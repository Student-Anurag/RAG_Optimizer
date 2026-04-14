import numpy as np
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from rank_bm25 import BM25Okapi

CHROMA_PATH = "./chroma_db"

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

def ingest(docs: list[Document]) -> int:
    global _bm25, _bm25_docs

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=64,
    )
    chunks = splitter.split_documents(docs)

    Chroma.from_documents(
        chunks,
        _get_embeddings(),
        persist_directory=CHROMA_PATH,
    )

    _bm25_docs = chunks
    tokenized = [c.page_content.lower().split() for c in chunks]
    _bm25 = BM25Okapi(tokenized)

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