import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Lito Dictionary — A world of words", template: "%s | Lito Dictionary" },
  description: "Let curiosity lead. Explore English words, definitions, pronunciation, and examples with Lito Dictionary.",
  icons: { icon: "/branding/lito-bird.png" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><a href="#main-content" className="skip-link">Skip to content</a><SiteHeader /><main id="main-content" className="flex-1">{children}</main><SiteFooter /></body></html>;
}
