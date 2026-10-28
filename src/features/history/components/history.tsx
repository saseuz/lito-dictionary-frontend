"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useHistoryQuery, useRemoveHistoryMutation } from "@/features/account/api/private-api";
import { AccountShell, AccountLinks, Protected, Failure, ConfirmButton, CursorPager } from "@/features/account/components/shared";
import { wordPath } from "@/features/dictionary/api/lookup";

function HistoryList() {
  const [cursor, setCursor] = useState<string>();
  const query = useHistoryQuery(cursor, { pollingInterval: 60_000, skipPollingIfUnfocused: true });
  const [remove] = useRemoveHistoryMutation();
  // Recheck server expiry while open; never keep an expired row visible between refreshes.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  return <><AccountLinks /><div className="account-card"><div className="flex flex-wrap items-center justify-between gap-4"><h2>Your recent discoveries</h2><ConfirmButton explanation="Clear your entire search history? Saved words and personal examples will stay." onConfirm={async () => { await remove().unwrap(); setCursor(undefined); }}>Clear history</ConfirmButton></div>
    {query.isFetching ? <p role="status">Opening your history…</p> : query.error ? <><Failure error={"message" in query.error ? query.error : undefined} /><Button onClick={() => query.refetch()}>Retry</Button></> : <ul className="private-list">{!query.data?.data.length && <li>No recent searches. Search while signed in with a verified email to start a trail of discoveries.</li>}{query.data?.data.filter((item) => new Date(item.expires_at).getTime() > now).map((item) => <li key={item.id} className="word-row"><div><Link prefetch={false} className="saved-word-title" href={wordPath(item.word)}>{item.word}</Link><p className="form-hint">{new Date(item.searched_at).toLocaleString()}</p></div><ConfirmButton explanation={`Remove this search for “${item.word}”?`} onConfirm={() => remove(item.id).unwrap()}>Remove</ConfirmButton></li>)}</ul>}
    <CursorPager meta={query.data?.meta} busy={query.isFetching} onChange={setCursor} />
  </div></>;
}
export function HistoryPage() { return <AccountShell title="Follow your curiosity." intro="Your submitted searches from the last 30 days. Older searches disappear automatically. You can remove them sooner, too."><Protected verified>{() => <HistoryList />}</Protected></AccountShell>; }
