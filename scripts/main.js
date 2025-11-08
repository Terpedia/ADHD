const DEFAULT_METASTUDY = {
  question: "Generate a metastudy about ADHD backed by our current evidence graph.",
  abstract:
    "Objective: Aggregate cross-modal ADHD interventions to surface consistent response patterns. Methods: Synthesised 42 peer-reviewed trials spanning CBT, pharmacological, and integrative modalities, normalising outcomes to executive-function endpoints. Findings: Sustained attention improved in 71% of interventions with a pooled Hedges g of 0.42; working-memory gains tracked alongside dopaminergic modulation. Interpretation: The evidence backbone substantiates continued combination strategies blending neuromodulation, behavioural scaffolding, and terpene adjuncts.",
  markdown: [
    "# ADHD Metastudy Summary",
    "",
    "## Scope",
    "- 42 trials; adult and adolescent cohorts",
    "- Modalities: CBT, stimulant and non-stimulant pharmacology, integrative protocols",
    "",
    "## Key Findings",
    "- Sustained attention: pooled Hedges g 0.42 (CI 0.31–0.53)",
    "- Working memory: 0.36 (CI 0.21–0.48)",
    "- Emotional regulation: 0.28 (CI 0.15–0.40)",
    "",
    "## Recommendations",
    "1. Advance terpene adjunct programmes paired with structured CBT.",
    "2. Expand longitudinal monitoring for executive-function durability.",
    "3. Align formulation readiness with upcoming regulatory checkpoints.",
  ].join("\n"),
  title: "Metastudy • ADHD Focus Evidence Backbone",
  copy: [
    "**Scope:** 42 trials spanning CBT, pharmacological, and integrative ADHD interventions.",
    "**Pull-through:** Extracted effect sizes for sustained attention, working memory, and executive control.",
    "**Usage:** Anchors Terpedia’s evidence grading rubric for ADHD-focused product concepts.",
  ].join("\n"),
  link: "https://terpedia.com/research/adhd-focus-metastudy",
  cta: "Open ADHD Metastudy",
  type: "markdown",
};

const DEFAULT_TERP_STUDY = {
  question: "Write a targeted study on terpenes and ADHD suited for rapid product iteration.",
  abstract:
    "Objective: Design a targeted validation study quantifying terpene contributions to ADHD symptom improvement. Methods: Prospective 12-week cohort randomised to terpene-rich formulation vs. standard behavioural therapy; endpoints include n-back accuracy, EEG beta synchrony, and clinician-rated focus inventories. Findings: Expected medium effect on sustained attention (d≈0.38) with correlated noradrenergic biomarkers. Interpretation: Study de-risks terpene integration and establishes readiness checkpoints for formulation scale-up.",
  markdown: [
    "# Terpene × ADHD Targeted Study Plan",
    "",
    "## Study Design",
    "- Duration: 12 weeks",
    "- Population: Adults 18–45 with diagnosed ADHD (combined presentation)",
    "- Arms: Terpene formulation + behavioural therapy vs. behavioural therapy alone",
    "",
    "## Outcome Measures",
    "- Primary: n-back working-memory accuracy",
    "- Secondary: EEG beta synchrony, focus inventory, daytime alertness",
    "- Exploratory: Supply-chain stability and sensory compliance",
    "",
    "## Next Steps",
    "1. Finalise terpene sourcing (linalool / alpha-pinene / beta-caryophyllene ratios).",
    "2. Register protocol and align with safety review board.",
    "3. Launch pilot with staged data locks at weeks 6 and 12.",
  ].join("\n"),
  title: "Targeted Study • Terpene Synergy for ADHD",
  copy: [
    "**Design:** 12-week pilot comparing terpene-rich formulations vs. placebo in adult ADHD cohorts.",
    "**Highlights:** Correlated linalool/pinene ratios with n-back performance and EEG biomarkers.",
    "**Next:** Supplies formulation SOPs and regulatory notes for rapid product iteration.",
  ].join("\n"),
  link: "https://terpedia.com/research/terpenes-adhd-focus-trial",
  cta: "View Terpene Study Dossier",
  type: "markdown",
};
const canvas = document.getElementById("canvas");
const newFlowButton = document.getElementById("new-flow-button");
const badge = document.querySelector(".build-badge");

const GRAPH_DEFINITION_URL = "./inquiry-graph.json";

const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

const DEFAULT_PAPERS = [
  {
    title: "Linalool Modulates Prefrontal Cortical Oscillations Linked to Sustained Attention",
    journal: "Journal of Neuropharmacology",
    year: 2024,
    link: "https://doi.org/10.5555/jnp.2024.11827",
    summary:
      "Acute inhalation of linalool enhanced beta-band synchrony and reduced variability in attention task performance among neurodivergent adults.",
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
    summary:
      "Pinene-dominant terpene formulations improved working memory scores and daytime alertness in a 6-week observational cohort.",
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
    summary:
      "CB2 agonism via beta-caryophyllene correlated with reduced emotional lability and improved task persistence scores.",
    abstract:
      "This double-blind pilot explored beta-caryophyllene supplementation in young adults managing ADHD-related dysregulation. Participants reported reduced emotional volatility and increased task persistence. Immune assays and salivary cortisol data indicate CB2-mediated anti-inflammatory pathways that may indirectly support executive functioning.",
    keyTerpene: "beta-caryophyllene",
    shortLabel: "BCP Pilot",
  },
];

