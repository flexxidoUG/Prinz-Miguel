import { useEffect, useRef, useState } from 'react';
import type { Content } from '../api';
import { confetti, COLORS, reducedMotion } from '../confetti';
import { Elf, Stage } from './Stage';
import { createShow, SHOW_END, type ShowEvent } from './show';

type Mode = 'audio' | 'muted' | 'paused' | 'done';

/** Global handle so the nav can toggle sound. */
export const heroAudio: { toggle?: () => void; listeners: Set<(on: boolean) => void> } = { listeners: new Set() };

export function Hero({ content }: { content: Content }) {
  const root = useRef<HTMLElement>(null);
  const svgWrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const textCol = useRef<HTMLDivElement>(null);
  const crewSvg = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<Mode>('muted');
  const [soundOn, setSoundOn] = useState(false);
  const api = useRef<{ play: (withSound: boolean) => void; pause: () => void; replay: (withSound?: boolean) => void; skip: () => void; sound: (on: boolean) => void }>();

  useEffect(() => {
    const svg = svgWrap.current!.querySelector('svg')!;
    const a = audio.current!;
    const fire = confetti.create(canvas.current!, { resize: true, useWorker: true });
    const onEvent = (e: ShowEvent) => {
      const r = svg.getBoundingClientRect(), c = canvas.current!.getBoundingClientRect();
      const origin = { x: (r.left - c.left + (e.x / 1000) * r.width) / c.width, y: (r.top - c.top + (e.y / 1000) * r.height) / c.height };
      const big = e.kind !== 'test';
      fire({ particleCount: big ? 140 : 24, angle: e.angle, spread: big ? 55 : 30, startVelocity: big ? 62 : 28, origin, colors: COLORS, scalar: big ? 1.1 : 0.8, ticks: 260, gravity: 0.9 });
      if (e.kind === 'alaaf' && e.angle < 90) fire({ particleCount: 120, spread: 160, startVelocity: 38, origin: { x: origin.x + (r.width / 2 / c.width) * 0.9, y: 0.05 }, colors: COLORS, ticks: 320 });
    };
    const lines = [...textCol.current!.querySelectorAll<HTMLElement>('.hero-line > span')];
    const render = createShow(svg, content.hero.cues, onEvent, { svg: crewSvg.current!, lines, text: textCol.current! });
    const relayout = () => { render.layout(); render(t); };
    const ro = new ResizeObserver(relayout);
    ro.observe(textCol.current!);
    const relayoutLate = setTimeout(relayout, 2600); // after the line reveal animation settles

    let t = 0, virtStart = performance.now(), m: Mode = 'muted', raf = 0, visible = true;
    const dur = () => (Number.isFinite(a.duration) ? a.duration : 35.64);
    const setM = (v: Mode) => { m = v; setMode(v); };
    const clock = () => {
      if (m === 'audio' && !a.paused && !a.ended) return a.currentTime;
      if (m === 'audio' || m === 'muted') return (performance.now() - virtStart) / 1000;
      return t;
    };
    const frame = () => {
      t = clock();
      if (visible || m === 'done') {
        const { glow } = render(t);
        root.current!.style.setProperty('--glow', glow.toFixed(3));
        if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, t / dur())})`;
      }
      if (t > SHOW_END + 0.2 && (m === 'muted' || (m === 'audio' && a.ended))) {
        setM('done');
        render(SHOW_END + 1);
        return;
      }
      if (m !== 'paused' && m !== 'done') raf = requestAnimationFrame(frame);
    };
    const loop = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); };
    const startVirtual = (from: number) => { virtStart = performance.now() - from * 1000; };

    const sound = (on: boolean) => {
      setSoundOn(on);
      heroAudio.listeners.forEach((l) => l(on));
      if (on) {
        if (m === 'done') { replay(true); return; }
        if (t < dur()) {
          a.currentTime = t;
          a.muted = false;
          a.play().then(() => { setM('audio'); loop(); }).catch(() => setSoundOn(false));
        }
      } else {
        a.muted = true;
        startVirtual(t);
        a.pause();
        if (m === 'audio') setM('muted');
        loop();
      }
    };
    const replay = (withSound = soundRef.on) => {
      t = 0; startVirtual(0); a.currentTime = 0;
      if (withSound) {
        a.muted = false;
        a.play().then(() => { setM('audio'); setSoundOn(true); }).catch(() => { setM('muted'); setSoundOn(false); });
      }
      setM(withSound ? 'audio' : 'muted');
      loop();
    };
    const pause = () => { a.pause(); setM('paused'); cancelAnimationFrame(raf); };
    const play = (withSound: boolean) => {
      if (m === 'done') return replay(withSound);
      startVirtual(t);
      if (withSound && t < dur()) { a.currentTime = t; a.muted = false; a.play().then(() => setM('audio')).catch(() => setM('muted')); setM('audio'); }
      else setM('muted');
      loop();
    };
    const skip = () => { a.pause(); t = SHOW_END + 1; setM('done'); render(t); root.current!.style.setProperty('--glow', '1'); if (bar.current) bar.current.style.transform = 'scaleX(1)'; };
    const soundRef = { on: false };
    heroAudio.listeners.add((on) => (soundRef.on = on));
    api.current = { play, pause, replay, skip, sound };
    heroAudio.toggle = () => sound(!soundRef.on);
    if (location.search.includes('debug')) Object.assign(window, { __show: { render, pause, skip } });

    a.addEventListener('ended', () => { startVirtual(t); });

    const seen = sessionStorageGet('show-seen');
    if (reducedMotion() || (content.hero.playOncePerVisit && seen)) {
      skip();
    } else {
      sessionStorageSet('show-seen', '1');
      startVirtual(0);
      loop();
      if (content.hero.autoplay) {
        a.muted = false;
        a.play()
          .then(() => { a.currentTime = 0; startVirtual(0); setM('audio'); soundRef.on = true; setSoundOn(true); heroAudio.listeners.forEach((l) => l(true)); })
          .catch(() => {
            // Autoplay with sound blocked: run silently and switch sound on at the first real interaction.
            const first = (ev: Event) => {
              if ((ev.target as HTMLElement)?.closest?.('[data-no-autosound]')) return;
              off();
              if (m !== 'done' && m !== 'paused' && !soundRef.on) sound(true);
            };
            const off = () => ['pointerdown', 'keydown'].forEach((k) => window.removeEventListener(k, first, true));
            ['pointerdown', 'keydown'].forEach((k) => window.addEventListener(k, first, true));
          });
      }
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!visible && m === 'audio') { /* keep music running while the visitor scrolls on */ }
    });
    io.observe(root.current!);
    const onVis = () => { if (document.hidden && m === 'muted') pause(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { ro.disconnect(); clearTimeout(relayoutLate); cancelAnimationFrame(raf); io.disconnect(); a.pause(); document.removeEventListener('visibilitychange', onVis); fire.reset(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const h = content.hero;
  return (
    <section id="start" ref={root} className="hero" aria-label="Startseite">
      <div className="hero-curtain hero-curtain--l" aria-hidden />
      <div className="hero-curtain hero-curtain--r" aria-hidden />
      <div className="hero-valance" aria-hidden />
      <div className="hero-glow" aria-hidden />
      <div className="hero-inner">
        <div className="hero-text" ref={textCol}>
          <svg ref={crewSvg} className="hero-crew" aria-hidden>
            <line id="cr-rope" stroke="#c8a56a" strokeWidth="2.2" />
            <g id="cr-sparks" fill="#fff6d6" />
            <Elf id="elfE" c1="#b5162b" c2="#fff4dc" hair="#3a2010" prop="pole" />
            <g className="crew-f">
              <g id="cr-sign" opacity="0">
                <rect x="-2" y="-70" width="4" height="70" fill="#6b3d1c" />
                <rect x="-66" y="-118" width="132" height="50" rx="10" fill="#fbf1dc" stroke="url(#hs-gold)" strokeWidth="4" />
                <text x="0" y="-85" textAnchor="middle" className="cr-sign-text" />
              </g>
              <Elf id="elfF" c1="#e8b84e" c2="#7a0f1d" hair="#6b3a1e" />
            </g>
          </svg>
          <p className="kicker hero-kicker">{content.site.sessionLabel}</p>
          <h1 className="hero-lines">
            {h.lines.map((l, i) => (
              <span key={i} className="hero-line" style={{ animationDelay: `${0.5 + i * 0.45}s` }}>
                <span>{l}</span>
              </span>
            ))}
          </h1>
          <p className="hero-welcome">{h.welcome}</p>
          <div className="hero-controls" data-no-autosound>
            <button className="pill pill--gold" onClick={() => api.current?.sound(!soundOn)} aria-pressed={soundOn}>
              <SoundIcon on={soundOn} /> {soundOn ? 'Ton aus' : 'Ton an'}
            </button>
            {mode === 'paused' || mode === 'done' ? (
              <button className="pill" onClick={() => (mode === 'done' ? api.current?.replay(soundOn) : api.current?.play(soundOn))}>
                {mode === 'done' ? '↺ Show erneut abspielen' : '▶ Weiter'}
              </button>
            ) : (
              <>
                <button className="pill" onClick={() => api.current?.pause()} aria-label="Show pausieren">❚❚</button>
                <button className="pill pill--ghost" onClick={() => api.current?.skip()}>Überspringen</button>
              </>
            )}
            <div className="hero-progress" aria-hidden><div ref={bar} /></div>
          </div>
        </div>
        <div className="hero-stage" ref={svgWrap}>
          <Stage group={content.media.group} />
        </div>
      </div>
      <canvas ref={canvas} className="hero-confetti" aria-hidden />
      <a className="scroll-cue" href="#team" aria-label="Weiter zum Prinzenteam"><span /></a>
      <audio ref={audio} src={content.media.audio} preload="auto" />
    </section>
  );
}

export function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {on ? <path d="M16 8.5a5 5 0 0 1 0 7M18.8 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
    </svg>
  );
}

function sessionStorageGet(k: string) { try { return sessionStorage.getItem(k); } catch { return null; } }
function sessionStorageSet(k: string, v: string) { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } }
