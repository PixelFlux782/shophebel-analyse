import { AnalyseDashboardEntry } from "@/components/analyse/analyse-dashboard-entry";

interface AnalysePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AnalysePage({ searchParams }: AnalysePageProps) {
  const params = await searchParams;
  const initialUrl = firstParam(params.url) ?? "";
  const planParam = firstParam(params.plan);
  const initialPlan = planParam === "full" || planParam === "premium" ? planParam : undefined;

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950">
      <AnalyseDashboardEntry initialUrl={initialUrl} initialPlan={initialPlan} />
    </main>
  );
}
