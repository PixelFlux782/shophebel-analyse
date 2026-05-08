import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}
