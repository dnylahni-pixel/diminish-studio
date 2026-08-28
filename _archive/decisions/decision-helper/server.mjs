// Decision Helper — tiny zero-dependency server
// Serves the UI (index.html) + a small JSON-file API over decision-inbox/.
//
//   GET  /                         → index.html
//   GET  /api/files                → list of decision files
//   GET  /api/files/:id            → full content of a file
//   POST /api/files/:id/resolve    → answer a pending file (writes resolved-<id>.json)
//   GET  /api/schema               → decision-helper/schema.json
//
// The canonical id of a file is its internal "id" field; the filename
// (pending-<id>.json / resolved-<id>.json) is the convention. Lookups match
// internal id first, then filename-derived id.
//
// Env:
//   PORT                (default 4173)
//   DECISION_INBOX_DIR  (default <repo>/decision-inbox)

import { createServer } from 'node:http';
import { mkdir, readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HELPER_DIR = dirname(fileURLToPath(import.meta.url));
const INBOX_DIR = resolve(process.env.DECISION_INBOX_DIR || join(HELPER_DIR, '..', 'decision-inbox'));
const PORT = Number(process.env.PORT) || 4173;
const BRAIN_DUMP_FILE = resolve(
  process.env.BRAIN_DUMP_DIR || join(HELPER_DIR, '..', 'brain-dump'),
  'brain-dump.json'
);

const INDEX_FILE = join(HELPER_DIR, 'index.html');
const SCHEMA_FILE = join(HELPER_DIR, 'schema.json');

const send = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};
const sendHtml = (res, code, html) => {
  res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
};

const readJsonBody = (req) =>
  new Promise((resolveBody, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) req.destroy(new Error('body too large'));
    });
    req.on('end', () => {
      try {
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });

const fileStatus = (name) => (name.startsWith('resolved-') ? 'resolved' : 'pending');
const idFromName = (name) => name.replace(/^(pending-|resolved-)/, '').replace(/\.json$/, '');
const idOf = (data, name) =>
  data && typeof data.id === 'string' && data.id ? data.id : idFromName(name);

const isAnswered = (answer) => {
  if (answer === null || answer === undefined) return false;
  if (typeof answer === 'string') return answer.trim() !== '';
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === 'number') return Number.isFinite(answer);
  return true;
};

const brainId = () =>
  Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

