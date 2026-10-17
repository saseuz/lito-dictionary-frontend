import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { lookupWord, lookupUrl, wordPath } from "../src/features/dictionary/api/lookup";
import { lookupResponseSchema } from "../src/types/dictionary";
import { safeExternalUrl } from "../src/lib/utils";
import { makeStore } from "../src/store/store";
import { dictionaryApi } from "../src/features/dictionary/api/dictionary-api";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const fixture = { data: {
  word: "hello", language: "en", origin: "provider",
  meanings: [{ part_of_speech: "interjection", senses: [{ definitions: ["An original test greeting."], examples: [{ text: "Hello, Mira!", attribution: "Lito test", license: "CC0-1.0", license_url: null }] }], pronunciations: [{ text: "həˈloʊ", notation: "ipa", audio_url: null }] }],
  source: { name: "Lito test", url: "https://example.test", attribution: "Original test content", license: "CC0-1.0", license_url: "https://creativecommons.org/publicdomain/zero/1.0/" },
} };

test("the boundary validates every nested field and tolerates additive fields", () => {
  assert.equal(lookupResponseSchema.safeParse(fixture).success, true);
  assert.equal(lookupResponseSchema.safeParse({ data: { ...fixture.data, extra: true } }).success, true);
  for (const meanings of [[{}], [{ ...fixture.data.meanings[0], senses: [{}] }], [{ ...fixture.data.meanings[0], pronunciations: [null] }]]) {
    assert.equal(lookupResponseSchema.safeParse({ data: { ...fixture.data, meanings } }).success, false);
  }
});

test("queries preserve Unicode and encode reserved characters without changing lookup semantics", () => {
  const word = "café / a?b#c&d";
  const url = lookupUrl("https://example.test/api/v1/", word);
  assert.equal(url.pathname, "/api/v1/dictionary/lookup");
  assert.equal(url.searchParams.get("word"), word);
  assert.equal(url.searchParams.get("language"), "en");
  assert.equal(wordPath(word), `/dictionary/${encodeURIComponent(word)}`);
});

test("successful requests omit cookies, never use HTTP caches, and validate JSON", async () => {
  globalThis.fetch = async (_url, init) => {
    assert.equal(init?.cache, "no-store"); assert.equal(init?.credentials, "omit");
    assert.deepEqual(init?.headers, { Accept: "application/json" });
    return Response.json(fixture);
  };
  assert.deepEqual(await lookupWord("hello", "https://example.test/api/v1"), { data: fixture.data });
});

for (const status of [404, 422, 429, 503]) {
  test(`HTTP ${status} becomes safe actionable feedback`, async () => {
    globalThis.fetch = async () => new Response("private upstream details", { status });
    const result = await lookupWord("hello", "https://example.test/api/v1");
    assert.equal(result.error?.status, status);
    assert.ok(result.error?.message);
    assert.equal(result.error?.message.includes("private"), false);
  });
}

test("network failures, malformed JSON and malformed nested payloads fail safely", async () => {
  for (const response of [() => { throw new Error("secret host"); }, () => new Response("not JSON"), () => Response.json({ data: { ...fixture.data, meanings: [{}] } })]) {
    globalThis.fetch = async () => response();
    const result = await lookupWord("hello", "https://example.test/api/v1");
    assert.ok(result.error);
    assert.equal(result.error.message.includes("secret"), false);
  }
});

test("missing configuration never starts a request", async () => {
  globalThis.fetch = async () => { throw new Error("should not run"); };
  assert.match((await lookupWord("hello", undefined)).error!.message, /not configured/);
});

test("source links reject executable URLs and embedded credentials", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,hello", "https://user:pass@example.test", "invalid", null]) assert.equal(safeExternalUrl(value), undefined);
  assert.equal(safeExternalUrl("https://example.test"), "https://example.test/");
});

test("Redux stores are isolated and query state is not persisted", async () => {
  const first = makeStore(); const second = makeStore();
  globalThis.fetch = async () => Response.json(fixture);
  const prior = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
  process.env.NEXT_PUBLIC_LARAVEL_API_URL = "https://example.test/api/v1";
  try {
    const request = first.dispatch(dictionaryApi.endpoints.lookup.initiate("hello"));
    assert.deepEqual(await request.unwrap(), fixture.data);
    assert.equal(Object.keys(second.getState().dictionaryApi.queries).length, 0);
    request.unsubscribe();
    first.dispatch(dictionaryApi.util.resetApiState());
    assert.equal(Object.keys(first.getState().dictionaryApi.queries).length, 0);
  } finally {
    if (prior === undefined) delete process.env.NEXT_PUBLIC_LARAVEL_API_URL;
    else process.env.NEXT_PUBLIC_LARAVEL_API_URL = prior;
  }
});
