import time
import os

from langchain_core.documents import Document

from backend.app.pipelines.query_rewriter import rewrite_query
from backend.app.pipelines.hybrid_retriever import retrieve 
from backend.app.pipelines.reranker import rerank
from backend.app.pipelines.semantic_cache import get_cached, set_cache
from backend.app.models import PipelineResult 

import os
from langchain_groq import ChatGroq

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.5,max_tokens=1024)

def run_rag_pipeline(question: str, k: int = 4) -> PipelineResult:
    start = time.perf_counter()

    # 1. Check semantic cache
    cached_result = get_cached(question)
    if cached_result:
        cached_result["cache_hit"] = True
        cached_result["latency_seconds"] = round(time.perf_counter() - start, 3)
        return PipelineResult(**cached_result)

    # 2. Rewrite query
    queries = rewrite_query(question)

    # 3. Hybrid retrieval (using the correct function name 'retrieve')
    candidates = retrieve(queries, k=k*2)

    # 4. Rerank candidates
    reranked = rerank(question, candidates, top_n=k)
    top_docs = [doc for doc, score in reranked]
    rerank_scores = [round(float(score), 4) for _, score in reranked]

    # 5. Generation
    context = "\n\n".join(d.page_content for d in top_docs)
    prompt = f"Answer based only on this context:\n\n{context}\n\nQuestion: {question}"
    response = llm.invoke(prompt)

    # 6. Build result dictionary
    result_data = {
        "pipeline": "traditional_rag",
        "answer": response.content,
        "retrieved_chunks": [d.page_content for d in top_docs],
        "rerank_scores": rerank_scores,
        "query_variants": queries,
        "latency_seconds": round(time.perf_counter() - start, 3),
        "num_chunks_retrieved": len(top_docs),
        "cache_hit": False,
    }

    # 7. Store and return as Pydantic model
    set_cache(question, result_data)
    return PipelineResult(**result_data)