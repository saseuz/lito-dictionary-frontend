import { z } from "zod";
import type { ApiFailure } from "@/types/account";

export class AccountError extends Error {
  constructor(public failure: ApiFailure) { super(failure.message); }
}
export function apiRoot(value = process.env.NEXT_PUBLIC_LARAVEL_API_URL): URL {
  try {
    const url = new URL(value || "");
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
    url.pathname = url.pathname.replace(/\/$/, "");
    return url;
  } catch { throw new AccountError({ status: 0, message: "Account services are not configured. Please try again later." }); }
}
export function safeReturnPath(value: string | null): string {
  if (!value || !/^\/(?!\/)/.test(value) || /[\\\x00-\x20]/.test(value)) return "/account";
  const path = value.split(/[?#]/)[0];
  return ["/account", "/vocabulary", "/history", "/verify-email", "/"].includes(path) || /^\/(dictionary|vocabulary)\/[^/]+$/.test(path) ? value : "/account";
}
export function verificationUrl(value: string, root = apiRoot()): URL {
  const url = new URL(value);
  if (url.origin !== root.origin || url.username || url.password || url.hash ||
    !new RegExp(`^${root.pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/auth/email/verify/[0-9]+/[a-f0-9]{40}$`).test(url.pathname) ||
    !url.searchParams.has("signature") || !url.searchParams.has("expires")) {
    throw new AccountError({ status: 422, message: "This verification link is invalid. Request a new email below." });
  }
  return url;
}
export function failureOf(error: unknown): ApiFailure {
  const failure = z.object({ status: z.number(), message: z.string(), errors: z.record(z.string(), z.array(z.string())).optional() }).safeParse(error);
  if (failure.success) return failure.data;
  return error instanceof AccountError ? error.failure : { status: 0, message: "We couldn’t reach your account. Check your connection and try again." };
}
const errorBody = z.object({ errors: z.record(z.string(), z.array(z.string())).optional() });
async function checkedFetch(url: URL, init: RequestInit): Promise<Response> {
  let response: Response;
  try { response = await fetch(url, { ...init, credentials: "include", cache: "no-store", redirect: "error", signal: init.signal ?? AbortSignal.timeout(20_000) }); }
  catch { throw new AccountError(failureOf(null)); }
  if (!response.ok) {
    const body = errorBody.safeParse(await response.json().catch(() => null));
    const messages: Record<number, string> = {
      401: "Your session has ended. Please sign in again.",
      403: "This action needs a verified email or recent authentication. Check your account and confirm your identity, then try again.",
      404: "This item is no longer available.", 409: "This request conflicts with an existing item. Refresh and try again.",
      419: "Your security session has expired. Please try the action again.",
      422: "Please check the information below.", 429: "Too many attempts. Please wait a minute before trying again.",
    };
    throw new AccountError({ status: response.status, message: messages[response.status] || "Account services are temporarily unavailable. Please try again later.", errors: body.success && response.status === 422 ? body.data.errors : undefined });
  }
  return response;
}
export async function privateRequest(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<unknown> {
  const root = apiRoot();
  if (!path.startsWith("/") || path.startsWith("//") || /[\\#]/.test(path)) throw new AccountError({ status: 0, message: "Invalid account request." });
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET") {
    await checkedFetch(new URL("/sanctum/csrf-cookie", root), { headers, signal });
    const cookie = document.cookie.split("; ").find((item) => item.startsWith("XSRF-TOKEN="));
    if (!cookie) throw new AccountError({ status: 419, message: "Cookies are required to sign in. Use localhost consistently and enable cookies for this site." });
    headers["X-XSRF-TOKEN"] = decodeURIComponent(cookie.slice("XSRF-TOKEN=".length));
    headers["Content-Type"] = "application/json";
  }
  const response = await checkedFetch(new URL(root.href + path), { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal });
  return response.status === 204 ? null : response.json();
}
export async function verifyEmail(value: string): Promise<void> {
  try { await checkedFetch(verificationUrl(value), { headers: { Accept: "application/json" } }); }
  catch (error) {
    if (failureOf(error).status === 403) throw new AccountError({ status: 403, message: "This link has expired or belongs to another account. Check the signed-in email, or request a new link." });
    throw error;
  }
}
// Full navigation destroys every in-memory private cache. No identity or credential is persisted.
export const sessionSender = typeof window === "undefined" ? "server" : crypto.randomUUID();
export function sessionChanged(destination: string): void {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("lito-session");
    channel.postMessage({ type: "changed", sender: sessionSender }); channel.close();
  }
  window.location.assign(safeReturnPath(destination));
}
