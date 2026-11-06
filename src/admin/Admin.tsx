import { useEffect, useState } from 'react';
import { api, type Content, type EventItem, type Greeting } from '../api';
import './admin.css';

type Tab = 'hero' | 'team' | 'zepter' | 'termine' | 'gaestebuch' | 'recht' | 'konto';
const TABS: [Tab, string][] = [['hero', 'Startseite'], ['team', 'Prinzenteam'], ['zepter', 'Zepter'], ['termine', 'Termine'], ['gaestebuch', 'Gästebuch'], ['recht', 'Finale & Recht'], ['konto', 'Konto']];

export default function Admin() {
  const [user, setUser] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    document.title = 'Admin · Prinzenteam';
    api<{ username: string }>('/api/admin/me').then((u) => setUser(u.username)).catch(() => setUser(null));
  }, []);
  if (user === undefined) return <div className="ad-center">Lädt …</div>;
  if (!user) return <Login onOk={setUser} />;
  return <Panel user={user} onLogout={() => setUser(null)} />;
}

function Login({ onOk }: { onOk: (u: string) => void }) {
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  return (
    <div className="ad-center">
      <form className="ad-login" onSubmit={async (e) => {
        e.preventDefault();
        setErr('');
        try { const r = await api<{ username: string }>('/api/admin/login', { method: 'POST', json: f }); onOk(r.username); }
        catch (x) { setErr((x as Error).message); }
      }}>
        <h1>Admin-Bereich</h1>
        <label>Benutzername<input autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} required /></label>
        <label>Passwort<input type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></label>
        {err && <p className="ad-err" role="alert">{err}</p>}
        <button className="ad-btn ad-btn--gold">Anmelden</button>
        <a href="/" className="ad-link">← Zur Webseite</a>
      </form>
    </div>
  );
}

