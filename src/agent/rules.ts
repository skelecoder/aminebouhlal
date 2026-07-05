// Tier 1: deterministic stimuli. No model, no network, no cost.
// Each rule fires at most once per session; global pacing is enforced
// by the orchestrator (one action per 10s minimum).

import type { AgentAction, BehaviorSummary } from "./protocol";

export type RuleResult = { rule: string; action: AgentAction };

export function evaluateRules(
  s: BehaviorSummary,
  fired: Set<string>
): RuleResult | null {
  const once = (rule: string, action: AgentAction): RuleResult | null =>
    fired.has(rule) ? null : { rule, action };

  // R1 — LinkedIn arrival, still in hero after ~8s: point at the work.
  if (
    s.cameFrom === "linkedin" &&
    s.secondsOnPage >= 8 &&
    s.maxScrollPct < 30 &&
    !fired.has("R1")
  ) {
    return once("R1", { type: "guide", target: "work" });
  }

  // R2 — Interest in a specific case (hover, no click): nudge its card.
  const interested = s.cardsHovered.find((c) => !s.cardsClicked.includes(c));
  if (interested && s.secondsOnPage >= 15 && !fired.has("R2")) {
    return once("R2", { type: "highlight", target: interested });
  }

  // R3 — Deep reader: 70%+ consumed and 75s+ on page → light the path to contact.
  if (s.maxScrollPct >= 70 && s.secondsOnPage >= 75 && !fired.has("R3")) {
    return once("R3", { type: "guide", target: "contact" });
  }

  // R4 — Returning visitor: acknowledge quietly (accent shift) + console hint.
  if (s.isReturning && s.secondsOnPage >= 5 && !fired.has("R4")) {
    return once("R4", { type: "reveal", target: "console-hint" });
  }

  // R5 — Long dwell on experience (recruiter pattern): surface contact affordance.
  if ((s.dwellBySection["experience"] ?? 0) >= 20 && !fired.has("R5")) {
    return once("R5", { type: "reveal", target: "contact" });
  }

  return null;
}

// The director is consulted only when local rules have gone quiet and the
// visitor is still engaged — the ambiguous middle where a model earns its cost.
export function shouldConsultDirector(
  s: BehaviorSummary,
  directorCalls: number,
  lastActionAgoMs: number
): boolean {
  if (directorCalls >= 2) return false; // hard per-session cap
  if (s.secondsOnPage < 45) return false;
  if (lastActionAgoMs < 30_000) return false;
  return s.maxScrollPct >= 25; // engaged enough to be worth a decision
}