const flows = [];
let jsPlumbInstance = null;
let graphDefinition = null;
let activeFlowId = null;
const flowConnections = new Map();

const updateFlowVisualState = (flowRecord, isActive) => {
  if (!flowRecord) return;

  Object.values(flowRecord.nodes || {}).forEach((nodeId) => {
    const element = document.getElementById(nodeId);
    if (element) {
      element.classList.toggle("node--active", Boolean(isActive));
    }
  });

  const connections = flowConnections.get(flowRecord.id);
  if (connections) {
    connections.forEach((connection) => {
      if (!connection) return;
      if (isActive) {
        connection.addClass("flow-connection--active");
      } else {
        connection.removeClass("flow-connection--active");
      }
    });
  }
};

const activateFlow = (flowId) => {
  activeFlowId = flowId || null;
  flows.forEach((flowRecord) => {
    updateFlowVisualState(flowRecord, activeFlowId && flowRecord.id === activeFlowId);
  });
};

const COLOR_LINE = getComputedStyle(document.documentElement)
  .getPropertyValue("--line")
  .trim();
const BODY_DATASET = document.body.dataset || {};
const LANE_INDEX = {
  questions: 0,
  answers: 1,
  artifacts: 2,
};
const LANE_NODE_HORIZONTAL_PADDING = 64;
const LANE_NODE_MIN_WIDTH = 260;
const NODE_LANES = {
  question: "questions",
  prompt: "questions",
  answer: "answers",
  insights: "answers",
  evidence: "artifacts",
  abstracts: "artifacts",
  metastudyQuestion: "questions",
  metastudyAbstract: "answers",
  metastudyMarkdown: "answers",
  metastudy: "artifacts",
  terpStudyQuestion: "questions",
  terpStudyAbstract: "answers",
  terpStudyMarkdown: "answers",
  terpStudy: "artifacts",
};
const ROW_SEQUENCE = [
  ["question"],
  ["prompt"],
  ["answer"],
  ["evidence"],
  ["terms"],
  ["claims"],
  ["abstracts"],
  ["metastudyQuestion"],
  ["metastudyAbstract"],
  ["metastudyMarkdown"],
  ["metastudy"],
  ["terpStudyQuestion"],
  ["terpStudyAbstract"],
  ["terpStudyMarkdown"],
  ["terpStudy"],
];
const ROW_GAP = 140;
const ROW_BASE_OFFSET = 140;
const FLOW_GAP = 240;
const CANVAS_TOP_PADDING = 160;
const CANVAS_BOTTOM_PADDING = 260;
let pendingLayoutFrame = null;

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

const truncateText = (value, maxLength = 120) => {
  if (!value) return "";
  const cleanValue = String(value).replace(/\s+/g, " ").trim();
  if (cleanValue.length <= maxLength) return cleanValue;
  return `${cleanValue.slice(0, maxLength - 1).trim()}…`;
};

const formatPaperLabel = (paper, index) =>
  paper.shortLabel ||
  `${paper.journal ? paper.journal.split(" ")[0] : "Paper"} ${index + 1}`;

const renderMarkdown = (element, markdown, options = {}) => {
  const { enableKroki = false } = options;
  let content = markdown;

  const placeholders = [];

  if (enableKroki) {
    content = markdown.replace(/```kroki-([a-z0-9-]+)\s+([\s\S]*?)```/gi, (_, type, body) => {
      const source = body.trim();
      const id = uid("kroki");
      placeholders.push({ id, type, source });
      return `<div class="kroki-diagram" data-kroki-id="${id}"><span class="kroki-diagram__loading">Rendering ${type}…</span></div>`;
    });
  }

  if (
    typeof window !== "undefined" &&
    window.marked &&
    typeof window.marked.parse === "function"
  ) {
    element.innerHTML = window.marked.parse(content);
  } else {
    element.textContent = content;
    return;
  }

  if (!enableKroki || !placeholders.length) return;

  placeholders.forEach(async ({ id, type, source }) => {
    const target = element.querySelector(`[data-kroki-id="${id}"]`);
    if (!target) return;
    try {
      const response = await fetch(`https://kroki.io/${type}/svg`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: source,
      });
      if (!response.ok) {
        throw new Error(`Kroki request failed with status ${response.status}`);
      }
      const svg = await response.text();
      target.innerHTML = svg;
      target.classList.add("kroki-diagram--ready");
    } catch (error) {
      console.error("Failed to render Kroki diagram:", error);
      target.innerHTML = `<span class="kroki-diagram__error">Diagram unavailable</span>`;
      target.classList.add("kroki-diagram--error");
    }
  });
};

const ensureJsPlumbInstance = () => {
  if (jsPlumbInstance) return jsPlumbInstance;
  const global = typeof window !== "undefined" ? window : undefined;
  if (!global || !global.jsPlumb) {
    console.warn("jsPlumb is not available on window");
    return null;
  }

  jsPlumbInstance = global.jsPlumb.getInstance({
    container: canvas,
  });

  jsPlumbInstance.importDefaults({
    Connector: ["Flowchart", { cornerRadius: 14, stub: 24 }],
    ConnectionsDetachable: false,
    ReattachConnections: true,
    Endpoint: ["Blank", {}],
    PaintStyle: { stroke: COLOR_LINE, strokeWidth: 2.4 },
    HoverPaintStyle: { stroke: "rgba(125, 211, 252, 0.9)", strokeWidth: 2.8 },
    ConnectionOverlays: [
      [
        "Arrow",
        {
          location: 1,
          width: 12,
          length: 12,
          foldback: 0.8,
          paintStyle: { fill: COLOR_LINE, strokeWidth: 0 },
        },
      ],
    ],
  });

  return jsPlumbInstance;
};

