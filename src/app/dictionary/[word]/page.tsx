import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWord } from "@/features/dictionary/api/server";
import { WordEntry } from "@/features/dictionary/components/word-entry";
import { SearchForm } from "@/features/dictionary/components/search-form";
import { StoreProvider } from "@/store/provider";
import { RetryButton } from "@/features/dictionary/components/retry-button";

type Props = { params: Promise<{ word: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { word } = await params;
  const result = await getWord(word);
  return { title: `${word} — meaning & examples`, description: `Explore the meaning, pronunciation and examples of ${word} in Lito Dictionary.`, ...(result.error ? { robots: { index: false, follow: true } } : {}) };
}
export default async function WordPage({ params }: Props) {
  const { word } = await params;
  const result = await getWord(word);
  if (result.error?.status === 404) notFound();
  return <div className="page-width detail-page">
    <nav aria-label="Breadcrumb" className="breadcrumb"><Link href="/">Dictionary</Link><span aria-hidden="true">/</span><span className="break-all" aria-current="page">{word}</span></nav>
    <div className="detail-search"><StoreProvider><SearchForm key={word} initialWord={word} navigate /></StoreProvider></div>
    {result.error ? <section className="feedback-card my-10" role="alert"><p className="eyebrow">{result.error.status === 429 ? "A moment to pause" : "We couldn’t open this word"}</p><h1 className="mt-4 font-serif text-3xl">{result.error.status === 422 ? "Let’s try another search." : "A little pause in your discovery."}</h1><p className="my-5">{result.error.message}</p><RetryButton /></section> : <WordEntry entry={result.data} />}
  </div>;
}
