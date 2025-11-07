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

## Updating Artifact Cards
- Markdown artifacts (`type: "markdown"`) render formatted copy and Kroki diagrams inside fenced code blocks (` ```kroki-diagramType ... ``` `).
- Scholarly references (`type: "reference"`) show title, journal metadata, abstract, and optional notes.
