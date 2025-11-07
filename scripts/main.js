const DEFAULT_METASTUDY = {
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

const flows = [];
let jsPlumbInstance = null;

const COLOR_LINE = getComputedStyle(document.documentElement)
  .getPropertyValue("--line")
  .trim();
const BODY_DATASET = document.body.dataset || {};
const LANE_INDEX = {
  answers: 0,
  questions: 1,
  artifacts: 2,
};
const NODE_LANES = {
  question: "questions",
  prompt: "questions",
  answer: "answers",
  insights: "answers",
  evidence: "artifacts",
  abstracts: "artifacts",
  metastudy: "artifacts",
  terpStudy: "artifacts",
};
const ROW_SEQUENCE = [
  ["question"],
  ["prompt"],
  ["answer"],
  ["insights"],
  ["evidence"],
  ["abstracts"],
  ["metastudy"],
  ["terpStudy"],
];
const ROW_GAP = 64;
const FLOW_GAP = 180;
const CANVAS_TOP_PADDING = 32;
const CANVAS_BOTTOM_PADDING = 200;
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

const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

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
  if (!laneName) return;
  const centerX = getLaneCenterX(laneName);
  if (centerX == null) return;
  const width = node.offsetWidth || parseFloat(getComputedStyle(node).width) || 320;
  const position = Math.max(0, centerX - width / 2);
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
const createNodeShell = ({ id, label, title, x, y, lane }) => {
  const node = document.createElement("section");
  node.className = "node";
  node.id = id;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  if (lane) {
    node.dataset.lane = lane;
  }

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
  const instance = ensureJsPlumbInstance();
  if (instance) {
    instance.manage(node);
    instance.makeSource(node, {
      filter: ".node__header, .node__body",
      anchor: "BottomCenter",
      allowLoopback: false,
    });
    instance.makeTarget(node, {
      anchor: "TopCenter",
      allowLoopback: false,
    });
  }

  alignNodeToLane(node, lane);
  if (jsPlumbInstance) {
    jsPlumbInstance.revalidate(node);
  }

  registerNodeForResize(node);
  scheduleLayout();

  return { node, body };
};

const connectNodes = (fromId, toId) => {
  const instance = ensureJsPlumbInstance();
  if (!instance) return;

  instance.connect({
    source: fromId,
    target: toId,
    anchors: ["Bottom", "Top"],
  });
};

/**
 * Node builders
 */
const buildQuestionNode = ({ id, position, flow, onQuestionChange }) => {
  const { node, body } = createNodeShell({
    id,
    label: null,
    title: null,
    x: position.x,
    y: position.y,
    lane: "questions",
  });

  node.classList.add("node--question");

  const input = document.createElement("input");
  input.type = "text";
  input.className = "node__input";
  input.value = flow.question;
  input.placeholder = "Pose your terpene × ADHD question...";
  input.setAttribute("aria-label", "Research question input");

  input.addEventListener("input", (event) => {
    const value = event.target.value.trim();
    onQuestionChange(value.length ? value : flow.question);
  });

  body.append(input);
  return node;
};

const buildPromptNode = ({ id, position, flow }) => {
  const { node, body } = createNodeShell({
    id,
    label: "LLM Prompt",
    title: "System Briefing",
    x: position.x,
    y: position.y,
    lane: "questions",
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
    lane: "answers",
  });
  node.classList.add("node--answer");

  const markdown = buildLLMAnswer(flow.question, flow.papers);
  renderMarkdown(body, markdown);
  body.querySelectorAll("p").forEach((paragraph) => {
    paragraph.style.marginBottom = "0.9rem";
    paragraph.style.color = "var(--text-secondary)";
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
    lane: "artifacts",
  });
  node.classList.add("node--artifact");

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

    const summary = document.createElement("div");
    renderMarkdown(summary, paper.summary || "");
    summary.style.margin = "0";
    summary.style.fontSize = "0.9rem";
    summary.querySelectorAll("p").forEach((paragraph) => {
      paragraph.style.margin = "0";
      paragraph.style.color = "var(--text-secondary)";
    });

    item.append(title, meta, summary);
    list.append(item);
  });

  body.append(list);
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

  const { node, body } = createNodeShell({
    id,
    label: "Artifact",
    title: details.title,
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

  return node;
};

const buildAbstractTabsNode = ({ id, position, flow }) => {
  const { node, body } = createNodeShell({
    id,
    label: "Deep Dive",
    title: "Abstract Explorer",
    x: position.x,
    y: position.y,
    lane: "artifacts",
  });
  node.classList.add("node--artifact");

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
    lane: "answers",
  });
  node.classList.add("node--answer");

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
  const yOffset = index * 920;
  const columnSpacing = 360;
  const columnLeftX = 48;
  const columnMiddleX = columnLeftX + columnSpacing;
  const columnRightX = columnMiddleX + columnSpacing;
  const verticalSpacing = 220;
  const rowY = (row) => 40 + yOffset + verticalSpacing * row;
  const layout = {
    question: { x: columnMiddleX, y: rowY(0) },
    prompt: { x: columnMiddleX, y: rowY(1) },
    answer: { x: columnLeftX, y: rowY(2) },
    insights: { x: columnLeftX, y: rowY(3) },
    evidence: { x: columnRightX, y: rowY(3) },
    abstracts: { x: columnRightX, y: rowY(4) },
    metastudy: { x: columnMiddleX, y: rowY(4) },
    terpStudy: { x: columnMiddleX, y: rowY(5) },
  };

  const flowRecord = { id: flowId, data: flow, nodes: {} };
  flows.push(flowRecord);

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

    const insightsNode = buildInsightsNode({
      id: `${flowId}-insights`,
      position: layout.insights,
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
      abstracts: abstractsNode.id,
      insights: insightsNode.id,
      metastudy: metastudyNode.id,
      terpStudy: terpStudyNode.id,
    };

    connectNodes(questionNode.id, promptNode.id);
    connectNodes(promptNode.id, answerNode.id);
    connectNodes(answerNode.id, insightsNode.id);
    connectNodes(answerNode.id, evidenceNode.id);
    connectNodes(insightsNode.id, metastudyNode.id);
    connectNodes(evidenceNode.id, abstractsNode.id);
    connectNodes(metastudyNode.id, terpStudyNode.id);
    connectNodes(abstractsNode.id, terpStudyNode.id);

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
  const markdown = buildLLMAnswer(flowRecord.data.question, flowRecord.data.papers);
  renderMarkdown(body, markdown);
  body.querySelectorAll("p").forEach((paragraph) => {
    paragraph.style.marginBottom = "0.9rem";
    paragraph.style.color = "var(--text-secondary)";
  });
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
