export function ScreenshotFallback() {
  return (
    <div className="rounded-[1.45rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-600">
      <p className="font-semibold text-slate-950">Screenshot nicht geladen</p>
      <p className="mt-2">
        Die Analyse ist vorhanden, aber die visuelle Vorschau konnte nicht angezeigt werden.
      </p>
    </div>
  );
}
