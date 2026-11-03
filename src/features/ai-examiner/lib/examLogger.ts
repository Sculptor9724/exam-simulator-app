import { consoleLogBuffer } from "../../../shared/lib/consoleLogBuffer";

type LogEntry = {
  time: string;
  elapsed: string;
  event: string;
  detail?: unknown;
};

const entries: LogEntry[] = [];
let sessionStart: number | null = null;

function now() {
  return new Date().toLocaleTimeString("da-DK", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);
}

function elapsed(): string {
  if (!sessionStart) return "—";
  const diff = Date.now() - sessionStart;
  const s = Math.floor(diff / 1000);
  const ms = diff % 1000;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s ${ms}ms`;
}

function log(event: string, detail?: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  const entry: LogEntry = { time: now(), elapsed: elapsed(), event, detail };
  entries.push(entry);
  if (entries.length > 200) entries.shift();
  // Also mirror to console with a recognizable prefix
  if (detail !== undefined) {
    console.log(`[ExamLog] ${entry.elapsed} | ${event}`, detail);
  } else {
    console.log(`[ExamLog] ${entry.elapsed} | ${event}`);
  }
}

function reset() {
  entries.length = 0;
  sessionStart = Date.now();
  log("session_reset");
}

function startSession() {
  sessionStart = Date.now();
  log("session_started");
}

function printLogs() {
  const { originalConsole } = consoleLogBuffer;

  if (entries.length === 0) {
    originalConsole.log(
      "%c No exam logs recorded yet.",
      "color: gray; font-style: italic;",
    );
    return;
  }

  originalConsole.log(
    `%c ── Exam Session Logs (${entries.length} entries) ──`,
    "color: #2563eb; font-weight: bold; font-size: 14px;",
  );
  originalConsole.table(
    entries.map((e) => ({
      Time: e.time,
      Elapsed: e.elapsed,
      Event: e.event,
      Detail:
        e.detail !== undefined
          ? typeof e.detail === "string"
            ? e.detail
            : JSON.stringify(e.detail)
          : "",
    })),
  );

  // Also print a focused timing summary for the closing flow
  const closingEntries = entries.filter(
    (e) =>
      e.event.startsWith("closing_") ||
      e.event.startsWith("finalize_") ||
      e.event.startsWith("grade_") ||
      e.event.startsWith("disconnect") ||
      e.event === "timer_pre_end_mute" ||
      e.event === "timer_exam_end" ||
      e.event === "hard_timeout" ||
      e.event === "deliberation_started" ||
      e.event === "grade_ready",
  );

  if (closingEntries.length > 0) {
    originalConsole.log(
      `%c ── Closing Flow Timeline ──`,
      "color: #dc2626; font-weight: bold; font-size: 13px;",
    );
    originalConsole.table(
      closingEntries.map((e) => ({
        Elapsed: e.elapsed,
        Event: e.event,
        Detail:
          e.detail !== undefined
            ? typeof e.detail === "string"
              ? e.detail
              : JSON.stringify(e.detail)
            : "",
      })),
    );
  }
}

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // Expose globally so you can type logs() in the console.
  (window as any).logs = printLogs;
  (window as any).examLog = { entries, log, reset, show: printLogs };
}

export const examLogger = { log, reset, startSession, entries, printLogs };
