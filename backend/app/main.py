import os
from fastapi import FastAPI
from dotenv import load_dotenv

import uuid
import shutil
from fastapi import  UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
load_dotenv()
 
from backend.app.pipelines.traditional_rag import run_rag_pipeline
from backend.app.pipelines.vectorless_rag import get_or_build_tree, vectorless_rag
from backend.app.pipelines.evaluator import evaluate_pipelines
from backend.app.routers import ingest

app = FastAPI(
    title="RAG Optimizer API",
    description="Compares Traditional RAG vs Vectorless RAG and provides insights on performance and efficiency.",
    version="1.0.0",
)


# Allow frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "./temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/evaluate")
async def evaluate_document(
    file: UploadFile = File(...),
    query: str = Form(...)
):
    """
    Main endpoint: Receives PDF and query, runs both RAG pipelines, 
    evaluates them, and returns the final recommendation.

    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Step 1: Save uploaded file temporarily with a unique name

    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(TEMP_DIR, unique_filename)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Step 2: Build or load the document tree
        print(f"⚙️ Processing: {file.filename}")
        tree = get_or_build_tree(temp_path)

        # Step 3: Run Vectorless Pipeline
        print("🚀 Running Vectorless Pipeline...")
        ans_vectorless,vectorless_nodes_used = vectorless_rag(query, tree, verbose=False)

        # --- FUTURE INTEGRATION POINTS ---
        app.include_router(ingest.router)
        # Step 4: Run Vectored Pipeline 
        print("🚀 Running Vectored Pipeline...")
        result = run_rag_pipeline(query, k=4)

        
        # Step 5: Run Evaluator Agent
        print("⚖️ Evaluating Pipelines...")
        evaluation_report = evaluate_pipelines(
    query             = query,
    vectorless_answer = ans_vectorless,
    vectored_answer   = result.answer,
    vectored_chunks   = result.retrieved_chunks,
    vectorless_nodes   = vectorless_nodes_used  # ← pass chunks
)

        # Return the payload to the frontend
        return {
            "filename": file.filename,
            "query": query,
            "vectorless_answer": ans_vectorless,
            "vectored_answer": result,
            "recommendation": evaluation_report
        }

    except Exception as e:
        print(f"❌ Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Step 6: Clean up temp file (the JSON tree cache remains safe)
        if os.path.exists(temp_path):
            os.remove(temp_path)
            print(f"🧹 Cleaned up temporary file: {unique_filename}")




# Connect the routers to the main app
# app.include_router(ingest.router)
# app.include_router(query.router)




@app.get("/health")
def health():
    return {"status": "ok", "message": "RAG Optimizer API is running."}




