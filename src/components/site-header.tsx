import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SiteHeader() {
  return <header className="site-header"><div className="page-width flex items-center justify-between gap-4">
    <Link href="/" aria-label="Lito Dictionary home" className="shrink-0"><Image src="/branding/lito-wide.png" alt="Lito Dictionary" width={2172} height={724} className="brand-logo" priority /></Link>
    <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm font-semibold"><Link href="/#search" className="nav-link">Dictionary</Link><Link href="/sources" className="nav-link hidden items-center gap-1 sm:flex">Our sources <ArrowUpRight size={15} aria-hidden="true" /></Link></nav>
  </div></header>;
}
