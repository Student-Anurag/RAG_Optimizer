from pydantic import BaseModel

class PipelineResult(BaseModel):
    pipeline: str
    answer: str
    retrieved_chunks: list[str]
    latency_seconds: float
    cache_hit: bool = False
    rerank_scores: list[float] = []
    query_variants: list[str] = []

class QueryRequest(BaseModel):
    question: str

class IngestResponse(BaseModel):
    message: str
    chunk_created: int
    pipeline: str