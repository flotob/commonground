import json
from typing import Dict, List
from llama_cpp import Llama
from fastapi import FastAPI, Request, Security, HTTPException
from fastapi.responses import Response, StreamingResponse
import numpy
import signal
import sys
import torch
import os
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from threading import Event

# Global stop event for graceful interruption of generation
shutting_down = Event()


device = "cuda" if torch.cuda.is_available() and os.environ.get("CUDA_ARCH", None) is not None else "cpu"

model = None
if device == "cuda":
	model_size = os.environ.get("MODEL_SIZE", "medium")
	if model_size == "medium":
		model = Llama.from_pretrained(
			repo_id="bartowski/mistralai_Mistral-Small-3.1-24B-Instruct-2503-GGUF",
			filename="mistralai_Mistral-Small-3.1-24B-Instruct-2503-Q4_K_M.gguf",
			flash_attn=True,
			n_gpu_layers=-1, n_ctx=32000, n_batch=512, n_threads=8, device=device, verbose=True
		)
	elif model_size == "large":
		model = Llama.from_pretrained(
			repo_id="bartowski/mistralai_Mistral-Small-3.1-24B-Instruct-2503-GGUF",
			filename="mistralai_Mistral-Small-3.1-24B-Instruct-2503-Q6_K_L.gguf",
			flash_attn=True,
			n_gpu_layers=-1, n_threads=6, n_ctx=131072, n_batch=512, device=device, verbose=True
		)
else:
	model = Llama.from_pretrained(
		repo_id="bartowski/mistralai_Mistral-Small-3.1-24B-Instruct-2503-GGUF",
		filename="mistralai_Mistral-Small-3.1-24B-Instruct-2503-IQ2_XS.gguf",
		flash_attn=True,
		n_threads=8, n_ctx=2048, n_batch=512, device=device, verbose=True
	)

app = FastAPI()
security = HTTPBasic()
generating = False

# test_tokens = model.tokenize(b"<s>[SYSTEM_PROMPT]A[/SYSTEM_PROMPT][AVAILABLE_TOOLS]A[/AVAILABLE_TOOLS][INST]A[/INST][TOOL_CALLS]A</s>[TOOL_RESULTS]A[/TOOL_RESULTS]", add_bos=False, special=True)
# print(test_tokens)

eos_token_id = model.tokenize(b"</s>", add_bos=False, special=True)[0]
tool_calls_token_id = model.tokenize(b"[TOOL_CALLS]", add_bos=False, special=True)[0]
print("eos_token_id", eos_token_id)
print("tool_calls_token_id", tool_calls_token_id)

# Custom stopping criteria to stop generation after a certain number of tokens
# or when the eos token is generated
class CustomStoppingCriteria:
	def __init__(self, max_length: int):
		self.counter = 0
		self.max_length = max_length

	def __call__(self, input_ids: numpy.ndarray, score: numpy.ndarray, **kwargs) -> bool:
		self.counter += 1
		if input_ids[-1] == eos_token_id:
			return True
		if self.counter >= self.max_length:
			return True
		return shutting_down.is_set()

# Tokenize the messages and tools
def tokenize(messages: List[Dict[str, str]], tools: List[Dict[str, str]] | None):
	if len(messages) == 0:
		raise ValueError("No messages provided")
	if messages[0].get("role") != "system":
		raise ValueError("First message must be a system message")
	
	token_ids = model.tokenize(b"<s>[SYSTEM_PROMPT]", add_bos=False, special=True)
	token_ids.extend(model.tokenize(messages[0].get("content").encode('utf-8'), add_bos=False, special=False))
	token_ids.extend(model.tokenize(b"[/SYSTEM_PROMPT]", add_bos=False, special=True))

	if tools is not None and len(tools) > 0:
		token_ids.extend(model.tokenize(b"[AVAILABLE_TOOLS][", add_bos=False, special=True))
		token_ids.extend(model.tokenize(json.dumps(tools).encode('utf-8'), add_bos=False, special=False))
		token_ids.extend(model.tokenize(b"[/AVAILABLE_TOOLS]", add_bos=False, special=True))

	for message in messages[1:]:
		if message.get("role") == "user":
			token_ids.extend(model.tokenize(b"[INST]", add_bos=False, special=True))
			token_ids.extend(model.tokenize(message.get("content").encode('utf-8'), add_bos=False, special=False))
			token_ids.extend(model.tokenize(b"[/INST]", add_bos=False, special=True))
		elif message.get("role") == "assistant":
			# Todo: this might need better special token handling. Currently, if the assistant spells
			# out a special token, it will be tokenized as a special token when it comes back from the backend.
			assistant_content = message.get("content")
			assistant_tool_calls = message.get("tool_calls")
			if assistant_tool_calls is not None:
				assistant_content += "[TOOL_CALLS][" + ",".join([json.dumps(tool_call) for tool_call in assistant_tool_calls]) + "]"
			if not assistant_content.endswith("</s>"):
				assistant_content += "</s>"
			token_ids.extend(model.tokenize(assistant_content.encode('utf-8'), add_bos=False, special=True))
		elif message.get("role") == "tool":
			token_ids.extend(model.tokenize(b"[TOOL_RESULTS]", add_bos=False, special=True))
			token_ids.extend(model.tokenize(message.get("content").encode('utf-8'), add_bos=False, special=False))
			token_ids.extend(model.tokenize(b"[/TOOL_RESULTS]", add_bos=False, special=True))
		else:
			raise ValueError("Invalid message role: " + message.get("role"))

	return token_ids

