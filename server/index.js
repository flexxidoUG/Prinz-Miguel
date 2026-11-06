import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, getContent, saveContent, shape, hashPassword, verifyPassword, UPLOAD_DIR } from './db.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, '..', 'dist');
const PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3000);
const SECURE_COOKIE = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === '1' : PROD;
const SALT = process.env.IP_SALT || db.prepare("select value from kv where key='ip_salt'").get().value;

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy':
      "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' blob:; worker-src 'self' blob:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  });
  if (SECURE_COOKIE) res.set('Strict-Transport-Security', 'max-age=31536000');
  next();
});
app.use(express.json({ limit: '300kb' }));

// ---------- helpers ----------
const ipKey = (req) => {
  const ip = (req.ip || '').replace(/^::ffff:/, '');
  const truncated = ip.includes(':') ? ip.split(':').slice(0, 4).join(':') : ip.split('.').slice(0, 3).join('.');
  return crypto.createHash('sha256').update(SALT + truncated).digest('hex').slice(0, 32);
};
const buckets = new Map();
// shortcut: in-memory rate limit, resets on restart and is per process; use a shared store if you run several instances
function limited(name, key, max, windowMs) {
  const k = name + key, now = Date.now();
  const hits = (buckets.get(k) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(k, hits);
  return hits.length > max;
}
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isUrl = (v) => !v || /^https?:\/\/[^\s]+$/i.test(v);

// ---------- public API ----------
app.get('/api/public', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json({
    content: getContent(),
    events: db.prepare('select id,date,title,location,description,link from events order by date').all(),
    guestbook: db.prepare("select id,name,message,created_at from guestbook where status='approved' order by created_at desc limit 60").all(),
  });
});

app.post('/api/guestbook', (req, res) => {
  const b = req.body || {};
  const name = str(b.name, 60), message = str(b.message, 500);
  if (b.website) return res.json({ ok: true }); // honeypot: pretend success
  if (!b.consent) return res.status(400).json({ error: 'Bitte stimme der Datenschutzerklärung zu.' });
  if (name.length < 2 || message.length < 3) return res.status(400).json({ error: 'Bitte Name und Nachricht ausfüllen.' });
  if (!(Number(b.elapsed) >= 3000)) return res.status(400).json({ error: 'Das ging etwas zu schnell – bitte noch einmal absenden.' });
  if ((message.match(/https?:\/\/|www\./gi) || []).length > 1) return res.status(400).json({ error: 'Bitte keine Links im Gruß.' });
  const ip = ipKey(req);
  if (limited('gb', ip, 3, 10 * 60e3)) return res.status(429).json({ error: 'Zu viele Grüße in kurzer Zeit. Bitte später erneut versuchen.' });
  if (db.prepare("select 1 from guestbook where message=? and created_at > datetime('now','-1 day')").get(message))
    return res.json({ ok: true });
  db.prepare('insert into guestbook(name,message,ip_hash) values(?,?,?)').run(name, message, ip);
  res.json({ ok: true });
});

// ---------- auth ----------
const sessionUser = (req) => {
  const sid = (req.headers.cookie || '').match(/(?:^|;\s*)sid=([a-f0-9]{64})/)?.[1];
  if (!sid) return null;
  const h = crypto.createHash('sha256').update(sid).digest('hex');
  return db.prepare("select u.id,u.username from sessions s join users u on u.id=s.user_id where s.token_hash=? and s.expires_at > datetime('now')").get(h) || null;
};
const cookie = (v, maxAge) => `sid=${v}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${SECURE_COOKIE ? '; Secure' : ''}`;

