"use client";

// The ambient agent: observes silently, acts visually, speaks last.
// Press ~ (or click the status port) to open the console and watch it think.
// Everything it observes stays in this browser; only an anonymous behaviour
// summary is sent if the LLM director is consulted. Kill switch included.

import { useCallback, useEffect, useRef, useState } from "react";
import { Observer } from "./observer";
import { evaluateRules, shouldConsultDirector } from "./rules";
import { applyAction } from "./actuators";
import { runTour } from "./tour";
import { canSpeak, speak } from "./voice";
import { sanitizeActions, type AgentAction } from "./protocol";

type LogEntry = { t: string; kind: "signal" | "action" | "info" | "director"; text: string };

const TICK_MS = 5000;
const MIN_ACTION_GAP_MS = 10_000;
const INVITATION =
  "Want to know more about the agentic A I project? Press tilde to meet the agent behind this site.";

export default function AmbientAgent() {
  const [armed, setArmed] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [whisper, setWhisper] = useState<{ text: string; href?: string; tourOffer?: boolean } | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [touring, setTouring] = useState(false);

  const gestured = useRef(false);
  const invited = useRef(false);
  const pendingInvite = useRef(false);
  const tourOffered = useRef(false);
  const observerRef = useRef<Observer | null>(null);
  const firedRules = useRef(new Set<string>());
  const firedActions = useRef<string[]>([]);
  const lastActionAt = useRef(0);
  const directorCalls = useRef(0);
  const directorBusy = useRef(false);

  const addLog = useCallback((kind: LogEntry["kind"], text: string) => {
    const t = new Date().toTimeString().slice(0, 8);
    setLog((l) => [...l.slice(-79), { t, kind, text }]);
  }, []);

  const soundEnabled = useCallback(
    () => soundOn && gestured.current && localStorage.getItem("ab-agent-mute") !== "1",
    [soundOn]
  );

  const runAction = useCallback(
    (action: AgentAction, source: string) => {
      const now = Date.now();
      if (now - lastActionAt.current < MIN_ACTION_GAP_MS) return false;
      lastActionAt.current = now;
      firedActions.current.push(`${action.type}:${source}`);
      applyAction(action, {
        log: (k, text) => addLog(k, text),
        reducedMotion: observerRef.current?.reducedMotion ?? false,
        onWhisper: (text, href) => setWhisper({ text, href }),
        soundEnabled: soundEnabled(),
      });
      return true;
    },
    [addLog, soundEnabled]
  );

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

  // Ignored whispers retreat on their own.
  useEffect(() => {
    if (!whisper) return;
    const t = window.setTimeout(() => setWhisper(null), whisper.tourOffer ? 18_000 : 12_000);
    return () => window.clearTimeout(t);
  }, [whisper]);

  const startTour = useCallback(() => {
    if (touring) return;
    setWhisper(null);
    setConsoleOpen(false);
    setTouring(true);
    void runTour({
      log: addLog,
      onWhisper: (text, href) => setWhisper({ text, href }),
      soundEnabled,
      reducedMotion: observerRef.current?.reducedMotion ?? false,
    }).finally(() => setTouring(false));
  }, [touring, addLog, soundEnabled]);

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

  // Observe + decide loop
  useEffect(() => {
    if (!armed || disabled) return;
    const obs = new Observer(
      (s) => addLog("signal", s),
      (slug) => {
        // Spoken invitation the first time the flagship case enters the viewport.
        if (slug !== "multi-agent-service-desk" || invited.current || touring) return;
        if (soundEnabled() && canSpeak()) {
          invited.current = true;
          addLog("action", "speak(invitation)");
          void speak(INVITATION);
          setWhisper({ text: "Curious? The full case study →", href: "/work/multi-agent-service-desk" });
        } else {
          // No gesture yet → the browser won't let us speak. Park the
          // invitation and hint at the voice instead of wasting the moment.
          pendingInvite.current = true;
          addLog("info", "invitation parked (no audio unlock yet)");
          setWhisper({ text: "The agent can talk. Click anywhere, voice comes online." });
        }
      }
    );
    observerRef.current = obs;
    obs.start();
    addLog("info", `agent armed · observing (${obs.isReturning ? "returning" : "first"} visit)`);

    const tick = window.setInterval(async () => {
      if (touring) return; // the tour has the floor
      const summary = obs.summary(firedActions.current, soundEnabled());

      // A parked invitation speaks as soon as audio is unlocked.
      if (pendingInvite.current && !invited.current && soundEnabled() && canSpeak()) {
        pendingInvite.current = false;
        invited.current = true;
        addLog("action", "speak(invitation)");
        void speak(INVITATION);
        setWhisper({ text: "Curious? The full case study →", href: "/work/multi-agent-service-desk" });
        return;
      }

      // Offer the guided tour once, to engaged first-time visitors.
      if (!tourOffered.current && summary.secondsOnPage >= 25 && summary.maxScrollPct >= 15) {
        tourOffered.current = true;
        addLog("info", "offering guided tour");
        setWhisper({ text: "Sixty seconds. I drive, you watch. Guided tour?", tourOffer: true });
        return;
      }

      // Tier 1 — local rules
      const hit = evaluateRules(summary, firedRules.current);
      if (hit) {
        firedRules.current.add(hit.rule);
        addLog("info", `rule ${hit.rule} matched`);
        runAction(hit.action, hit.rule);
        return;
      }

      // Tier 2 — LLM director
      if (
        !directorBusy.current &&
        shouldConsultDirector(summary, directorCalls.current, Date.now() - lastActionAt.current)
      ) {
        directorBusy.current = true;
        directorCalls.current += 1;
        addLog("director", `consulting director (call ${directorCalls.current}/2)…`);
        try {
          const res = await fetch("/api/director", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(summary),
          });
          if (res.ok) {
            const data = await res.json();
            const actions = sanitizeActions(data.actions);
            if (data.reason) addLog("director", `reasoning: ${data.reason}`);
            if (actions.length === 0) addLog("director", "decision: stay silent");
            for (const a of actions) runAction(a, "director");
          } else {
            addLog("director", `director unavailable (${res.status}) — staying local`);
          }
        } catch {
          addLog("director", "director unreachable — staying local");
        } finally {
          directorBusy.current = false;
        }
      }
    }, TICK_MS);

    return () => {
      window.clearInterval(tick);
      obs.stop();
    };
  }, [armed, disabled, touring, addLog, runAction, soundEnabled]);

  // ~ toggles the console
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // "~" arrives differently per layout: direct on US/ES, AltGr+é dead key
      // on French AZERTY (Windows reports AltGr as ctrl+alt, key = "Dead").
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
          {disabled ? "Agent: off" : touring ? "Agent: driving" : "Agent: observing"}
        </button>
        <button
          aria-label={soundOn ? "Mute agent voice" : "Enable agent voice"}
          onClick={() => {
            const next = !soundOn;
            setSoundOn(next);
            localStorage.setItem("ab-agent-mute", next ? "0" : "1");
            addLog("info", next ? "voice on" : "voice muted");
            if (next && canSpeak()) {
              // The click itself unlocks audio — prove the voice exists.
              gestured.current = true;
              void speak("Voice online. I'm the resident agent. Scroll, and I'll point out what matters.");
            }
          }}
          className="border-l border-line px-2.5 font-mono text-[11px] text-faint transition-colors hover:text-accent"
        >
          {soundOn ? "◉))" : "◉ x"}
        </button>
      </div>

      {/* contact affordance (revealed by rule R5 / director) */}
      <a
        hidden
        data-agent-reveal="contact"
        href="mailto:abouhlal@gmail.com"
        className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 border border-accent bg-accent-soft px-4 py-2 font-mono text-[10px] tracking-[0.16em] text-accent uppercase backdrop-blur transition-colors hover:bg-accent hover:text-bg"
      >
        Email Amine →
      </a>

      {/* console hint (revealed by rule R4) */}
      <button
        hidden
        data-agent-reveal="console-hint"
        onClick={() => setConsoleOpen(true)}
        className="fixed right-4 bottom-14 z-40 cursor-pointer border border-line-soft bg-bg/90 px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-faint backdrop-blur transition-colors hover:border-accent hover:text-accent"
      >
        see what the agent sees <span className="text-accent">→</span>
      </button>

      {/* whisper */}
      {whisper && (
        <div className="agent-whisper fixed bottom-4 left-4 z-40 max-w-xs border border-line bg-surface/95 p-4 backdrop-blur">
          <p className="font-mono text-[11px] leading-relaxed text-ink">{whisper.text}</p>
          <div className="mt-2 flex gap-4 font-mono text-[10px] tracking-[0.14em] uppercase">
            {whisper.tourOffer && (
              <button onClick={startTour} className="text-accent hover:underline">
                ▶ Start tour
              </button>
            )}
            {whisper.href && (
              <a href={whisper.href} className="text-accent hover:underline" onClick={() => setWhisper(null)}>
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
            <p className="mb-2 text-faint">
              This site runs an ambient agent: it observes reading behaviour
              (in this browser only), and responds with visual cues first,
              words last. Log below — newest at the bottom.
            </p>
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
