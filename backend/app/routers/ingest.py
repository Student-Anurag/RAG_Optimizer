import tempfile
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from langchain_community.document_loaders import PyPDFLoader
from backend.app.models import IngestResponse
from backend.app.pipelines.hybrid_retriever import ingest

router = APIRouter(prefix="/api/ingest", tags=["Ingestion"])

@router.post("/", response_model=IngestResponse)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # Create a temporary file to save the uploaded PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Use LangChain to extract the text from the PDF
            loader = PyPDFLoader(tmp_path)
            docs = loader.load()
            
            # The loader might split pages into separate Document objects.
            # We pass all these pages directly to your hybrid retriever.
            chunks_created = ingest(docs)
            
        finally:
            # Clean up: Delete the temporary file from the hard drive
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        
        return IngestResponse(
            message=f"Successfully processed {file.filename}",
            chunks_created=chunks_created,
            pipeline="Hybrid Chroma + BM25"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")