import { useRef, useState } from 'react';
import { api, type Greeting } from '../api';
import { celebrate } from '../confetti';

export function Guestbook({ entries }: { entries: Greeting[] }) {
  const started = useRef(Date.now());
  const [form, setForm] = useState({ name: '', message: '', consent: false, website: '' });
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; msg?: string; name?: string }>({ status: 'idle' });
  const btn = useRef<HTMLButtonElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ status: 'sending' });
    try {
      await api('/api/guestbook', { method: 'POST', json: { ...form, elapsed: Date.now() - started.current } });
      const r = btn.current?.getBoundingClientRect();
      celebrate(r ? { x: (r.left + r.width / 2) / innerWidth, y: r.top / innerHeight } : undefined);
      setState({ status: 'done', name: form.name.trim() });
      setForm({ name: '', message: '', consent: false, website: '' });
    } catch (err) {
      setState({ status: 'error', msg: (err as Error).message });
    }
  };

  return (
    <section id="gaestebuch" className="gb" aria-label="Gästebuch">
      <div className="gb-head">
        <p className="kicker">Digitales Gästebuch</p>
        <h2 className="section-title">Ein Gruß für das <em className="gold-text">Prinzenteam</em></h2>
      </div>
      <div className="gb-grid">
        <div className="gb-wall" aria-label="Veröffentlichte Grüße">
          {entries.length === 0 && <p className="gb-empty">Noch keine Grüße – schreib den ersten!</p>}
          {entries.map((g, i) => (
            <figure key={g.id} className="gb-card" style={{ ['--d' as string]: `${(i % 7) * -1.3}s`, ['--r' as string]: `${((i * 37) % 7) - 3}deg` }}>
              <blockquote>{g.message}</blockquote>
              <figcaption>— {g.name}</figcaption>
            </figure>
          ))}
        </div>
        <div className="gb-formwrap">
          {state.status === 'done' ? (
            <div className="gb-thanks" role="status">
              <p className="gb-thanks-big">Danke{state.name ? `, ${state.name}` : ''}!</p>
              <p>Dein Karnevalsgruß ist bei Miguel, Laura & Louisa angekommen. Er erscheint hier, sobald er freigegeben wurde. Alaaf!</p>
              <button className="pill" onClick={() => { started.current = Date.now(); setState({ status: 'idle' }); }}>Noch einen Gruß schreiben</button>
            </div>
          ) : (
            <form className="gb-form" onSubmit={submit} noValidate={false}>
              <label>
                <span>Dein Name</span>
                <input required minLength={2} maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
              </label>
              <label>
                <span>Dein Karnevalsgruß</span>
                <textarea required minLength={3} maxLength={500} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                <small>{form.message.length}/500</small>
              </label>
              <label className="gb-hp" aria-hidden>
                Website <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </label>
              <label className="gb-consent">
                <input type="checkbox" required checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                <span>Ich bin einverstanden, dass mein Name und mein Gruß gespeichert und nach Prüfung hier veröffentlicht werden. Details in der <a href="/datenschutz" target="_blank">Datenschutzerklärung</a>. Kinder bitte nur mit Erlaubnis der Eltern.</span>
              </label>
              {state.status === 'error' && <p className="gb-error" role="alert">{state.msg}</p>}
              <button ref={btn} className="pill pill--gold btn-lg" disabled={state.status === 'sending'}>
                {state.status === 'sending' ? 'Wird gesendet …' : 'Gruß absenden'}
              </button>
              <p className="gb-note">Alle Grüße werden vor der Veröffentlichung gelesen.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
