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
import re

# Global stop event for graceful interruption of generation
shutting_down = Event()

device = "cuda" if torch.cuda.is_available() and os.environ.get("CUDA_ARCH", None) is not None else "cpu"

model = None
if device == "cuda":
	model_size = os.environ.get("MODEL_SIZE", "medium")
	if model_size == "medium":
		model = Llama.from_pretrained(
			repo_id="bartowski/google_gemma-3-27b-it-GGUF",
			filename="google_gemma-3-27b-it-Q4_K_M.gguf",
			flash_attn=True,
			n_gpu_layers=-1, n_ctx=6000, n_batch=512, n_threads=8, device=device, verbose=True
		)
	elif model_size == "large":
		model = Llama.from_pretrained(
			repo_id="bartowski/google_gemma-3-27b-it-GGUF",
			filename="google_gemma-3-27b-it-Q6_K.gguf",
			flash_attn=True,
			n_gpu_layers=-1, n_threads=6, n_ctx=42000, n_batch=512, device=device, verbose=True
		)
else:
	model = Llama.from_pretrained(
		repo_id="bartowski/google_gemma-3-12b-it-GGUF",
		filename="google_gemma-3-12b-it-Q4_K_M.gguf",
		flash_attn=True,
		n_threads=8, n_ctx=4096, n_batch=512, device=device, verbose=True
	)

app = FastAPI()
security = HTTPBasic()
generating = False

eot_token_id = model.tokenize(b"<end_of_turn>", add_bos=False, special=True)[0]
print("eot_token_id", eot_token_id)

# Custom stopping criteria to stop generation after a certain number of tokens
# or when the eos token is generated
class CustomStoppingCriteria:
	def __init__(self, max_length: int):
		self.counter = 0
		self.max_length = max_length

	def __call__(self, input_ids: numpy.ndarray, score: numpy.ndarray, **kwargs) -> bool:
		self.counter += 1
		if input_ids[-1] == eot_token_id:
			return True
		if self.counter >= self.max_length:
			return True
		return shutting_down.is_set()

tools_start = """
At each turn, if you decide to invoke any of the function(s), it should be wrapped with ```tool_code```. The python methods described below are available. The generated code should be readable and efficient. The response to a method will be wrapped in ```tool_output``` use it to call more tools or generate a helpful, friendly response. When using a ```tool_call``` think step by step why and how it should be used.

You can make multiple tool calls within one ```tool_code``` block, just separate them with a new line. This is the ONLY format that the tool call parser understands. Example:

```tool_code
allowedFunctionA(index=7, startDate="2024-01-01")
allowedFunctionB(arg1=0, arg2=10)
```

Tool calls WILL NOT be evaluated but only parsed, you MUST NEVER call ANY other python methods or functions than the ones described below. Using any other function will break the tool call parser.

The following Python methods are available:

```python\n"""

tools_end = "\n```\n"

tool_getChannelMessagesRange = """
def getRecentChannelMessages(channelIndex: int, limit: int) -> List:
    \"\"\"Get recent messages from a channel, starting from the most recent.

    Args:
      channelIndex: The list index of the channel to get messages from.
      limit: The maximum number of messages to return.

    Returns:
      A list of dicts, each with the following keys:
      - userName: The name of the user who sent the message.
      - isoDate: The ISO 8601 date and time of the message.
      - message: The content of the message.
    \"\"\"
"""

tool_getRecentChannelMessages = """
def getChannelMessagesRange(channelIndex: int, startDate: str, endDate: str) -> List:
    \"\"\"Get messages from a channel, within a specific time range.

    Args:
      channelIndex: The list index of the channel to get messages from.
      startDate: The start date of the time range to get messages from. Must be in the format YYYY-MM-DD.
      endDate: The end date of the time range to get messages from. Must be in the format YYYY-MM-DD.

    Returns:
      A list of dicts, each with the following keys:
      - userName: The name of the user who sent the message.
      - isoDate: The ISO 8601 date and time of the message.
      - message: The content of the message.
    \"\"\"
"""

model_agreement = """<start_of_turn>model
I understand.
<end_of_turn>\n"""

def get_tool_instructions(tools: List[Dict[str, str]]):
	tool_strings = []
	for tool in tools:
		if tool.get("function", {}).get("name") == "getChannelMessagesRange":
			tool_strings.append(tool_getChannelMessagesRange)
		elif tool.get("function", {}).get("name") == "getRecentChannelMessages":
			tool_strings.append(tool_getRecentChannelMessages)
	if len(tool_strings) > 0:
		return tools_start + "\n".join(tool_strings) + tools_end
	else:
		return ""

