// Perception: a timestamped event stream with a rolling "present" window
// and a compressed session digest. Everything stays in this browser until
// the salience gate decides a moment deserves the director.

import type { AgentEvent } from "./salience";
import { SECTION_IDS } from "./protocol";

const WINDOW_MS = 45_000;

export class Observer {
  private events: AgentEvent[] = [];
  private dwell: Record<string, number> = {};
  private visibleSince: Record<string, number> = {};
  private hoverSince: Record<string, number> = {};
  private cardsOpened = new Set<string>();
  private maxScrollPct = 0;
  private lastScrollY = 0;
  private lastScrollT = 0;
  private downTravel = 0;
  private stillSince = Date.now();
  private stillnessReported = 0;
  private currentSection: string | null = null;
  private io?: IntersectionObserver;
  private stillTimer = 0;
  private cleanup: Array<() => void> = [];
  readonly reducedMotion: boolean;
  readonly isReturning: boolean;
  readonly startedAt = Date.now();

  constructor(private emit: (e: AgentEvent) => void) {
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.isReturning = localStorage.getItem("ab-agent-seen") === "1";
    localStorage.setItem("ab-agent-seen", "1");
  }

  private push(e: AgentEvent) {
    this.events.push(e);
    const cutoff = Date.now() - WINDOW_MS * 3;
    while (this.events.length > 120 || (this.events[0] && this.events[0].t < cutoff)) {
      this.events.shift();
    }
    this.emit(e);
  }

