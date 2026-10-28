"use client";
import { useId, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMeQuery } from "../api/session-api";
import { failureOf } from "../api/transport";
import type { ApiFailure, User } from "@/types/account";

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return <div className="account-field"><label htmlFor={id}>{label}</label><Input id={id} className="h-11 bg-white text-base" {...props} /></div>;
}
export function Failure({ error: raw }: { error?: unknown }) {
  if (!raw) return null;
  const error = failureOf(raw);
  return <div role="alert" className="form-error"><p>{error.message}</p>{error.errors && <ul>{Object.entries(error.errors).flatMap(([field, messages]) => messages.map((message, i) => <li key={`${field}-${i}`}>{message}</li>))}</ul>}</div>;
}
export function useTask() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [message, setMessage] = useState("");
  async function run(action: () => Promise<unknown>, success = "") {
    if (busy) return false;
    setBusy(true); setError(null); setMessage("");
    try { await action(); setMessage(success); return true; }
    catch (error) { setError(failureOf(error)); return false; }
    finally { setBusy(false); }
  }
  return { busy, error, message, run };
}
export function TaskFeedback({ task }: { task: ReturnType<typeof useTask> }) {
  return <><Failure error={task.error} />{task.message && <p role="status" className="form-success">{task.message}</p>}</>;
}
export function AccountShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return <div className="page-width account-page"><div className="account-heading"><span className="eyebrow">Your little world of words</span><h1>{title}</h1>{intro && <p>{intro}</p>}</div>{children}</div>;
}
export function AccountLinks() {
  const pathname = usePathname();
  return <nav aria-label="Your account" className="account-tabs">{[["/vocabulary", "Saved words"], ["/history", "Search history"], ["/account", "Account & security"]].map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>;
}
export function Protected({ children, verified = false }: { children: (user: User) => ReactNode; verified?: boolean }) {
  const me = useMeQuery();
  const pathname = usePathname();
  const search = useSearchParams();
  if (me.isFetching && !me.data) return <p role="status" className="account-card">Checking your session…</p>;
  if (me.error) return <div className="account-card"><Failure error={"message" in me.error ? me.error : undefined} /><Button onClick={() => me.refetch()}>Try again</Button></div>;
  if (!me.data) return <div className="account-card"><h2>Make yourself at home.</h2><p>Sign in to keep your words and examples together.</p><Link className="text-link" href={`/login?next=${encodeURIComponent(pathname + (search.size ? `?${search}` : ""))}`}>Sign in</Link></div>;
  if (verified && !me.data.email_verified_at) return <div className="account-card"><h2>One more little step</h2><p>Verify your email to save words, write examples, and keep a search history.</p><Link className="text-link" href="/verify-email">Verify email</Link></div>;
  // Hide stale private content during session checks, preserving unfinished forms.
  return <>{me.isFetching && <p role="status">Checking your session…</p>}<div key={me.data.id} hidden={me.isFetching}>{children(me.data)}</div></>;
}
export function CursorPager({ meta, onChange, busy }: { meta?: { next_cursor: string | null; prev_cursor: string | null }; onChange: (cursor: string | undefined) => void; busy: boolean }) {
  if (!meta || (!meta.next_cursor && !meta.prev_cursor)) return null;
  return <nav aria-label="List pages" className="flex gap-3 mt-6"><Button variant="outline" disabled={busy || !meta.prev_cursor} onClick={() => onChange(meta.prev_cursor || undefined)}>Previous</Button><Button variant="outline" disabled={busy || !meta.next_cursor} onClick={() => onChange(meta.next_cursor || undefined)}>Next</Button></nav>;
}
export function ConfirmButton({ children, explanation, onConfirm, disabled = false }: { children: ReactNode; explanation: string; onConfirm: () => Promise<unknown>; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const task = useTask();
  if (!confirming) return <Button type="button" variant="outline" disabled={disabled} onClick={() => setConfirming(true)}>{children}</Button>;
  return <div className="confirm-box"><p>{explanation}</p><div className="flex flex-wrap gap-3"><Button type="button" variant="destructive" disabled={task.busy} onClick={() => void task.run(onConfirm).then((ok) => { if (ok) setConfirming(false); })}>{task.busy ? "Working…" : "Confirm"}</Button><Button type="button" variant="ghost" disabled={task.busy} onClick={() => setConfirming(false)}>Cancel</Button></div><TaskFeedback task={task} /></div>;
}
export function formValues(event: FormEvent<HTMLFormElement>) { event.preventDefault(); return Object.fromEntries(new FormData(event.currentTarget)); }
