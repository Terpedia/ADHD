"""Local Chroma-based RAG helpers for ADHD research."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional

import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions


@dataclass
class CorpusDocument:
    """Metadata wrapper for a processed corpus chunk."""

    doc_id: str
    text: str
    source: str
    tags: List[str]
    metadata: dict


def load_corpus(processed_dir: Path, index_path: Optional[Path] = None) -> List[CorpusDocument]:
    """Load processed corpus files and optional metadata index."""

    documents: List[CorpusDocument] = []

    if index_path and index_path.exists():
        index = json.loads(index_path.read_text())
        for item in index:
            chunk_path = processed_dir / Path(item["path"]).name
            if not chunk_path.exists():
                continue
            payload = json.loads(chunk_path.read_text())
            documents.append(
                CorpusDocument(
                    doc_id=item["id"],
                    text=payload["text"],
                    source=item.get("source", ""),
                    tags=item.get("tags", []),
                    metadata={k: v for k, v in item.items() if k not in {"id", "path", "source", "tags"}},
                )
            )
        return documents

    # fallback: load every JSON file in processed_dir
    for file_path in processed_dir.glob("*.json"):
        payload = json.loads(file_path.read_text())
        documents.append(
            CorpusDocument(
                doc_id=file_path.stem,
                text=payload.get("text", ""),
                source=payload.get("source", ""),
                tags=payload.get("tags", []),
                metadata={k: v for k, v in payload.items() if k not in {"text", "source", "tags"}},
            )
        )

    return documents


def get_chroma_client(persist_directory: Path) -> chromadb.Client:
    persist_directory.mkdir(parents=True, exist_ok=True)
    return chromadb.Client(Settings(persist_directory=str(persist_directory), anonymized_telemetry=False))


def build_collection(
    client: chromadb.Client,
    name: str,
    embed_model: Optional[str] = None,
    openai_api_key: Optional[str] = None,
) -> chromadb.api.models.Collection.Collection:
    """Get or create a Chroma collection with the requested embedding function."""

    embedding_function = None

    if embed_model:
        if embed_model.startswith("text-embedding"):
            api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise RuntimeError("OPENAI_API_KEY must be set for OpenAI embeddings")
            embedding_function = embedding_functions.OpenAIEmbeddingFunction(
                api_key=api_key,
                model_name=embed_model,
            )
        else:
            raise ValueError(f"Unsupported embedding model: {embed_model}")

    try:
        collection = client.get_collection(name=name)
        if embedding_function:
            collection._embedding_function = embedding_function
        return collection
    except chromadb.errors.InvalidCollectionError:
        return client.create_collection(name=name, embedding_function=embedding_function)


def upsert_documents(
    collection: chromadb.api.models.Collection.Collection,
    documents: Iterable[CorpusDocument],
    batch_size: int = 64,
) -> None:
    """Insert or update documents inside the Chroma collection."""

    batch: List[CorpusDocument] = []

    for doc in documents:
        batch.append(doc)
        if len(batch) >= batch_size:
            _flush_batch(collection, batch)
            batch.clear()

    if batch:
        _flush_batch(collection, batch)


def _flush_batch(collection, batch: List[CorpusDocument]) -> None:
    collection.upsert(
        ids=[doc.doc_id for doc in batch],
        documents=[doc.text for doc in batch],
        metadatas=[{"source": doc.source, "tags": doc.tags, **doc.metadata} for doc in batch],
    )


def query(
    collection: chromadb.api.models.Collection.Collection,
    query_text: str,
    n_results: int = 4,
) -> List[dict]:
    """Return top matches for the given query."""

    result = collection.query(query_texts=[query_text], n_results=n_results)
    matches = []
    for ids, docs, metadatas in zip(result["ids"], result["documents"], result["metadatas"]):
        for doc_id, text, metadata in zip(ids, docs, metadatas):
            matches.append({"id": doc_id, "text": text, "metadata": metadata})
    return matches
