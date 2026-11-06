import { useEffect, useState } from 'react';
import { heroAudio, SoundIcon } from './hero/Hero';

const LINKS = [
  ['start', 'Startseite'],
  ['team', 'Unser Prinzenteam'],
  ['zepter', 'Das Prinzenszepter'],
  ['termine', 'Termine'],
  ['gaestebuch', 'Gästebuch'],
] as const;

export function Nav() {
  const [active, setActive] = useState('start');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const l = (on: boolean) => setSound(on);
    heroAudio.listeners.add(l);
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const mid = window.innerHeight * 0.4;
      let cur = 'start';
      for (const [id] of LINKS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < mid) cur = id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); heroAudio.listeners.delete(l); };
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  return (
    <header className={`nav ${scrolled ? 'nav--solid' : ''} ${open ? 'nav--open' : ''}`}>
      <a href="#start" className="nav-brand" onClick={() => setOpen(false)}>
        <Crest />
        <span>Miguel I.<small>Laura &amp; Louisa</small></span>
      </a>
      <nav className="nav-links" aria-label="Hauptnavigation" id="nav-links">
        {LINKS.map(([id, label], i) => (
          <a key={id} href={`#${id}`} className={active === id ? 'is-active' : ''} aria-current={active === id ? 'true' : undefined} style={{ ['--i' as string]: i }} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
      </nav>
      <div className="nav-actions" data-no-autosound>
        <button className="nav-sound" onClick={() => heroAudio.toggle?.()} aria-label={sound ? 'Ton ausschalten' : 'Ton einschalten'} aria-pressed={sound}>
          <SoundIcon on={sound} />
        </button>
        <button className="nav-burger" aria-expanded={open} aria-controls="nav-links" aria-label={open ? 'Menü schließen' : 'Menü öffnen'} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}

export function Crest({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="crest-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9a6d23" /><stop offset=".45" stopColor="#f7dc8f" /><stop offset="1" stopColor="#b88630" />
        </linearGradient>
      </defs>
      <path d="M8 46 L13 18 L25 31 L32 9 L39 31 L51 18 L56 46Z" fill="url(#crest-g)" />
      <rect x="8" y="46" width="48" height="7" rx="2" fill="url(#crest-g)" />
      <circle cx="13" cy="16" r="3.5" fill="url(#crest-g)" /><circle cx="51" cy="16" r="3.5" fill="url(#crest-g)" /><circle cx="32" cy="7" r="3.5" fill="url(#crest-g)" />
      <circle cx="32" cy="37" r="5.5" fill="#b5162b" />
    </svg>
  );
}
