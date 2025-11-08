"""
Utilities for building a FAISS vector store from repository documents.

Run locally, in CI, or from Colab to keep the RAG corpus in sync.
"""

from __future__ import annotations

import argparse
import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List, Sequence

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DIRS = [
    REPO_ROOT / "data" / "uploads",
    REPO_ROOT / "docs",
]
RAG_DIR = REPO_ROOT / "data" / "rag"
VECTORSTORE_DIR = RAG_DIR / "vectorstore"
MANIFEST_PATH = RAG_DIR / "docs-manifest.json"

SUPPORTED_SUFFIXES = {".md", ".txt", ".pdf", ".mdx"}


@dataclass
class DocumentRecord:
    source: str
    chunk_id: str
    chunk_index: int
    num_tokens: int
    created_at: str


def ensure_directories(*paths: Path) -> None:
    for path in paths:
        path.mkdir(parents=True, exist_ok=True)


def load_file(path: Path) -> List[Document]:
    suffix = path.suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        return []

    if suffix == ".pdf":
        loader = PyPDFLoader(str(path))
        docs = loader.load()
    else:
        loader = TextLoader(str(path), encoding="utf-8")
        docs = loader.load()

    for doc in docs:
        doc.metadata.setdefault("source", str(path.relative_to(REPO_ROOT)))
    return docs


def collect_documents(source_dirs: Sequence[Path]) -> List[Document]:
    documents: List[Document] = []
    for directory in source_dirs:
        if not directory.exists():
            continue
        for path in directory.rglob("*"):
            if path.is_file():
                documents.extend(load_file(path))
    return documents


def split_documents(
    documents: Iterable[Document],
    chunk_size: int,
    chunk_overlap: int,
) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    return splitter.split_documents(list(documents))


def build_vector_store(
    source_dirs: Sequence[Path] = DEFAULT_SOURCE_DIRS,
    output_dir: Path = VECTORSTORE_DIR,
    chunk_size: int = 800,
    chunk_overlap: int = 120,
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
) -> None:
    ensure_directories(*source_dirs, output_dir, RAG_DIR)

    documents = collect_documents(source_dirs)
    if not documents:
        raise RuntimeError(
            "No documents discovered. Add files to data/uploads or specify --source."
        )

    chunks = split_documents(documents, chunk_size, chunk_overlap)
    print(f"Loaded {len(documents)} documents → {len(chunks)} chunks.")

    embeddings = SentenceTransformerEmbeddings(model_name=embedding_model)
    vectorstore = FAISS.from_documents(chunks, embedding=embeddings)
    vectorstore.save_local(str(output_dir))
    print(f"Saved FAISS index to {output_dir}")

    manifest_records = []
    now = datetime.now(timezone.utc).isoformat()
    for idx, chunk in enumerate(chunks):
        chunk_id = f"chunk-{idx:05d}"
        manifest_records.append(
            DocumentRecord(
                source=chunk.metadata.get("source", "unknown"),
                chunk_id=chunk_id,
                chunk_index=idx,
                num_tokens=len(chunk.page_content.split()),
                created_at=now,
            )
        )

    with MANIFEST_PATH.open("w", encoding="utf-8") as manifest_file:
        json.dump([asdict(record) for record in manifest_records], manifest_file, indent=2)
    print(f"Wrote manifest with {len(manifest_records)} entries to {MANIFEST_PATH}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the RAG vector store.")
    parser.add_argument(
        "--source",
        dest="sources",
        action="append",
        default=[],
        help="Source directory to include (defaults to data/uploads and docs).",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=int(os.environ.get("RAG_CHUNK_SIZE", 800)),
        help="Text splitter chunk size.",
    )
    parser.add_argument(
        "--chunk-overlap",
        type=int,
        default=int(os.environ.get("RAG_CHUNK_OVERLAP", 120)),
        help="Text splitter overlap.",
    )
    parser.add_argument(
        "--model",
        default=os.environ.get(
            "RAG_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
        ),
        help="SentenceTransformer model name.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    sources = [Path(path) for path in args.sources] if args.sources else DEFAULT_SOURCE_DIRS
    build_vector_store(
        source_dirs=sources,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
        embedding_model=args.model,
    )


if __name__ == "__main__":
    main()
