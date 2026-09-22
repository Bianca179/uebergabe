import Link from "next/link";

export function Header({ title, back }: { title: string; back?: string }) {
  return (
    <header className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {back && (
          <Link href={back} aria-label="Zurück" className="text-[var(--muted)] text-xl leading-none">
            ‹
          </Link>
        )}
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </div>
      {!back && (
        <Link href="/settings" aria-label="Einstellungen" className="text-[var(--muted)] text-sm">
          Einstellungen
        </Link>
      )}
    </header>
  );
}