re_getChannelMessagesRange = re.compile(r"^getChannelMessagesRange\((channelIndex=)?(\d+), ?(startDate=)?[\"'](\d{4}-\d{2}-\d{2})[\"'], ?(endDate=)?[\"'](\d{4}-\d{2}-\d{2})[\"']\)$")
re_getRecentChannelMessages = re.compile(r"^getRecentChannelMessages\((channelIndex=)?(\d+), ?(limit=)?(\d+)\)$")

def parse_tool_call(tool_call: str):
	tool_call = tool_call.strip()
	multi_call = tool_call.split("\n")
	calls = []
	for call in multi_call:
		call = call.strip()
		if call == "":
			continue

		match_getChannelMessagesRange = re_getChannelMessagesRange.match(call)
		match_getRecentChannelMessages = re_getRecentChannelMessages.match(call)

		try:
			if match_getChannelMessagesRange:
				channel_index = int(match_getChannelMessagesRange.group(2))
				start_date = match_getChannelMessagesRange.group(4)
				end_date = match_getChannelMessagesRange.group(6)
				if not start_date or not end_date or channel_index is None or channel_index < 0:
					print("Warning: startDate or endDate is not set for tool call: " + call)
					continue
				calls.append(json.dumps({"name": "getChannelMessagesRange", "arguments": {"channelIndex": channel_index, "startDate": start_date, "endDate": end_date}}))
			elif match_getRecentChannelMessages:
				channel_index = int(match_getRecentChannelMessages.group(2))
				limit = int(match_getRecentChannelMessages.group(4))
				if channel_index is None or channel_index < 0 or limit is None or limit < 0:
					print("Warning: channelIndex or limit is not set for tool call: " + call)
					continue
				calls.append(json.dumps({"name": "getRecentChannelMessages", "arguments": {"channelIndex": channel_index, "limit": limit}}))
		except Exception as e:
			print("Error parsing tool call: " + call)
			print(e)
			pass

	if len(calls) > 0:
		return "[" + ", ".join(calls) + "]"
	else:
		raise ValueError("Invalid tool call: " + call)

def format_tool_call(tool_call: Dict[str, str]):
	function_name = tool_call.get("name")
	function_arguments = tool_call.get("arguments")
	args = []
	if function_name == "getChannelMessagesRange":
		channel_index = function_arguments.get("channelIndex")
		start_date = function_arguments.get("startDate")
		end_date = function_arguments.get("endDate")
		if channel_index is not None:
			args.append(f"channelIndex={channel_index}")
		else:
			print("Warning: channelIndex is not set for tool call: " + tool_call)
		if start_date is not None:
			args.append(f"startDate=\"{start_date}\"")
		else:
			print("Warning: startDate is not set for tool call: " + tool_call)
		if end_date is not None:
			args.append(f"endDate=\"{end_date}\"")
		else:
			print("Warning: endDate is not set for tool call: " + tool_call)

	elif function_name == "getRecentChannelMessages":
		channel_index = function_arguments.get("channelIndex")
		limit = function_arguments.get("limit")

		if channel_index is not None:
			args.append(f"channelIndex={channel_index}")
		else:
			print("Warning: channelIndex is not set for tool call: " + tool_call)
		if limit is not None:
			args.append(f"limit={limit}")
		else:
			print("Warning: limit is not set for tool call: " + tool_call)
	
	else:
		for k, v in function_arguments.items():
			args.append(f"{k}=" + (f"\"{v}\"" if isinstance(v, str) else f"{v}"))
		
		print("Warning: unknown tool call: " + tool_call)

	argstr = ", ".join(args)
	return "```tool_code\n" + function_name + "(" + argstr + ")\n```\n"

