ARG LLAMA_BASEIMAGE="ubuntu:22.04"
FROM ${LLAMA_BASEIMAGE} AS builder
ARG CUDA_ARCH=""
RUN if [ -n "$CUDA_ARCH" ]; then \
        apt update && apt install -y python3 pip git libcuda1-384 ccache; \
        python3 -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124; \
        python3 -m pip install transformers cmake ninja fastapi uvicorn; \
        CMAKE_ARGS="-DGGML_CUDA=on -DCMAKE_CUDA_ARCHITECTURES=${CUDA_ARCH}" python3 -m pip install llama-cpp-python; \
    else \
        apt update && apt install -y python3 pip git ccache; \
        python3 -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu; \
        python3 -m pip install transformers cmake ninja fastapi uvicorn; \
        python3 -m pip install llama-cpp-python; \
    fi

ARG LLAMA_BASEIMAGE="ubuntu:22.04"
FROM ${LLAMA_BASEIMAGE}
ARG CUDA_ARCH=""
RUN mkdir /dist && chmod 777 /dist
RUN mkdir /data && chmod 777 /data
RUN if [ -n "$CUDA_ARCH" ]; then \
        apt update && apt install -y python3 libcuda1-384 && \
        rm -rf /var/lib/apt/lists/*; \
    else \
        apt update && apt install -y python3 && \
        rm -rf /var/lib/apt/lists/*; \
    fi
COPY --from=builder /usr/local/lib/python3.10/dist-packages/ /usr/local/lib/python3.10/dist-packages/
COPY ./dist/qwen.py /dist/qwen.py
COPY ./dist/mistral.py /dist/mistral.py
COPY ./dist/gemma3.py /dist/gemma3.py
EXPOSE 8443
CMD ["python3", "/dist/qwen.py"]