app.post('/api/admin/login', (req, res) => {
  const ip = ipKey(req);
  if (limited('login', ip, 8, 15 * 60e3)) return res.status(429).json({ error: 'Zu viele Versuche. Bitte 15 Minuten warten.' });
  const u = db.prepare('select * from users where username=?').get(str(req.body?.username, 100));
  if (!u || !verifyPassword(String(req.body?.password || ''), u.password_hash))
    return res.status(401).json({ error: 'Benutzername oder Passwort falsch.' });
  const sid = crypto.randomBytes(32).toString('hex');
  db.prepare("insert into sessions(token_hash,user_id,expires_at) values(?,?,datetime('now','+8 hours'))")
    .run(crypto.createHash('sha256').update(sid).digest('hex'), u.id);
  res.set('Set-Cookie', cookie(sid, 8 * 3600)).json({ ok: true, username: u.username });
});

const admin = express.Router();
admin.use((req, res, next) => {
  const u = sessionUser(req);
  if (!u) return res.status(401).json({ error: 'Nicht angemeldet.' });
  // CSRF: cookie is SameSite=Strict and every mutating call must carry a custom header (impossible cross-site without CORS).
  if (req.method !== 'GET' && req.get('X-CSRF') !== '1') return res.status(403).json({ error: 'CSRF' });
  req.user = u;
  next();
});

admin.get('/me', (req, res) => res.json(req.user));
admin.post('/logout', (req, res) => {
  const sid = (req.headers.cookie || '').match(/sid=([a-f0-9]{64})/)?.[1];
  if (sid) db.prepare('delete from sessions where token_hash=?').run(crypto.createHash('sha256').update(sid).digest('hex'));
  res.set('Set-Cookie', cookie('', 0)).json({ ok: true });
});
admin.post('/password', (req, res) => {
  const { current, next: nw } = req.body || {};
  const u = db.prepare('select * from users where id=?').get(req.user.id);
  if (!verifyPassword(String(current || ''), u.password_hash)) return res.status(400).json({ error: 'Aktuelles Passwort falsch.' });
  if (typeof nw !== 'string' || nw.length < 12) return res.status(400).json({ error: 'Neues Passwort: mindestens 12 Zeichen.' });
  db.prepare('update users set password_hash=? where id=?').run(hashPassword(nw), u.id);
  db.prepare('delete from sessions where user_id=?').run(u.id);
  res.set('Set-Cookie', cookie('', 0)).json({ ok: true });
});

admin.get('/content', (req, res) => res.json(getContent()));
admin.put('/content', (req, res) => {
  const cur = getContent();
  const next = shape(cur, req.body);
  next.media = cur.media; // media only changes through uploads
  saveContent(next);
  res.json(next);
});

// uploads
const SLOTS = {
  group: 'image', miguel: 'image', laura: 'image', louisa: 'image', scepterRef: 'image',
  audio: 'audio', scepterModel: 'model',
};
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 40 * 1024 * 1024 } });
admin.post('/upload/:slot', upload.single('file'), async (req, res) => {
  const kind = SLOTS[req.params.slot];
  const f = req.file;
  if (!kind || !f) return res.status(400).json({ error: 'Ungültiger Upload.' });
  const id = crypto.randomBytes(8).toString('hex');
  let name;
  try {
    if (kind === 'image') {
      // Re-encode: strips EXIF/GPS metadata; only downsizes very large files, never changes the picture content.
      name = `${req.params.slot}-${id}.webp`;
      await sharp(f.buffer).rotate().resize({ width: 2000, height: 2400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 }).toFile(path.join(UPLOAD_DIR, name));
    } else if (kind === 'audio') {
      const b = f.buffer;
      const mp3 = b.slice(0, 3).toString() === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
      if (!mp3) return res.status(400).json({ error: 'Bitte eine MP3-Datei hochladen.' });
      name = `audio-${id}.mp3`;
      fs.writeFileSync(path.join(UPLOAD_DIR, name), b);
    } else {
      if (f.buffer.slice(0, 4).toString() !== 'glTF') return res.status(400).json({ error: 'Bitte ein binäres glTF (.glb) hochladen.' });
      name = `model-${id}.glb`;
      fs.writeFileSync(path.join(UPLOAD_DIR, name), f.buffer);
    }
  } catch {
    return res.status(400).json({ error: 'Datei konnte nicht verarbeitet werden.' });
  }
  const c = getContent();
  const old = c.media[req.params.slot];
  c.media[req.params.slot] = `/uploads/${name}`;
  saveContent(c);
  if (old && /^\/uploads\/[\w.-]+-[a-f0-9]{16}\.\w+$/.test(old)) fs.rm(path.join(UPLOAD_DIR, path.basename(old)), () => {});
  res.json(c);
});
admin.delete('/upload/scepterModel', (req, res) => {
  const c = getContent();
  c.media.scepterModel = '';
  saveContent(c);
  res.json(c);
});

