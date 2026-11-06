import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultContent, seedEvents } from './defaults.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, '..', 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'site.db'));
db.exec(`
pragma journal_mode=wal;
pragma foreign_keys=on;
create table if not exists kv(key text primary key, value text not null);
create table if not exists users(id integer primary key, username text unique not null, password_hash text not null);
create table if not exists sessions(token_hash text primary key, user_id integer not null references users(id) on delete cascade, expires_at text not null);
create table if not exists events(id integer primary key, date text not null, title text not null, location text not null default '', description text not null default '', link text not null default '');
create table if not exists guestbook(id integer primary key, name text not null, message text not null, status text not null default 'pending' check(status in ('pending','approved','rejected')), ip_hash text, created_at text not null default (datetime('now')));
create index if not exists guestbook_status on guestbook(status, created_at);
`);

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}
export function verifyPassword(pw, stored) {
  const [, salt, key] = String(stored).split('$');
  if (!salt || !key) return false;
  const k = crypto.scryptSync(pw, Buffer.from(salt, 'hex'), 64, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(k, Buffer.from(key, 'hex'));
}

// Coerce untrusted input into the shape of `tpl`: unknown keys dropped, wrong types fall back to tpl.
export function shape(tpl, val) {
  if (Array.isArray(tpl)) {
    if (!Array.isArray(val)) return tpl;
    const item = tpl[0] ?? '';
    return val.slice(0, 40).map((v, i) => shape(tpl[i] ?? item, v));
  }
  if (tpl && typeof tpl === 'object') {
    const out = {};
    for (const k of Object.keys(tpl)) out[k] = shape(tpl[k], val?.[k]);
    return out;
  }
  if (typeof tpl === 'string') return typeof val === 'string' ? val.slice(0, 8000) : tpl;
  if (typeof tpl === 'number') return Number.isFinite(val) ? Math.max(0, Math.min(600, val)) : tpl;
  if (typeof tpl === 'boolean') return typeof val === 'boolean' ? val : tpl;
  return tpl;
}

export function getContent() {
  const row = db.prepare("select value from kv where key='content'").get();
  return shape(defaultContent, row ? JSON.parse(row.value) : defaultContent);
}
export function saveContent(c) {
  db.prepare("insert into kv(key,value) values('content',?) on conflict(key) do update set value=excluded.value").run(JSON.stringify(c));
}

// ---------- first start ----------
if (!db.prepare("select 1 from kv where key='ip_salt'").get())
  db.prepare("insert into kv values('ip_salt',?)").run(crypto.randomBytes(16).toString('hex'));

if (!db.prepare("select 1 from kv where key='content'").get()) {
  const seed = path.join(ROOT, 'seed');
  for (const f of fs.readdirSync(seed)) fs.copyFileSync(path.join(seed, f), path.join(UPLOAD_DIR, f));
  saveContent(defaultContent);
  const ins = db.prepare('insert into events(date,title,location,description,link) values(?,?,?,?,?)');
  for (const e of seedEvents) ins.run(e.date, e.title, e.location, e.description, e.link);
}

if (process.env.ADMIN_USER && process.env.ADMIN_PASSWORD && !db.prepare('select 1 from users where username=?').get(process.env.ADMIN_USER)) {
  db.prepare('insert into users(username,password_hash) values(?,?)').run(process.env.ADMIN_USER, hashPassword(process.env.ADMIN_PASSWORD));
  console.log(`Admin-Benutzer "${process.env.ADMIN_USER}" angelegt.`);
}
if (!db.prepare('select 1 from users').get()) console.warn('Noch kein Admin-Benutzer: npm run create-admin -- <name> <passwort>');
