import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { AccountError, apiRoot, privateRequest, safeReturnPath, verificationUrl, verifyEmail } from '../src/features/account/api/transport';
import { sessionApi } from '../src/features/account/api/session-api';
import { privateApi } from '../src/features/account/api/private-api';
import { makeStore } from '../src/store/store';
import { pageSchema, vocabularySchema } from '../src/types/account';

const originalFetch = globalThis.fetch;
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
const originalEnv = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
afterEach(() => {
 globalThis.fetch = originalFetch;
 if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument); else Reflect.deleteProperty(globalThis, 'document');
 if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_LARAVEL_API_URL; else process.env.NEXT_PUBLIC_LARAVEL_API_URL = originalEnv;
});
function setup() { process.env.NEXT_PUBLIC_LARAVEL_API_URL = 'http://localhost:8000/api/v1'; Object.defineProperty(globalThis, 'document', { configurable: true, value: { cookie: 'XSRF-TOKEN=a%2Fb%3D' } }); }

test('cookie mutations obtain CSRF, decode the readable cookie, and never follow redirects or cache', async () => {
 setup(); const calls: string[] = [];
 globalThis.fetch = async (url, init) => {
  calls.push(String(url)); assert.equal(init?.credentials, 'include'); assert.equal(init?.cache, 'no-store'); assert.equal(init?.redirect, 'error');
  if (String(url).endsWith('csrf-cookie')) return new Response(null, { status: 204 });
  assert.equal((init?.headers as Record<string,string>)['X-XSRF-TOKEN'], 'a/b='); assert.equal(init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(init?.body)), { word: 'hello' });
  return Response.json({ data: { id: 1 } });
 };
 await privateRequest('/me/vocabulary', 'POST', { word: 'hello' });
 assert.deepEqual(calls, ['http://localhost:8000/sanctum/csrf-cookie', 'http://localhost:8000/api/v1/me/vocabulary']);
});

test('a failed CSRF bootstrap sends no mutation; an expired mutation is not automatically replayed', async () => {
 setup(); let calls = 0;
 globalThis.fetch = async () => { calls++; return new Response(null, { status: 503 }); };
 await assert.rejects(privateRequest('/auth/login', 'POST', {}), AccountError); assert.equal(calls, 1);
 calls = 0;
 globalThis.fetch = async () => { calls++; return new Response(null, { status: calls === 1 ? 204 : 419 }); };
 await assert.rejects(privateRequest('/me/history', 'POST', {}), (error: unknown) => error instanceof AccountError && error.failure.status === 419);
 assert.equal(calls, 2);
});

test('private errors never expose server debug messages; validation retains field messages', async () => {
 setup(); globalThis.fetch = async () => Response.json({ message: 'secret password database host' }, { status: 500 });
 await assert.rejects(privateRequest('/me'), (e: unknown) => e instanceof AccountError && !e.message.includes('secret'));
 globalThis.fetch = async () => Response.json({ errors: { email: ['Enter a valid email.'] } }, { status: 422 });
 await assert.rejects(privateRequest('/me'), (e: unknown) => e instanceof AccountError && e.failure.errors?.email[0] === 'Enter a valid email.');
});

test('verification links cannot send cookies to another origin or arbitrary endpoint', async () => {
 setup(); const root = apiRoot(); const signed = `${root.href}/auth/email/verify/1/${'a'.repeat(40)}?expires=1&signature=test`;
 assert.equal(verificationUrl(signed, root).href, signed);
 for (const value of [signed.replace('localhost', 'evil.test'), signed.replace('/auth/email/verify/1/', '/me/'), 'javascript:alert(1)', signed + '#fragment', signed.replace('localhost', 'user:password@localhost')]) assert.throws(() => verificationUrl(value, root));
 let called = false; globalThis.fetch = async () => { called = true; return new Response(); };
 await assert.rejects(verifyEmail('https://evil.test/')); assert.equal(called, false);
});

test('return destinations stay in the website and preserve intended verification links', () => {
 for (const value of ['//evil.test', '/\\evil.test', 'https://evil.test', '/login', '/admin', '/\n/evil.test']) assert.equal(safeReturnPath(value), '/account');
 assert.equal(safeReturnPath('/verify-email?verification=encoded'), '/verify-email?verification=encoded');
 assert.equal(safeReturnPath('/dictionary/caf%C3%A9'), '/dictionary/caf%C3%A9');
});

test('private schemas reject missing cursor metadata and malformed owned records', () => {
 const schema = pageSchema(vocabularySchema);
 assert.equal(schema.safeParse({ data: [], meta: { next_cursor: null, prev_cursor: null } }).success, true);
 assert.equal(schema.safeParse({ data: [] }).success, false);
 assert.equal(schema.safeParse({ data: [{ id: 'admin-uuid', word: 'hello' }], meta: { next_cursor: null, prev_cursor: null } }).success, false);
});

test('guest session is ordinary state; private caches are isolated and explicitly erased', async () => {
 setup(); const first = makeStore(); const second = makeStore();
 globalThis.fetch = async () => new Response(null, { status: 401 });
 const session = first.dispatch(sessionApi.endpoints.me.initiate()); assert.equal(await session.unwrap(), null);
 globalThis.fetch = async () => Response.json({ data: [{ id: 1, word: 'private', language: 'en', created_at: '2026-10-18T00:00:00Z' }], meta: { next_cursor: null, prev_cursor: null } });
 const request = first.dispatch(privateApi.endpoints.vocabulary.initiate()); await request.unwrap();
 assert.equal(Object.keys(second.getState().privateApi.queries).length, 0);
 first.dispatch(privateApi.util.resetApiState()); assert.equal(Object.keys(first.getState().privateApi.queries).length, 0);
 session.unsubscribe(); request.unsubscribe(); first.dispatch(sessionApi.util.resetApiState());
});

test('session changes notify other tabs without reloading the sending tab', async () => {
 const priorWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
 const priorChannel = Object.getOwnPropertyDescriptor(globalThis, 'BroadcastChannel');
 const messages: unknown[] = []; const destinations: string[] = [];
 Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { assign: (path: string) => destinations.push(path) } } });
 Object.defineProperty(globalThis, 'BroadcastChannel', { configurable: true, value: class { postMessage(value: unknown) { messages.push(value); } close() {} } });
 try {
  const { sessionChanged, sessionSender } = await import('../src/features/account/api/transport');
  sessionChanged('/vocabulary');
  assert.deepEqual(messages, [{ type: 'changed', sender: sessionSender }]);
  assert.deepEqual(destinations, ['/vocabulary']);
 } finally {
  if (priorWindow) Object.defineProperty(globalThis, 'window', priorWindow); else Reflect.deleteProperty(globalThis, 'window');
  if (priorChannel) Object.defineProperty(globalThis, 'BroadcastChannel', priorChannel); else Reflect.deleteProperty(globalThis, 'BroadcastChannel');
 }
});

test('unsupported passkey browsers receive a password fallback without starting a ceremony', async () => {
 const { passkeyCeremony } = await import('../src/features/account/api/passkeys');
 let called = false; globalThis.fetch = async () => { called = true; return new Response(); };
 await assert.rejects(passkeyCeremony('login'), (e: unknown) => e instanceof AccountError && e.message.includes('password'));
 assert.equal(called, false);
});
