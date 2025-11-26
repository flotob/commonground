from llama_cpp import Llama
from fastapi import FastAPI, Request, Security, HTTPException
from fastapi.responses import Response, StreamingResponse
import asyncio
import signal
import sys
import torch
import os
from fastapi.security import HTTPBasic, HTTPBasicCredentials

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
		n_threads=8, n_ctx=32768, n_batch=512, device=device, verbose=True
	)

app = FastAPI()
security = HTTPBasic()
generating = False
shutting_down = False

# Dummy function to check credentials
def authenticate(credentials: HTTPBasicCredentials):
    correct_username = os.getenv("AI_USERNAME")
    correct_password = os.getenv("AI_PASSWORD")

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
	
	# model.reset()

	async def stream_tokens():
		global shutting_down
		global generating
		if shutting_down:
			yield "Error: Server is shutting down"
			return
		try:
			generating = True
			result = model.create_chat_completion(
				messages=messages,
				tools=tools,
				stream=True,
				max_tokens=4096
			)
			for chunk in result:
				if 'choices' in chunk and len(chunk['choices']) > 0:
					delta = chunk['choices'][0].get('delta', {})
					content = delta.get('content', '')
					if content and not shutting_down:
						yield content
					if shutting_down:
						break
		except Exception as e:
			print(e)
			if not shutting_down:
				yield "Error: " + str(e)
		finally:
			generating = False
			if shutting_down:
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
	shutting_down = True
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