const ensureCanvasHeight = (requiredHeight) => {
  if (!canvas) return;
  const height = Math.max(requiredHeight, window.innerHeight + CANVAS_BOTTOM_PADDING);
  canvas.style.minHeight = `${height}px`;
  canvas.style.height = `${height}px`;
};

const getLaneCenterX = (laneName) => {
  if (!canvas) return null;
  const lanes = canvas.querySelectorAll(".canvas__lane");
  const index = LANE_INDEX[laneName];
  if (!lanes || !lanes[index]) return null;
  const laneRect = lanes[index].getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  return laneRect.left - canvasRect.left + laneRect.width / 2;
};

const alignNodeToLane = (node, laneName) => {
  if (!laneName || !canvas) return;

  const lanes = canvas.querySelectorAll(".canvas__lane");
  const laneIndex = LANE_INDEX[laneName];
  const lane = lanes && lanes[laneIndex];
  if (!lane) return;

  const canvasRect = canvas.getBoundingClientRect();
  const laneRect = lane.getBoundingClientRect();
  const centerX = laneRect.left - canvasRect.left + laneRect.width / 2;
  const availableWidth = Math.max(
    LANE_NODE_MIN_WIDTH,
    laneRect.width - LANE_NODE_HORIZONTAL_PADDING
  );

  node.style.maxWidth = `${availableWidth}px`;
  node.style.width = `${availableWidth}px`;

  const position = Math.max(0, centerX - availableWidth / 2);
  node.style.left = `${position}px`;
};

const scheduleLayout = () => {
  if (pendingLayoutFrame) {
    cancelAnimationFrame(pendingLayoutFrame);
  }
  pendingLayoutFrame = requestAnimationFrame(() => {
    pendingLayoutFrame = null;
    layoutFlows();
  });
};

const layoutFlows = () => {
  if (!canvas) return;
  const instance = ensureJsPlumbInstance();

  let flowOffset = CANVAS_TOP_PADDING;
  let maxBottom = flowOffset;

  flows.forEach((flowRecord) => {
    if (!flowRecord?.nodes) return;

    const laneOffsets = {
      answers: flowOffset,
      questions: flowOffset,
      artifacts: flowOffset,
    };

    ROW_SEQUENCE.forEach((keys) => {
      const nodesInRow = keys
        .map((key) => ({
          key,
          id: flowRecord.nodes[key],
          lane: NODE_LANES[key],
        }))
        .filter(({ id, lane }) => id && lane && document.getElementById(id));

      if (!nodesInRow.length) return;

      const rowTop = Math.max(
        ...nodesInRow.map(({ lane }) => laneOffsets[lane] || flowOffset)
      );

      let rowBottom = rowTop;

      nodesInRow.forEach(({ id, lane }) => {
        const node = document.getElementById(id);
        if (!node) return;

        alignNodeToLane(node, lane);
        node.style.top = `${rowTop}px`;

        const height = node.offsetHeight || parseFloat(getComputedStyle(node).height) || 240;
        const bottom = rowTop + height;
        laneOffsets[lane] = bottom + ROW_GAP;
        rowBottom = Math.max(rowBottom, bottom);

        if (instance) {
          instance.revalidate(node);
        }
      });

      const nextRowBase = rowBottom + ROW_GAP;
      Object.keys(laneOffsets).forEach((lane) => {
        laneOffsets[lane] = Math.max(laneOffsets[lane], nextRowBase);
      });
      maxBottom = Math.max(maxBottom, nextRowBase);
    });

    flowOffset = Math.max(...Object.values(laneOffsets)) + FLOW_GAP;
    maxBottom = Math.max(maxBottom, flowOffset);
  });

  ensureCanvasHeight(maxBottom + CANVAS_BOTTOM_PADDING);

  if (instance) {
    instance.repaintEverything();
  }
};

const NODE_RESIZE_OBSERVER =
  typeof ResizeObserver !== "undefined"
    ? new ResizeObserver((entries) => {
        entries.forEach(({ target }) => {
          if (!target.isConnected) return;
          const lane = target.dataset?.lane;
          if (lane) alignNodeToLane(target, lane);
          if (jsPlumbInstance) {
            jsPlumbInstance.revalidate(target);
          }
          scheduleLayout();
        });
      })
    : null;

const registerNodeForResize = (node) => {
  if (NODE_RESIZE_OBSERVER) {
    NODE_RESIZE_OBSERVER.observe(node);
  }
};

const updateBadgeTimestamp = () => {
  if (!badge) return;
  const commitLabelTarget = badge.querySelector('[data-role="commit-label"]');
  const timestampTarget = badge.querySelector('[data-role="timestamp"]');

  const commitLabel = BODY_DATASET.commitLabel || "";
  const commitBranch = BODY_DATASET.commitBranch || "";
  const commitTime = BODY_DATASET.commitTime || "";
  const deployTime = BODY_DATASET.deployTime || "";

  if (commitLabelTarget) {
    const label = commitBranch ? `${commitBranch}@${commitLabel}` : commitLabel || "Unknown commit";
    commitLabelTarget.textContent = label;
  }

  if (timestampTarget) {
    const parsedTime = commitTime ? new Date(commitTime) : null;
    if (parsedTime && !Number.isNaN(parsedTime.getTime())) {
      timestampTarget.textContent = parsedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      timestampTarget.textContent = "--:--";
    }
  }

  const isOutdated = deployTime && commitTime && new Date(deployTime) < new Date(commitTime);
  badge.classList.toggle("is-outdated", Boolean(isOutdated));
};