// events
const eventBody = (b = {}) => {
  const e = { date: str(b.date, 16), title: str(b.title, 120), location: str(b.location, 160), description: str(b.description, 1000), link: str(b.link, 500) };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(e.date) || !e.title) return null;
  if (!isUrl(e.link)) return null;
  return e;
};
admin.get('/events', (req, res) => res.json(db.prepare('select * from events order by date').all()));
admin.post('/events', (req, res) => {
  const e = eventBody(req.body);
  if (!e) return res.status(400).json({ error: 'Datum, Uhrzeit und Titel sind Pflicht; Link muss mit http(s):// beginnen.' });
  const r = db.prepare('insert into events(date,title,location,description,link) values(?,?,?,?,?)').run(e.date, e.title, e.location, e.description, e.link);
  res.json({ id: Number(r.lastInsertRowid), ...e });
});
admin.put('/events/:id', (req, res) => {
  const e = eventBody(req.body);
  if (!e) return res.status(400).json({ error: 'Datum, Uhrzeit und Titel sind Pflicht; Link muss mit http(s):// beginnen.' });
  db.prepare('update events set date=?,title=?,location=?,description=?,link=? where id=?').run(e.date, e.title, e.location, e.description, e.link, Number(req.params.id));
  res.json({ id: Number(req.params.id), ...e });
});
admin.delete('/events/:id', (req, res) => {
  db.prepare('delete from events where id=?').run(Number(req.params.id));
  res.json({ ok: true });
});

// guestbook moderation
admin.get('/guestbook', (req, res) =>
  res.json(db.prepare("select id,name,message,status,created_at from guestbook order by case status when 'pending' then 0 else 1 end, created_at desc").all()));
admin.patch('/guestbook/:id', (req, res) => {
  const s = req.body?.status;
  if (!['approved', 'rejected', 'pending'].includes(s)) return res.status(400).json({ error: 'Status ungültig.' });
  db.prepare('update guestbook set status=? where id=?').run(s, Number(req.params.id));
  res.json({ ok: true });
});
admin.delete('/guestbook/:id', (req, res) => {
  db.prepare('delete from guestbook where id=?').run(Number(req.params.id));
  res.json({ ok: true });
});

app.use('/api/admin', admin);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- static ----------
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: false }));
if (fs.existsSync(DIST)) {
  app.use('/assets', express.static(path.join(DIST, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(DIST, { index: false, maxAge: '1h' }));
  const html = () => {
    const c = getContent();
    return fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
      .replace('<meta name="robots" content="noindex,nofollow" />', c.site.allowIndexing ? '' : '<meta name="robots" content="noindex,nofollow" />');
  };
  app.get(['/', '/admin', '/impressum', '/datenschutz'], (req, res) => {
    res.set(req.path === '/admin' ? { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } : { 'Cache-Control': 'no-cache' });
    res.type('html').send(html());
  });
}
app.use((req, res) => res.status(404).type('text').send('Nicht gefunden'));

// housekeeping: expired sessions + anonymised IP hashes older than 30 days
const sweep = () => {
  db.exec("delete from sessions where expires_at < datetime('now')");
  db.exec("update guestbook set ip_hash=null where created_at < datetime('now','-30 days')");
};
sweep();
setInterval(sweep, 6 * 3600e3).unref();

app.listen(PORT, () => console.log(`Kinderprinz-Server läuft auf http://localhost:${PORT}`));
