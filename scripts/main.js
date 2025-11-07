const canvas = document.getElementById("canvas");
const newFlowButton = document.getElementById("new-flow-button");

const flows = [];
const lines = [];

const COLOR_LINE = getComputedStyle(document.documentElement)
  .getPropertyValue("--line")
  .trim();

const STOP_WORDS = new Set(
  [
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "can",
    "for",
    "from",
    "have",
    "in",
    "is",
    "it",
    "may",
    "of",
    "on",
    "or",
    "that",
    "the",
    "their",
    "this",
    "to",
    "with",
  ].map((word) => word.toLowerCase())
);

/**
 * Utility helpers
 */
const uid = (() => {
  let count = 0;
  return (prefix = "node") => `${prefix}-${Date.now()}-${++count}`;
})();

const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

const formatPaperLabel = (paper, index) =>
  paper.shortLabel ||
  `${paper.journal ? paper.journal.split(" ")[0] : "Paper"} ${index + 1}`;

const getTopTerms = (abstracts, limit = 8) => {
  const frequencies = new Map();
  const text = abstracts.join(" ").toLowerCase();
  const tokens = text.match(/[a-zA-Z-]{3,}/g) || [];

  tokens.forEach((token) => {
    if (STOP_WORDS.has(token)) return;
    const key = token.replace(/-+/g, "-");
    frequencies.set(key, (frequencies.get(key) || 0) + 1);
  });

  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
};

const extractClaims = (papers) => {
  const triggerWords = ["significant", "modulates", "associated", "suggest", "improve", "correlates"];
  const claims = [];

  papers.forEach((paper) => {
    const sentences = paper.abstract.split(/(?<=[.!?])\s+/);
    sentences.forEach((sentence) => {
      const lower = sentence.toLowerCase();
      const hit = triggerWords.find((word) => lower.includes(word));
      if (!hit) return;
      claims.push({
        source: paper.title,
        highlight: hit,
        text: sentence.trim(),
      });
    });
  });

  return claims.slice(0, 4);
};

const buildPrompt = (question, persona = "research strategist") => {
  return [
    `You are a ${persona} embedded within Terpedia's inquiry engine.`,
    `Your task is to evaluate whether emerging terpene science can inform ADHD-focused interventions.`,
    "",
    `1. Restate the core user question: "${question}".`,
    "2. Identify terpene mechanisms (neurological, endocrine, behavioral) most relevant to attention regulation.",
    "3. Retrieve 3 recent peer-reviewed findings or preprints with clear links to ADHD, cognition, or focus.",
    "4. Summarize market-readiness signals (formulation maturity, safety evidence, regulatory posture).",
    "5. Recommend next investigative steps for experimentation or evidence gathering.",
    "",
    "Respond in no more than 220 words with concise paragraphs and clear callouts.",
  ].join("\n");
};

const buildLLMAnswer = (question, papers) => {
  const firstPaper = papers[0];
  const terpeneMention = firstPaper?.keyTerpene || "linalool";
  return [
    `Preliminary synthesis: Terpenes such as ${terpeneMention} show neuromodulatory effects that align with ADHD symptom pathways.`,
    "",
    `Evidence snapshot:`,
    papers
      .map(
        (paper) =>
          `• ${paper.title} (${paper.year}): ${paper.summary || "Highlights modulation of dopaminergic and noradrenergic signaling."}`
      )
      .join("\n"),
    "",
    `Implication: ${question} — Current data support further formulation work that blends targeted terpenes with established ADHD management protocols.`,
    "Next steps: design a small-N focus cohort, capture EEG/attention metrics, and validate supply chain partners for the featured terpenes.",
  ].join("\n");
};

/**
 * Node + line creation
 */
const createNodeShell = ({ id, label, title, x, y }) => {
  const node = document.createElement("section");
  node.className = "node";
  node.id = id;
  node.dataset.x = String(x);
  node.dataset.y = String(y);
  node.style.transform = `translate(${x}px, ${y}px)`;

  if (label || title) {
    const header = document.createElement("header");
    header.className = "node__header";

    if (label) {
      const labelEl = document.createElement("span");
      labelEl.className = "node__label";
      labelEl.textContent = label;
      header.append(labelEl);
    }

    if (title) {
      const titleEl = document.createElement("h3");
      titleEl.className = "node__title";
      titleEl.textContent = title;
      header.append(titleEl);
    }

    node.append(header);
  }

  const body = document.createElement("div");
  body.className = "node__body";
  node.append(body);

  canvas.append(node);
  return { node, body };
};

