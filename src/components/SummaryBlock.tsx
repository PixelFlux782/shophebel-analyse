interface SummaryBlockProps {
  title: string;
  eyebrow?: string;
  items: string[];
  tone: "cyan" | "emerald" | "slate";
}

const toneClasses = {
  cyan: "border-cyan-100 bg-cyan-50/80",
  emerald: "border-emerald-100 bg-emerald-50/80",
  slate: "border-slate-200 bg-slate-50/90",
};

export function SummaryBlock({ title, eyebrow, items, tone }: SummaryBlockProps) {
  return (
    <section
      className={`rounded-[1.75rem] border p-6 ${toneClasses[tone]} shadow-[0_24px_80px_-48px_rgba(15,23,42,0.25)]`}
    >
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-sm leading-6 text-slate-700"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
