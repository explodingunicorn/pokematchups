"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthControls } from "@/components/auth/auth-controls";

const routes = [
  { href: "/analyzer", label: "Analyzer" },
  { href: "/simulator", label: "Simulator" },
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-separator bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-bold tracking-tight text-foreground no-underline"
        >
          Pokemon TCG Analysis
        </Link>
        <ul className="flex items-center gap-2">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <li key={route.href}>
                <Link
                  href={route.href}
                  className={`rounded-md px-3 py-2 text-sm no-underline transition ${
                    isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-default"
                  }`}
                >
                  {route.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <AuthControls />
      </div>
    </nav>
  );
}