const connectNodes = (fromId, toId) => {
  const from = document.getElementById(fromId);
  const to = document.getElementById(toId);
  if (!from || !to || typeof LeaderLine === "undefined") return;

  const line = new LeaderLine(from, to, {
    color: COLOR_LINE,
    size: 2.4,
    path: "grid",
    startSocket: "right",
    endSocket: "left",
    startPlug: "disc",
    endPlug: "arrow3",
    endPlugSize: 2.6,
    gradient: true,
    dash: { animation: true },
  });

  lines.push({ fromId, toId, line });
};

const updateLinesForNode = (nodeId) => {
  lines.forEach((entry) => {
    if (entry.fromId === nodeId || entry.toId === nodeId) {
      entry.line.position();
    }
  });
};

const updateAllLines = () => {
  lines.forEach((entry) => entry.line.position());
};

/**
 * Node builders
 */
const buildQuestionNode = ({ id, position, flow, onQuestionChange }) => {
  const { node, body } = createNodeShell({
    id,
    label: "Input",
    title: "Research Question",
    x: position.x,
    y: position.y,
  });

  const prompt = document.createElement("label");
  prompt.textContent = "What inquiry should we pursue?";
  prompt.style.display = "block";
  prompt.style.fontWeight = "500";
  prompt.style.color = "var(--text)";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "node__input";
  input.value = flow.question;
  input.placeholder = "Formulate a terpene-focused ADHD hypothesis...";
  input.setAttribute("aria-label", "Research question");

  input.addEventListener("input", (event) => {
    const value = event.target.value.trim();
    onQuestionChange(value.length ? value : flow.question);
  });

  body.append(prompt, input);
  return node;
};

const buildPromptNode = ({ id, position, flow }) => {
  const { node, body } = createNodeShell({
    id,
    label: "LLM Prompt",
    title: "System Briefing",
    x: position.x,
    y: position.y,
  });

  const pre = document.createElement("pre");
  pre.className = "node__prompt";
  pre.textContent = buildPrompt(flow.question);
  pre.dataset.role = "promptContent";

  body.append(pre);
  return node;
};

const buildLLMNode = ({ id, position, flow }) => {
  const { node, body } = createNodeShell({
    id,
    label: "LLM Output",
    title: "Synopsis & Direction",
    x: position.x,
    y: position.y,
  });

  const paragraphs = buildLLMAnswer(flow.question, flow.papers)
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  paragraphs.forEach((chunk) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = chunk;
    paragraph.style.marginBottom = "0.9rem";
    paragraph.style.color = "var(--text-secondary)";
    body.append(paragraph);
  });

  return node;
};

const buildEvidenceNode = ({ id, position, flow }) => {
  const { node, body } = createNodeShell({
    id,
    label: "Evidence",
    title: "Highlighted Papers",
    x: position.x,
    y: position.y,
  });

  const list = document.createElement("ul");
  list.className = "node__list";

  flow.papers.forEach((paper) => {
    const item = document.createElement("li");
    item.className = "node__list-item";

    const title = document.createElement("strong");
    if (paper.link) {
      const link = document.createElement("a");
      link.href = paper.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = paper.title;
      title.append(link);
    } else {
      title.textContent = paper.title;
    }

    const meta = document.createElement("small");
    meta.textContent = `${paper.journal || "Journal"} · ${paper.year || "2024"}`;
    meta.style.display = "block";
    meta.style.marginBottom = "0.35rem";
    meta.style.color = "rgba(148, 163, 184, 0.75)";

    const summary = document.createElement("p");
    summary.textContent = paper.summary;
    summary.style.margin = 0;
    summary.style.fontSize = "0.9rem";

    item.append(title, meta, summary);
    list.append(item);
  });

  body.append(list);
  return node;
};

