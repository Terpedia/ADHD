# Focus On Focus Workspace

Interactive three-lane jsPlumb graph that maps `Questions → Answers → Artifacts` for Terpedia’s ADHD inquiry experiments.

## Deploy Status
- Last pushed commit: `6d669a4` — *Add lane-aware graph layout with artifact badge* (2025-11-07).
- Automated deployment is not configured in this repo; publish steps are manual.
- The in-app build badge reads deployment metadata from `<body>` data attributes. Make sure the deployment process sets:

  ```html
  <body
    data-commit-branch="main"
    data-commit-label="6d669a4"
    data-commit-time="2025-11-07T13:45:00Z"
    data-deploy-time="2025-11-07T14:00:00Z"
  >
  ```

  Update the values above with the commit and deploy times whenever you ship.

## Local Development
1. Serve the site with any static file server (e.g. `npx serve .`).
2. Ensure an internet connection for `jsPlumb`, `marked`, and Kroki diagram rendering.
3. Use the `+ Add Inquiry Lane` button to prototype additional question → answer → artifact flows.

## Inquiry Graph Definition
- `inquiry-graph.inq` stores the canonical flow for the UI as Mermaid. The app fetches this file on load (presently for reference only).
- `adhd-metastudy.inq` describes the broader MCP-driven metastudy pipeline; the two `.inq` docs will converge once the orchestration layer lands.

## MCP Tooling Roadmap
The inquiry graph is evolving into a locally hosted MCP stack. Planned tools line up with the metastudy flow:

1. `doc.*` — index/search/fetch ADHD corpus artifacts (optional `pdf.table.extract`).
2. `adhd.screen.classify` — relevance + study-type classifier with batch support.
3. `study.extract` — schema-driven structured extraction for study, population, outcome, and quality blocks.
4. `adhd.normalize` — canonicalise instruments, diagnosis labels, timepoints, and group names.
5. `meta.effect.compute` — compute Hedges g / log-OR / Fisher z plus variances and analysis keys.
6. `meta.run.*` — random-effects meta-analyses, meta-regressions, and bias diagnostics.
7. `inq.store` / `inq.graph` — persist artifacts and build the inquiry graph JSON.
8. `inq.runner` (optional) — execute `.inq` graphs end-to-end by invoking upstream tools.

All interfaces will be defined in JSON schemas so the same calls work locally or once hosted.

## Runtime Strategy
- **Current state:** run LLM + MCP services locally (Docker or bare processes) for rapid iteration.
- **Deployment target:** containerised services with config-driven endpoints, ready for future hosting (e.g., managed VM or Kubernetes).
- **Data handling:** the metastudy pipeline emits artifacts described in `adhd-metastudy.inq`; store them via `inq.store` so UI nodes can hydrate.
- **Observability/security:** even on localhost, tools will emit structured logs; design includes auth hooks for when services move beyond local.

## Updating Artifact Cards
- Markdown artifacts (`type: "markdown"`) render formatted copy and Kroki diagrams inside fenced code blocks (` ```kroki-diagramType ... ``` `).
- Scholarly references (`type: "reference"`) show title, journal metadata, abstract, and optional notes.

## Git Hooks
Mermaid syntax validation runs on `git push` via `githooks/pre-push`. To enable project hooks:

```bash
git config core.hooksPath githooks
```

Dependencies:
- Node.js with `npx` available (for `@mermaid-js/mermaid-cli`).
- Python 3 for `scripts/check_mermaid.py`.
