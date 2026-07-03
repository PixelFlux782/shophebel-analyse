import { getScoreLabel, getScoreTone } from "@/lib/result-ui";

interface ScoreCardProps {
  title: string;
  description: string;
  score: number;
}

export function ScoreCard({ title, description, score }: ScoreCardProps) {
  const tone = getScoreTone(score);
  const label = getScoreLabel(score);

  return (
    <article
      className="flex h-full min-h-[12rem] flex-col rounded-[0.9rem] border border-slate-200 bg-white p-4 shadow-[0_18px_70px_-58px_rgba(15,23,42,0.45)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {title}
          </p>
          <span
            className={`mt-2 inline-flex max-w-full rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone.badge}`}
          >
            <span className="whitespace-normal break-words">{label}</span>
          </span>
        </div>
        <div
          className="flex h-12 w-14 shrink-0 items-center justify-center self-start rounded-[0.7rem] border border-slate-200 bg-[#f9f6ef] font-mono text-xl font-semibold text-slate-950"
        >
          {score}
        </div>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${tone.progress}`}
          style={{ width: `${Math.max(6, Math.min(100, score))}%` }}
        />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
