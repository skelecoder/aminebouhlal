// Actuators: how the agent touches the page. Every effect is additive,
// reversible and time-boxed. Nothing moves under the visitor's cursor,
// nothing is removed from the page, everything degrades to no-op.

import type { AgentAction } from "./protocol";

type LogFn = (kind: "action" | "info", text: string) => void;

function el(target: string): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(`[data-agent-card="${target}"]`) ??
    document.getElementById(target)
  );
}

function highlight(target: string, log: LogFn) {
  const node = el(target);
  if (!node) return;
  node.classList.add("agent-highlight");
  log("action", `highlight(${target})`);
  window.setTimeout(() => node.classList.remove("agent-highlight"), 6000);
}

function pulse(target: string, log: LogFn) {
  const node = el(target);
  if (!node) return;
  node.classList.add("agent-pulse-zone");
  log("action", `pulse(${target})`);
  window.setTimeout(() => node.classList.remove("agent-pulse-zone"), 5000);
}

// Draws a temporary "current" line along the right edge of the viewport
// pointing toward the target section, then removes itself.
function guide(target: string, log: LogFn, reducedMotion: boolean) {
  const node = el(target);
  if (!node) return;
  log("action", `guide(${target})`);
  if (reducedMotion) {
    highlight(target, () => {});
    return;
  }
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "agent-guide");
  svg.setAttribute("viewBox", "0 0 24 100");
  svg.setAttribute("preserveAspectRatio", "none");
  const down = node.getBoundingClientRect().top > window.innerHeight / 2;
  const d = down ? "M12 8 V92" : "M12 92 V8";
  svg.innerHTML =
    `<path d="${d}" class="d-track"/>` +
    `<path d="${d}" class="d-flow"/>` +
    `<path d="${down ? "M6 84 L12 93 L18 84" : "M6 16 L12 7 L18 16"}" class="d-track" fill="none"/>`;
  document.body.appendChild(svg);
  window.setTimeout(() => {
    svg.remove();
    highlight(target, () => {});
  }, 3500);
}

function reveal(target: "contact" | "console-hint", log: LogFn) {
  const node = document.querySelector<HTMLElement>(`[data-agent-reveal="${target}"]`);
  if (!node || !node.hidden) return;
  node.hidden = false;
  node.classList.add("agent-revealed");
  log("action", `reveal(${target})`);
}

function recolor(mode: "cool" | "warm", log: LogFn) {
  document.documentElement.style.setProperty(
    "--color-accent",
    mode === "warm" ? "#5eead4" : "#22d3ee"
  );
  log("action", `recolor(${mode})`);
}

export function applyAction(
  action: AgentAction,
  opts: {
    log: LogFn;
    reducedMotion: boolean;
    onWhisper: (text: string, href?: string) => void;
  }
) {
  switch (action.type) {
    case "highlight":
      return highlight(action.target, opts.log);
    case "pulse":
      return pulse(action.target, opts.log);
    case "guide":
      return guide(action.target, opts.log, opts.reducedMotion);
    case "reveal":
      return reveal(action.target, opts.log);
    case "recolor":
      return recolor(action.mode, opts.log);
    case "whisper":
      opts.log("action", `whisper("${action.text}")`);
      return opts.onWhisper(action.text, action.href);
  }
}