function Panel({ user, onLogout }: { user: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('hero');
  const [c, setC] = useState<Content | null>(null);
  const [saved, setSaved] = useState<Content | null>(null);
  const [toast, setToast] = useState('');
  const [pending, setPending] = useState(0);
  useEffect(() => {
    api<Content>('/api/admin/content').then((x) => { setC(x); setSaved(x); });
    api<Greeting[]>('/api/admin/guestbook').then((g) => setPending(g.filter((x) => x.status === 'pending').length));
  }, []);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  if (!c) return <div className="ad-center">Lädt …</div>;
  const dirty = JSON.stringify(c) !== JSON.stringify(saved);
  const set = (path: (string | number)[], v: unknown) => {
    const next = structuredClone(c) as unknown as Record<string, unknown>;
    let o = next as Record<string | number, unknown>;
    for (const k of path.slice(0, -1)) o = o[k] as Record<string | number, unknown>;
    o[path[path.length - 1]] = v;
    setC(next as unknown as Content);
  };
  const save = async () => {
    try { const r = await api<Content>('/api/admin/content', { method: 'PUT', json: c }); setC(r); setSaved(r); flash('Gespeichert ✓'); }
    catch (e) { flash((e as Error).message); }
  };
  const onMedia = (m: Content) => { setC({ ...c, media: m.media }); setSaved((s) => (s ? { ...s, media: m.media } : s)); flash('Datei hochgeladen ✓'); };
  const contentTab = ['hero', 'team', 'zepter', 'recht'].includes(tab);

  return (
    <div className="ad">
      <header className="ad-top">
        <strong>Prinzenteam · Admin</strong>
        <div><a href="/" target="_blank" rel="noopener">Webseite ansehen ↗</a> <span className="ad-user">{user}</span></div>
      </header>
      <nav className="ad-tabs">
        {TABS.map(([k, l]) => (
          <button key={k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>
            {l}{k === 'gaestebuch' && pending > 0 && <span className="ad-badge">{pending}</span>}
          </button>
        ))}
      </nav>
      {!c.site.photoConsentConfirmed && (
        <p className="ad-warn">Bitte bestätigen Sie unter „Finale &amp; Recht“, dass die schriftliche Einwilligung der Erziehungsberechtigten zur Veröffentlichung der Kinderfotos vorliegt. Impressum und Datenschutzerklärung enthalten noch Platzhalter, die vor dem Livegang ausgefüllt werden müssen.</p>
      )}
      <main className="ad-main">
        {tab === 'hero' && (
          <>
            <Card title="Medien">
              <Upload slot="group" label="Gruppenportrait (Hero & Finale)" url={c.media.group} onDone={onMedia} />
              <Upload slot="audio" label="Show-Audio (MP3, ca. 35 s)" url={c.media.audio} onDone={onMedia} accept="audio/mpeg,.mp3" />
            </Card>
            <Card title="Begrüßungstext">
              {c.hero.lines.map((l, i) => <Field key={i} label={`Zeile ${i + 1}`} value={l} onChange={(v) => set(['hero', 'lines', i], v)} />)}
              <Field label="Willkommenstext" multiline value={c.hero.welcome} onChange={(v) => set(['hero', 'welcome'], v)} />
              <Field label="Session-Bezeichnung" value={c.site.sessionLabel} onChange={(v) => set(['site', 'sessionLabel'], v)} />
            </Card>
            <Card title="Animation">
              <Check label="Show beim Öffnen automatisch starten (Ton, soweit der Browser es erlaubt)" value={c.hero.autoplay} onChange={(v) => set(['hero', 'autoplay'], v)} />
              <Check label="Show pro Besuch nur einmal abspielen" value={c.hero.playOncePerVisit} onChange={(v) => set(['hero', 'playOncePerVisit'], v)} />
              <p className="ad-hint">Zeitmarken in Sekunden ab Start der MP3. Die Animation wird automatisch an diese Punkte angepasst – wichtig, wenn eine neue MP3 hochgeladen wird.</p>
              <div className="ad-grid3">
                {([['miguel', '„Kinderprinz Miguel …“'], ['paginnen', '„… seine Paginnen“'], ['laura', '„Laura“'], ['louisa', '„Louisa“'], ['konfetti', '„Konfetti fliegen“'], ['dreimal', '„Dreimal kräftig“'], ['alaaf', '„Alaaf!“']] as const).map(([k, l]) => (
                  <label key={k} className="ad-field">{l}<input type="number" step="0.1" min="0" value={c.hero.cues[k]} onChange={(e) => set(['hero', 'cues', k], Number(e.target.value))} /></label>
                ))}
              </div>
            </Card>
          </>
        )}

        {tab === 'team' && c.team.map((m, i) => (
          <Card key={m.key} title={`${m.title} ${m.name}`}>
            <Upload slot={m.key as 'miguel'} label="Einzelportrait" url={c.media[m.key as 'miguel']} onDone={onMedia} />
            <div className="ad-grid2">
              <Field label="Titel" value={m.title} onChange={(v) => set(['team', i, 'title'], v)} />
              <Field label="Name" value={m.name} onChange={(v) => set(['team', i, 'name'], v)} />
            </div>
            <Field label="Persönliches Motto" value={m.motto} onChange={(v) => set(['team', i, 'motto'], v)} />
            <Field label="Vorstellungstext" multiline value={m.text} onChange={(v) => set(['team', i, 'text'], v)} />
            <Pairs label="Persönliche Informationen" items={m.facts} onChange={(v) => set(['team', i, 'facts'], v)} />
          </Card>
        ))}

        {tab === 'zepter' && (
          <>
            <Card title="Zepter-Dateien">
              <Upload slot="scepterRef" label="Referenzbild (wird als Fallback ohne WebGL gezeigt)" url={c.media.scepterRef} onDone={onMedia} />
              <Upload slot="scepterModel" label="Eigenes 3D-Modell (.glb, optional – ersetzt das mitgelieferte Modell)" url={c.media.scepterModel} onDone={onMedia} accept=".glb,model/gltf-binary" />
              {c.media.scepterModel && (
                <button className="ad-btn" onClick={async () => onMedia(await api<Content>('/api/admin/upload/scepterModel', { method: 'DELETE' }))}>Eigenes Modell entfernen</button>
              )}
            </Card>
            <Card title="Einleitung & Karnevalsmotto">
              <Field label="Einleitungstext" multiline value={c.scepter.intro} onChange={(v) => set(['scepter', 'intro'], v)} />
              <Field label="Überschrift Kapitel I" value={c.scepter.motto.kicker} onChange={(v) => set(['scepter', 'motto', 'kicker'], v)} />
              <Field label="Offizielles Karnevalsmotto (auch im Finale)" value={c.scepter.motto.text} onChange={(v) => set(['scepter', 'motto', 'text'], v)} />
            </Card>
            <Card title="Kapitel II – Session">
              <Field label="Überschrift" value={c.scepter.session.kicker} onChange={(v) => set(['scepter', 'session', 'kicker'], v)} />
              <Field label="Titel" value={c.scepter.session.title} onChange={(v) => set(['scepter', 'session', 'title'], v)} />
              <Field label="Text" multiline value={c.scepter.session.text} onChange={(v) => set(['scepter', 'session', 'text'], v)} />
              <Pairs label="Eckdaten" items={c.scepter.session.items} onChange={(v) => set(['scepter', 'session', 'items'], v)} />
            </Card>
            <Card title="Kapitel III – Prinzenteam">
              <Field label="Überschrift" value={c.scepter.team.kicker} onChange={(v) => set(['scepter', 'team', 'kicker'], v)} />
              <Field label="Text" value={c.scepter.team.text} onChange={(v) => set(['scepter', 'team', 'text'], v)} />
            </Card>
          </>
        )}

        {tab === 'recht' && (
          <>
            <Card title="Finale">
              <div className="ad-grid2">
                <Field label="Zeile 1" value={c.finale.kicker} onChange={(v) => set(['finale', 'kicker'], v)} />
                <Field label="Zeile 2" value={c.finale.text} onChange={(v) => set(['finale', 'text'], v)} />
              </div>
              <p className="ad-hint">Die große Schrift im Finale ist das Karnevalsmotto (Tab „Zepter“).</p>
            </Card>
            <Card title="Kinderschutz & Sichtbarkeit">
              <Check label="Die schriftliche Einwilligung aller Erziehungsberechtigten zur Veröffentlichung der Fotos und Namen liegt vor." value={c.site.photoConsentConfirmed} onChange={(v) => set(['site', 'photoConsentConfirmed'], v)} />
              <Check label="Suchmaschinen dürfen die Seite indexieren (Standard: aus)" value={c.site.allowIndexing} onChange={(v) => set(['site', 'allowIndexing'], v)} />
              <Field label="Seitentitel (Browser-Tab)" value={c.site.title} onChange={(v) => set(['site', 'title'], v)} />
            </Card>
            <Card title="Impressum"><Field label="Text (Leerzeile = neuer Absatz)" multiline rows={12} value={c.legal.impressum} onChange={(v) => set(['legal', 'impressum'], v)} /></Card>
            <Card title="Datenschutzerklärung"><Field label="Text (Leerzeile = neuer Absatz)" multiline rows={20} value={c.legal.datenschutz} onChange={(v) => set(['legal', 'datenschutz'], v)} /></Card>
          </>
        )}

        {tab === 'termine' && <EventsAdmin flash={flash} />}
        {tab === 'gaestebuch' && <GuestbookAdmin flash={flash} onCount={setPending} />}
        {tab === 'konto' && <Account onLogout={onLogout} flash={flash} />}
      </main>
      {contentTab && (
        <div className={`ad-savebar ${dirty ? 'is-dirty' : ''}`}>
          <span>{dirty ? 'Ungespeicherte Änderungen' : 'Alles gespeichert'}</span>
          <button className="ad-btn" disabled={!dirty} onClick={() => setC(saved)}>Verwerfen</button>
          <button className="ad-btn ad-btn--gold" disabled={!dirty} onClick={save}>Speichern</button>
        </div>
      )}
      {toast && <div className="ad-toast" role="status">{toast}</div>}
    </div>
  );
}

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="ad-card"><h2>{title}</h2>{children}</section>
);
function Field({ label, value, onChange, multiline, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number }) {
  return (
    <label className="ad-field">{label}
      {multiline ? <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /> : <input value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}
const Check = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <label className="ad-check"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />{label}</label>
);
function Pairs({ label, items, onChange }: { label: string; items: { label: string; value: string }[]; onChange: (v: { label: string; value: string }[]) => void }) {
  return (
    <div className="ad-pairs">
      <span>{label}</span>
      {items.map((it, i) => (
        <div key={i} className="ad-pair">
          <input aria-label="Bezeichnung" placeholder="Bezeichnung" value={it.label} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
          <input aria-label="Wert" placeholder="Wert" value={it.value} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
          <button className="ad-btn ad-btn--icon" aria-label="Entfernen" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button className="ad-btn" onClick={() => onChange([...items, { label: '', value: '' }])}>+ Zeile</button>
    </div>
  );
}

function Upload({ slot, label, url, onDone, accept = 'image/*' }: { slot: string; label: string; url: string; onDone: (c: Content) => void; accept?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="ad-upload">
      <div className="ad-prev">
        {!url ? <span>–</span> : accept.startsWith('image') ? <img src={url} alt="" /> : accept.includes('audio') ? <audio controls src={url} preload="none" /> : <span>Modell aktiv</span>}
      </div>
      <div>
        <p>{label}</p>
        <label className="ad-btn">
          {busy ? 'Lädt hoch …' : 'Datei wählen'}
          <input type="file" accept={accept} hidden disabled={busy} onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true); setErr('');
            const fd = new FormData();
            fd.append('file', f);
            try { onDone(await api<Content>(`/api/admin/upload/${slot}`, { method: 'POST', body: fd })); }
            catch (x) { setErr((x as Error).message); }
            setBusy(false);
            e.target.value = '';
          }} />
        </label>
        {err && <p className="ad-err">{err}</p>}
      </div>
    </div>
  );
}

const emptyEvent = { date: '', title: '', location: '', description: '', link: '' };
function EventsAdmin({ flash }: { flash: (m: string) => void }) {
  const [list, setList] = useState<EventItem[]>([]);
  const [edit, setEdit] = useState<Partial<EventItem> | null>(null);
  const load = () => api<EventItem[]>('/api/admin/events').then(setList);
  useEffect(() => { load(); }, []);
  const save = async () => {
    try {
      if (edit?.id) await api(`/api/admin/events/${edit.id}`, { method: 'PUT', json: edit });
      else await api('/api/admin/events', { method: 'POST', json: edit });
      setEdit(null); load(); flash('Termin gespeichert ✓');
    } catch (e) { flash((e as Error).message); }
  };
  const now = Date.now();
  return (
    <>
      <Card title="Termine">
        <button className="ad-btn ad-btn--gold" onClick={() => setEdit({ ...emptyEvent })}>+ Neuer Termin</button>
        <ul className="ad-list">
          {list.map((e) => (
            <li key={e.id} className={new Date(e.date).getTime() + 6 * 3600e3 < now ? 'is-past' : ''}>
              <div><strong>{e.title}</strong><small>{new Date(e.date).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} · {e.location}</small></div>
              <div className="ad-row">
                <button className="ad-btn" onClick={() => setEdit(e)}>Bearbeiten</button>
                <button className="ad-btn ad-btn--danger" onClick={async () => { if (confirm(`„${e.title}“ löschen?`)) { await api(`/api/admin/events/${e.id}`, { method: 'DELETE' }); load(); } }}>Löschen</button>
              </div>
            </li>
          ))}
        </ul>
        <p className="ad-hint">Vergangene Termine (grau) erscheinen auf der Webseite automatisch im Archiv.</p>
      </Card>
      {edit && (
        <div className="ad-modal" role="dialog" aria-modal="true" aria-label="Termin bearbeiten">
          <div className="ad-card">
            <h2>{edit.id ? 'Termin bearbeiten' : 'Neuer Termin'}</h2>
            <label className="ad-field">Datum & Uhrzeit<input type="datetime-local" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></label>
            <Field label="Veranstaltung" value={edit.title || ''} onChange={(v) => setEdit({ ...edit, title: v })} />
            <Field label="Ort" value={edit.location || ''} onChange={(v) => setEdit({ ...edit, location: v })} />
            <Field label="Beschreibung (optional)" multiline value={edit.description || ''} onChange={(v) => setEdit({ ...edit, description: v })} />
            <Field label="Link (optional, https://…)" value={edit.link || ''} onChange={(v) => setEdit({ ...edit, link: v })} />
            <div className="ad-row">
              <button className="ad-btn" onClick={() => setEdit(null)}>Abbrechen</button>
              <button className="ad-btn ad-btn--gold" onClick={save}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GuestbookAdmin({ flash, onCount }: { flash: (m: string) => void; onCount: (n: number) => void }) {
  const [list, setList] = useState<Greeting[]>([]);
  const [filter, setFilter] = useState('pending');
  const load = () => api<Greeting[]>('/api/admin/guestbook').then((l) => { setList(l); onCount(l.filter((x) => x.status === 'pending').length); });
  useEffect(() => { load(); }, []);
  const act = async (id: number, status: string) => { await api(`/api/admin/guestbook/${id}`, { method: 'PATCH', json: { status } }); load(); flash(status === 'approved' ? 'Freigegeben ✓' : 'Abgelehnt'); };
  const shown = list.filter((g) => g.status === filter);
  const labels: Record<string, string> = { pending: 'Neu', approved: 'Freigegeben', rejected: 'Abgelehnt' };
  return (
    <Card title="Gästebuch-Moderation">
      <div className="ad-row">
        {Object.entries(labels).map(([k, l]) => (
          <button key={k} className={`ad-btn ${filter === k ? 'ad-btn--gold' : ''}`} onClick={() => setFilter(k)}>{l} ({list.filter((g) => g.status === k).length})</button>
        ))}
      </div>
      {shown.length === 0 && <p className="ad-hint">Keine Einträge.</p>}
      <ul className="ad-list">
        {shown.map((g) => (
          <li key={g.id} className="ad-gb">
            <div><strong>{g.name}</strong><small>{new Date(g.created_at.replace(' ', 'T') + 'Z').toLocaleString('de-DE')}</small><p>{g.message}</p></div>
            <div className="ad-row">
              {g.status !== 'approved' && <button className="ad-btn ad-btn--gold" onClick={() => act(g.id, 'approved')}>Freigeben</button>}
              {g.status !== 'rejected' && <button className="ad-btn" onClick={() => act(g.id, 'rejected')}>Ablehnen</button>}
              <button className="ad-btn ad-btn--danger" onClick={async () => { if (confirm('Eintrag endgültig löschen?')) { await api(`/api/admin/guestbook/${g.id}`, { method: 'DELETE' }); load(); } }}>Löschen</button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Account({ onLogout, flash }: { onLogout: () => void; flash: (m: string) => void }) {
  const [pw, setPw] = useState({ current: '', next: '' });
  return (
    <>
      <Card title="Passwort ändern">
        <label className="ad-field">Aktuelles Passwort<input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
        <label className="ad-field">Neues Passwort (mind. 12 Zeichen)<input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
        <button className="ad-btn ad-btn--gold" onClick={async () => {
          try { await api('/api/admin/password', { method: 'POST', json: pw }); flash('Passwort geändert – bitte neu anmelden.'); setTimeout(onLogout, 1200); }
          catch (e) { flash((e as Error).message); }
        }}>Passwort speichern</button>
      </Card>
      <Card title="Sitzung">
        <button className="ad-btn" onClick={async () => { await api('/api/admin/logout', { method: 'POST' }); onLogout(); }}>Abmelden</button>
      </Card>
    </>
  );
}
