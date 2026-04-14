import os
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="RAG Optimizer API",
    description="Compares Traditional RAG vs Vectorless RAG and provides insights on performance and efficiency.",
    version="1.0.0",
)

@app.get("/health")
def health():
    return {"status": "ok", "message": "RAG Optimizer API is running."}