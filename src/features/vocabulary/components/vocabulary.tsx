"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { wordPath } from "@/features/dictionary/api/lookup";
import { useMeQuery } from "@/features/account/api/session-api";
import { useVocabularyQuery, useWordQuery, useSaveWordMutation, useRemoveWordMutation, useExamplesQuery, useWriteExampleMutation, useRemoveExampleMutation } from "@/features/account/api/private-api";
import { AccountShell, AccountLinks, ConfirmButton, CursorPager, Failure, Field, Protected, TaskFeedback, formValues, useTask } from "@/features/account/components/shared";
import type { Example } from "@/types/account";

export function SaveWord({ word }: { word: string }) {
  const me = useMeQuery();
  const [save, result] = useSaveWordMutation();
  return <div className="save-word">
    {!me.data ? <Link href={`/login?next=${encodeURIComponent(wordPath(word))}`} className="text-link">Sign in to save this word</Link> : !me.data.email_verified_at ? <Link href="/verify-email" className="text-link">Verify your email to save words</Link> : result.data ? <Link href={`/vocabulary/${result.data.data.id}`} className="text-link">Saved — add your own example →</Link> : <Button variant="outline" disabled={result.isLoading || me.isFetching} onClick={() => void save(word)}>{result.isLoading ? "Saving…" : "Save word"}</Button>}
    {result.error && <Failure error={"message" in result.error ? result.error : undefined} />}
  </div>;
}
function WordList() {
  const [cursor, setCursor] = useState<string>();
  const query = useVocabularyQuery(cursor);
  const [save] = useSaveWordMutation();
  const [remove] = useRemoveWordMutation();
  const task = useTask();
  return <><AccountLinks /><div className="account-card"><form className="bookmark-form" onSubmit={(event) => { const form = event.currentTarget; const values = formValues(event); void task.run(async () => { await save(String(values.word).trim()).unwrap(); form.reset(); setCursor(undefined); }, "Word saved. Open it to add your own example."); }}><Field label="Save a word" name="word" required maxLength={255} placeholder="A word to come back to…" /><Button disabled={task.busy}>Save word</Button></form><p className="form-hint">Save any word, even if a definition isn’t available yet. Your collection keeps the word and your own writing.</p><TaskFeedback task={task} /></div>
    <div className="account-card">{query.isFetching ? <p role="status">Opening your collection…</p> : query.error ? <><Failure error={"message" in query.error ? query.error : undefined} /><Button onClick={() => query.refetch()}>Try again</Button></> : <>
      {!query.data?.data.length && <div className="empty-collection"><h2>A little room for discovery.</h2><p>Your saved words will appear here. Add one above, or find something new in the dictionary.</p><Link className="text-link" href="/">Explore words</Link></div>}
      <ul className="private-list">{query.data?.data.map((word) => <li key={word.id} className="word-row"><div><Link className="saved-word-title" href={`/vocabulary/${word.id}`}>{word.word}</Link><p className="form-hint">Saved {new Date(word.created_at).toLocaleDateString()}</p></div><ConfirmButton explanation={`Remove “${word.word}” and all your examples for it?`} onConfirm={async () => { await remove(word.id).unwrap(); }}>Remove</ConfirmButton></li>)}</ul>
    </>}<CursorPager meta={query.data?.meta} onChange={setCursor} busy={query.isFetching} /></div>
  </>;
}
export function VocabularyPage() { return <AccountShell title="Words worth keeping." intro="A personal collection, one little discovery at a time."><Protected verified>{() => <WordList />}</Protected></AccountShell>; }

function ExampleEditor({ id, example, onDone }: { id: number; example?: Example; onDone?: () => void }) {
  const [write] = useWriteExampleMutation();
  const task = useTask();
  const fieldId = `example-${example?.id || "new"}`;
  return <form className="account-form" onSubmit={(event) => { const form = event.currentTarget; const values = formValues(event); void task.run(async () => { await write({ id, example: example?.id, text: String(values.text) }).unwrap(); form.reset(); onDone?.(); }, "Your example is saved."); }}><div className="account-field"><label htmlFor={fieldId}>{example ? "Edit your example" : "Write your own example"}</label><textarea id={fieldId} name="text" required maxLength={2000} rows={4} defaultValue={example?.text} placeholder="Use this word in a sentence that means something to you…" /></div><p className="form-hint">Your own words, up to 2,000 characters. Visible only to you.</p><TaskFeedback task={task} /><div className="flex gap-3"><Button disabled={task.busy}>{task.busy ? "Saving…" : "Save example"}</Button>{onDone && <Button type="button" variant="ghost" disabled={task.busy} onClick={onDone}>Cancel</Button>}</div></form>;
}
function ExampleItem({ id, example }: { id: number; example: Example }) {
  const [editing, setEditing] = useState(false);
  const [remove] = useRemoveExampleMutation();
  return <li>{editing ? <ExampleEditor id={id} example={example} onDone={() => setEditing(false)} /> : <><p className="personal-example">{example.text}</p><div className="flex flex-wrap gap-3 mt-4"><Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button><ConfirmButton explanation="Permanently remove this personal example?" onConfirm={() => remove({ id, example: example.id }).unwrap()}>Remove</ConfirmButton></div></>}</li>;
}
function Examples({ id }: { id: number }) {
  const [cursor, setCursor] = useState<string>();
  const query = useExamplesQuery({ id, cursor });
  return <section className="account-card"><h2>In your own words</h2><ExampleEditor id={id} />{query.isFetching ? <p role="status">Loading your examples…</p> : query.error ? <><Failure error={"message" in query.error ? query.error : undefined} /><Button onClick={() => query.refetch()}>Retry</Button></> : <ul className="private-list mt-6">{!query.data?.data.length && <li>No examples on this page yet.</li>}{query.data?.data.map((example) => <ExampleItem key={example.id} id={id} example={example} />)}</ul>}<CursorPager meta={query.data?.meta} onChange={setCursor} busy={query.isFetching} /></section>;
}
function SavedWord({ id }: { id: number }) {
  const query = useWordQuery(id);
  const [remove] = useRemoveWordMutation();
  const router = useRouter();
  return <><AccountLinks />{query.isFetching ? <p role="status">Opening your word…</p> : query.error ? <div className="account-card"><Failure error={"message" in query.error ? query.error : undefined} /><Button onClick={() => query.refetch()}>Try again</Button><p><Link href="/vocabulary" className="text-link">Back to saved words</Link></p></div> : query.data && <><section className="account-card"><h2 className="saved-word-title">{query.data.data.word}</h2><p>Look up the latest definition in the public dictionary. Availability can change; your word and personal examples stay in your collection.</p><div className="flex flex-wrap items-center gap-5"><Link prefetch={false} className="text-link" href={wordPath(query.data.data.word)}>Open dictionary entry →</Link><ConfirmButton explanation="Remove this word and all its personal examples?" onConfirm={async () => { await remove(id).unwrap(); router.replace("/vocabulary"); }}>Remove word</ConfirmButton></div></section><Examples id={id} /></> }</>;
}
export function SavedWordPage({ id }: { id: number }) { return <AccountShell title="A word of your own."><Protected verified>{() => <SavedWord id={id} />}</Protected></AccountShell>; }
