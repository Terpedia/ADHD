# Corpus

Place source materials here for retrieval-augmented generation workflows.

## Conventions

- Use `raw/` for unprocessed documents (PDF, HTML, etc.).
- Use `processed/` for cleaned text, chunked JSON, or other embeddings-ready formats.
- Maintain `corpus-index.json` to track metadata (title, source URL, ingestion date, tags).

A starter index file can look like:

```json
[
  {
    "id": "study-linalool-2024",
    "path": "processed/study-linalool-2024.json",
    "source": "https://doi.org/10.5555/jnp.2024.11827",
    "tags": ["attention", "terpene", "linalool"],
    "ingested_at": "2025-11-07"
  }
]
```

Keep sensitive data out of version control or add it to `.gitignore` as needed.
