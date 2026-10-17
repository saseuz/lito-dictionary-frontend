export default function Loading() {
  return <div className="page-width py-16" role="status" aria-live="polite"><p className="eyebrow">Opening the dictionary…</p><div className="mt-10 space-y-5 motion-safe:animate-pulse" aria-hidden="true"><div className="h-14 w-2/5 rounded-xl bg-border" /><div className="h-80 rounded-3xl bg-secondary" /></div></div>;
}
