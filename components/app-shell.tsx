"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { label: string; href: string; icon: string };

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "◎" },
  { label: "Services", href: "/services", icon: "❖" },
  { label: "Clients", href: "/clients", icon: "◇" },
  { label: "Projects", href: "/projects", icon: "▦" },
  { label: "Deliverables", href: "/deliverables", icon: "◈" },
  { label: "Tasks", href: "/tasks", icon: "☰" },


  { label: "Proposals", href: "/proposals", icon: "◪" },
  { label: "Invoices", href: "/invoices", icon: "▤" },
  { label: "Expenses", href: "/expenses", icon: "◉" },
  { label: "Working Capital", href: "/working-capital", icon: "◐" },
];

type AppShellProps = { children: React.ReactNode };

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <>
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
          Imagine Studio
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Business Hub</h1>
        <p className="mt-2 text-sm text-stone-400">
          Clients · Projects · Invoices · Finance
        </p>
      </div>

      <nav className="space-y-1 text-sm">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                isActive
                  ? "bg-amber-400 font-semibold text-stone-950 shadow-lg shadow-amber-400/15"
                  : "text-stone-400 hover:bg-stone-800/80 hover:text-stone-100"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <div className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4">
          <p className="text-xs uppercase tracking-widest text-stone-500">
            Imagine Studio
          </p>
          <p className="mt-1 text-sm text-stone-400">v1.0 · Internal Use</p>
        </div>
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 flex-col border-r border-stone-800 bg-stone-900/80 p-6 lg:flex">
          {sidebar}
        </aside>

        {/* Mobile header */}
        <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-stone-800 bg-stone-950/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
              Imagine Studio
            </p>
            <p className="text-sm font-semibold">Business Hub</p>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {mobileOpen ? (
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-stone-900 p-6 shadow-2xl animate-[slideInLeft_0.25s_ease-out]">
              {sidebar}
            </aside>
          </div>
        )}

        {/* Main content */}
        <section className="flex-1 min-w-0 p-4 pt-20 lg:p-10 lg:pt-10 overflow-x-hidden">
          {children}
        </section>
      </div>
    </main>
  );
}
