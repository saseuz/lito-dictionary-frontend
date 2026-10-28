"use client";
import { useId, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLazyLookupQuery } from "../api/dictionary-api";
import { wordPath } from "../api/lookup";
import { SourceCredit } from "./source-credit";
import { useMeQuery } from "@/features/account/api/session-api";
import { useRecordSearchMutation } from "@/features/account/api/private-api";
import { SaveWord } from "@/features/vocabulary/components/vocabulary";

export function SearchForm({ initialWord = "", navigate = false }: { initialWord?: string; navigate?: boolean }) {
  const id = useId();
  const router = useRouter();
  const [word, setWord] = useState(initialWord);
  const [validation, setValidation] = useState("");
  const [pending, startTransition] = useTransition();
  const [lookup, result] = useLazyLookupQuery();
  const me = useMeQuery();
  const [recordSearch, history] = useRecordSearchMutation();
  const busy = pending || result.isFetching;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = word.trim();
    if (!value) { setValidation("Enter a word to begin exploring."); return; }
    setValidation("");
    // Only deliberate submissions in a known verified session. No anonymous replay.
    if (me.data?.email_verified_at && !me.isFetching) void recordSearch({ word: value, client_event_id: crypto.randomUUID() });
    if (navigate) startTransition(() => router.push(wordPath(value)));
    else void lookup(value, false);
  }
  const error = result.error && "message" in result.error ? result.error.message : undefined;
  return <div className="search-area">
    <form onSubmit={submit} role="search" aria-label="Dictionary search">
      <label htmlFor={id} className="search-label">What word are you curious about?</label>
      <div className="search-box">
        <Search size={22} aria-hidden="true" className="search-icon" />
        <Input id={id} name="word" value={word} onChange={(event) => { setWord(event.target.value); setValidation(""); }}
          maxLength={255} required autoComplete="off" autoCapitalize="none" spellCheck={false}
          placeholder="Search an English word…" aria-invalid={Boolean(validation)} aria-describedby={`${id}-help`}
          className="h-14 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 md:text-base" />
        <Button type="submit" disabled={busy} className="h-12 rounded-xl px-5 text-base">
          {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Search aria-hidden="true" />}
          <span className="hidden sm:inline">Search</span><span className="sr-only sm:hidden">Search dictionary</span>
        </Button>
      </div>
      <p id={`${id}-help`} className="mt-3 text-sm text-muted-foreground">{validation || "English words, clear meanings. One little discovery at a time."}</p>
    </form>
    <div aria-live="polite" aria-atomic="true" aria-busy={busy}>
      {busy && <p role="status" className="mt-6 text-sm">Opening the dictionary…</p>}
      {history.isError && <p role="status" className="mt-4 text-sm">Your search can continue, but we couldn’t save it to history.</p>}
      {!busy && error && <div className="feedback-card mt-6" role="alert"><p>{error}</p><p className="mt-2 text-sm">You can edit your search and try again.</p></div>}
      {!busy && result.currentData && <article className="search-result mt-6">
        <span className="eyebrow">A word worth discovering</span>
        <h2 className="mt-3 font-serif text-3xl font-semibold break-words">{result.currentData.word}</h2>
        <p className="mt-2 text-sm italic text-muted-foreground">{result.currentData.meanings.map((m) => m.part_of_speech).filter((p, i, all) => all.indexOf(p) === i).join(" · ")}</p>
        <p className="my-5 leading-relaxed">{result.currentData.meanings[0]?.senses[0]?.definitions[0] || "Open this entry to explore its meanings."}</p>
        <Link prefetch={false} href={wordPath(result.originalArgs || result.currentData.word)} className="inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">Explore this word <ArrowRight size={18} aria-hidden="true" /></Link>
        <div className="mt-6 border-t border-border pt-5"><SourceCredit source={result.currentData.source} /></div>
      </article>}
      {!busy && result.originalArgs && <SaveWord key={result.originalArgs} word={result.originalArgs} />}
    </div>
  </div>;
}
