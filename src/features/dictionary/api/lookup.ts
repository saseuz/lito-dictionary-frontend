import { lookupResponseSchema, type LookupResult } from "@/types/dictionary";

export function lookupUrl(baseUrl: string | undefined, word: string): URL {
  if (!baseUrl) throw new Error("Missing Laravel API URL");
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/dictionary/lookup`);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.hash || url.search) {
    throw new Error("Invalid Laravel API URL");
  }
  url.search = new URLSearchParams({ word, language: "en" }).toString();
  return url;
}

export function lookupMessage(status: number): string {
  switch (status) {
    case 404: return "We couldn’t find that word. Check the spelling or try another word.";
    case 422: return "Enter an English word or phrase of 1–255 characters, without control characters.";
    case 429: return "A few too many lookups. Please wait a minute and try again.";
    default: return "The dictionary is taking a little break. Please try again shortly.";
  }
}

export async function lookupWord(word: string, baseUrl: string | undefined, signal?: AbortSignal): Promise<LookupResult> {
  let url: URL;
  try { url = lookupUrl(baseUrl, word); }
  catch { return { error: { status: 503, message: "Dictionary connection is not configured yet. Please try again later." } }; }
  try {
    const timeout = AbortSignal.timeout(8000);
    const response = await fetch(url, {
      headers: { Accept: "application/json" }, cache: "no-store", credentials: "omit",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!response.ok) return { error: { status: response.status, message: lookupMessage(response.status) } };
    const parsed = lookupResponseSchema.safeParse(await response.json());
    if (!parsed.success) return { error: { status: 502, message: lookupMessage(502) } };
    return { data: parsed.data.data };
  } catch {
    return { error: { status: 503, message: lookupMessage(503) } };
  }
}

export function wordPath(word: string): string { return `/dictionary/${encodeURIComponent(word)}`; }
