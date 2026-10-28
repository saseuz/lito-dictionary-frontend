import { Suspense } from "react";
import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p role="status" className="page-width py-12">Opening your account…</p>}>{children}</Suspense>;
}
