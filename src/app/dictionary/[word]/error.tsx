"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="page-width py-20"><div className="feedback-card" role="alert"><h1 className="font-serif text-3xl">Something interrupted this discovery.</h1><p className="my-5">Please try opening the word again.</p><Button onClick={reset}>Try again</Button></div></div>;
}
