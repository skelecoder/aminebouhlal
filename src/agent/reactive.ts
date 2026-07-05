// The 0ms layer: something is alive every single second, no model involved.
// Cursor-port on the grid, click ripples, scroll-velocity current, hover glow.
// All canvas/CSS, all disabled by reduced-motion or the kill switch.

export type Reactive = { destroy: () => void };

export function startReactive(reducedMotion: boolean): Reactive {
  if (reducedMotion) return { destroy: () => {} };

  // --- canvas overlay: cursor port + click ripples --------------------
  const canvas = document.createElement("canvas");
  canvas.className = "agent-reactive-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  let w = 0, h = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const mouse = { x: -100, y: -100 };
  const port = { x: -100, y: -100 };
  let hasMouse = false;
  const ripples: { x: number; y: number; r: number; a: number }[] = [];

  const onMove = (e: PointerEvent) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    hasMouse = e.pointerType === "mouse";
  };
  const onDown = (e: PointerEvent) => {
    ripples.push({ x: e.clientX, y: e.clientY, r: 4, a: 0.5 });
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });

  const GRID = 28;
  let raf = 0;
  let t = 0;
  const draw = () => {
    t += 1;
    ctx.clearRect(0, 0, w, h);

    if (hasMouse && mouse.x >= 0) {
      // easing pursuit
      port.x += (mouse.x - port.x) * 0.16;
      port.y += (mouse.y - port.y) * 0.16;
      // nearest grid node
      const gx = Math.round(port.x / GRID) * GRID;
      const gy = Math.round(port.y / GRID) * GRID;
      // current from grid node to port
      ctx.strokeStyle = "rgba(34,211,238,0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.lineDashOffset = -(t % 8);
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(port.x, port.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // grid node
      ctx.fillStyle = "rgba(34,211,238,0.5)";
      ctx.fillRect(gx - 1.5, gy - 1.5, 3, 3);
      // the port itself: ring + breathing core
      const breath = 2.6 + Math.sin(t / 18) * 0.8;
      ctx.strokeStyle = "rgba(34,211,238,0.55)";
      ctx.beginPath();
      ctx.arc(port.x, port.y, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(34,211,238,0.9)";
      ctx.beginPath();
      ctx.arc(port.x, port.y, breath, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.r += 2.4;
      r.a *= 0.94;
      if (r.a < 0.02) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = `rgba(34,211,238,${r.a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      // secondary: nearby grid dots flash
      const gx = Math.round(r.x / GRID) * GRID;
      const gy = Math.round(r.y / GRID) * GRID;
      ctx.fillStyle = `rgba(34,211,238,${r.a * 0.8})`;
      const k = Math.floor(r.r / GRID);
      for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k]] as const) {
        ctx.fillRect(gx + dx * GRID - 1, gy + dy * GRID - 1, 2, 2);
      }
    }
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  // --- top edge current: speed follows scroll velocity ----------------
  const bar = document.createElement("div");
  bar.className = "agent-topcurrent";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  let lastY = window.scrollY;
  let lastTs = performance.now();
  const onScroll = () => {
    const now = performance.now();
    const v = Math.abs(window.scrollY - lastY) / Math.max(1, now - lastTs); // px/ms
    lastY = window.scrollY;
    lastTs = now;
    const doc = document.documentElement;
    const pct = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
    bar.style.width = `${Math.min(100, pct)}%`;
    bar.style.setProperty("--speed", `${Math.max(0.25, Math.min(3, 3 - v * 2))}s`);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // --- instant hover life on interactive zones ------------------------
  const hoverables = document.querySelectorAll<HTMLElement>(
    "[data-agent-card], section[id], a[href^='mailto'], [data-agent-reveal]"
  );
  const enter = (e: Event) => (e.currentTarget as HTMLElement).classList.add("agent-hover-live");
  const leave = (e: Event) => (e.currentTarget as HTMLElement).classList.remove("agent-hover-live");
  hoverables.forEach((n) => {
    n.addEventListener("pointerenter", enter);
    n.addEventListener("pointerleave", leave);
  });

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
      hoverables.forEach((n) => {
        n.removeEventListener("pointerenter", enter);
        n.removeEventListener("pointerleave", leave);
      });
      canvas.remove();
      bar.remove();
    },
  };
}
