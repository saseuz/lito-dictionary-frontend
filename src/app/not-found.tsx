import Link from "next/link";
import { SearchForm } from "@/features/dictionary/components/search-form";
import { StoreProvider } from "@/store/provider";
export default function NotFound() {
  return <section className="page-width empty-page"><p className="eyebrow">A word still waiting to be found</p><h1>Let’s turn another page.</h1><p className="mb-10 mt-5 text-muted-foreground">We couldn’t find that word or page. Check the spelling, or let your curiosity lead somewhere new.</p><StoreProvider><SearchForm navigate /></StoreProvider><Link href="/" className="text-link mt-8 inline-block">Back to the dictionary</Link></section>;
}
