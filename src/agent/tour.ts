// The guided tour: the agent drives. Scripted (zero LLM cost), narrated if
// sound is on, cancelled the instant the visitor takes the wheel (scrolls).

import { applyAction } from "./actuators";
import { speak } from "./voice";
import type { AgentAction } from "./protocol";

type Step = {
  scrollTo?: string; // element id
  action?: AgentAction;
  say?: string; // spoken (EN) if sound on
  holdMs: number;
};

const STEPS: Step[] = [
  {
    say: "Welcome. I'm the resident agent. Let me show you around — sixty seconds.",
    action: { type: "whisper", text: "Tour started — scroll anytime to take over." },
    holdMs: 5500,
  },
  {
    scrollTo: "work",
    action: { type: "highlight", target: "multi-agent-service-desk" },
    say: "This is the flagship: a multi-agent service desk on Google's agent platform. Agents like me, but with a day job.",
    holdMs: 9000,
  },
  {
    action: { type: "highlight", target: "voice-ai-at-logistics-scale" },
    say: "This voice agent answers one hundred eighty thousand calls a month. In production, not in a slide.",
    holdMs: 8500,
  },
  {
    scrollTo: "approach",
    action: { type: "pulse", target: "approach" },
    say: "The method: discover, design, build, run. Amine stays hands-on to the end.",
    holdMs: 8000,
  },
  {
    scrollTo: "footprint",
    action: { type: "pulse", target: "footprint" },
    say: "Based in Tangier. Delivering across Europe and the Americas, in four languages.",
    holdMs: 8000,
  },
  {
    scrollTo: "contact",
    action: { type: "reveal", target: "contact" },
    say: "If you have a workflow that shouldn't be manual anymore — this is the moment.",
    holdMs: 6000,
  },
];

export type TourHooks = {
  log: (kind: "action" | "info", text: string) => void;
  onWhisper: (text: string, href?: string) => void;
  soundEnabled: () => boolean;
  reducedMotion: boolean;
};

export async function runTour(hooks: TourHooks): Promise<"completed" | "cancelled"> {
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
  for (const step of STEPS) {
    if (cancelled) break;
    if (step.scrollTo) await scrollTo(step.scrollTo);
    if (cancelled) break;
    if (step.action) {
      applyAction(step.action, {
        log: hooks.log,
        reducedMotion: hooks.reducedMotion,
        onWhisper: hooks.onWhisper,
      });
    }
    if (step.say && hooks.soundEnabled()) {
      await speak(step.say);
      await new Promise((r) => window.setTimeout(r, 800));
    } else {
      if (step.say) hooks.onWhisper(step.say);
      await new Promise((r) => window.setTimeout(r, step.holdMs));
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
