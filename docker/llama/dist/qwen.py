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
			repo_id="lmstudio-community/Qwen2.5-14B-Instruct-1M-GGUF",
			filename="Qwen2.5-14B-Instruct-1M-Q4_K_M.gguf",
			flash_attn=True,
			n_gpu_layers=-1, n_threads=8, n_ctx=50000, n_batch=512, device=device, verbose=True
		)
	elif model_size == "large":
		model = Llama.from_pretrained(
			repo_id="lmstudio-community/Qwen2.5-32B-Instruct-GGUF",
			filename="Qwen2.5-32B-Instruct-Q4_K_M.gguf",
			flash_attn=True,
			n_gpu_layers=-1, n_threads=6, n_ctx=90000, n_batch=512, device=device, verbose=True
		)
else:
	model = Llama.from_pretrained(
		repo_id="lmstudio-community/Qwen2.5-7B-Instruct-1M-GGUF",
		filename="Qwen2.5-7B-Instruct-1M-Q4_K_M.gguf",
		flash_attn=True,
		n_threads=8, n_ctx=8192, n_batch=512, device=device, verbose=True
	)

app = FastAPI()
security = HTTPBasic()
generating = False

# test_tokens = model.tokenize(b"<s>[SYSTEM_PROMPT]A[/SYSTEM_PROMPT][AVAILABLE_TOOLS]A[/AVAILABLE_TOOLS][INST]A[/INST][TOOL_CALLS]A</s>[TOOL_RESULTS]A[/TOOL_RESULTS]", add_bos=False, special=True)
# print(test_tokens)

eos_token_id = model.tokenize(b"<|im_end|>", add_bos=False, special=True)[0]
print("eos_token_id", eos_token_id)
eos_token_ids = model.tokenize(b"<|im_end|>\n", add_bos=False, special=True)
print("eos_token_ids", eos_token_ids)

tool_calls_start_ids = model.tokenize(b"<tool_call>", add_bos=False, special=True)
tool_calls_end_ids = model.tokenize(b"</tool_call>", add_bos=False, special=True)
tool_calls_start_id = tool_calls_start_ids[0]
tool_calls_end_id = tool_calls_end_ids[0]

print("tool_calls_start_ids", tool_calls_start_ids)
print("tool_calls_end_ids", tool_calls_end_ids)
print("tool_calls_start_id", tool_calls_start_id)
print("tool_calls_end_id", tool_calls_end_id)

tools_query_start = "\n\n# Tools\n\nYou may call one or more functions to assist with the user query.\n\n"
tools_query_start += "You are provided with function signatures within <tools></tools> XML tags:\n<tools>\n"

tools_query_end = "</tools>\n\nFor each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:\n"
tools_query_end += "<tool_call>\n{\"name\": <function-name>, \"arguments\": <args-json-object>}\n</tool_call>"

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
	
	token_ids = model.tokenize(b"<|im_start|>system\n", add_bos=False, special=True)
	token_ids.extend(model.tokenize(messages[0].get("content").encode('utf-8'), add_bos=False, special=False))
	if tools is not None and len(tools) > 0:
		token_ids.extend(model.tokenize(tools_query_start.encode('utf-8'), add_bos=False, special=True))
		token_ids.extend(model.tokenize("\n".join([json.dumps(tool) for tool in tools]).encode('utf-8'), add_bos=False, special=False))
		token_ids.extend(model.tokenize(tools_query_end.encode('utf-8'), add_bos=False, special=True))

	token_ids.extend(model.tokenize(b"<|im_end|>\n", add_bos=False, special=True))

	for message in messages[1:]:
		if message.get("role") == "user":
			token_ids.extend(model.tokenize(b"<|im_start|>user\n", add_bos=False, special=True))
			token_ids.extend(model.tokenize(message.get("content").encode('utf-8'), add_bos=False, special=False))
			token_ids.extend(model.tokenize(b"<|im_end|>\n", add_bos=False, special=True))
		elif message.get("role") == "assistant":
			# Todo: this might need better special token handling. Currently, if the assistant spells
			# out a special token, it will be tokenized as a special token when it comes back from the backend.
			assistant_content = "<|im_start|>assistant\n"
			assistant_content += message.get("content")
			assistant_tool_calls = message.get("tool_calls")
			if assistant_tool_calls is not None:
				tool_calls = []
				for tool_call in assistant_tool_calls:
					name = tool_call.get("name")
					arguments = tool_call.get("arguments")
					if name and arguments:
						tool_calls.append('<tool_call>\n{"name": "' + name + '", "arguments": ' + json.dumps(arguments) + '}\n</tool_call>\n')
					else:
						print("Warning: Invalid tool call", tool_call)
				assistant_content += "".join(tool_calls)
			if not assistant_content.endswith("<|im_end|>\n"):
				assistant_content += "<|im_end|>\n"
			token_ids.extend(model.tokenize(assistant_content.encode('utf-8'), add_bos=False, special=True))
		elif message.get("role") == "tool":
			tool_results = json.loads(message.get("content"))
			all_results_str = []
			if not isinstance(tool_results, list):
				tool_results = [tool_results]
			try:
				for tool_result in tool_results:
					all_results_str.append(json.dumps(tool_result))
			except Exception as e:
				print("Error parsing tool results", e)
				pass

			if len(all_results_str) == 0:
				raise ValueError("Invalid tool results: " + message.get("content"))
		
			token_ids.extend(model.tokenize(b"<|im_start|>user\n", add_bos=False, special=True))
			for result_str in all_results_str:
				token_ids.extend(model.tokenize(b"<tool_response>\n", add_bos=False, special=True))
				token_ids.extend(model.tokenize(result_str.encode('utf-8'), add_bos=False, special=False))
				token_ids.extend(model.tokenize(b"\n</tool_response>\n", add_bos=False, special=True))

			token_ids.extend(model.tokenize(b"<|im_end|>\n", add_bos=False, special=True))
		
		else:
			raise ValueError("Invalid message role: " + message.get("role"))

	token_ids.extend(model.tokenize(b"<|im_start|>assistant\n", add_bos=False, special=True))

	print(model.detokenize(token_ids, special=True).decode('utf-8'))
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
							# if the utf-decode passes, all is good, so we can extend the token ids
							all_token_ids.extend(gathered_tokens)
							gathered_tokens = []
							gathering = False
						except Exception as e:
							print(e)
							pass

					else:
						text = model.detokenize([token_id], prev_tokens=all_token_ids, special=False).decode('utf-8')
						text_special = model.detokenize([token_id], prev_tokens=all_token_ids, special=True).decode('utf-8')
						all_token_ids.append(token_id)
						gathered_tokens = []

						if token_id == tool_calls_start_id:
							is_tool = True
						elif token_id == tool_calls_end_id:
							is_tool = False
						elif text != text_special:
							is_special = True
							result_text = text_special
						else:
							result_text = text

						print(text_special, end="", flush=True)
				
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
