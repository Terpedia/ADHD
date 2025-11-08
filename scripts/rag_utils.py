"""
Helper functions for working with the repository RAG assets.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable, List, Optional

import requests
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

REPO_ROOT = Path(__file__).resolve().parents[1]
RAG_DIR = REPO_ROOT / "data" / "rag"
VECTORSTORE_DIR = RAG_DIR / "vectorstore"

DEFAULT_EMBED_MODEL = os.environ.get(
    "RAG_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
)
DEFAULT_CHAT_URL = os.environ.get("KB_CHAT_URL", "https://kb.terpedia.com/v1/api/chat")


def load_vector_store(
    embeddings_model: str = DEFAULT_EMBED_MODEL,
    persist_dir: Path | str = VECTORSTORE_DIR,
):
    """Load the FAISS vector store from disk."""
    persist_dir = Path(persist_dir)
    if not persist_dir.exists():
        raise FileNotFoundError(
            f"Vector store not found at {persist_dir}. Run rag_ingest.build_vector_store first."
        )

    embeddings = SentenceTransformerEmbeddings(model_name=embeddings_model)
    return FAISS.load_local(
        str(persist_dir),
        embeddings,
        allow_dangerous_deserialization=True,
    )


def retrieve_context(
    query: str,
    *,
    retriever=None,
    k: int = 4,
) -> List[Document]:
    """Return the top-k documents for a query."""
    if retriever is None:
        retriever = load_vector_store().as_retriever(search_kwargs={"k": k})
    return retriever.get_relevant_documents(query)


def format_context(documents: Iterable[Document]) -> str:
    """Render retrieved documents into a prompt-friendly string."""
    lines = []
    for idx, doc in enumerate(documents, start=1):
        source = doc.metadata.get("source", "unknown")
        snippet = doc.page_content.strip()
        lines.append(f"[{idx}] Source: {source}\n{snippet}")
    return "\n\n".join(lines)


def call_chat_api(
    prompt: str,
    context_documents: Iterable[Document],
    *,
    history: Optional[List[dict]] = None,
    api_url: str = DEFAULT_CHAT_URL,
    api_key: Optional[str] = None,
    timeout: int = 60,
) -> requests.Response:
    """
    Send the prompt and retrieved context to the Terpedia chat endpoint.

    The exact payload schema may vary; adjust as needed to match the upstream API.
    """
    context = format_context(context_documents)
    history = history or []
    messages = history + [
        {
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion:\n{prompt}",
        }
    ]

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    response = requests.post(
        api_url,
        json={"messages": messages},
        timeout=timeout,
        headers=headers,
    )
    response.raise_for_status()
    return response
