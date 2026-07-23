"use client";

import { MicrophoneIcon } from "./icons";

export function RecorderCard() {
  const handleStart = (): void => {};
  const handleStop = (): void => {};

  return (
    <section aria-labelledby="recorder-heading" className="flex min-h-[430px] flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-card sm:p-10">
      <h2 id="recorder-heading" className="sr-only">Aufnahme</h2>
      <div className="relative mb-7">
        <div className="absolute inset-0 scale-125 rounded-full bg-accent-50" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/20">
          <MicrophoneIcon className="h-14 w-14" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500">Aufnahmezeit</p>
      <p className="mt-1 font-mono text-4xl font-semibold tracking-tight text-ink" aria-label="Aufnahmezeit 00 Minuten 00 Sekunden">00:00</p>
      <div className="mt-5 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
        <span className="h-2 w-2 rounded-full bg-slate-400" />
        Mikrofon nicht aktiv
      </div>
      <div className="mt-8 grid w-full max-w-md gap-3 sm:grid-cols-2">
        <button type="button" onClick={handleStart} className="rounded-xl bg-accent-600 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-accent-700">Aufnahme starten</button>
        <button type="button" onClick={handleStop} disabled className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-5 py-3.5 font-semibold text-slate-400">Aufnahme stoppen</button>
      </div>
    </section>
  );
}
