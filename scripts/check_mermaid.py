#!/usr/bin/env python3
"""
Mermaid syntax checker for project diagrams.

Collects all .mmd sources plus inline Mermaid blocks in HTML files
and validates them using @mermaid-js/mermaid-cli. Intended to run
automatically via the pre-push git hook (see githooks/pre-push).
"""

from __future__ import annotations

import html
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Iterable, List, Tuple


ROOT = Path(__file__).resolve().parents[1]
MERMAID_CLI = ["npx", "-y", "@mermaid-js/mermaid-cli@10.9.0"]

INLINE_SOURCES: Iterable[Path] = (
    ROOT / "meta-methods.html",
    ROOT / "study-methods.html",
)

MMD_FILES: Iterable[Path] = (
    ROOT / "META-METHODS.mmd",
)


class MermaidError(Exception):
    """Raised when mermaid-cli reports a syntax error."""


def find_inline_mermaid(path: Path) -> List[Tuple[str, str]]:
    content = path.read_text(encoding="utf-8")
    pattern = re.compile(
        r'<div[^>]*class="[^"]*mermaid[^"]*"[^>]*>(.*?)</div>',
        re.DOTALL | re.IGNORECASE,
    )
    blocks: List[Tuple[str, str]] = []
    for idx, match in enumerate(pattern.finditer(content), start=1):
        raw = html.unescape(match.group(1)).strip()
        if raw:
            blocks.append((f"{path.name} (block {idx})", raw))
    return blocks


def run_mermaid_cli(label: str, definition: str) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        source_file = tmp_dir / "diagram.mmd"
        output_file = tmp_dir / "diagram.svg"
        source_file.write_text(definition, encoding="utf-8")

        cmd = [
            *MERMAID_CLI,
            "-i",
            str(source_file),
            "-o",
            str(output_file),
            "--quiet",
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            message = result.stderr.strip() or result.stdout.strip()
            raise MermaidError(f"{label}: {message or 'unknown error'}")


def main() -> int:
    snippets: List[Tuple[str, str]] = []

    for path in MMD_FILES:
        if path.exists():
            snippets.append((str(path.relative_to(ROOT)), path.read_text(encoding="utf-8")))

    for path in INLINE_SOURCES:
        if path.exists():
            snippets.extend(find_inline_mermaid(path))

    if not snippets:
        print("No Mermaid definitions found. Skipping check.")
        return 0

    errors: List[str] = []
    for label, definition in snippets:
        try:
            run_mermaid_cli(label, definition)
        except MermaidError as exc:
            errors.append(str(exc))

    if errors:
        print("Mermaid syntax check failed:\n")
        for error in errors:
            print(f"  - {error}")
        print("\nFix the issues above before pushing.")
        return 1

    print(f"Mermaid syntax check passed for {len(snippets)} snippet(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
