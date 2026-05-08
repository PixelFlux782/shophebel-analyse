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
      className={`flex h-full min-h-[22rem] flex-col rounded-[1.75rem] border p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)] ${tone.surface}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <span
            className={`mt-3 inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tone.badge}`}
          >
            <span className="whitespace-normal break-words">{label}</span>
          </span>
        </div>
        <div
          className={`flex h-18 w-18 shrink-0 items-center justify-center self-start rounded-[1.4rem] bg-gradient-to-br ${tone.glow} text-2xl font-semibold text-white shadow-[0_22px_50px_-24px_rgba(15,23,42,0.55)]`}
        >
          {score}
        </div>
      </div>

      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/80">
        <div
          className={`h-full rounded-full ${tone.progress}`}
          style={{ width: `${Math.max(6, Math.min(100, score))}%` }}
        />
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
