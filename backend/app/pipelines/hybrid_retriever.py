import json
import os
import numpy as np
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from rank_bm25 import BM25Okapi

CHROMA_PATH = "./chroma_db"

# ✅ FIX 3: BM25 persistence path — so the index survives server restarts.
#           Previously _bm25 was always None on a fresh start, meaning
#           sparse retrieval was silently skipped every single time.
BM25_CACHE_PATH = "./bm25_cache.json"

_embeddings = None
_bm25: BM25Okapi | None = None
_bm25_docs: list[Document] = []


def _get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return _embeddings


def _save_bm25_cache(chunks: list[Document]) -> None:
    """Persist BM25 corpus (raw text only) to disk as JSON."""
    data = [{"page_content": c.page_content, "metadata": c.metadata} for c in chunks]
    with open(BM25_CACHE_PATH, "w") as f:
        json.dump(data, f)


def _load_bm25_cache() -> list[Document]:
    """Load BM25 corpus from disk if it exists."""
    if not os.path.exists(BM25_CACHE_PATH):
        return []
    with open(BM25_CACHE_PATH, "r") as f:
        data = json.load(f)
    return [Document(page_content=d["page_content"], metadata=d.get("metadata", {})) for d in data]


def _ensure_bm25() -> None:
    """
    ✅ FIX 3 (continued): Lazily rebuild BM25 from disk cache if the
    in-memory index was lost (e.g. after a server restart).
    """
    global _bm25, _bm25_docs
    if _bm25 is not None:
        return  # already in memory
    docs = _load_bm25_cache()
    if not docs:
        return  # nothing cached yet — first run
    _bm25_docs = docs
    tokenized = [c.page_content.lower().split() for c in docs]
    _bm25 = BM25Okapi(tokenized)
    print(f"✅ BM25 index restored from disk ({len(docs)} chunks)")


def ingest(docs: list[Document]) -> int:
    global _bm25, _bm25_docs

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=64,
    )
    chunks = splitter.split_documents(docs)

    # Persist to Chroma
    Chroma.from_documents(
        chunks,
        _get_embeddings(),
        persist_directory=CHROMA_PATH,
    )

    # Build and persist BM25
    _bm25_docs = chunks
    tokenized = [c.page_content.lower().split() for c in chunks]
    _bm25 = BM25Okapi(tokenized)

    # ✅ FIX 3: Save BM25 corpus to disk so it survives restarts
    _save_bm25_cache(chunks)

    return len(chunks)


def _rrf(
    dense_docs: list[Document],
    sparse_docs: list[Document],
    k: int = 60,
) -> list[Document]:
    scores: dict[str, float] = {}
    doc_map: dict[str, Document] = {}

    for rank, doc in enumerate(dense_docs):
        key = doc.page_content[:120]
        scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank + 1)
        doc_map[key] = doc

    for rank, doc in enumerate(sparse_docs):
        key = doc.page_content[:120]
        scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank + 1)
        doc_map[key] = doc

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [doc_map[key] for key, _ in ranked]


def retrieve(queries: list[str], k: int = 6) -> list[Document]:
    # ✅ FIX 3: Restore BM25 from disk if in-memory index is gone
    _ensure_bm25()

    vectorstore = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=_get_embeddings(),
    )

    dense_results: list[Document] = []
    sparse_results: list[Document] = []
    seen_dense: set[str] = set()
    seen_sparse: set[str] = set()

    for q in queries:
        for doc in vectorstore.similarity_search(q, k=k):
            key = doc.page_content[:120]
            if key not in seen_dense:
                seen_dense.add(key)
                dense_results.append(doc)

        if _bm25 is not None:
            bm25_scores = _bm25.get_scores(q.lower().split())
            top_idx = np.argsort(bm25_scores)[::-1][:k]
            for i in top_idx:
                key = _bm25_docs[i].page_content[:120]
                if key not in seen_sparse:
                    seen_sparse.add(key)
                    sparse_results.append(_bm25_docs[i])

    merged = _rrf(dense_results, sparse_results)
    return merged[:k]