export const AUTH_COOKIE = "uebergabe_auth";

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function authEnabled(): boolean {
  return Boolean(process.env.APP_ACCESS_CODE);
}

export async function expectedToken(): Promise<string> {
  return sha256(`uebergabe:${process.env.APP_ACCESS_CODE ?? ""}`);
}

export async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!authEnabled()) return true;
  if (!token) return false;
  return token === (await expectedToken());
}
