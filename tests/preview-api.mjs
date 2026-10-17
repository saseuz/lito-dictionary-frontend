// Disposable, original CC0 fixture. Run only for local UI checks; never a production fallback.
import { createServer } from 'node:http';
const data = {
  word: 'hello', language: 'en', origin: 'provider',
  meanings: [{ part_of_speech: 'interjection', pronunciations: [{ text: 'həˈloʊ', notation: 'ipa', audio_url: null }],
    senses: [{ definitions: ['A friendly word used to greet someone or begin a conversation.'], examples: [{ text: 'Hello, Mira! Shall we read together?', attribution: 'Lito demo dictionary', license: 'CC0-1.0', license_url: 'https://creativecommons.org/publicdomain/zero/1.0/' }] }] }],
  source: { name: 'Lito demo dictionary', url: 'https://creativecommons.org/publicdomain/zero/1.0/', attribution: 'Original Lito demonstration content, dedicated to CC0-1.0.', license: 'CC0-1.0', license_url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
};
createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:8127');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const word = url.searchParams.get('word');
  const status = word === 'hello' ? 200 : word === 'busy' ? 429 : word === 'offline' ? 503 : word === 'invalid' ? 422 : 404;
  if (url.pathname !== '/api/v1/dictionary/lookup') { res.writeHead(404); res.end('{}'); return; }
  res.writeHead(status); res.end(JSON.stringify(status === 200 ? { data } : { error: { code: 'fixture_error', message: 'Test response' } }));
}).listen(8127, '127.0.0.1', () => console.log('Fixture API: http://localhost:8127'));
