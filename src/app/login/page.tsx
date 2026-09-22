"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    if (res.ok) router.replace("/");
    else setError("Falscher Code.");
  }

  return (
    <main className="flex-1 flex flex-col justify-center gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Übergabe</h1>
        <p className="text-sm text-[var(--muted)]">Zugangscode eingeben.</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          className="input text-lg"
          type="password"
          inputMode="text"
          autoComplete="current-password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code"
          autoFocus
        />
        <button type="submit" className="btn btn-primary">Rein</button>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      </form>
    </main>
  );
}
