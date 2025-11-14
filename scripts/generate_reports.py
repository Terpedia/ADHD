#!/usr/bin/env python3
"""
Generate a single report from a template by calling OpenRouter.

Usage examples:

    python scripts/generate_reports.py \
        --template meta-template.md \
        --output meta.md \
        --context context/meta.json

    python scripts/generate_reports.py \
        --template study.template.md \
        --output study.md \
        --model openrouter/gpt-5

If --dry-run is supplied, the merged prompt is written to the output file
without calling the LLM. OPENROUTER_API_KEY must be set to perform generation.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

import requests


OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-4o-mini"


def read_file(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Template missing: {path}")
    return path.read_text(encoding="utf-8")


def read_context(path: Optional[Path]) -> Dict[str, Any]:
    if not path:
        return {}
    if not path.exists():
        raise FileNotFoundError(f"Context file missing: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def merge_template(template: str, context: Dict[str, Any]) -> str:
    """Fill simple [placeholders] with context values if provided."""
    content = template
    for key, value in context.items():
        placeholder = f"[{key}]"
        if placeholder in content:
            content = content.replace(placeholder, str(value))
    return content


def call_openrouter(prompt: str, model: str) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set. Aborting request.")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/danielmcshan/ADHD",
        "X-Title": "ADHD Meta/Study Report Generator",
    }

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are Terpedia's scientific writing assistant. "
                    "Produce journal-quality scientific prose aligned with the provided template. "
                    "Respect headings, requested word counts, and guardrails. "
                    "Do not invent data beyond the context supplied."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": 0.2,
        "max_tokens": 4096,
    }

    response = requests.post(OPENROUTER_BASE_URL, headers=headers, json=payload, timeout=120)
    if response.status_code >= 400:
        raise RuntimeError(
            f"OpenRouter error {response.status_code}: {response.text}"
        )
    data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Unexpected OpenRouter response: {data}") from exc


def generate(template_path: Path, output_path: Path, context: Dict[str, Any], model: str, dry_run: bool) -> None:
    template = read_file(template_path)
    prompt = merge_template(template, context)

    if dry_run:
        output_path.write_text(prompt, encoding="utf-8")
        print(f"[dry-run] Wrote merged template to {output_path}")
        return

    content = call_openrouter(prompt, model=model)
    output_path.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Generated {output_path.name} using {model}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a Terpedia report via OpenRouter.")
    parser.add_argument(
        "--template",
        type=Path,
        required=True,
        help="Path to template Markdown file (e.g., meta-template.md).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Destination Markdown file for the generated report.",
    )
    parser.add_argument("--context", type=Path, help="Optional JSON context file with placeholder replacements.")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"OpenRouter model (default {DEFAULT_MODEL}).")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not call OpenRouter; just merge placeholders for inspection.",
    )
    args = parser.parse_args()

    context = read_context(args.context)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    generate(args.template, args.output, context, args.model, args.dry_run)


if __name__ == "__main__":
    main()