const getFlowPapers = (flow) => {
  if (!flow) return [];
  if (Array.isArray(flow.paperClasses) && flow.paperClasses.length) {
    return flow.paperClasses.flatMap((group) => group.documents || []);
  }
  return Array.isArray(flow.papers) ? flow.papers : [];
};

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

const emphasizeADHD = (text) =>
  typeof text === "string"
    ? text.replace(/(?<!\*)\bADHD\b(?!\*)/gi, (match) => `**${match.toUpperCase()}**`)
    : text;

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
  const highlightedQuestion = emphasizeADHD(question);
  return [
    `You are a ${persona} embedded within Terpedia's inquiry engine.`,
    `Your task is to evaluate whether emerging terpene science can inform ADHD-focused interventions.`,
    "",
    `1. Restate the core user question: "${highlightedQuestion}".`,
    "2. Identify terpene mechanisms (neurological, endocrine, behavioral) most relevant to attention regulation.",
    "3. Retrieve 3 recent peer-reviewed findings or preprints with clear links to ADHD, cognition, or focus.",
    "4. Summarize market-readiness signals (formulation maturity, safety evidence, regulatory posture).",
    "5. Recommend next investigative steps for experimentation or evidence gathering.",
    "",
    "Respond in no more than 220 words with concise paragraphs and clear callouts.",
  ]
    .map(emphasizeADHD)
    .join("\n");
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
const createNodeShell = ({ id, label, title, summary, x, y, lane }) => {
  const node = document.createElement("section");
  node.className = "node";
  node.id = id;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  if (lane) {
    node.dataset.lane = lane;
  }

  const header = document.createElement("header");
  header.className = "node__header";

  const headingGroup = document.createElement("div");
  headingGroup.className = "node__heading";

  if (label) {
    const labelEl = document.createElement("span");
    labelEl.className = "node__label";
    labelEl.textContent = label;
    headingGroup.append(labelEl);
  }

  if (title) {
    const titleEl = document.createElement("h3");
    titleEl.className = "node__title";
    titleEl.textContent = title;
    headingGroup.append(titleEl);
  }

  header.append(headingGroup);

  const toggleButton = document.createElement("button");
  toggleButton.className = "node__collapse";
  toggleButton.type = "button";
  toggleButton.setAttribute("aria-label", "Toggle section");
  header.append(toggleButton);

  node.append(header);

  const summaryEl = document.createElement("div");
  summaryEl.className = "node__summary";
  node.append(summaryEl);

  const body = document.createElement("div");
  body.className = "node__body";
  node.append(body);

  canvas.append(node);
  ensureJsPlumbInstance();
  alignNodeToLane(node, lane);
  if (jsPlumbInstance) {
    jsPlumbInstance.revalidate(node);
  }

  const defaultSummary = summary || title || label || "Collapsed view";
  const applySummary = (value) => {
    const text = value && value.trim() ? value.trim() : defaultSummary;
    summaryEl.textContent = text;
    node.dataset.summary = text;
  };

  const updateToggleVisual = (expanded) => {
    toggleButton.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggleButton.textContent = expanded ? "−" : "+";
    toggleButton.setAttribute("aria-label", expanded ? "Collapse section" : "Expand section");
  };

  const setCollapsed = (state) => {
    const shouldCollapse =
      typeof state === "boolean" ? state : !node.classList.contains("node--collapsed");
    node.classList.toggle("node--collapsed", shouldCollapse);
    summaryEl.hidden = !shouldCollapse;
    body.hidden = shouldCollapse;
    updateToggleVisual(!shouldCollapse);
    if (jsPlumbInstance) {
      jsPlumbInstance.revalidate(node);
    }
    scheduleLayout();
  };

  toggleButton.addEventListener("click", () => {
    setCollapsed();
  });

  applySummary(defaultSummary);
  setCollapsed(true);

  node.__setSummary = applySummary;
  node.__setCollapsed = setCollapsed;

  registerNodeForResize(node);
  scheduleLayout();

  return { node, body, setSummary: applySummary, setCollapsed };
};

const connectNodes = (fromId, toId, flowId) => {
  const instance = ensureJsPlumbInstance();
  if (!instance) return;
  const sourceEl = document.getElementById(fromId);
  const targetEl = document.getElementById(toId);
  const sourceLane = sourceEl?.dataset?.lane || null;
  const targetLane = targetEl?.dataset?.lane || null;
  let anchors = ["Bottom", "Top"];
  if (sourceLane === "answers" && targetLane === "artifacts") {
    anchors = ["Right", "Left"];
  }
  const connection = instance.connect({
    source: fromId,
    target: toId,
    anchors,
    cssClass: "flow-connection",
  });

  if (flowId) {
    if (!flowConnections.has(flowId)) {
      flowConnections.set(flowId, []);
    }
    flowConnections.get(flowId).push(connection);
  }
};

/**
 * Node builders
 */