correct_username = os.getenv("AI_USERNAME")
correct_password = os.getenv("AI_PASSWORD")

# Dummy function to check credentials
def authenticate(credentials: HTTPBasicCredentials):
    if not (credentials.username == correct_username and 
            credentials.password == correct_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials

@app.post("/generate")
async def generate_text(request: Request, credentials: HTTPBasicCredentials = Security(security)):
	authenticate(credentials)
	request = await request.json()
	# print(pprint.pformat(request))
	messages = request.get("messages")
	tools = request.get("tools")
	if len(tools) == 0:
		tools = None

	if len(messages) == 0:
		return Response(status_code=400, content="No messages provided")
	
	async def stream_tokens():
		global shutting_down
		global generating
		if shutting_down.is_set():
			error_result = json.dumps({"text": "Error: Server is shutting down", "is_special": False, "is_tool": False, "is_error": True})
			yield f"{error_result}\n"
			return

		try:
			tokens = tokenize(messages, tools)
			all_token_ids = [t for t in tokens]
			generating = True
			print("Generation started, num tokens:", len(all_token_ids))

			generate_result = model.generate(
				tokens,
				top_k=40,
				top_p=0.95,
				temp=0.15,
				repeat_penalty=1.0,
				stopping_criteria=CustomStoppingCriteria(max_length=2048)
			)
			is_tool = False
			gathering = False
			gathered_tokens = []
			for token_id in generate_result:
				try:
					is_special = False
					result_text = ""
					# gather tokens if we are in the middle of a unicode decode error, can happen e.g. for emojis
					if gathering:
						try:
							gathered_tokens.append(token_id)
							result_text = model.detokenize(gathered_tokens, prev_tokens=all_token_ids, special=False).decode('utf-8')
							all_token_ids.extend(gathered_tokens)
							gathered_tokens = []
							gathering = False
						except Exception as e:
							print(e)
							pass

					else:
						#print(1)
						text = model.detokenize([token_id], prev_tokens=all_token_ids, special=False).decode('utf-8')
						#print(text)
						text_special = model.detokenize([token_id], prev_tokens=all_token_ids, special=True).decode('utf-8')
						#print(text_special)
						all_token_ids.append(token_id)
						gathered_tokens = []

						if token_id == tool_calls_token_id:
							is_tool = True
						elif text != text_special:
							is_special = True
							result_text = text_special
						else:
							result_text = text

						#print(text_special.decode('utf-8'), end="", flush=True)
				
					if result_text != "":
						result = json.dumps({"text": result_text, "is_special": is_special, "is_tool": is_tool, "is_error": False})
						yield f"{result}\n"
					
				except Exception as e:
					print(e)
					if isinstance(e, UnicodeDecodeError):
						gathering = True
						gathered_tokens.append(token_id)
					else:
						raise e

		except Exception as e:
			print(e)
			if not shutting_down.is_set():
				error_result = json.dumps({"text": "Error: " + str(e), "is_special": False, "is_tool": False, "is_error": True})
				yield f"{error_result}\n"
		finally:
			generating = False
			if shutting_down.is_set():
				cleanup_handler()

		print("Generation finished, num tokens:", len(all_token_ids))

	return StreamingResponse(stream_tokens(), media_type="text/event-stream")

# @app.post("/interrupt")
# async def interrupt_stream(request: Request):
#     request_id = await request.json().get("request_id")
#     if request_id in active_streams:
#         del active_streams[request_id]
#         return {"message": "Stream interrupted"}
#     else:
#         return {"error": "Request not found"}

def shutdown_handler(signum, frame):
	global shutting_down
	shutting_down.set()
	print("Shutting down...")
	if not generating:
		cleanup_handler()

def cleanup_handler():
	model.reset()
	model.close()
	print("Model closed")
	sys.exit(0)

signal.signal(signal.SIGTERM, shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8443)