# Tokenize the messages and tools
def tokenize(messages: List[Dict[str, str]], tools: List[Dict[str, str]] | None):
	if len(messages) == 0:
		raise ValueError("No messages provided")
	if messages[0].get("role") != "system":
		raise ValueError("First message must be a system message")
	if messages[1].get("role") != "user":
		raise ValueError("Second message must be a user message")
	
	token_ids = model.tokenize(b"<start_of_turn>user\n", add_bos=True, special=True)
	token_ids.extend(model.tokenize(messages[0].get("content").encode('utf-8') + b"\n", add_bos=False, special=False))

	tool_instructions = get_tool_instructions(tools)
	if len(tool_instructions) > 0:
		token_ids.extend(model.tokenize(tool_instructions.encode('utf-8'), add_bos=False, special=False))

	token_ids.extend(model.tokenize(b"<end_of_turn>\n" + model_agreement.encode('utf-8'), add_bos=False, special=True))

	for message in messages[1:]:
		if message.get("role") == "user":
			token_ids.extend(model.tokenize(b"<start_of_turn>user\n", add_bos=False, special=True))
			token_ids.extend(model.tokenize(message.get("content").encode('utf-8'), add_bos=False, special=False))
			token_ids.extend(model.tokenize(b"<end_of_turn>\n", add_bos=False, special=True))
		elif message.get("role") == "assistant":
			token_ids.extend(model.tokenize(b"<start_of_turn>model\n", add_bos=False, special=True))
			assistant_content = message.get("content", "")
			assistant_tool_calls = message.get("tool_calls")
			if assistant_tool_calls is not None:
				if assistant_content != "" and not assistant_content.endswith("\n"):
					assistant_content += "\n"
				assistant_content += "".join([format_tool_call(tool_call) for tool_call in assistant_tool_calls])
			token_ids.extend(model.tokenize(assistant_content.encode('utf-8'), add_bos=False, special=False))
			token_ids.extend(model.tokenize(b"<end_of_turn>\n" if assistant_content.endswith("\n") else b"\n<end_of_turn>\n", add_bos=False, special=True))
		elif message.get("role") == "tool":
			# tool results are a JSON stringified list of tool results
			tool_results = json.loads(message.get("content"))
			if isinstance(tool_results, list):
				token_ids.extend(model.tokenize(b"<start_of_turn>user\n", add_bos=False, special=True))
				for tool_result in tool_results:
					tool_result_str = json.dumps(tool_result)
					token_ids.extend(model.tokenize(
						b"```tool_output\n" +
						tool_result_str.encode('utf-8') +
						(b"```\n" if tool_result_str.endswith("\n") else b"\n```\n"),
						add_bos=False, special=False)
					)
				token_ids.extend(model.tokenize(b"\n<end_of_turn>\n", add_bos=False, special=True))
			else:
				raise ValueError("Invalid tool results: " + message.get("content"))
		else:
			raise ValueError("Invalid message role: " + message.get("role"))

	token_ids.extend(model.tokenize(b"<start_of_turn>model\n", add_bos=False, special=True))		
	# print(model.detokenize(token_ids, special=True).decode('utf-8'))

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
				top_k=64,
				top_p=0.95,
				min_p=0.01,
				temp=1.0,
				repeat_penalty=1.0,
				stopping_criteria=CustomStoppingCriteria(max_length=2048)
			)
			is_tool = False
			tool_token_partial = ""
			tool_token_open = "```tool_code\n"
			tool_token_close = "\n```"
			tool_string = ""

			gathering = False
			gathering_tokens = []
			for token_id in generate_result:
				try:
					if gathering:
						try:
							gathered_tokens.append(token_id)
							result_text = model.detokenize(gathered_tokens, prev_tokens=all_token_ids, special=False).decode('utf-8')
							all_token_ids.extend(gathered_tokens)
							gathered_tokens = []
							gathering = False
							if is_tool:
								tool_token_partial = tool_token_partial + result_text
							else:
								result = json.dumps({"text": result_text, "is_special": False, "is_tool": False, "is_error": False})
								yield f"{result}\n"
						except Exception as e:
							print(e)
							pass

					else:
						text = model.detokenize([token_id], prev_tokens=all_token_ids, special=False) #  prev_tokens=all_token_ids ?
						text_special = model.detokenize([token_id], prev_tokens=all_token_ids, special=True)
						all_token_ids.append(token_id)
						is_special = text != text_special

						new_partial = tool_token_partial + text.decode('utf-8')

						if is_special:
							if token_id != eot_token_id:
								result = json.dumps({"text": text_special.decode('utf-8'), "is_special": True, "is_tool": False, "is_error": False})
								yield f"{result}\n"

						elif is_tool:
							if new_partial.startswith(tool_token_close):
								tool_call = tool_string
								try:
									tool_call = parse_tool_call(tool_call)
								except Exception as e:
									print("Error parsing tool call: " + tool_call)
									print(e)
									pass

								is_tool = False
								tool_string = ""
								tool_token_partial = ""
								result = json.dumps({"text": tool_call, "is_special": False, "is_tool": True, "is_error": False})
								yield f"{result}\n"

							elif tool_token_close.startswith(new_partial):
								tool_token_partial = new_partial

							else:
								tool_string += new_partial
								tool_token_partial = ""

						else:
							if new_partial.startswith(tool_token_open):
								tool_token_partial = ""
								is_tool = True

							elif tool_token_open.startswith(new_partial):
								tool_token_partial = new_partial

							else:
								tool_token_partial = ""
								result = json.dumps({"text": new_partial, "is_special": False, "is_tool": False, "is_error": False})
								yield f"{result}\n"

				except Exception as e:
					print(e)
					if isinstance(e, UnicodeDecodeError):
						gathering = True
						gathering_tokens.append(token_id)
					else:
						raise e

			print("Generation finished, num tokens:", len(all_token_ids))

		except Exception as e:
			print(e)
			if not shutting_down.is_set():
				error_result = json.dumps({"text": "Error: " + str(e), "is_special": False, "is_tool": False, "is_error": True})
				yield f"{error_result}\n"
		finally:
			generating = False
			if shutting_down.is_set():
				cleanup_handler()

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