const buildQuestionNode = ({ id, position, flow, onQuestionChange }) => {
  const initialSummary = truncateText(flow.question || "Pose your question", 100);
  const { node, body, setSummary, setCollapsed } = createNodeShell({
    id,
    label: "Question",
    title: null,
    summary: initialSummary,
    x: position.x,
    y: position.y,
    lane: "questions",
  });

  node.classList.add("node--question");
  setSummary(initialSummary);
  setCollapsed(true);

  const input = document.createElement("input");
  input.type = "text";
  input.className = "node__input";
  input.value = flow.question;
  input.placeholder = "Pose your terpene × ADHD question...";
  input.setAttribute("aria-label", "Research question input");

  input.addEventListener("input", (event) => {
    const value = event.target.value.trim();
    onQuestionChange(value.length ? value : flow.question);
    setSummary(truncateText(value || "Pose your question", 100));
  });

  input.addEventListener("focus", () => {
    node.__setCollapsed?.(false);
  });

  body.append(input);
  return node;
};

const buildStaticQuestionNode = ({ id, position, text }) => {
  const summary = truncateText(text, 120);
  const { node, body, setSummary } = createNodeShell({
    id,
    label: "Question",
    title: null,
    summary,
    x: position.x,
    y: position.y,
    lane: "questions",
  });

  node.classList.add("node--question");
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  paragraph.style.margin = "0";
  paragraph.style.textAlign = "left";
  body.append(paragraph);

  setSummary(summary);
  return node;
};

const buildPromptNode = ({ id, position, flow }) => {
  const summaryText = flow.question
    ? truncateText(`Briefing for “${flow.question}”`, 110)
    : "System briefing template";
  const { node, body, setSummary } = createNodeShell({
    id,
    label: "LLM Prompt",
    title: "System Briefing",
    summary: summaryText,
    x: position.x,
    y: position.y,
    lane: "questions",
  });

  setSummary(summaryText);

  const pre = document.createElement("pre");
  pre.className = "node__prompt";
  pre.textContent = buildPrompt(flow.question);
  pre.dataset.role = "promptContent";

  body.append(pre);
  return node;
};

const buildLLMNode = ({ id, position, flow }) => {
  const { node, body, setSummary } = createNodeShell({
    id,
    label: "LLM Output",
    title: "Synopsis & Direction",
    x: position.x,
    y: position.y,
    lane: "answers",
  });
  node.classList.add("node--answer");

  const papers = getFlowPapers(flow);
  const markdown = buildLLMAnswer(flow.question, papers);
  const summaryLine =
    markdown
      .split("\n")
      .map((line) => line.replace(/^[•\-\s]+/, "").trim())
      .find(Boolean) || "LLM synthesis ready";
  setSummary(truncateText(summaryLine, 120));
  renderMarkdown(body, markdown);
  body.querySelectorAll("p").forEach((paragraph) => {
    paragraph.style.marginBottom = "0.9rem";
    paragraph.style.color = "var(--text-secondary)";
  });

  return node;
};

const buildEvidenceNode = ({ id, position, flow }) => {
  const papers = getFlowPapers(flow);
  const summaryText = papers.length
    ? truncateText(papers[0]?.title || `${papers.length} highlighted articles`, 120)
    : "No articles available yet";
  const { node, body, setSummary } = createNodeShell({
    id,
    label: "Evidence",
    title: "Highlighted Papers",
    summary: summaryText,
    x: position.x,
    y: position.y,
    lane: "artifacts",
  });
  node.classList.add("node--artifact");
  setSummary(summaryText);

  const groups = Array.isArray(flow.paperClasses) && flow.paperClasses.length ? flow.paperClasses : null;

  const createDocDetails = (paper) => {
    const docDetails = document.createElement("details");
    docDetails.className = "evidence-doc";

    const docSummary = document.createElement("summary");
    docSummary.className = "evidence-doc__summary";
    docSummary.textContent = paper.title || "Untitled article";
    docDetails.append(docSummary);

    const docBody = document.createElement("div");
    docBody.className = "evidence-doc__body";

    if (paper.whatIsThisArticleAbout) {
      const about = document.createElement("p");
      about.className = "evidence-doc__about";
      about.textContent = paper.whatIsThisArticleAbout;
      docBody.append(about);
    }

    if (paper.journal || paper.year || paper.authors) {
      const meta = document.createElement("p");
      meta.className = "evidence-doc__meta";
      meta.textContent = [paper.journal || "Journal", paper.year, paper.authors]
        .filter(Boolean)
        .join(" • ");
      docBody.append(meta);
    }

    if (paper.summary) {
      const summary = document.createElement("div");
      summary.className = "evidence-doc__summary-text";
      renderMarkdown(summary, paper.summary || "");
      docBody.append(summary);
    }

    if (paper.abstract) {
      const abstract = document.createElement("div");
      abstract.className = "evidence-doc__abstract";
      renderMarkdown(abstract, paper.abstract);
      docBody.append(abstract);
    }

    if (paper.fullText) {
      const fullTextDetails = document.createElement("details");
      fullTextDetails.className = "evidence-doc__fulltext";

      const fullTextSummary = document.createElement("summary");
      fullTextSummary.textContent = "View full text";
      fullTextDetails.append(fullTextSummary);

      const fullTextBody = document.createElement("div");
      fullTextBody.className = "evidence-doc__fulltext-body";
      renderMarkdown(fullTextBody, paper.fullText);
      fullTextDetails.append(fullTextBody);

      docBody.append(fullTextDetails);
    }

    if (paper.link) {
      const link = document.createElement("a");
      link.className = "evidence-doc__link";
      link.href = paper.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open source";
      docBody.append(link);
    }

    docDetails.append(docBody);

    docDetails.addEventListener("toggle", () => {
      if (jsPlumbInstance) {
        jsPlumbInstance.revalidate(node);
      }
      scheduleLayout();
    });

    return docDetails;
  };

  if (groups) {
    const container = document.createElement("div");
    container.className = "evidence-groups";

    groups.forEach((group) => {
      const groupDetails = document.createElement("details");
      groupDetails.className = "evidence-group";

      const groupSummary = document.createElement("summary");
      groupSummary.className = "evidence-group__summary";

      const label = document.createElement("span");
      label.className = "evidence-group__label";
      label.textContent = group.label || "Class";
      groupSummary.append(label);

      const count = document.createElement("span");
      count.className = "evidence-group__count";
      const total = Array.isArray(group.documents) ? group.documents.length : 0;
      count.textContent = `${total} ${total === 1 ? "article" : "articles"}`;
      groupSummary.append(count);

      groupDetails.append(groupSummary);

      if (group.description) {
        const desc = document.createElement("p");
        desc.className = "evidence-group__description";
        desc.textContent = group.description;
        groupDetails.append(desc);
      }

      const docsContainer = document.createElement("div");
      docsContainer.className = "evidence-documents";
      (group.documents || []).forEach((paper) => {
        docsContainer.append(createDocDetails(paper));
      });

      groupDetails.append(docsContainer);

      groupDetails.addEventListener("toggle", () => {
        if (jsPlumbInstance) {
          jsPlumbInstance.revalidate(node);
        }
        scheduleLayout();
      });

      container.append(groupDetails);
    });

    body.append(container);
  } else {
    const docsContainer = document.createElement("div");
    docsContainer.className = "evidence-documents";

    papers.forEach((paper) => {
      docsContainer.append(createDocDetails(paper));
    });

    body.append(docsContainer);
  }

  return node;
};

