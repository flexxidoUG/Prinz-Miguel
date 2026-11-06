import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MONTHS, parseLocal, type EventItem } from '../api';
import { reducedMotion } from '../confetti';

const ARCHIVE_AFTER_H = 6; // an appearance counts as past 6 h after its start

export function Events({ events }: { events: EventItem[] }) {
  const root = useRef<HTMLElement>(null);
  const [showPast, setShowPast] = useState(false);
  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const withD = events.map((e) => ({ ...e, d: parseLocal(e.date) }));
    return {
      upcoming: withD.filter((e) => e.d.getTime() + ARCHIVE_AFTER_H * 3600e3 >= now),
      past: withD.filter((e) => e.d.getTime() + ARCHIVE_AFTER_H * 3600e3 < now).reverse(),
    };
  }, [events]);
  const next = upcoming[0];
  const days = next ? Math.ceil((next.d.getTime() - Date.now()) / 864e5) : 0;

  useLayoutEffect(() => {
    if (reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.ev-line-fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.ev-list', start: 'top 70%', end: 'bottom 60%', scrub: true } });
      gsap.utils.toArray<HTMLElement>('.ev-item').forEach((el, i) => {
        gsap.from(el.querySelector('.ev-card'), { x: i % 2 ? 80 : -80, rotateY: i % 2 ? -18 : 18, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%' } });
        gsap.from(el.querySelector('.ev-medal'), { scale: 0, rotate: -120, duration: 0.9, ease: 'back.out(2)', scrollTrigger: { trigger: el, start: 'top 82%' } });
      });
    }, root);
    return () => ctx.revert();
  }, [upcoming.length]);

  const fmtTime = (d: Date) => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const fmtDay = (d: Date) => d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <section id="termine" ref={root} className="ev" aria-label="Termine">
      <div className="ev-head">
        <p className="kicker">Unsere Auftritte</p>
        <h2 className="section-title">Wo ihr uns <em className="gold-text">erleben könnt</em></h2>
        {next && <p className="ev-next">{days <= 0 ? 'Heute ist es so weit!' : days === 1 ? 'Der nächste Auftritt ist morgen.' : `Noch ${days} Tage bis zum nächsten Auftritt.`}</p>}
      </div>
      {upcoming.length === 0 && <p className="ev-empty">Neue Termine werden in Kürze bekanntgegeben.</p>}
      <ol className="ev-list">
        <span className="ev-line" aria-hidden><span className="ev-line-fill" /></span>
        {upcoming.map((e, i) => (
          <li key={e.id} className={`ev-item ${i % 2 ? 'ev-item--r' : ''}`}>
            <div className="ev-medal" aria-hidden>
              <b>{e.d.getDate()}</b><span>{MONTHS[e.d.getMonth()]}</span>
            </div>
            <article className="ev-card">
              <time dateTime={e.date}>{fmtDay(e.d)} · {fmtTime(e.d)} Uhr</time>
              <h3>{e.title}</h3>
              {e.location && <p className="ev-loc"><Pin /> {e.location}</p>}
              {e.description && <p className="ev-desc">{e.description}</p>}
              {e.link && <a className="pill" href={e.link} target="_blank" rel="noopener noreferrer">Zur Veranstaltung ↗</a>}
            </article>
          </li>
        ))}
      </ol>
      {past.length > 0 && (
        <div className="ev-archive">
          <button className="pill pill--ghost" onClick={() => setShowPast(!showPast)} aria-expanded={showPast}>
            {showPast ? 'Archiv schließen' : `Archiv · ${past.length} vergangene Auftritte`}
          </button>
          {showPast && (
            <ul>
              {past.map((e) => (
                <li key={e.id}><time dateTime={e.date}>{e.d.toLocaleDateString('de-DE')}</time> {e.title}{e.location ? ` · ${e.location}` : ''}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

const Pin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" /></svg>
);
