import { ShieldIcon } from "./icons";

interface StatusItemProps {
  label: string;
  value: string;
  indicatorClassName?: string;
}

function StatusItem({ label, value, indicatorClassName }: StatusItemProps) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 flex items-center gap-2 font-semibold text-slate-700">
        {indicatorClassName && <span className={`h-2 w-2 rounded-full ${indicatorClassName}`} />}
        {value}
      </p>
    </div>
  );
}

export function StatusBar() {
  return (
    <aside aria-label="Informationen" className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card md:grid-cols-[1fr_1fr_2fr] md:items-center">
      <StatusItem label="Gewählte Sprache" value="Deutsch" indicatorClassName="bg-accent-500" />
      <StatusItem label="Spracherkennung" value="Im Browser" indicatorClassName="bg-accent-500" />
      <div className="flex gap-3 border-t border-slate-100 pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><ShieldIcon className="h-5 w-5" /></div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Deine Privatsphäre zählt</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">Die App lädt deine Audioaufnahme nicht auf einen eigenen Server hoch.</p>
        </div>
      </div>
    </aside>
  );
}