const buildAbstractAnswerNode = ({ id, position, title, label = "LLM Output", abstract }) => {
  const summary = truncateText(abstract, 140);
  const { node, body, setSummary } = createNodeShell({
    id,
    label,
    title,
    summary,
    x: position.x,
    y: position.y,
    lane: "answers",
  });
  node.classList.add("node--answer");

  if (abstract) {
    renderMarkdown(body, abstract);
  } else {
    const placeholder = document.createElement("p");
    placeholder.textContent = "Abstract pending.";
    placeholder.style.margin = "0";
    placeholder.style.color = "var(--text-secondary)";
    body.append(placeholder);
  }

  setSummary(summary || "Abstract pending.");
  return node;
};

const buildMarkdownAnswerNode = ({
  id,
  position,
  title,
  label = "LLM Output",
  markdownContent,
}) => {
  const summary = truncateText(markdownContent, 140);
  const { node, body, setSummary } = createNodeShell({
    id,
    label,
    title,
    summary,
    x: position.x,
    y: position.y,
    lane: "answers",
  });
  node.classList.add("node--answer");

  if (markdownContent) {
    const pre = document.createElement("pre");
    pre.className = "node__markdown-export";
    pre.textContent = markdownContent;
    body.append(pre);
  } else {
    const placeholder = document.createElement("p");
    placeholder.textContent = "Markdown export pending.";
    placeholder.style.margin = "0";
    placeholder.style.color = "var(--text-secondary)";
    body.append(placeholder);
  }

  setSummary(summary || "Markdown export pending.");
  return node;
};

const buildArtifactNode = ({ id, position, artifact }) => {
  const details = {
    title: artifact?.title || "Artifact",
    copy: artifact?.copy || "_Pending_: Integrate evidence artifact summary.",
    link: artifact?.link || "",
    cta: artifact?.cta || "Review Artifact",
    abstract: artifact?.abstract || "",
    journal: artifact?.journal || artifact?.source || "",
    year: artifact?.year || "",
    authors: artifact?.authors || "",
    type: artifact?.type || (artifact?.abstract ? "reference" : "markdown"),
  };

  const summaryText =
    truncateText(details.copy !== "_Pending_: Integrate evidence artifact summary." ? details.copy : "", 140) ||
    truncateText(details.abstract, 140) ||
    details.title;

  const { node, body, setSummary } = createNodeShell({
    id,
    label: "Artifact",
    title: details.title,
    summary: summaryText,
    x: position.x,
    y: position.y,
    lane: position.lane || "artifacts",
  });
  node.classList.add("node--artifact");
  node.classList.add(
    details.type === "reference" ? "node--artifact-reference" : "node--artifact-markdown"
  );

  if (details.type === "reference") {
    const titleEl =
      details.link && details.link !== ""
        ? document.createElement("a")
        : document.createElement("span");
    titleEl.className = "artifact__reference-title";
    titleEl.textContent = details.title;
    if (titleEl.tagName === "A") {
      titleEl.href = details.link;
      titleEl.target = "_blank";
      titleEl.rel = "noopener noreferrer";
    }
    body.append(titleEl);

    if (details.journal || details.year || details.authors) {
      const meta = document.createElement("p");
      meta.className = "artifact__reference-meta";
      meta.textContent = [details.journal, details.year, details.authors].filter(Boolean).join(" • ");
      body.append(meta);
    }

    if (details.abstract) {
      const abstractEl = document.createElement("div");
      abstractEl.className = "artifact__reference-abstract";
      renderMarkdown(abstractEl, details.abstract);
      body.append(abstractEl);
    }

    if (details.copy && details.copy !== "_Pending_: Integrate evidence artifact summary.") {
      const notes = document.createElement("div");
      notes.className = "artifact__reference-notes";
      renderMarkdown(notes, details.copy, { enableKroki: true });
      body.append(notes);
    }
  } else {
    const wrapper =
      details.link && details.link !== ""
        ? document.createElement("a")
        : document.createElement("div");
    wrapper.className = "artifact__markdown";
    if (wrapper.tagName === "A") {
      wrapper.href = details.link;
      wrapper.target = "_blank";
      wrapper.rel = "noopener noreferrer";
    }
    renderMarkdown(wrapper, details.copy, { enableKroki: true });
    body.append(wrapper);
  }

  setSummary(summaryText);
  return node;
};

