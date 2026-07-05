// Hover whisperer client: cursor rests ≥400ms on a known target → stream a
// one-liner from /api/hover into a tooltip. Session-cached per target;
// vanishes 5s after it finishes if ignored; aborts instantly on leave.

const cache = new Map<string, string>();
let inflight: AbortController | null = null;

export type QuipEvents = {
  onStart: (target: string, x: number, y: number) => void;
  onDelta: (text: string) => void;
  onDone: () => void;
  log: (text: string) => void;
};

export function attachQuips(lang: string, ev: QuipEvents): () => void {
  let timer = 0;
  let active: string | null = null;

  const findTarget = (el: HTMLElement): { key: string; node: HTMLElement } | null => {
    const card = el.closest<HTMLElement>("[data-agent-card]");
    if (card?.dataset.agentCard) return { key: card.dataset.agentCard, node: card };
    const section = el.closest<HTMLElement>("section[id]");
    if (section?.id) return { key: section.id, node: section };
    return null;
  };

  const onOver = (e: PointerEvent) => {
    const hit = findTarget(e.target as HTMLElement);
    if (!hit || hit.key === active) return;
    window.clearTimeout(timer);
    active = hit.key;
    const { key } = hit;
    const x = e.clientX;
    const y = e.clientY;
    timer = window.setTimeout(async () => {
      if (active !== key) return;
      const cached = cache.get(key);
      if (cached) {
        ev.onStart(key, x, y);
        ev.onDelta(cached);
        ev.onDone();
        return;
      }
      inflight?.abort();
      const ac = new AbortController();
      inflight = ac;
      try {
        const res = await fetch("/api/hover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: key, lang }),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) return;
        ev.onStart(key, x, y);
        ev.log(`quip(${key}) streaming`);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let full = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = dec.decode(value, { stream: true });
          full += chunk;
          ev.onDelta(chunk);
        }
        cache.set(key, full.trim());
        ev.onDone();
      } catch {
        /* aborted or offline — silence */
      }
    }, 400);
  };

  const onOut = (e: PointerEvent) => {
    const hit = findTarget(e.target as HTMLElement);
    if (hit && hit.key === active) {
      const to = e.relatedTarget as HTMLElement | null;
      if (to && findTarget(to)?.key === active) return;
      active = null;
      window.clearTimeout(timer);
    }
  };

  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerout", onOut, { passive: true });
  return () => {
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    window.clearTimeout(timer);
    inflight?.abort();
  };
}
