import type { DictionaryEntry } from "@/types/dictionary";
import { safeExternalUrl } from "@/lib/utils";
import { SourceCredit } from "./source-credit";

export function WordEntry({ entry }: { entry: DictionaryEntry }) {
  return <div className="entry-grid">
    <article className="entry-card">
      <div className="border-b border-border pb-8"><span className="eyebrow">English dictionary</span><h1 className="word-heading">{entry.word}</h1></div>
      {entry.meanings.length === 0 && <p className="mt-8">No definitions are available for this entry yet.</p>}
      {entry.meanings.map((meaning, index) => <section key={index} aria-labelledby={`meaning-${index}`} className="meaning-section">
        <h2 id={`meaning-${index}`} className="pos-label">{meaning.part_of_speech || "Meaning"}</h2>
        {meaning.pronunciations.length > 0 ? <div className="mt-4 flex flex-wrap gap-3" aria-label="Pronunciation">
          {meaning.pronunciations.map((p, i) => <p key={i} className="pronunciation"><span className="mr-2 text-xs font-semibold uppercase tracking-wide">{p.notation}</span>{p.notation === "ipa" ? `/${p.text.replace(/^\/|\/$/g, "")}/` : p.text}</p>)}
        </div> : <p className="mt-4 text-sm text-muted-foreground">Pronunciation isn’t available for this entry yet.</p>}
        <ol className="sense-list">
          {meaning.senses.map((sense, i) => <li key={i}>
            <span className="sense-number" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              {sense.definitions.map((text, j) => <p className="definition" key={j}>{text}</p>)}
              {sense.examples.map((example, j) => <figure className="example" key={j}>
                <blockquote>{example.text}</blockquote>
                {(example.attribution || example.license) && <figcaption className="mt-2 text-xs not-italic text-muted-foreground">
                  {example.attribution}{example.attribution && example.license ? " · " : ""}
                  {safeExternalUrl(example.license_url) ? <a className="text-link" href={safeExternalUrl(example.license_url)} rel="noreferrer">{example.license || "Source terms"}</a> : example.license}
                </figcaption>}
              </figure>)}
            </div>
          </li>)}
        </ol>
        {meaning.senses.every((sense) => sense.examples.length === 0) && <p className="mt-5 text-sm text-muted-foreground">No example sentences are available for this meaning.</p>}
      </section>)}
    </article>
    <aside className="source-panel" aria-labelledby="source-title"><span className="eyebrow">Words with roots</span><h2 id="source-title" className="mt-3 mb-6 font-serif text-2xl">From the source</h2><SourceCredit source={entry.source} /><p className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">Every definition has a source. Explore the original dictionary for more context.</p></aside>
  </div>;
}
