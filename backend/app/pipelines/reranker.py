from sentence_transformers import CrossEncoder
from langchain_core.documents import Document

_model = None

def _get_model() -> CrossEncoder:
    global _model
    if _model is None:
        _model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _model

def rerank(query: str, docs: list[Document],top_n: int = 4) -> list[tuple[Document, float]]:
    if not docs:
        return []
    model = _get_model()
    pairs = [(query, doc.page_content) for doc in docs]
    scores = model.predict(pairs).tolist()
    scored = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
    return scored[:top_n]