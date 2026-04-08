"use client";

import { useEffect } from "react";

type SlideOverProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
};

export function SlideOver({ open, onClose, title, children, wide }: SlideOverProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 flex h-full flex-col border-l border-stone-800 bg-stone-900 shadow-2xl animate-[slideIn_0.25s_ease-out] ${
          wide ? "w-full max-w-2xl" : "w-full max-w-lg"
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-800 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Reusable form field ──────────────────────────── */

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

export function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-400">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition";

export const selectClass =
  "w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-2.5 text-sm text-stone-100 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition appearance-none";

export const btnPrimary =
  "rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-500/20 transition hover:shadow-amber-500/40 hover:brightness-110 active:scale-[0.98]";

export const btnSecondary =
  "rounded-xl border border-stone-700 bg-stone-800 px-5 py-2.5 text-sm font-medium text-stone-300 transition hover:bg-stone-700 hover:text-white active:scale-[0.98]";

export const btnDanger =
  "rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-400 transition hover:bg-rose-500/25 active:scale-[0.98]";
