/**
 * Reads an API key from the environment and cleans up common paste mistakes:
 * surrounding whitespace or quotes, and the same key pasted several times
 * (separated by spaces or newlines). Only the first token is used.
 */
export function readKey(name: string): string {
  const raw = process.env[name] ?? "";
  const first = raw.trim().replace(/^["']|["']$/g, "").split(/\s+/)[0] ?? "";
  if (!first) throw new Error(`${name} fehlt`);
  return first;
}

/** Removes anything that looks like an API key from a message before it reaches the UI. */
export function redact(message: string): string {
  return message.replace(/\b(sk-ant-[A-Za-z0-9_-]{6})[A-Za-z0-9_-]+/g, "$1…").replace(/\b(sk_[A-Za-z0-9]{4})[A-Za-z0-9]+/g, "$1…");
}

export function errorMessage(e: unknown): string {
  return redact(e instanceof Error ? e.message : String(e));
}
