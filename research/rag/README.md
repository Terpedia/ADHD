# Retrieval-Augmented Generation (RAG)

Reusable components that turn the corpus into a searchable knowledge base and expose helper utilities for notebooks.

## Directories

- `config/` – YAML/TOML/JSON configs for embedding models, chunking, or datastore connections.
- `pipelines/` – scripts defining ingestion, indexing, and query flows.
- `scripts/` – lightweight utilities (CLI entry points, schedulers, etc.).

## Suggested Workflow

1. **Ingest** documents from `../corpus` with a pipeline script.
2. **Embed** content using an embedding provider (OpenAI, Vertex, etc.).
3. **Persist** vectors locally (FAISS, Chroma) or remotely (Pinecone, Weaviate).
4. **Query** from notebooks via a helper function (see `pipelines/rag.py`).

Keep credentials in environment variables or `.env` files that are excluded from git.
