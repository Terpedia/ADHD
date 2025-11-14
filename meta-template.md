# Terpedia Meta-Study Generation Template

Use this template when prompting an LLM to generate the ADHD umbrella review meta-study. Replace bracketed placeholders with project-specific context before sending the prompt. Preserve headings and requested word counts to keep outputs consistent across drafts and revisions.

---

## Project Context

- **Primary research question:** [insert]
- **Sub-questions / moderators of interest:** [insert]
- **Target audience:** Clinical researchers, product formulators, evidence reviewers.
- **Data foundation:** Summaries and extracted statistics from `data/extraction_meta_analyses.csv`, `data/extraction_terpene_rcts.csv`, `amstar2_meta_analyses.csv`, `rob2_terpene_rcts.csv`.
- **Tone:** Analytical, precise, journal-ready prose (Nature Mental Health tier).
- **Citation style:** Inline bracketed numeric references (e.g., `[1]`) mapped to studies in the Evidence Appendix.

---

## Required Output Structure

1. **Executive Summary (120–150 words)**
   - Capture the central thesis, study volume, headline effect ranges, and practice implications.

2. **Scope and Methods (150–180 words)**
   - List databases searched, date range, inclusion criteria, and registered protocol reference (PROSPERO draft).
   - Mention dual-reviewer screening, AMSTAR 2 and RoB 2 assessments, and analysis methods (REML, moderator models).

3. **Evidence Synthesis (260–320 words)**
   - Organize by intervention class (pharmacological, behavioral, neuromodulation, nutritional, terpenes).
   - Report pooled effect sizes with confidence intervals and heterogeneity signals (I^2, prediction intervals).
   - Highlight key moderators and comparative strength of evidence.

4. **Mechanistic Insights (150–190 words)**
   - Explain neurobiological or behavioral mechanisms, linking terpene findings to attention circuitry where possible.
   - Reference relevant biomarkers or mechanistic trials surfaced in the dataset.

5. **Implementation Considerations (160–200 words)**
   - Discuss translation to clinical or product settings, regulatory notes, and integration with Focus on Focus product plans.
   - Flag gaps in the evidence base and prerequisites for adoption.

6. **Next Actions (120–160 words)**
   - Outline immediate research steps, targeted RCT concepts, and product validation tasks.

7. **Evidence Appendix**
   - Provide a numbered list of cited studies with bibliographic details (author, year, title, journal).
   - Note if effect sizes are drawn from previously published meta-analyses or calculated de novo.

---

## Quality Guardrails

- Maintain factual alignment with provided CSV extractions and quality assessments.
- Clearly state when data is limited, heterogeneous, or derived from small sample counts.
- Avoid hallucinating study titles or results; if evidence is sparse, note the gap explicitly.
- Ensure numerical findings match the directionality (higher scores better vs worse) recorded in the dataset.
- Keep each section within the requested word ranges (±10%) for consistency across drafts.

---

## Optional Insertions

- **Tables or bullet summaries** for intervention class comparisons if the dataset supports quantitative contrasts.
- **Callout boxes** (labeled “Key Insight”) for high-impact findings or recommendations.
- **Sensitivity analysis notes** reflecting removal of high-risk-of-bias trials or alternative models.

---

## Submission Metadata (Fill Before Prompting)

- **Run ID / Git commit:** [insert]
- **Dataset snapshot date:** [insert]
- **Analyst reviewer:** [insert]
- **LLM assistant / version:** [insert]
