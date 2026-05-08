import { Finding } from "@/types/analysis";

const statusClasses: Record<Finding["status"], string> = {
  success: "border-emerald-200 bg-emerald-50/85 text-emerald-900",
  warning: "border-amber-200 bg-amber-50/85 text-amber-900",
  error: "border-rose-200 bg-rose-50/85 text-rose-900",
};

const badgeClasses: Record<Finding["status"], string> = {
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-rose-100 text-rose-800",
};

const priorityClasses: Record<Finding["priority"], string> = {
  high: "bg-rose-100 text-rose-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

interface FindingCardProps {
  finding: Finding;
}

export function FindingCard({ finding }: FindingCardProps) {
  return (
    <article className={`rounded-[1.45rem] border p-5 ${statusClasses[finding.status]}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
          {finding.category}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badgeClasses[finding.status]}`}
        >
          {finding.status}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${priorityClasses[finding.priority]}`}
        >
          {finding.priority}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold">{finding.title}</h3>
      <p className="mt-2 text-sm leading-7 opacity-90">{finding.description}</p>
    </article>
  );
}
