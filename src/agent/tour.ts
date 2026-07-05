// The guided tour: the agent drives. The STRUCTURE is fixed (stops and
// visual cues); the NARRATION is generated fresh per run by the director,
// in the visitor's language, aware of what they already looked at.
// Cancelled the instant the visitor takes the wheel.

import { applyAction } from "./actuators";
import { speak } from "./voice";
import type { AgentAction } from "./protocol";

type Stop = { scrollTo?: string; action?: AgentAction; holdMs: number };

const STOPS: Stop[] = [
  { holdMs: 5000 }, // intro at hero
  { scrollTo: "work", action: { type: "highlight", target: "multi-agent-service-desk" }, holdMs: 8500 },
  { action: { type: "highlight", target: "voice-ai-at-logistics-scale" }, holdMs: 8000 },
  { scrollTo: "approach", action: { type: "pulse", target: "approach" }, holdMs: 7500 },
  { scrollTo: "footprint", action: { type: "pulse", target: "footprint" }, holdMs: 7500 },
  { scrollTo: "contact", action: { type: "reveal", target: "contact" }, holdMs: 6000 },
];

export type TourHooks = {
  log: (kind: "action" | "info", text: string) => void;
  onWhisper: (text: string, href?: string) => void;
  soundEnabled: () => boolean;
  reducedMotion: boolean;
  moment: () => string; // observer.moment(...) — context for the script
  lang: string;
};

export async function runTour(hooks: TourHooks): Promise<"completed" | "cancelled"> {
  // 1. Ask the director for this run's script (one call, generated).
  let lines: string[] = [];
  try {
    const res = await fetch("/api/director", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "tour", moment: hooks.moment(), lang: hooks.lang }),
    });
    if (res.ok) lines = (await res.json()).lines ?? [];
  } catch {
    /* visual-only tour below */
  }
  hooks.log("info", lines.length ? `tour script generated (${hooks.lang})` : "tour: visual-only (no script)");

  let cancelled = false;
  let programmatic = false;
  const cancelOnUserScroll = () => {
    if (!programmatic) cancelled = true;
  };
  window.addEventListener("wheel", cancelOnUserScroll, { passive: true });
  window.addEventListener("touchmove", cancelOnUserScroll, { passive: true });

  const scrollTo = (id: string) =>
    new Promise<void>((resolve) => {
      const node = document.getElementById(id);
      if (!node) return resolve();
      programmatic = true;
      node.scrollIntoView({ behavior: hooks.reducedMotion ? "auto" : "smooth", block: "start" });
      window.setTimeout(() => {
        programmatic = false;
        resolve();
      }, hooks.reducedMotion ? 100 : 1200);
    });

  hooks.log("info", "guided tour started");
  for (let i = 0; i < STOPS.length; i++) {
    if (cancelled) break;
    const stop = STOPS[i];
    if (stop.scrollTo) await scrollTo(stop.scrollTo);
    if (cancelled) break;
    if (stop.action) {
      applyAction(stop.action, {
        log: hooks.log,
        reducedMotion: hooks.reducedMotion,
        onWhisper: hooks.onWhisper,
      });
    }
    const line = lines[i];
    if (line && hooks.soundEnabled()) {
      await speak(line);
      await new Promise((r) => window.setTimeout(r, 700));
    } else {
      if (line) hooks.onWhisper(line);
      await new Promise((r) => window.setTimeout(r, stop.holdMs));
    }
  }

  window.removeEventListener("wheel", cancelOnUserScroll);
  window.removeEventListener("touchmove", cancelOnUserScroll);

  if (cancelled) {
    hooks.log("info", "tour cancelled — visitor took the wheel");
    return "cancelled";
  }
  hooks.log("info", "tour completed");
  if (!hooks.reducedMotion) {
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 70,
      spread: 75,
      origin: { y: 0.7 },
      colors: ["#22d3ee", "#dce5f0", "#5eead4"],
      disableForReducedMotion: true,
    });
  }
  return "completed";
}
