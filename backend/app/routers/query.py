from fastapi import APIRouter, HTTPException
from backend.app.models import QueryRequest, PipelineResult
from backend.app.pipelines.traditional_rag import run_rag_pipeline

# router = APIRouter(prefix="/api/query", tags=["Query Engine"])

# @router.post("/", response_model=PipelineResult)
# async def handle_query(request: QueryRequest):
#     try:
#         result = run_rag_pipeline(request.question)
#         return result
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))