  start() {
    this.push({ t: Date.now(), kind: "arrive", target: this.referrerClass() });

    this.io = new IntersectionObserver(
      (entries) => {
        const now = Date.now();
        for (const e of entries) {
          const id = (e.target as HTMLElement).id;
          if (!id) continue;
          if (e.isIntersecting) {
            this.visibleSince[id] = now;
            this.currentSection = id;
            this.push({ t: now, kind: "enter", target: id });
          } else if (this.visibleSince[id]) {
            this.dwell[id] = (this.dwell[id] ?? 0) + (now - this.visibleSince[id]);
            delete this.visibleSince[id];
            if (this.currentSection === id) this.currentSection = null;
            this.push({ t: now, kind: "leave", target: id });
          }
        }
      },
      { threshold: 0.4 }
    );
    for (const id of SECTION_IDS) {
      const node = document.getElementById(id);
      if (node) this.io.observe(node);
    }

    // Scroll: depth, velocity bursts, backtracking, stillness reset
    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const dy = y - this.lastScrollY;
      const dt = Math.max(1, now - this.lastScrollT);
      const v = Math.abs(dy) / dt; // px per ms
      if (dy > 0) this.downTravel += dy;
      if (dy < -350 && this.downTravel > 900) {
        this.push({ t: Date.now(), kind: "backtrack", target: this.currentSection ?? undefined });
        this.downTravel = 0;
      }
      if (v > 3.5) this.push({ t: Date.now(), kind: "scan" });
      this.lastScrollY = y;
      this.lastScrollT = now;
      this.stillSince = Date.now();
      this.stillnessReported = 0;
      const doc = document.documentElement;
      this.maxScrollPct = Math.max(
        this.maxScrollPct,
        Math.min(100, Math.round(((y + window.innerHeight) / doc.scrollHeight) * 100))
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    this.cleanup.push(() => window.removeEventListener("scroll", onScroll));

    // Stillness: parked on a section = reading. Report at 8s, 20s, 40s.
    this.stillTimer = window.setInterval(() => {
      const s = Math.round((Date.now() - this.stillSince) / 1000);
      const marks = [8, 20, 40];
      const next = marks[this.stillnessReported];
      if (next && s >= next && this.currentSection && document.visibilityState === "visible") {
        this.stillnessReported += 1;
        this.push({ t: Date.now(), kind: "stillness", target: this.currentSection, value: s });
      }
      if (s >= 90 && this.stillnessReported >= marks.length) {
        this.push({ t: Date.now(), kind: "idle", value: s });
        this.stillSince = Date.now(); // don't spam idle
        this.stillnessReported = 0;
      }
    }, 2000);
    this.cleanup.push(() => window.clearInterval(this.stillTimer));

    // Card hovers with duration + opens
    const over = (e: Event) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-agent-card]");
      const slug = card?.dataset.agentCard;
      if (slug && !this.hoverSince[slug]) {
        this.hoverSince[slug] = Date.now();
        this.push({ t: Date.now(), kind: "hoverStart", target: slug });
      }
    };
    const out = (e: Event) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-agent-card]");
      const slug = card?.dataset.agentCard;
      const to = (e as PointerEvent).relatedTarget as HTMLElement | null;
      if (slug && this.hoverSince[slug] && to?.closest(`[data-agent-card="${slug}"]`) === null) {
        const ms = Date.now() - this.hoverSince[slug];
        delete this.hoverSince[slug];
        this.push({ t: Date.now(), kind: "hoverEnd", target: slug, value: ms });
      }
    };
    const click = (e: Event) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-agent-card]");
      if (card?.dataset.agentCard) {
        this.cardsOpened.add(card.dataset.agentCard);
        this.push({ t: Date.now(), kind: "open", target: card.dataset.agentCard });
      }
    };
    document.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerout", out, { passive: true });
    document.addEventListener("click", click, { passive: true });
    this.cleanup.push(() => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("click", click);
    });
  }

  stop() {
    this.io?.disconnect();
    this.cleanup.forEach((fn) => fn());
  }

  referrerClass(): string {
    const r = document.referrer;
    if (!r) return "direct";
    if (r.includes("linkedin")) return "linkedin";
    if (r.includes("google") || r.includes("bing")) return "search";
    return "other";
  }

  /** The moment, verbatim, for the director: recent events with ages. */
  moment(saidTopics: string[]): string {
    const now = Date.now();
    const recent = this.events
      .filter((e) => now - e.t <= WINDOW_MS)
      .map((e) => {
        const age = ((now - e.t) / 1000).toFixed(1);
        const bits = [e.kind, e.target, e.value !== undefined ? String(e.value) : null]
          .filter(Boolean)
          .join(":");
        return `${age}s ago ${bits}`;
      });
    const dwellDigest = Object.entries(this.settledDwell())
      .filter(([, s]) => s >= 4)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, s]) => `${k}=${s}s`)
      .join(" ");
    return JSON.stringify({
      now: recent,
      session: {
        secondsOnPage: Math.round((now - this.startedAt) / 1000),
        maxScrollPct: this.maxScrollPct,
        dwell: dwellDigest,
        opened: [...this.cardsOpened],
        visit: this.isReturning ? "returning" : "first",
        referrer: this.referrerClass(),
      },
      alreadySaid: saidTopics,
    });
  }

  private settledDwell(): Record<string, number> {
    const now = Date.now();
    const out: Record<string, number> = {};
    for (const [id, ms] of Object.entries(this.dwell)) out[id] = Math.round(ms / 1000);
    for (const [id, since] of Object.entries(this.visibleSince)) {
      out[id] = (out[id] ?? 0) + Math.round((now - since) / 1000);
    }
    return out;
  }

  lang(): string {
    return (navigator.language || "en").slice(0, 2);
  }

  /** Inject an out-of-band event (e.g. visitor enabled sound). */
  note(kind: AgentEvent["kind"], target?: string) {
    this.push({ t: Date.now(), kind, target });
  }

  /** Cheap live stats for the ticker. */
  stats() {
    const dwell = this.settledDwell();
    const top = Object.entries(dwell).sort((a, b) => b[1] - a[1])[0];
    return {
      seconds: Math.round((Date.now() - this.startedAt) / 1000),
      depth: this.maxScrollPct,
      top: top ? `${top[0]} ${top[1]}s` : null,
      events: this.events.length,
    };
  }
}
