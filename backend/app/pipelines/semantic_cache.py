import numpy as np
from sentence_transformers import SentenceTransformer

_encoder = None
_cache: list[dict] = []
THRESHOLD = 0.88

def _get_encoder() -> SentenceTransformer:
    global _encoder
    if _encoder is None:
        _encoder = SentenceTransformer("all-MiniLM-L6-v2")
    return _encoder

def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)

def get_cached(query: str) -> dict | None:
    if not _cache:
        return None
    enc = _get_encoder()
    q_emb = enc.encode(query)
    for entry in _cache:
        if _cosine(q_emb, entry["embedding"]) >= THRESHOLD:
            return entry["result"]
    return None

def set_cache(query: str, result: dict) -> None:
    # ✅ FIX 5: Never cache a result that has no retrieved chunks.
    #           An empty-chunk result means retrieval failed; caching it would
    #           cause every semantically similar future query to get a poisoned
    #           cache hit instead of a fresh (potentially successful) retrieval.
    if not result.get("retrieved_chunks"):
        return
    enc = _get_encoder()
    _cache.append({
        "embedding": enc.encode(query),
        "query": query,
        "result": result,
    })

def clear_cache() -> None:
    _cache.clear()