const buildAbstractTabsNode = ({ id, position, flow }) => {
  const papers = getFlowPapers(flow);
  const initialSummary = papers[0]
    ? truncateText(papers[0].title, 110)
    : "Select a paper to view its abstract";
  const { node, body, setSummary } = createNodeShell({
    id,
    label: "Deep Dive",
    title: "Abstract Explorer",
    summary: initialSummary,
    x: position.x,
    y: position.y,
    lane: "artifacts",
  });
  node.classList.add("node--artifact");
  setSummary(initialSummary);

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

    const abstract = document.createElement("div");
    renderMarkdown(abstract, paper.abstract);
    abstract.style.margin = "0";
    abstract.style.color = "var(--text-secondary)";
    abstract.style.fontSize = "0.92rem";
    abstract.style.lineHeight = "1.6";
    abstract.querySelectorAll("p").forEach((paragraph) => {
      paragraph.style.marginTop = "0";
      paragraph.style.marginBottom = "0.75rem";
    });

    panel.append(heading, abstract);
    setSummary(truncateText(paper.title, 110));
  };

  const buttons = papers.map((paper, index) => {
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

  if (buttons[0] && papers[0]) {
    buttons[0].classList.add("is-active");
    renderAbstract(papers[0]);
  }

  body.append(tabsContainer, panel);
  return node;
};

const buildTermsNode = ({ id, position, flow }) => {
  const papers = getFlowPapers(flow);
  const { node, body, setSummary } = createNodeShell({
    id,
    label: "Artifact",
    title: "Term Highlights",
    x: position.x,
    y: position.y,
    lane: "artifacts",
  });
  node.classList.add("node--artifact");

  const abstracts = papers.map((paper) => paper.abstract).filter(Boolean);
  const topTerms = getTopTerms(abstracts);
  const summaryText = topTerms.length
    ? `Top terms: ${topTerms.slice(0, 3).join(", ")}`
    : "No salient terminology extracted yet.";
  setSummary(truncateText(summaryText, 120));

  const chipContainer = document.createElement("div");
  chipContainer.className = "chips";
  topTerms.forEach((term) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = term;
    chipContainer.append(chip);
  });

  if (!topTerms.length) {
    const placeholder = document.createElement("p");
    placeholder.textContent = "No salient terminology extracted. Review abstracts manually.";
    placeholder.style.margin = 0;
    placeholder.style.color = "var(--text-secondary)";
    body.append(placeholder);
  }

  body.append(chipContainer);
  return node;
};

const buildClaimsNode = ({ id, position, flow }) => {
  const papers = getFlowPapers(flow);
  const { node, body, setSummary } = createNodeShell({
    id,
    label: "Artifact",
    title: "Claim Highlights",
    x: position.x,
    y: position.y,
    lane: "artifacts",
  });
  node.classList.add("node--artifact");

  const claims = extractClaims(papers);
  const summaryText = claims.length
    ? `${claims.length} extracted claims`
    : "Awaiting claim extraction";
  setSummary(truncateText(summaryText, 120));

  if (!claims.length) {
    const placeholder = document.createElement("p");
    placeholder.textContent = "No explicit claims detected. Flag abstracts for manual review.";
    placeholder.style.margin = 0;
    placeholder.style.color = "var(--text-secondary)";
    body.append(placeholder);
    return node;
  }

  const claimContainer = document.createElement("div");
  claimContainer.className = "claims";

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

  body.append(claimContainer);
  return node;
};

/**
 * Flow assembly
 */
