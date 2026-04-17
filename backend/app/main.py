import os
import uuid
import shutil

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

load_dotenv()

from backend.app.pipelines.traditional_rag import run_rag_pipeline
from backend.app.pipelines.vectorless_rag import get_or_build_tree, vectorless_rag
from backend.app.pipelines.evaluator import evaluate_pipelines
from backend.app.pipelines.hybrid_retriever import ingest as ingest_docs
from backend.app.routers import ingest

# ✅ FIX 1: include_router must be called at module level (startup),
#            NOT inside a request handler. Calling it per-request causes
#            duplicate route registration and never properly wires the router.
app = FastAPI(
    title="RAG Optimizer API",
    description="Compares Traditional RAG vs Vectorless RAG and provides insights on performance and efficiency.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ FIX 1 (continued): router registered once at startup
app.include_router(ingest.router)

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

    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(TEMP_DIR, unique_filename)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        print(f"⚙️  Processing: {file.filename}")

        # Step 1: Build or load the document tree (for vectorless pipeline)
        tree = get_or_build_tree(temp_path)

        # ✅ FIX 2: Ingest the uploaded PDF into Chroma + BM25 BEFORE
        #           running the traditional RAG pipeline.
        #           Previously the vectored pipeline always queried an empty
        #           Chroma DB because ingestion was never triggered per request.
        print("📥 Ingesting document into vector store...")
        from langchain_community.document_loaders import PyMuPDFLoader
        loader = PyMuPDFLoader(temp_path)
        raw_docs = loader.load()
        num_chunks = ingest_docs(raw_docs)
        print(f"✅ Ingested {num_chunks} chunks into Chroma + BM25")

        # Step 3: Run Vectorless Pipeline
        print("🚀 Running Vectorless Pipeline...")
        ans_vectorless, vectorless_nodes_used = vectorless_rag(query, tree, verbose=False)

        # Step 4: Run Vectored Pipeline
        print("🚀 Running Vectored Pipeline...")
        result = run_rag_pipeline(query, k=4)

        # Step 5: Run Evaluator Agent
        print("⚖️  Evaluating Pipelines...")
        evaluation_report = evaluate_pipelines(
            query=query,
            vectorless_answer=ans_vectorless,
            vectored_answer=result.answer,
            vectored_chunks=result.retrieved_chunks,
            vectorless_nodes=vectorless_nodes_used,
        )

        return {
            "filename": file.filename,
            "query": query,
            "vectorless_answer": ans_vectorless,
            "vectored_answer": result,
            "recommendation": evaluation_report,
        }

    except Exception as e:
        print(f"❌ Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            print(f"🧹 Cleaned up temporary file: {unique_filename}")


@app.get("/health")
def health():
    return {"status": "ok", "message": "RAG Optimizer API is running."}