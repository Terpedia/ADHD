# Terpedia Targeted Study Plan Template

Use this prompt framework when asking an LLM to draft the ADHD terpene-focused study plan. The structure delivers a 600-word operational blueprint with decision gates, instrumentation, and product handoff notes. Replace bracketed placeholders before sending to the model.

---

## Project Brief

- **Study objective:** [insert objective statement]
- **Primary hypothesis:** [insert]
- **Secondary hypotheses / exploratory aims:** [insert]
- **Intervention concept:** [compound list, delivery route, dosing rationale]
- **Comparator:** [placebo / active comparator / usual care]
- **Target population:** [age range, diagnostic criteria, inclusion/exclusion highlights]
- **Data references:** `data/extraction_terpene_rcts.csv`, `rob2_terpene_rcts.csv`, `ADHD_Terpenes.md`, `study-methods.html`
- **Tone:** Clinical protocol style, ready for IRB pre-review and collaborator onboarding.

---

## Output Outline (Approx. 600 words total)

1. **Overview and Objectives (70–90 words)**
   - State clinical need, terpene rationale, and primary/secondary endpoints.

2. **Study Design Summary (90–110 words)**
   - Describe trial phase, randomization model, blinding, study arms, sample size target.
   - Include high-level timeline with key visits.

3. **Population and Eligibility (80–100 words)**
   - Define inclusion/exclusion criteria (diagnostic standards, comorbidities, medication washout).
   - Note recruitment sources and stratification considerations (age bands, baseline severity).

4. **Intervention and Comparator Details (80–100 words)**
   - Specify formulation, dosing schedule, titration plan, administration route.
   - Document comparator handling, adherence monitoring, and product quality controls.

5. **Outcomes and Instrumentation (90–120 words)**
   - Primary endpoints: objective attention/executive metrics (e.g., TOVA, n-back, EEG beta synchrony).
   - Secondary endpoints: clinician-rated scales, patient-reported outcomes, biomarkers.
   - Detail assessment schedule and blinding of outcome assessors.

6. **Operational Plan and Decision Gates (90–110 words)**
   - Map visit structure (baseline, midpoints, follow-up), procedures, and safety labs.
   - Define go/no-go criteria at interim analyses, adverse event management, and stopping rules.
   - Call out data capture platforms and quality-control workflows.

7. **Risk Mitigation and Ethics (60–80 words)**
   - Summarize known or theoretical safety concerns, monitoring procedures, and reporting cadence.
   - Reference consent process, DSMB involvement, and regulatory filings as appropriate.

8. **Product Translation Notes (40–60 words)**
   - Link study outputs to Focus on Focus product roadmap, including formulation validation or labeling needs.

---

## Guidance and Constraints

- Ground all numeric assumptions (sample, dosing, effect sizes) in available evidence or state when assumptions are exploratory.
- Use consistent terminology with `study-methods.html` to maintain alignment between design and execution documents.
- Favor concise paragraphs and bullet lists for procedural steps; avoid nested numbering that complicates LLM comprehension.
- Cite datasets or prior studies in-text with short references (e.g., “(see Trial X, 2021)”); long bibliographies are not required for this document.
- Highlight unknowns or TBD items explicitly so human reviewers can fill gaps.

---

## Optional Appendices (Include only if requested)

- **Schedule of assessments table** summarizing visit-by-visit activities.
- **Data collection schema** referencing electronic case report forms or REDCap modules.
- **Manufacturing readiness checklist** mapping trial learnings to product scaling requirements.

---

## Submission Metadata (Fill Before Prompting)

- **Run ID / Git commit:** [insert]
- **Dataset snapshot date:** [insert]
- **Protocol lead:** [insert]
- **LLM assistant / version:** [insert]
