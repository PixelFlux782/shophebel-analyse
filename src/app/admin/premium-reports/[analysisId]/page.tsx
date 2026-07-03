import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PremiumReportSection } from "@/components/results/premium-report-section";
import { isAdminHeaders } from "@/lib/adminAuth";
import { getAnalysisResult } from "@/lib/analysisStore";
import {
  EMPTY_CONSULTANT_NOTES,
  hasAnyConsultantNotes,
  normalizeConsultantNotes,
} from "@/lib/premium/consultantNotes";
import {
  getPremiumReportRecordByAnalysisId,
  saveConsultantNotesForAnalysis,
} from "@/lib/premium/premiumReportStore";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface AdminPremiumReportPageProps {
  params: Promise<{
    analysisId: string;
  }>;
  searchParams: Promise<{
    saved?: string;
  }>;
}

async function saveConsultantNotesAction(analysisId: string, formData: FormData) {
  "use server";

  if (!isAdminHeaders(await headers())) {
    throw new Error("Admin-Zugriff nicht autorisiert.");
  }

  const consultantNotes = normalizeConsultantNotes({
    executiveComment: formData.get("executiveComment"),
    priorityOverrideNotes: formData.get("priorityOverrideNotes"),
    customActionItems: formData.get("customActionItems"),
    upsellRecommendation: formData.get("upsellRecommendation"),
    internalNotes: formData.get("internalNotes"),
  });

  await saveConsultantNotesForAnalysis({
    analysisId,
    consultantNotes,
  });

  revalidatePath(`/admin/premium-reports/${analysisId}`);
  redirect(`/admin/premium-reports/${analysisId}?saved=1`);
}

export default async function AdminPremiumReportPage({
  params,
  searchParams,
}: AdminPremiumReportPageProps) {
  if (!isAdminHeaders(await headers())) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Admin</p>
          <h1 className="mt-3 text-3xl font-bold">Zugriff geschuetzt</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Öffne diese Seite mit `Authorization: Bearer ADMIN_API_TOKEN` oder `x-admin-token`.
            Ohne gesetztes `ADMIN_API_TOKEN` werden keine Premium-Daten geladen.
          </p>
        </div>
      </main>
    );
  }

  const { analysisId } = await params;
  const { saved } = await searchParams;
  const analysis = await getAnalysisResult(analysisId);

  if (!analysis) {
    notFound();
  }

  const premiumReport = await getPremiumReportRecordByAnalysisId(analysisId);

  if (!premiumReport) {
    notFound();
  }

  const notes = {
    ...EMPTY_CONSULTANT_NOTES,
    ...premiumReport.consultantNotes,
  };
  const statusLabel = hasAnyConsultantNotes(notes) || premiumReport.status === "refined"
    ? "veredelt"
    : "automatisch";
  const saveAction = saveConsultantNotesAction.bind(null, analysisId);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-200 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="min-w-0">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Admin Premium Report</p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Report veredeln</h1>
                <p className="mt-2 max-w-3xl break-all text-sm leading-7 text-slate-300">
                  {analysis.analysis.url}
                </p>
              </div>
              <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-100">
                Einschätzung: {statusLabel}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/analyse/result/${analysisId}`}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:border-cyan-300/50"
              >
                Kundenansicht
              </Link>
              <Link
                href={`/api/premium-report/${analysisId}/pdf`}
                className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
              >
                PDF prüfen
              </Link>
            </div>
            {saved ? (
              <p className="mt-5 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">
                Consultant Notes gespeichert.
              </p>
            ) : null}
          </div>

          <div className="mt-8">
            <PremiumReportSection report={premiumReport.report} />
          </div>
        </section>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <form action={saveAction} className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-2xl">
            <h2 className="text-xl font-bold">Consultant-Kommentare</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Kundenkommentare erscheinen im PDF. Interne Notizen bleiben nur hier.
            </p>

            <label className="mt-5 block text-sm font-bold" htmlFor="executiveComment">
              Management-Kommentar
            </label>
            <textarea
              id="executiveComment"
              name="executiveComment"
              defaultValue={notes.executiveComment}
              rows={5}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <label className="mt-4 block text-sm font-bold" htmlFor="priorityOverrideNotes">
              Priority Override Notes
            </label>
            <textarea
              id="priorityOverrideNotes"
              name="priorityOverrideNotes"
              defaultValue={notes.priorityOverrideNotes}
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <label className="mt-4 block text-sm font-bold" htmlFor="customActionItems">
              Custom Action Items
            </label>
            <textarea
              id="customActionItems"
              name="customActionItems"
              defaultValue={notes.customActionItems?.join("\n")}
              rows={5}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <label className="mt-4 block text-sm font-bold" htmlFor="upsellRecommendation">
              Upsell Recommendation
            </label>
            <textarea
              id="upsellRecommendation"
              name="upsellRecommendation"
              defaultValue={notes.upsellRecommendation}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <label className="mt-4 block text-sm font-bold" htmlFor="internalNotes">
              Internal Notes
            </label>
            <textarea
              id="internalNotes"
              name="internalNotes"
              defaultValue={notes.internalNotes}
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Speichern
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