async function readBrainDump() {
  try {
    const raw = await readFile(BRAIN_DUMP_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data?.items) ? data.items : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeBrainDump(items) {
  await mkdir(dirname(BRAIN_DUMP_FILE), { recursive: true });
  await writeFile(
    BRAIN_DUMP_FILE,
    JSON.stringify({ schemaVersion: 1, items }, null, 2) + '\n',
    'utf8'
  );
}

// Read every *.json in the inbox. Entries without .data failed to parse.
async function scanFiles() {
  await mkdir(INBOX_DIR, { recursive: true });
  const names = (await readdir(INBOX_DIR)).filter((n) => n.endsWith('.json'));
  const entries = [];
  for (const name of names.sort()) {
    const entry = { name, status: fileStatus(name) };
    try {
      entry.data = JSON.parse(await readFile(join(INBOX_DIR, name), 'utf8'));
    } catch (err) {
      entry.parseError = err instanceof SyntaxError ? 'JSON نامعتبر است' : 'خواندن فایل ممکن نشد';
    }
    entries.push(entry);
  }
  return entries;
}

async function listFiles() {
  const entries = await scanFiles();
  return entries.map(({ name, status, data, parseError }) => {
    if (!data) {
      return {
        id: idFromName(name),
        name,
        status,
        title: null,
        createdAt: null,
        resolvedAt: null,
        questionCount: 0,
        answeredCount: 0,
        invalid: true,
        error: parseError,
      };
    }
    const questions = Array.isArray(data.questions) ? data.questions : [];
    return {
      id: idOf(data, name),
      name,
      status,
      title: data.title ?? null,
      createdAt: data.createdAt ?? null,
      resolvedAt: data.resolvedAt ?? null,
      questionCount: questions.length,
      answeredCount: questions.filter((q) => isAnswered(q.answer)).length,
      invalid: false,
    };
  });
}

// Load a file by id — internal id first, then filename-derived.
async function loadFile(id) {
  const entries = await scanFiles();
  for (const e of entries) {
    if (e.data && idOf(e.data, e.name) === id) return { name: e.name, data: e.data };
  }
  const byName = entries.find((e) => e.data && idFromName(e.name) === id);
  if (byName) return { name: byName.name, data: byName.data };
  return null;
}

function validateAnswers(file, answers) {
  const errors = {};
  const byId = new Map(file.questions.map((q) => [q.id, q]));
  for (const key of Object.keys(answers)) {
    if (!byId.has(key)) errors[key] = ['سوالِ ناشناخته'];
  }
  for (const q of file.questions) {
    const a = answers[q.id];
    const isEmpty =
      a === undefined ||
      a === null ||
      (typeof a === 'string' && a.trim() === '') ||
      (Array.isArray(a) && a.length === 0);
    if (q.required && isEmpty) {
      errors[q.id] = ['پاسخ الزامی است'];
      continue;
    }
    if (isEmpty) continue;
    if (q.type === 'choice') {
      if (typeof a !== 'string') errors[q.id] = ['پاسخ باید متن باشد'];
      else if (Array.isArray(q.options) && !q.options.includes(a))
        errors[q.id] = ['پاسخ باید یکی از گزینه‌ها باشد'];
    } else if (q.type === 'multi-choice') {
      if (!Array.isArray(a)) errors[q.id] = ['پاسخ باید چند گزینه باشد'];
      else if (Array.isArray(q.options))
        for (const v of a) if (!q.options.includes(v)) {
          errors[q.id] = [`گزینه‌ی ناشناخته: ${v}`];
          break;
        }
    } else if (q.type === 'text') {
      if (typeof a !== 'string') errors[q.id] = ['پاسخ باید متن باشد'];
    } else if (q.type === 'number') {
      if (typeof a !== 'number' || !Number.isFinite(a)) errors[q.id] = ['پاسخ باید عدد باشد'];
    }
  }
  return errors;
}

async function handleResolve(req, res, id) {
  const entries = await scanFiles();
  const pending =
    entries.find((e) => e.status === 'pending' && e.data && idOf(e.data, e.name) === id) ||
    entries.find((e) => e.status === 'pending' && e.data && idFromName(e.name) === id);

  if (!pending) {
    const alreadyResolved = entries.some(
      (e) =>
        e.status === 'resolved' &&
        e.data &&
        (idOf(e.data, e.name) === id || idFromName(e.name) === id)
    );
    return send(res, alreadyResolved ? 409 : 404, {
      error: alreadyResolved ? 'این فایل قبلاً حل شده است' : 'فایلِ در انتظار یافت نشد',
    });
  }

  const file = pending.data;
  if (!Array.isArray(file.questions)) return send(res, 400, { error: 'ساختار فایل نامعتبر است' });

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return send(res, 400, { error: 'بدنه‌ی JSON نامعتبر است' });
  }
  const answers =
    body && typeof body.answers === 'object' && !Array.isArray(body.answers) ? body.answers : {};
  const explanations =
    body && typeof body.explanations === 'object' && !Array.isArray(body.explanations)
      ? body.explanations
      : {};

  const fieldErrors = validateAnswers(file, answers);
  const knownIds = new Set(file.questions.map((q) => q.id));
  for (const key of Object.keys(explanations)) {
    if (!knownIds.has(key)) fieldErrors[key] = ['سوالِ ناشناخته'];
    else if (typeof explanations[key] !== 'string') fieldErrors[key] = ['توضیح باید متن باشد'];
  }
  if (Object.keys(fieldErrors).length) return send(res, 400, { fieldErrors });

  const now = new Date().toISOString();
  const resolved = {
    ...file,
    status: 'resolved',
    resolvedAt: now,
    questions: file.questions.map((q) => {
      const a = answers[q.id];
      const answered = !(
        a === undefined ||
        a === null ||
        (typeof a === 'string' && a.trim() === '') ||
        (Array.isArray(a) && a.length === 0)
      );
      const explanation = explanations[q.id] ? String(explanations[q.id]).trim() : null;
      return { ...q, answer: answered ? a : null, answeredAt: answered ? now : null, explanation };
    }),
  };

  const outName = `resolved-${idOf(file, pending.name)}.json`;
  await writeFile(join(INBOX_DIR, outName), JSON.stringify(resolved, null, 2) + '\n', 'utf8');
  await unlink(join(INBOX_DIR, pending.name));
  return send(res, 200, { file: resolved, name: outName });
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && pathname === '/') {
      return sendHtml(res, 200, await readFile(INDEX_FILE, 'utf8'));
    }
    if (req.method === 'GET' && pathname === '/favicon.ico') {
      res.writeHead(204);
      return res.end();
    }
    if (req.method === 'GET' && pathname === '/api/files') {
      return send(res, 200, { files: await listFiles(), inboxDir: INBOX_DIR });
    }
    if (req.method === 'GET' && pathname === '/api/schema') {
      return send(res, 200, JSON.parse(await readFile(SCHEMA_FILE, 'utf8')));
    }

    if (req.method === 'GET' && pathname === '/api/brain-dump') {
      return send(res, 200, { items: await readBrainDump(), file: BRAIN_DUMP_FILE });
    }
    if (req.method === 'POST' && pathname === '/api/brain-dump/items') {
      let body;
      try {
        body = await readJsonBody(req);
      } catch {
        return send(res, 400, { error: 'بدنه‌ی JSON نامعتبر است' });
      }
      const text = typeof body?.text === 'string' ? body.text.trim() : '';
      if (!text) return send(res, 400, { error: 'متن خالی است' });
      const item = { id: brainId(), text, createdAt: new Date().toISOString() };
      const items = await readBrainDump();
      items.unshift(item);
      await writeBrainDump(items);
      return send(res, 201, { item });
    }

    const brainDeleteMatch = pathname.match(/^\/api\/brain-dump\/items\/([^/]+)$/);
    if (req.method === 'DELETE' && brainDeleteMatch) {
      const id = decodeURIComponent(brainDeleteMatch[1]);
      const items = await readBrainDump();
      const next = items.filter((it) => it.id !== id);
      if (next.length === items.length) return send(res, 404, { error: 'آیتم یافت نشد' });
      await writeBrainDump(next);
      return send(res, 200, { ok: true });
    }

    const fileMatch = pathname.match(/^\/api\/files\/([^/]+)$/);
    if (req.method === 'GET' && fileMatch) {
      const found = await loadFile(fileMatch[1]);
      if (!found) return send(res, 404, { error: 'فایل یافت نشد' });
      return send(res, 200, { file: found.data, name: found.name });
    }

    const resolveMatch = pathname.match(/^\/api\/files\/([^/]+)\/resolve$/);
    if (req.method === 'POST' && resolveMatch) {
      return await handleResolve(req, res, resolveMatch[1]);
    }

    return send(res, 404, { error: 'یافت نشد' });
  } catch (err) {
    console.error('[decision-helper]', err);
    if (!res.headersSent) return send(res, 500, { error: 'خطای داخلی سرور' });
    res.end();
  }
}).listen(PORT, () => {
  console.log(`🎯  Decision Helper روی http://localhost:${PORT}`);
  console.log(`📂  پوشه‌ی تصمیم‌ها: ${INBOX_DIR}`);
});
