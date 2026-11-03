type BufferedConsoleMethod = "log" | "info" | "debug" | "table";

type BufferedConsoleEntry = {
  method: BufferedConsoleMethod;
  timestamp: string;
  args: unknown[];
};

type OriginalConsole = Record<
  BufferedConsoleMethod,
  (...args: unknown[]) => void
>;

type ConsoleLogBufferWindow = Window & {
  showLogs?: () => BufferedConsoleEntry[];
  clearLogs?: () => void;
  __consoleLogBufferInstalled?: boolean;
  __consoleLogBufferEntries?: BufferedConsoleEntry[];
  __consoleLogBufferOriginalConsole?: OriginalConsole;
};

const bufferedMethods: BufferedConsoleMethod[] = [
  "log",
  "info",
  "debug",
  "table",
];
const maxBufferedLogs = 1000;

function getBufferWindow() {
  if (typeof window === "undefined") {
    return null;
  }

  return window as ConsoleLogBufferWindow;
}

function createOriginalConsole(): OriginalConsole {
  return {
    log: console.log.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console),
    table: console.table.bind(console) as (...args: unknown[]) => void,
  };
}

const originalConsole = (() => {
  const win = getBufferWindow();

  if (!win) {
    return createOriginalConsole();
  }

  if (!win.__consoleLogBufferOriginalConsole) {
    win.__consoleLogBufferOriginalConsole = createOriginalConsole();
  }

  return win.__consoleLogBufferOriginalConsole;
})();

const entries = (() => {
  const win = getBufferWindow();

  if (!win) {
    return [] as BufferedConsoleEntry[];
  }

  if (!win.__consoleLogBufferEntries) {
    win.__consoleLogBufferEntries = [];
  }

  return win.__consoleLogBufferEntries;
})();

function isLocalhost() {
  if (typeof window === "undefined") {
    return false;
  }

  return ["localhost", "127.0.0.1", "::1"].includes(
    window.location.hostname,
  );
}

function pushEntry(method: BufferedConsoleMethod, args: unknown[]) {
  entries.push({
    method,
    timestamp: new Date().toISOString(),
    args,
  });

  if (entries.length > maxBufferedLogs) {
    entries.splice(0, entries.length - maxBufferedLogs);
  }
}

function replayLogs() {
  if (entries.length === 0) {
    originalConsole.log(
      "%c No buffered console logs yet.",
      "color: gray; font-style: italic;",
    );
    return entries;
  }

  originalConsole.log(
    `%c -- Buffered Console Logs (${entries.length}) --`,
    "color: #2563eb; font-weight: bold;",
  );

  entries.forEach((entry) => {
    originalConsole.log(
      `%c[${entry.timestamp}] ${entry.method}`,
      "color: #64748b;",
    );
    originalConsole[entry.method](...entry.args);
  });

  return entries;
}

function clearLogs() {
  entries.length = 0;
}

export function installConsoleLogBuffer() {
  if (process.env.NODE_ENV !== "development") return;
  const win = getBufferWindow();

  if (!win) {
    return;
  }

  if (win.__consoleLogBufferInstalled) {
    return;
  }

  win.__consoleLogBufferInstalled = true;

  bufferedMethods.forEach((method) => {
    console[method] = (...args: unknown[]) => {
      pushEntry(method, args);

      if (isLocalhost()) {
        originalConsole[method](...args);
      }
    };
  });

  win.showLogs = replayLogs;
  win.clearLogs = clearLogs;
}

export const consoleLogBuffer = {
  entries,
  showLogs: replayLogs,
  clearLogs,
  isLocalhost,
  originalConsole,
};
