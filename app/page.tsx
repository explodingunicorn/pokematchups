import Link from "next/link";

export default function HomePage() {
  return (
    <section className="rounded-lg bg-surface p-6 shadow-lg">
      <div>
        <h1 className="section-title">Pokemon TCG Analysis Tools</h1>
      </div>
      <div className="page-stack mt-4">
        <p className="section-subtitle">
          This migration moves the app to Next.js SSR, HeroUI components, and a
          Supabase-backed auth/data foundation.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/analyzer"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground no-underline"
          >
            Open Analyzer
          </Link>
          <Link
            href="/simulator"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground no-underline"
          >
            Open Simulator
          </Link>
        </div>
      </div>
    </section>
  );
}
