import { trackResumeDownload } from "../analytics/plausible";
import { useGardenStore } from "../store/useGardenStore";

/** Sorted for tab completion + display. */
export const TERMINAL_COMMANDS = [
  "about",
  "clear",
  "cls",
  "coffee",
  "contact",
  "cottage",
  "echo",
  "exit",
  "garden",
  "help",
  "hub",
  "mailbox",
  "projects",
  "recruiter",
  "resume",
  "terminal",
  "version",
  "whoami",
] as const;

const HELP_LINES = [
  "Commands (TRD §10.7 subset):",
  "  help | clear | cls",
  "  hub | garden | cottage | about | projects | terminal | mailbox",
  "  resume — download PDF (add /public/resume.pdf for static hosting)",
  "  contact | recruiter — open panels",
  "  echo <text> | whoami | version | coffee | exit",
  "  Tab — complete command; Tab again cycles matches.",
];

function longestCommonPrefix(strings: readonly string[]): string {
  if (strings.length === 0) return "";
  let pref = strings[0]!;
  for (let i = 1; i < strings.length; i++) {
    const s = strings[i]!;
    while (!s.startsWith(pref)) {
      pref = pref.slice(0, -1);
      if (!pref) return "";
    }
  }
  return pref;
}

/**
 * Tab-complete the first word of `line`. `cycleIndex` advances when LCP already fills the word.
 * Returns the full line after completion.
 */
export function tabCompleteLine(line: string, cycleIndex: number): { next: string; matches: string[] } {
  const m = line.match(/^(\s*)([^\s]*)([\s\S]*)$/);
  const lead = m?.[1] ?? "";
  const word = m?.[2] ?? "";
  const tail = m?.[3] ?? "";

  const w = word.toLowerCase();
  const matches = TERMINAL_COMMANDS.filter((c) => c.startsWith(w));
  if (matches.length === 0) return { next: line, matches: [] };
  if (matches.length === 1) {
    const pick = matches[0]!;
    if (pick === w) return { next: line, matches };
    return { next: `${lead}${pick}${tail}`, matches };
  }

  const lcp = longestCommonPrefix(matches);
  if (w.length < lcp.length) {
    return { next: `${lead}${lcp}${tail}`, matches };
  }
  if (w === lcp) {
    const pick = matches[cycleIndex % matches.length]!;
    return { next: `${lead}${pick}${tail}`, matches };
  }
  return { next: `${lead}${lcp}${tail}`, matches };
}

/** Run a user line; returns lines of output (no leading `>`). */
export function runTerminalCommand(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/\s+/);
  const cmd = (parts[0] ?? "").toLowerCase();
  const args = parts.slice(1);

  const st = useGardenStore.getState();

  switch (cmd) {
    case "help":
    case "?":
      return HELP_LINES;
    case "clear":
    case "cls":
      return ["__CLEAR__"];
    case "hub":
    case "garden":
      st.goToCameraPreset("hub");
      return ["Panning to hub…"];
    case "cottage":
    case "about":
      st.goToCameraPreset("cottage");
      return ["Panning to cottage (About)…"];
    case "projects":
      st.goToCameraPreset("projects");
      return ["Panning to projects…"];
    case "terminal":
      st.goToCameraPreset("terminal");
      st.setTerminalOpen(true);
      return ["Camera at terminal station. Panel open."];
    case "mailbox":
      st.goToCameraPreset("mailbox");
      return ["Panning to mailbox…", "Tip: use Contact (✉️) in the HUD to send a message from the garden."];
    case "resume": {
      trackResumeDownload();
      try {
        const a = document.createElement("a");
        a.href = "/resume.pdf";
        a.download = "resume.pdf";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        /* noop */
      }
      return [
        "Triggering resume download (resume.pdf).",
        "Tip: add public/resume.pdf before deploy so the file exists on static hosting.",
      ];
    }
    case "contact":
      st.openModal("contact");
      return ["Opening contact…"];
    case "recruiter":
      st.openModal("recruiter");
      return ["Opening recruiter overview…"];
    case "echo":
      return args.length ? [args.join(" ")] : ["echo: need some text"];
    case "whoami":
      return ["guest@pixel-garden:~$", "You are a curious visitor in the Pixel Garden."];
    case "version":
      return ["pixel-garden/0.0.1", "Phase 8 terminal — command map + history + tab completion."];
    case "coffee": {
      st.recordCoffeeClick();
      const n = useGardenStore.getState().coffeeClickCount;
      return [
        `Coffee counter: ${n}/3 within the window.`,
        "Three quick coffees still wake the zombie (Phase 11).",
      ];
    }
    case "exit":
      if (st.environmentMode === "zombie") {
        st.exitZombie();
        return ["Leaving zombie mode. Welcome back."];
      }
      st.closeTerminal();
      return ["Terminal closed. (Use HUD to reopen.)"];
    default:
      return [`Unknown command: ${cmd}. Type help.`];
  }
}