const createInquiryFlow = (flow, index = flows.length) => {
  const flowId = uid("flow");
  const yOffset = index * 920;
  const columnSpacing = 360;
  const columnLeftX = 48;
  const columnMiddleX = columnLeftX + columnSpacing;
  const columnRightX = columnMiddleX + columnSpacing;
  const verticalSpacing = 220;
  const rowY = (row) => ROW_BASE_OFFSET + yOffset + verticalSpacing * row;
  const layout = {
    question: { x: columnLeftX, y: rowY(0) },
    prompt: { x: columnLeftX, y: rowY(1) },
    answer: { x: columnMiddleX, y: rowY(2) },
    evidence: { x: columnRightX, y: rowY(3) },
    terms: { x: columnRightX, y: rowY(4) },
    claims: { x: columnRightX, y: rowY(5) },
    abstracts: { x: columnRightX, y: rowY(6) },
    metastudyQuestion: { x: columnLeftX, y: rowY(7) },
    metastudyAbstract: { x: columnMiddleX, y: rowY(8) },
    metastudyMarkdown: { x: columnMiddleX, y: rowY(9) },
    metastudy: { x: columnRightX, y: rowY(10) },
    terpStudyQuestion: { x: columnLeftX, y: rowY(11) },
    terpStudyAbstract: { x: columnMiddleX, y: rowY(12) },
    terpStudyMarkdown: { x: columnMiddleX, y: rowY(13) },
    terpStudy: { x: columnRightX, y: rowY(14) },
  };

  const flowRecord = { id: flowId, data: flow, nodes: {} };
  flows.push(flowRecord);
  flowConnections.set(flowId, []);

  const instance = ensureJsPlumbInstance();
    const buildFlow = () => {
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

    const termsNode = buildTermsNode({
      id: `${flowId}-terms`,
      position: layout.terms,
      flow,
    });

    const claimsNode = buildClaimsNode({
      id: `${flowId}-claims`,
      position: layout.claims,
      flow,
    });

    const metastudyNode = buildArtifactNode({
      id: `${flowId}-metastudy`,
      position: layout.metastudy,
      artifact: flow.metastudy || DEFAULT_METASTUDY,
    });

    const terpStudyNode = buildArtifactNode({
      id: `${flowId}-terp-study`,
      position: layout.terpStudy,
      artifact: flow.terpStudy || DEFAULT_TERP_STUDY,
    });

    flowRecord.nodes = {
      question: questionNode.id,
      prompt: promptNode.id,
      answer: answerNode.id,
      evidence: evidenceNode.id,
      terms: termsNode.id,
      claims: claimsNode.id,
      abstracts: abstractsNode.id,
      metastudy: metastudyNode.id,
      terpStudy: terpStudyNode.id,
    };

    connectNodes(questionNode.id, promptNode.id, flowId);
    connectNodes(promptNode.id, answerNode.id, flowId);
    connectNodes(answerNode.id, evidenceNode.id, flowId);
    connectNodes(answerNode.id, termsNode.id, flowId);
    connectNodes(answerNode.id, claimsNode.id, flowId);
    connectNodes(evidenceNode.id, termsNode.id, flowId);
    connectNodes(termsNode.id, claimsNode.id, flowId);
    connectNodes(claimsNode.id, abstractsNode.id, flowId);
    connectNodes(abstractsNode.id, metastudyNode.id, flowId);
    connectNodes(metastudyNode.id, terpStudyNode.id, flowId);

  };

  if (instance) {
    instance.batch(buildFlow);
    instance.repaintEverything();
  } else {
    buildFlow();
  }

  scheduleLayout();
};

const refreshPrompt = (flowId) => {
  const flowRecord = flows.find((item) => item.id === flowId);
  if (!flowRecord) return;
  const promptNode = document.querySelector(`#${flowRecord.nodes.prompt} [data-role="promptContent"]`);
  if (promptNode) {
    promptNode.textContent = buildPrompt(flowRecord.data.question);
  }
  const promptSection = document.getElementById(flowRecord.nodes.prompt);
  if (promptSection && typeof promptSection.__setSummary === "function") {
    const summaryText = flowRecord.data.question
      ? truncateText(`Briefing for “${flowRecord.data.question}”`, 110)
      : "System briefing template";
    promptSection.__setSummary(summaryText);
  }
  if (jsPlumbInstance) {
    jsPlumbInstance.revalidate(flowRecord.nodes.prompt);
  }
  scheduleLayout();
};

const refreshLLM = (flowId) => {
  const flowRecord = flows.find((item) => item.id === flowId);
  if (!flowRecord) return;
  const node = document.getElementById(flowRecord.nodes.answer);
  if (!node) return;
  const body = node.querySelector(".node__body");
  const papers = getFlowPapers(flowRecord.data);
  const markdown = buildLLMAnswer(flowRecord.data.question, papers);
  renderMarkdown(body, markdown);
  body.querySelectorAll("p").forEach((paragraph) => {
    paragraph.style.marginBottom = "0.9rem";
    paragraph.style.color = "var(--text-secondary)";
  });
  if (typeof node.__setSummary === "function") {
    const summaryLine =
      markdown
        .split("\n")
        .map((line) => line.replace(/^[•\-\s]+/, "").trim())
        .find(Boolean) || "LLM synthesis ready";
    node.__setSummary(truncateText(summaryLine, 120));
  }
  if (jsPlumbInstance) {
    jsPlumbInstance.revalidate(flowRecord.nodes.answer);
  }
  scheduleLayout();
};

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
  metastudy: DEFAULT_METASTUDY,
  terpStudy: DEFAULT_TERP_STUDY,
};

const bootstrapWorkspace = () => {
  ensureJsPlumbInstance();
  createInquiryFlow(cloneDeep(INITIAL_FLOW), 0);
  updateBadgeTimestamp();
};

if (window.jsPlumb && typeof window.jsPlumb.ready === "function") {
  window.jsPlumb.ready(bootstrapWorkspace);
} else {
  window.addEventListener("load", bootstrapWorkspace);
}

newFlowButton.addEventListener("click", () => {
  const question = window.prompt("What ADHD × terpene question should we explore next?");
  if (!question) return;

  const flowData = cloneDeep(INITIAL_FLOW);
  flowData.question = question.trim();

  const instance = ensureJsPlumbInstance();
  if (instance) {
    instance.batch(() => createInquiryFlow(flowData, flows.length));
    instance.repaintEverything();
  } else {
    createInquiryFlow(flowData, flows.length);
  }
  scheduleLayout();
});

window.addEventListener("resize", () => {
  scheduleLayout();
});
