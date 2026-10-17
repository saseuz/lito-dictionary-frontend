import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, MessageCircle, Sprout } from "lucide-react";
import { SearchForm } from "@/features/dictionary/components/search-form";
import { StoreProvider } from "@/store/provider";

export default function Home() {
  return <>
    <section className="page-width hero" aria-labelledby="hero-title">
      <div className="hero-copy"><p className="eyebrow"><span className="little-dot" /> For the wonderfully curious</p><h1 id="hero-title">A little curiosity.<br /><span>A world of words.</span></h1><p className="hero-description">Big ideas begin with little words. Find their meaning, see them in context, and make a new discovery with Lito.</p>
        <div id="search" className="scroll-mt-6"><StoreProvider><SearchForm /></StoreProvider></div>
        <div className="starter-words"><span>Start with a little wonder</span>{["hello", "curiosity", "wander"].map((word) => <Link href={`/dictionary/${word}`} prefetch={false} key={word}>{word}<ArrowUpRight size={13} aria-hidden="true" /></Link>)}</div>
      </div>
      <div className="hero-art"><div className="art-sun" aria-hidden="true" /><span className="art-spark spark-one" aria-hidden="true">✦</span><Image src="/branding/lito-bird.png" alt="Lito, a cheerful green bird exploring a book" width={1254} height={1254} priority sizes="(max-width: 800px) 80vw, 440px" /><div className="art-note"><span aria-hidden="true">✦</span> Your next discovery is a word away.</div><span className="art-spark spark-two" aria-hidden="true">✧</span></div>
    </section>
    <section className="discovery-strip"><div className="page-width"><div className="strip-heading"><p className="eyebrow">Small discoveries, every day</p><h2>A friendly place for your next “aha.”</h2></div><div className="feature-grid">
      <div><span className="feature-icon"><BookOpen aria-hidden="true" /></span><h3>Find the meaning</h3><p>Explore definitions and parts of speech, all in one clear place.</p></div>
      <div><span className="feature-icon yellow"><MessageCircle aria-hidden="true" /></span><h3>See words in the wild</h3><p>Discover pronunciation and example sentences when available.</p></div>
      <div><span className="feature-icon"><Sprout aria-hidden="true" /></span><h3>Follow your curiosity</h3><p>From a familiar hello to something entirely new. Start anywhere.</p></div>
    </div></div></section>
  </>;
}
