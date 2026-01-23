export interface Logger {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  debug: (msg: string, meta?: Record<string, unknown>) => void;
}

const formatMeta = (meta?: Record<string, unknown>) => {
  if (!meta || Object.keys(meta).length === 0) return "";
  return ` ${JSON.stringify(meta)}`;
};

const colorize = (level: string, text: string): string => {
  const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
  if (!useColor) return text;
  const colors: Record<string, string> = {
    info: "\u001b[32m",  // green
    warn: "\u001b[33m",  // yellow
    error: "\u001b[31m", // red
    debug: "\u001b[90m", // gray
  };
  const reset = "\u001b[0m";
  const color = colors[level.toLowerCase()] ?? "";
  return color ? `${color}${text}${reset}` : text;
};

const line = (level: string, msg: string, meta?: Record<string, unknown>) => {
  const ts = new Date().toISOString();
  const base = `[${ts}] ${level.toUpperCase()} ${msg}${formatMeta(meta)}`;
  return colorize(level, base);
};

export const createLogger = (debugEnabled: boolean): Logger => {
  return {
    info: (msg, meta) => console.log(line("info", msg, meta)),
    warn: (msg, meta) => console.warn(line("warn", msg, meta)),
    error: (msg, meta) => console.error(line("error", msg, meta)),
    debug: (msg, meta) => {
      if (debugEnabled) console.log(line("debug", msg, meta));
    },
  };
};
