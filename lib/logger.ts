/**
 * Единый логгер приложения. Используйте вместо console.log.
 * В production можно заменить вывод на отправку в систему мониторинга.
 */
const isDev = typeof process !== "undefined" && process.env?.NODE_ENV === "development";

function noop(): void {}

function devLog(level: string, ...args: unknown[]): void {
  if (typeof console !== "undefined" && isDev) {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`[${level}]`, ...args);
  }
}

export function log(...args: unknown[]): void {
  devLog("log", ...args);
}

export function logInfo(...args: unknown[]): void {
  devLog("info", ...args);
}

export function logAudit(...args: unknown[]): void {
  devLog("audit", ...args);
}

export function logError(...args: unknown[]): void {
  if (typeof console !== "undefined") console.error("[error]", ...args);
}

export function logSecurity(...args: unknown[]): void {
  if (typeof console !== "undefined") console.warn("[security]", ...args);
}

export function logWarn(...args: unknown[]): void {
  if (typeof console !== "undefined") console.warn("[warn]", ...args);
}
