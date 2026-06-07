"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { selectActiveModal, selectEnvironmentMode, selectTerminalOpen } from "../../store/selectors";
import { useGardenStore } from "../../store/useGardenStore";
import { runTerminalCommand, tabCompleteLine } from "../../terminal/runCommand";

const TYPE_MS = 15;

const WELCOME = [
  "The Pixel Garden — in-world terminal",
  "Type help for commands. Escape closes this panel.",
];

export function TerminalPanel() {
  const terminalOpen = useGardenStore(selectTerminalOpen);
  const activeModal = useGardenStore(selectActiveModal);
  const environmentMode = useGardenStore(selectEnvironmentMode);
  const closeTerminal = useGardenStore((s) => s.closeTerminal);
  const goToCameraPreset = useGardenStore((s) => s.goToCameraPreset);

  const [committed, setCommitted] = useState<string[]>([]);
  const [typing, setTyping] = useState<{ text: string; i: number } | null>(null);
  const queueRef = useRef<string[]>([]);
  const tabCycleRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);

  const escapeEnabled = terminalOpen && activeModal === "none";
  useEscapeKey(escapeEnabled, closeTerminal);

  const pumpQueue = useCallback(() => {
    if (typing) return;
    const next = queueRef.current.shift();
    if (next) setTyping({ text: next, i: 0 });
  }, [typing]);

  useEffect(() => {
    if (!typing) {
      pumpQueue();
      return;
    }
    if (typing.i >= typing.text.length) {
      setCommitted((c) => [...c, typing.text]);
      setTyping(null);
      return;
    }
    const id = window.setTimeout(() => {
      setTyping((t) => (t ? { ...t, i: t.i + 1 } : null));
    }, TYPE_MS);
    return () => clearTimeout(id);
  }, [typing, pumpQueue]);

  useEffect(() => {
    if (!terminalOpen) {
      queueRef.current.length = 0;
      setTyping(null);
      return;
    }
    setCommitted([...WELCOME]);
    setDraft("");
    setHistIdx(null);
    queueRef.current.length = 0;
  }, [terminalOpen]);

  useEffect(() => {
    if (terminalOpen) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [terminalOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [committed, typing, terminalOpen]);

  const enqueueOutput = useCallback(
    (lines: string[]) => {
      for (const ln of lines) {
        if (ln === "__CLEAR__") {
          queueRef.current.length = 0;
          setTyping(null);
          setCommitted([]);
          continue;
        }
        queueRef.current.push(ln);
      }
      pumpQueue();
    },
    [pumpQueue],
  );

  const submitLine = useCallback(
    (raw: string) => {
      const line = raw.trimEnd();
      if (!line.trim()) return;
      setCommitted((c) => [...c, `> ${line.trim()}`]);
      setHistory((h) => [...h, line.trim()]);
      setHistIdx(null);
      setDraft("");
      tabCycleRef.current = 0;
      const out = runTerminalCommand(line);
      enqueueOutput(out);
    },
    [enqueueOutput],
  );

  if (!terminalOpen) return null;

  const typingVisible = typing ? typing.text.slice(0, typing.i) : "";
  const isZombie = environmentMode === "zombie";

  return (
    <div
      className={`font-terminal pointer-events-auto fixed bottom-[4.5rem] left-2 right-2 z-[43] flex max-h-[min(42dvh,320px)] flex-col rounded border-2 border-ui-text/35 bg-[color:var(--token-ui-bg)]/98 p-2 text-[color:var(--token-ui-text)] shadow-lg backdrop-blur-sm sm:bottom-6 sm:left-4 sm:right-4 md:bottom-4 md:left-6 md:right-6 md:max-h-[min(38dvh,360px)] ${isZombie ? "terminal-panel-zombie" : ""}`}
      role="region"
      aria-label="In-world terminal"
    >
      <div className="mb-1 flex items-center justify-between gap-2 border-b border-ui-text/20 pb-1">
        <span className="font-pixel text-[8px] uppercase tracking-wide text-ui-text/90 sm:text-[9px]">
          Terminal
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="font-pixel rounded border border-ui-text/30 px-2 py-0.5 text-[7px] text-ui-text/80 hover:border-accent sm:text-[8px]"
            onClick={() => goToCameraPreset("terminal")}
          >
            Re-center
          </button>
          <button
            type="button"
            className="font-pixel rounded border border-ui-text/30 px-2 py-0.5 text-[7px] text-ui-text/80 hover:border-accent sm:text-[8px]"
            onClick={() => closeTerminal()}
          >
            Close
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words px-1 py-1 text-sm leading-snug sm:text-base"
        aria-live="polite"
      >
        {committed.map((ln, i) => (
          <div key={`${i}-${ln.slice(0, 32)}`} className="mb-0.5">
            {ln}
          </div>
        ))}
        {typingVisible ? <div className="text-ui-text/95">{typingVisible}</div> : null}
      </div>

      <div className="mt-1 flex items-center gap-1 border-t border-ui-text/20 pt-1 font-mono text-sm sm:text-base">
        <span className="shrink-0 select-none text-accent" aria-hidden>
          $
        </span>
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          aria-label="Terminal command line"
          className="min-w-0 flex-1 bg-transparent text-[color:var(--token-ui-text)] outline-none placeholder:text-ui-text/40"
          placeholder="help"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            tabCycleRef.current = 0;
          }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              const { next, matches } = tabCompleteLine(draft, tabCycleRef.current);
              if (matches.length === 0) return;
              if (next !== draft) {
                tabCycleRef.current = 0;
                setDraft(next);
                return;
              }
              if (matches.length > 1) {
                tabCycleRef.current += 1;
                setDraft(tabCompleteLine(draft, tabCycleRef.current).next);
              }
              return;
            }

            if (e.key === "Enter") {
              e.preventDefault();
              submitLine(draft);
              return;
            }

            if (e.key === "ArrowUp") {
              e.preventDefault();
              if (history.length === 0) return;
              const next = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
              setHistIdx(next);
              setDraft(history[next] ?? "");
              return;
            }

            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (histIdx === null) return;
              const next = histIdx + 1;
              if (next >= history.length) {
                setHistIdx(null);
                setDraft("");
              } else {
                setHistIdx(next);
                setDraft(history[next] ?? "");
              }
            }
          }}
        />
      </div>
    </div>
  );
}
