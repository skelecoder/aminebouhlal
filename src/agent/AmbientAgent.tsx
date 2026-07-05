"use client";

// Ambient agent v3 — moment-consciousness.
// Perception (event bus) → salience gate → moment-director (LLM) → expression.
// Nothing it says is canned: every utterance is generated for this visitor,
// this instant, in their language. Discreet by design: silence is the default,
// and being ignored teaches it to be quieter. Press ~ to watch it think.

import { useCallback, useEffect, useRef, useState } from "react";
import { Observer } from "./observer";
import { SalienceGate } from "./salience";
import { applyAction } from "./actuators";
import { runTour } from "./tour";
import { canSpeak, speak } from "./voice";
import { startReactive } from "./reactive";
import { attachQuips } from "./quips";
import type { DirectorDecision } from "./protocol";
import { sanitizeActions } from "./protocol";

type LogEntry = { t: string; kind: "signal" | "action" | "info" | "director"; text: string };

export default function AmbientAgent() {
  const [armed, setArmed] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [whisper, setWhisper] = useState<{ text: string; href?: string; tourOffer?: boolean } | null>(null);
  const [quip, setQuip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [ticker, setTicker] = useState("");
  const [gateView, setGateView] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const [touring, setTouring] = useState(false);

  const gestured = useRef(false);
  const observerRef = useRef<Observer | null>(null);
  const gate = useRef(new SalienceGate());
  const said = useRef<string[]>([]);
  const directorBusy = useRef(false);
  const whisperEngaged = useRef(false);
  const tourOffered = useRef(false);
  const touringRef = useRef(false);

  const addLog = useCallback((kind: LogEntry["kind"], text: string) => {
    const t = new Date().toTimeString().slice(0, 8);
    setLog((l) => [...l.slice(-79), { t, kind, text }]);
  }, []);

  const soundEnabled = useCallback(
    () => soundOn && gestured.current && localStorage.getItem("ab-agent-mute") !== "1",
    [soundOn]
  );

  // The single path from a salient moment to an intervention.
  const consultDirector = useCallback(
    async (trigger: string) => {
      const obs = observerRef.current;
      if (!obs || directorBusy.current || touringRef.current) return;
      directorBusy.current = true;
      addLog("director", `moment sent (${trigger})`);
      try {
        const res = await fetch("/api/director", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moment: obs.moment(said.current),
            lang: obs.lang(),
            soundEnabled: soundEnabled(),
          }),
        });
        if (!res.ok) {
          addLog("director", `unavailable (${res.status})`);
          return;
        }
        const d: DirectorDecision = await res.json();
        if (d.reason) addLog("director", `${d.mood}: ${d.reason}`);
        if (d.mood === "silent") return;
        if (d.topic) said.current = [...said.current.slice(-11), d.topic];

        for (const a of sanitizeActions(d.actions, 2)) {
          applyAction(a, {
            log: addLog,
            reducedMotion: obs.reducedMotion,
            onWhisper: (text, href) => setWhisper({ text, href }),
          });
        }
        if (d.utterance) {
          if (soundEnabled() && canSpeak()) {
            addLog("action", `say("${d.utterance}")`);
            void speak(d.utterance);
            if (d.href) setWhisper({ text: d.utterance, href: d.href });
          } else {
            addLog("action", `whisper("${d.utterance}")`);
            whisperEngaged.current = false;
            setWhisper({ text: d.utterance, href: d.href });
          }
        }
      } catch {
        addLog("director", "unreachable — staying quiet");
      } finally {
        directorBusy.current = false;
      }
    },
    [addLog, soundEnabled]
  );

  // Arm after load + idle so the agent never competes with LCP.
  useEffect(() => {
    if (localStorage.getItem("ab-agent-off") === "1") {
      setDisabled(true);
      return;
    }
    const arm = () => window.setTimeout(() => setArmed(true), 2500);
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
  }, []);

  // First user gesture unlocks audio (browser autoplay policy).
  useEffect(() => {
    const onGesture = () => {
      gestured.current = true;
    };
    window.addEventListener("pointerdown", onGesture, { once: true, passive: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  // Ignored whispers retract on their own — and teach the gate.
  useEffect(() => {
    if (!whisper) return;
    whisperEngaged.current = false;
    const t = window.setTimeout(() => {
      setWhisper(null);
      if (!whisperEngaged.current) gate.current.ignored();
    }, whisper.tourOffer ? 18_000 : 9_000);
    return () => window.clearTimeout(t);
  }, [whisper]);

  const startTour = useCallback(() => {
    const obs = observerRef.current;
    if (!obs || touringRef.current) return;
    whisperEngaged.current = true;
    gate.current.rewarded();
    setWhisper(null);
    setConsoleOpen(false);
    setTouring(true);
    touringRef.current = true;
    gate.current.directorCalls += 1; // the script generation counts
    void runTour({
      log: addLog,
      onWhisper: (text, href) => setWhisper({ text, href }),
      soundEnabled,
      reducedMotion: obs.reducedMotion,
      moment: () => obs.moment(said.current),
      lang: obs.lang(),
    }).finally(() => {
      setTouring(false);
      touringRef.current = false;
    });
  }, [addLog, soundEnabled]);

  // Perception loop
  useEffect(() => {
    if (!armed || disabled) return;
    const obs = new Observer((e) => {
      const bits = [e.kind, e.target, e.value !== undefined ? String(e.value) : null]
        .filter(Boolean)
        .join(":");
      addLog("signal", bits);
      if (touringRef.current) return;
      if (gate.current.push(e)) void consultDirector(`salience:${e.kind}`);
      setGateView(() => {
        const s = gate.current.snapshot();
        return `charge ${s.charge}/${s.threshold} · calls ${s.calls}/12`;
      });

      // One-time tour offer, only for engaged first-timers, only once.
      if (
        !tourOffered.current &&
        e.kind === "stillness" &&
        (e.value ?? 0) >= 20 &&
        !obs.isReturning
      ) {
        tourOffered.current = true;
        addLog("info", "offering guided tour");
        setWhisper({ text: "", tourOffer: true });
      }
    });
    observerRef.current = obs;
    obs.start();
    addLog("info", `agent v3 armed · ${obs.isReturning ? "returning" : "first"} visit · discreet mode`);

    const reactive = startReactive(obs.reducedMotion);

    let quipTimer = 0;
    const detachQuips = attachQuips(obs.lang(), {
      onStart: (target, x, y) => {
        window.clearTimeout(quipTimer);
        setQuip({ text: "", x: Math.min(x, window.innerWidth - 280), y: Math.min(y + 24, window.innerHeight - 80) });
      },
      onDelta: (text) => setQuip((q) => (q ? { ...q, text: q.text + text } : q)),
      onDone: () => {
        quipTimer = window.setTimeout(() => setQuip(null), 5000);
      },
      log: (text) => addLog("director", text),
    });

    const tickerInterval = window.setInterval(() => {
      const s = obs.stats();
      const frames = [`t+${s.seconds}s`, `depth ${s.depth}%`, s.top ?? "surface", `${s.events} events`];
      setTicker(frames[s.seconds % frames.length]);
    }, 1000);

    return () => {
      window.clearInterval(tickerInterval);
      window.clearTimeout(quipTimer);
      detachQuips();
      reactive.destroy();
      obs.stop();
    };
  }, [armed, disabled, addLog, consultDirector]);

  // ~ toggles the console (US/ES layouts + AZERTY AltGr dead key)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const direct = (e.key === "~" || e.key === "º" || e.key === "`") && !e.metaKey && (!e.ctrlKey || e.altKey);
      const deadTilde = e.key === "Dead" && e.altKey;
      if (direct || deadTilde) {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
        setConsoleOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const kill = () => {
    localStorage.setItem("ab-agent-off", "1");
    setDisabled(true);
    setConsoleOpen(false);
    addLog("info", "agent disabled by visitor");
  };
  const revive = () => {
    localStorage.removeItem("ab-agent-off");
    window.location.reload();
  };

  if (!armed && !disabled) return null;

  return (
    <>
      {/* status port + sound toggle */}
      <div className="fixed right-4 bottom-4 z-40 flex items-stretch gap-px border border-line bg-bg/90 backdrop-blur">
        <button
          aria-label="Agent console"
          onClick={() => setConsoleOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-faint uppercase transition-colors hover:text-accent"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${disabled ? "bg-faint" : touring ? "bg-accent" : "agent-dot bg-accent"}`} />
          {disabled ? "Agent: off" : touring ? "Agent: driving" : `Agent: ${ticker || "observing"}`}
        </button>
        <button
          aria-label={soundOn ? "Mute agent voice" : "Enable agent voice"}
          onClick={() => {
            const next = !soundOn;
            setSoundOn(next);
            localStorage.setItem("ab-agent-mute", next ? "0" : "1");
            addLog("info", next ? "voice on" : "voice muted");
            if (next) {
              gestured.current = true;
              observerRef.current?.note("sound");
              gate.current.directorCalls += 1;
              void consultDirector("sound-enabled");
            }
          }}
          className="border-l border-line px-2.5 font-mono text-[11px] text-faint transition-colors hover:text-accent"
        >
          {soundOn ? "◉))" : "◉ x"}
        </button>
      </div>

      {/* contact affordance (revealed by the director) */}
      <a
        hidden
        data-agent-reveal="contact"
        href="mailto:abouhlal@gmail.com"
        className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 border border-accent bg-accent-soft px-4 py-2 font-mono text-[10px] tracking-[0.16em] text-accent uppercase backdrop-blur transition-colors hover:bg-accent hover:text-bg"
      >
        Email Amine →
      </a>

      {/* console hint */}
      <button
        hidden
        data-agent-reveal="console-hint"
        onClick={() => setConsoleOpen(true)}
        className="fixed right-4 bottom-14 z-40 cursor-pointer border border-line-soft bg-bg/90 px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-faint backdrop-blur transition-colors hover:border-accent hover:text-accent"
      >
        see what the agent sees <span className="text-accent">→</span>
      </button>

      {/* hover quip */}
      {quip && quip.text && (
        <p
          className="agent-quip border border-line bg-bg/95 px-3 py-2 font-mono text-[10px] leading-relaxed text-muted backdrop-blur"
          style={{ left: quip.x, top: quip.y }}
        >
          {quip.text}
        </p>
      )}

      {/* whisper / tour offer */}
      {whisper && (whisper.text || whisper.tourOffer) && (
        <div className="agent-whisper fixed bottom-4 left-4 z-40 max-w-xs border border-line bg-surface/95 p-4 backdrop-blur">
          <p className="font-mono text-[11px] leading-relaxed text-ink">
            {whisper.text || "I can drive for a minute, if you like."}
          </p>
          <div className="mt-2 flex gap-4 font-mono text-[10px] tracking-[0.14em] uppercase">
            {whisper.tourOffer && (
              <button onClick={startTour} className="text-accent hover:underline">
                ▶ Start tour
              </button>
            )}
            {whisper.href && (
              <a
                href={whisper.href}
                className="text-accent hover:underline"
                onClick={() => {
                  whisperEngaged.current = true;
                  gate.current.rewarded();
                  setWhisper(null);
                }}
              >
                Go →
              </a>
            )}
            <button onClick={() => setWhisper(null)} className="text-faint hover:text-ink">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* console */}
      {consoleOpen && (
        <div className="fixed right-4 bottom-14 z-50 flex max-h-[60vh] w-[min(26rem,calc(100vw-2rem))] flex-col border border-line bg-bg/95 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">
              {"//"} Agent console
            </p>
            <div className="flex gap-3 font-mono text-[10px] uppercase">
              {!disabled && !touring && (
                <button onClick={startTour} className="text-accent hover:underline">
                  ▶ Tour
                </button>
              )}
              {disabled ? (
                <button onClick={revive} className="text-accent hover:underline">
                  Enable
                </button>
              ) : (
                <button onClick={kill} className="text-faint hover:text-ink">
                  Disable agent
                </button>
              )}
              <button onClick={() => setConsoleOpen(false)} className="text-faint hover:text-ink">
                ✕
              </button>
            </div>
          </div>
          <div className="overflow-y-auto px-4 py-3 font-mono text-[10px] leading-relaxed">
            <p className="mb-1 text-faint">
              Moment-conscious agent: it watches this session (in your browser
              only), wakes its director when a moment is salient, and generates
              every word fresh. Ignoring it makes it quieter.
            </p>
            {gateView && <p className="mb-2 text-accent/70">{gateView}</p>}
            {log.map((e, i) => (
              <p key={i}>
                <span className="text-faint">{e.t}</span>{" "}
                <span
                  className={
                    e.kind === "action"
                      ? "text-accent"
                      : e.kind === "director"
                        ? "text-ink"
                        : "text-muted"
                  }
                >
                  [{e.kind}]
                </span>{" "}
                <span className="text-muted">{e.text}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
