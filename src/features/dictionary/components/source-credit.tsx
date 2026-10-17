import Image from "next/image";
import type { DictionaryEntry } from "@/types/dictionary";
import { safeExternalUrl } from "@/lib/utils";

export function SourceCredit({ source }: { source: DictionaryEntry["source"] }) {
  const url = safeExternalUrl(source.url);
  const licenseUrl = safeExternalUrl(source.license_url);
  return <div className="source-credit">
    {source.name.startsWith("Merriam-Webster") && <Image src="/branding/merriam-webster.png" alt="Merriam-Webster" width={50} height={50} unoptimized />}
    <div><p className="font-semibold">{url ? <a href={url} rel="noreferrer" className="text-link">{source.name}</a> : source.name}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{source.attribution}</p>
      <p className="mt-2 text-xs">{licenseUrl ? <a href={licenseUrl} rel="noreferrer" className="text-link">{source.license}</a> : source.license}</p>
    </div>
  </div>;
}
