// The observer: passive signal collection, entirely in-browser.
// Nothing here leaves the device except the anonymous BehaviorSummary,
// and only if/when the LLM director is consulted (Tier 2).

import type { BehaviorSummary } from "./protocol";
import { SECTION_IDS } from "./protocol";

export class Observer {
  private startedAt = Date.now();
  private dwell: Record<string, number> = {};
  private visibleSince: Record<string, number> = {};
  private maxScrollPct = 0;
  private cardsHovered = new Set<string>();
  private cardsClicked = new Set<string>();
  private io?: IntersectionObserver;
  private cleanup: Array<() => void> = [];
  readonly reducedMotion: boolean;
  readonly isReturning: boolean;

  private cardsSeen = new Set<string>();
  private cardIo?: IntersectionObserver;

  constructor(
    private onSignal: (text: string) => void,
    private onCardSeen?: (slug: string) => void
  ) {
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.isReturning = localStorage.getItem("ab-agent-seen") === "1";
    localStorage.setItem("ab-agent-seen", "1");
  }

  start() {
    // Section dwell via IntersectionObserver
    this.io = new IntersectionObserver(
      (entries) => {
        const now = Date.now();
        for (const e of entries) {
          const id = (e.target as HTMLElement).id;
          if (!id) continue;
          if (e.isIntersecting) {
            this.visibleSince[id] = now;
            this.onSignal(`enter(${id})`);
          } else if (this.visibleSince[id]) {
            this.dwell[id] = (this.dwell[id] ?? 0) + (now - this.visibleSince[id]);
            delete this.visibleSince[id];
          }
        }
      },
      { threshold: 0.4 }
    );
    for (const id of SECTION_IDS) {
      const node = document.getElementById(id);
      if (node) this.io.observe(node);
    }

    // Case cards entering the viewport (for spoken/visual invitations)
    this.cardIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const slug = (e.target as HTMLElement).dataset.agentCard;
          if (e.isIntersecting && slug && !this.cardsSeen.has(slug)) {
            this.cardsSeen.add(slug);
            this.onSignal(`inView(${slug})`);
            this.onCardSeen?.(slug);
          }
        }
      },
      { threshold: 0.6 }
    );
    document
      .querySelectorAll<HTMLElement>("[data-agent-card]")
      .forEach((n) => this.cardIo!.observe(n));

    // Scroll depth
    const onScroll = () => {
      const doc = document.documentElement;
      const pct = Math.round(
        ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100
      );
      if (pct > this.maxScrollPct) this.maxScrollPct = Math.min(100, pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    this.cleanup.push(() => window.removeEventListener("scroll", onScroll));

    // Card hovers / clicks
    const over = (e: Event) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-agent-card]");
      if (card?.dataset.agentCard && !this.cardsHovered.has(card.dataset.agentCard)) {
        this.cardsHovered.add(card.dataset.agentCard);
        this.onSignal(`hover(${card.dataset.agentCard})`);
      }
    };
    const click = (e: Event) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-agent-card]");
      if (card?.dataset.agentCard) this.cardsClicked.add(card.dataset.agentCard);
    };
    document.addEventListener("mouseover", over, { passive: true });
    document.addEventListener("click", click, { passive: true });
    this.cleanup.push(() => {
      document.removeEventListener("mouseover", over);
      document.removeEventListener("click", click);
    });
  }

  stop() {
    this.io?.disconnect();
    this.cardIo?.disconnect();
    this.cleanup.forEach((fn) => fn());
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

  cameFrom(): BehaviorSummary["cameFrom"] {
    const r = document.referrer;
    if (!r) return "direct";
    if (r.includes("linkedin")) return "linkedin";
    if (r.includes("google") || r.includes("bing")) return "google";
    return "other";
  }

  summary(actionsAlreadyFired: string[], soundEnabled = false): BehaviorSummary {
    return {
      soundEnabled,
      secondsOnPage: Math.round((Date.now() - this.startedAt) / 1000),
      maxScrollPct: this.maxScrollPct,
      dwellBySection: this.settledDwell(),
      cardsHovered: [...this.cardsHovered],
      cardsClicked: [...this.cardsClicked],
      cameFrom: this.cameFrom(),
      lang: (navigator.language || "en").slice(0, 2),
      isReturning: this.isReturning,
      reducedMotion: this.reducedMotion,
      actionsAlreadyFired,
    };
  }
}
