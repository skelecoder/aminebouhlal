// The ambient agent's action vocabulary. The director — whether the local
// rule engine or the LLM — can ONLY express itself through these actions.
// Anything outside this catalog is dropped at validation, on both client
// and server. The agent never manipulates the DOM freely.

export type AgentAction =
  | { type: "highlight"; target: string } // data-agent-card slug or section id
  | { type: "pulse"; target: string } // section id — pulses its diagram/ports
  | { type: "guide"; target: string } // section id — draws a current + smooth-scrolls hint
  | { type: "reveal"; target: "contact" | "console-hint" }
  | { type: "recolor"; mode: "cool" | "warm" }
  | { type: "whisper"; text: string; href?: string };

export const SECTION_IDS = [
  "work",
  "services",
  "approach",
  "experience",
  "skills",
  "footprint",
  "faq",
  "contact",
] as const;

export const CARD_SLUGS = [
  "multi-agent-service-desk",
  "voice-ai-at-logistics-scale",
  "conversational-ai-for-consumer-finance",
  "smart-city-platform-gijon",
  "erp-consolidation-odoo",
  "adamaguidi-com",
] as const;

const VALID_TARGETS = new Set<string>([...SECTION_IDS, ...CARD_SLUGS]);

export function isValidAction(a: unknown): a is AgentAction {
  if (!a || typeof a !== "object") return false;
  const x = a as Record<string, unknown>;
  switch (x.type) {
    case "highlight":
    case "pulse":
    case "guide":
      return typeof x.target === "string" && VALID_TARGETS.has(x.target);
    case "reveal":
      return x.target === "contact" || x.target === "console-hint";
    case "recolor":
      return x.mode === "cool" || x.mode === "warm";
    case "whisper":
      return (
        typeof x.text === "string" &&
        x.text.length > 0 &&
        x.text.length <= 120 &&
        (x.href === undefined ||
          (typeof x.href === "string" && x.href.startsWith("/")))
      );
    default:
      return false;
  }
}

export function sanitizeActions(raw: unknown, max = 3): AgentAction[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidAction).slice(0, max) as AgentAction[];
}

// The director's decision for a moment. Every string in it is generated
// server-side for this exact visitor and instant — nothing canned.
export type DirectorDecision = {
  mood: "silent" | "nudge" | "speak";
  reason?: string;
  topic?: string;
  actions: AgentAction[];
  utterance?: string;
  href?: string;
};