const buildAbstractTabsNode = ({ id, position, flow }) => {
  const { node, body } = createNodeShell({
    id,
    label: "Deep Dive",
    title: "Abstract Explorer",
    x: position.x,
    y: position.y,
  });

  const tabsContainer = document.createElement("div");
  tabsContainer.className = "tabs";

  const panel = document.createElement("div");
  panel.className = "tabs__panel";

  const renderAbstract = (paper) => {
    panel.innerHTML = "";

    const heading = document.createElement("strong");
    heading.textContent = paper.title;
    heading.style.display = "block";
    heading.style.marginBottom = "0.45rem";
    heading.style.color = "var(--text)";

    const abstract = document.createElement("p");
    abstract.textContent = paper.abstract;
    abstract.style.margin = 0;
    abstract.style.color = "var(--text-secondary)";
    abstract.style.fontSize = "0.92rem";
    abstract.style.lineHeight = "1.6";

    panel.append(heading, abstract);
  };

  const buttons = flow.papers.map((paper, index) => {
    const button = document.createElement("button");
    button.className = "tabs__button";
    button.type = "button";
    button.textContent = formatPaperLabel(paper, index);
    button.addEventListener("click", () => {
      buttons.forEach((btn) => btn.classList.remove("is-active"));
      button.classList.add("is-active");
      renderAbstract(paper);
    });
    tabsContainer.append(button);
    return button;
  });

  if (buttons[0]) {
    buttons[0].classList.add("is-active");
    renderAbstract(flow.papers[0]);
  }

  body.append(tabsContainer, panel);
  return node;
};

const buildInsightsNode = ({ id, position, flow }) => {
  const { node, body } = createNodeShell({
    id,
    label: "Synthesis",
    title: "Terms & Claims",
    x: position.x,
    y: position.y,
  });

  const abstracts = flow.papers.map((paper) => paper.abstract);
  const topTerms = getTopTerms(abstracts);
  const claims = extractClaims(flow.papers);

  const chipContainer = document.createElement("div");
  chipContainer.className = "chips";
  topTerms.forEach((term) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = term;
    chipContainer.append(chip);
  });

  const claimContainer = document.createElement("div");
  claimContainer.className = "claims";

  if (!claims.length) {
    const placeholder = document.createElement("p");
    placeholder.textContent = "No explicit claims detected. Flag abstracts for manual review.";
    placeholder.style.margin = 0;
    placeholder.style.color = "var(--text-secondary)";
    claimContainer.append(placeholder);
  } else {
    claims.forEach((claim) => {
      const box = document.createElement("article");
      box.className = "claim";

      const meta = document.createElement("div");
      meta.className = "claim__meta";
      meta.textContent = claim.source;

      const text = document.createElement("p");
      text.style.margin = 0;
      text.innerHTML = claim.text.replace(
        new RegExp(claim.highlight, "i"),
        (match) => `<strong>${match}</strong>`
      );

      box.append(meta, text);
      claimContainer.append(box);
    });
  }

  body.append(chipContainer, claimContainer);
  return node;
};

/**
 * Flow assembly
 */
const createInquiryFlow = (flow, index = flows.length) => {
  const flowId = uid("flow");
  const yOffset = index * 360;
  const layout = {
    question: { x: 40, y: 40 + yOffset },
    prompt: { x: 420, y: 40 + yOffset },
    answer: { x: 800, y: 40 + yOffset },
    evidence: { x: 800, y: 320 + yOffset },
    abstracts: { x: 420, y: 320 + yOffset },
    insights: { x: 40, y: 320 + yOffset },
  };

  const flowRecord = { id: flowId, data: flow, nodes: {} };
  flows.push(flowRecord);

  const questionNode = buildQuestionNode({
    id: `${flowId}-question`,
    position: layout.question,
    flow,
    onQuestionChange: (value) => {
      flowRecord.data.question = value;
      refreshPrompt(flowId);
      refreshLLM(flowId);
    },
  });

  const promptNode = buildPromptNode({
    id: `${flowId}-prompt`,
    position: layout.prompt,
    flow,
  });

  const answerNode = buildLLMNode({
    id: `${flowId}-answer`,
    position: layout.answer,
    flow,
  });

  const evidenceNode = buildEvidenceNode({
    id: `${flowId}-evidence`,
    position: layout.evidence,
    flow,
  });

  const abstractsNode = buildAbstractTabsNode({
    id: `${flowId}-abstracts`,
    position: layout.abstracts,
    flow,
  });

  const insightsNode = buildInsightsNode({
    id: `${flowId}-insights`,
    position: layout.insights,
    flow,
  });

  flowRecord.nodes = {
    question: questionNode.id,
    prompt: promptNode.id,
    answer: answerNode.id,
    evidence: evidenceNode.id,
    abstracts: abstractsNode.id,
    insights: insightsNode.id,
  };

  connectNodes(questionNode.id, promptNode.id);
  connectNodes(promptNode.id, answerNode.id);
  connectNodes(answerNode.id, evidenceNode.id);
  connectNodes(evidenceNode.id, abstractsNode.id);
  connectNodes(abstractsNode.id, insightsNode.id);
};

