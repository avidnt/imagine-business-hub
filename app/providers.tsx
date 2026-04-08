"use client";

import { DataProvider, useData } from "@/lib/data-context";

function LoadingGate({ children }: { children: React.ReactNode }) {
  const { loading } = useData();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-stone-800" />
            <div className="absolute inset-0 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
              Imagine Studio
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-100">
              Loading Business Hub…
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Connecting to database
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <LoadingGate>{children}</LoadingGate>
    </DataProvider>
  );
}
