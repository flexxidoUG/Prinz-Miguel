import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { api, type PublicData } from './api';
import { Nav } from './Nav';
import { Hero } from './hero/Hero';
import { Team } from './sections/Team';
import { ScepterSection } from './sections/Scepter';
import { Events } from './sections/Events';
import { Guestbook } from './sections/Guestbook';
import { Finale } from './sections/Finale';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export function App() {
  const [data, setData] = useState<PublicData | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api<PublicData>('/api/public').then(setData).catch(() => setErr('Die Seite konnte nicht geladen werden. Bitte später erneut versuchen.'));
  }, []);
  useEffect(() => {
    if (!data) return;
    document.title = data.content.site.title;
    // images/fonts change layout after load → re-measure pinned scenes
    const r = () => ScrollTrigger.refresh();
    requestAnimationFrame(r);
    window.addEventListener('load', r);
    document.fonts?.ready.then(r);
    return () => window.removeEventListener('load', r);
  }, [data]);

  if (err) return <div className="loading">{err}</div>;
  if (!data) return <div className="loading" aria-busy="true"><span className="loading-crown" /></div>;
  const c = data.content;
  return (
    <>
      <a className="skip" href="#team">Zum Inhalt springen</a>
      <Nav />
      <main>
        <Hero content={c} />
        <Team content={c} />
        <ScepterSection content={c} />
        <Events events={data.events} />
        <Guestbook entries={data.guestbook} />
        <Finale content={c} />
      </main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} Kinderprinz {c.team[0]?.name} · {c.team[1]?.name} & {c.team[2]?.name}</p>
        <nav aria-label="Rechtliches">
          <a href="/impressum">Impressum</a>
          <a href="/datenschutz">Datenschutz</a>
        </nav>
      </footer>
    </>
  );
}
