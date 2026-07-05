// The salience gate: decides WHEN the moment is interesting enough to wake
// the director. No business rules — just attention physics. Personality:
// DISCREET (high thresholds, long refractory, silence-biased).

export type AgentEvent = {
  t: number; // epoch ms
  kind:
    | "enter" // section entered viewport
    | "leave"
    | "hoverStart" // card hover begins
    | "hoverEnd" // card hover ends (payload carries ms)
    | "stillness" // no scroll, viewport parked on a section (payload: seconds)
    | "backtrack" // scrolled up meaningfully after going down
    | "scan" // fast scroll burst
    | "open" // card clicked
    | "idle" // nothing at all for a while
    | "sound" // visitor just enabled the voice
    | "arrive"; // session start (payload: referrer class)
  target?: string;
  value?: number;
};

// Discreet weights: only strong signals accumulate meaningful charge.
const WEIGHTS: Record<AgentEvent["kind"], number> = {
  enter: 2,
  leave: 0,
  hoverStart: 4,
  hoverEnd: 0, // weight comes from duration, below
  stillness: 0, // per-second below
  backtrack: 18,
  scan: 1,
  open: -30, // they acted — no intervention needed, discharge
  idle: 0,
  sound: 0, // handled out-of-band (direct director call)
  arrive: 0,
};

export const SPEAK_BUDGET = 4;
export const DIRECTOR_BUDGET = 12;

export class SalienceGate {
  private charge = 0;
  private threshold = 100; // discreet baseline
  private lastFire = 0;
  private refractoryMs = 20_000;
  directorCalls = 0;
  private ignoredStreak = 0;

  /** Feed an event; returns true when the director should be consulted. */
  push(e: AgentEvent): boolean {
    let w = WEIGHTS[e.kind] ?? 0;
    if (e.kind === "hoverEnd" && (e.value ?? 0) >= 1200) {
      w = Math.min(30, (e.value! / 1000) * 8); // long hover = real interest
    }
    if (e.kind === "stillness" && e.target) {
      w = Math.min(40, (e.value ?? 0) * 4); // parked reading = strongest pull
    }
    if (e.kind === "enter" && e.target === "contact") w = 45; // intent
    this.charge = Math.max(0, this.charge + w);

    if (this.directorCalls >= DIRECTOR_BUDGET) return false;
    if (Date.now() - this.lastFire < this.refractoryMs) return false;
    if (this.charge < this.threshold) return false;

    this.charge = 0;
    this.lastFire = Date.now();
    this.directorCalls += 1;
    return true;
  }

  /** The visitor engaged with a stimulus → the agent is being useful. */
  rewarded() {
    this.ignoredStreak = 0;
    this.threshold = Math.max(80, this.threshold * 0.85);
  }

  /** A stimulus retracted untouched → learn to shut up. */
  ignored() {
    this.ignoredStreak += 1;
    if (this.ignoredStreak >= 2) {
      this.threshold *= 1.5;
      this.refractoryMs = Math.min(90_000, this.refractoryMs * 1.5);
    }
  }

  snapshot() {
    return {
      charge: Math.round(this.charge),
      threshold: Math.round(this.threshold),
      calls: this.directorCalls,
      ignoredStreak: this.ignoredStreak,
    };
  }
}