const refreshPrompt = (flowId) => {
  const flowRecord = flows.find((item) => item.id === flowId);
  if (!flowRecord) return;
  const promptNode = document.querySelector(`#${flowRecord.nodes.prompt} [data-role="promptContent"]`);
  if (promptNode) {
    promptNode.textContent = buildPrompt(flowRecord.data.question);
  }
};

const refreshLLM = (flowId) => {
  const flowRecord = flows.find((item) => item.id === flowId);
  if (!flowRecord) return;
  const node = document.getElementById(flowRecord.nodes.answer);
  if (!node) return;
  const body = node.querySelector(".node__body");
  body.innerHTML = "";
  const paragraphs = buildLLMAnswer(flowRecord.data.question, flowRecord.data.papers)
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  paragraphs.forEach((chunk) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = chunk;
    paragraph.style.marginBottom = "0.9rem";
    paragraph.style.color = "var(--text-secondary)";
    body.append(paragraph);
  });
};

/**
 * Interact.js configuration
 */
interact(".node").draggable({
  inertia: true,
  listeners: {
    move(event) {
      const target = event.target;
      const x = (parseFloat(target.dataset.x) || 0) + event.dx;
      const y = (parseFloat(target.dataset.y) || 0) + event.dy;
      target.dataset.x = String(x);
      target.dataset.y = String(y);
      target.style.transform = `translate(${x}px, ${y}px)`;
      updateLinesForNode(target.id);
    },
    end(event) {
      updateLinesForNode(event.target.id);
    },
  },
});

window.addEventListener("resize", () => {
  clearTimeout(window.__resizeTimer);
  window.__resizeTimer = setTimeout(() => updateAllLines(), 120);
});

/**
 * Demo data + boot
 */
const INITIAL_FLOW = {
  question: "Can terpenes play a role in working with ADHD?",
  papers: [
    {
      title: "Linalool Modulates Prefrontal Cortical Oscillations Linked to Sustained Attention",
      journal: "Journal of Neuropharmacology",
      year: 2024,
      link: "https://doi.org/10.5555/jnp.2024.11827",
      summary: "Acute inhalation of linalool enhanced beta-band synchrony and reduced variability in attention task performance among neurodivergent adults.",
      abstract:
        "In a randomized crossover study, we evaluated the impact of inhaled linalool on sustained attention in adults with ADHD traits. EEG recordings revealed enhanced beta oscillations within dorsolateral prefrontal regions and improved reaction time stability during continuous performance tasks. These findings suggest linalool may modulate cortical excitability relevant to attentional control.",
      keyTerpene: "linalool",
      shortLabel: "Linalool EEG",
    },
    {
      title: "Pinene-Rich Blends and Executive Function Among Adolescents with ADHD",
      journal: "Phytotherapy Research",
      year: 2023,
      link: "https://doi.org/10.5555/phyto.2023.90442",
      summary: "Pinene-dominant terpene formulations improved working memory scores and daytime alertness in a 6-week observational cohort.",
      abstract:
        "We tracked executive function metrics in adolescents supplementing with a pinene-rich terpene blend alongside standard behavioral therapy. Significant improvements were observed in n-back working memory accuracy and classroom alertness ratings versus matched controls. Mechanistic assays suggest synergistic modulation of noradrenergic signaling.",
      keyTerpene: "alpha-pinene",
      shortLabel: "Pinene Cohort",
    },
    {
      title: "Beta-Caryophyllene as an Adjunctive Strategy for Emotional Regulation in ADHD",
      journal: "Frontiers in Behavioral Neuroscience",
      year: 2022,
      link: "https://doi.org/10.5555/frontiers.2022.66721",
      summary: "CB2 agonism via beta-caryophyllene correlated with reduced emotional lability and improved task persistence scores.",
      abstract:
        "This double-blind pilot explored beta-caryophyllene supplementation in young adults managing ADHD-related dysregulation. Participants reported reduced emotional volatility and increased task persistence. Immune assays and salivary cortisol data indicate CB2-mediated anti-inflammatory pathways that may indirectly support executive functioning.",
      keyTerpene: "beta-caryophyllene",
      shortLabel: "BCP Pilot",
    },
  ],
};

createInquiryFlow(cloneDeep(INITIAL_FLOW), 0);

newFlowButton.addEventListener("click", () => {
  const question = window.prompt("What ADHD × terpene question should we explore next?");
  if (!question) return;

  const flowData = cloneDeep(INITIAL_FLOW);
  flowData.question = question.trim();

  createInquiryFlow(flowData, flows.length);
  requestAnimationFrame(() => updateAllLines());
});

window.addEventListener("load", () => {
  requestAnimationFrame(() => updateAllLines());
});
