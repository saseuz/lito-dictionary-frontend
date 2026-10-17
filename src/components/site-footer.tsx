import Link from "next/link";
import { BookOpen } from "lucide-react";

export function SiteFooter() {
  return <footer className="site-footer"><div className="page-width flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><p className="flex items-center gap-2 text-sm"><BookOpen size={17} aria-hidden="true" /> A little word. A new possibility.</p><div className="flex gap-6 text-xs"><span>Lito Dictionary</span><Link className="text-link" href="/sources">Sources & attribution</Link></div></div></footer>;
}
