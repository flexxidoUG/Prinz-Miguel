import { useLayoutEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Content } from '../api';
import type { ScepterApi } from './scepter3d';

const START = 0.4; // progress where the information chapters begin
const chapterAt = (p: number) => (p < START ? -1 : Math.min(2, Math.floor((p - START) / 0.2)));

export function ScepterSection({ content }: { content: Content }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef<ScrollTrigger>();
  const api = useRef<ScepterApi>();
  const [chapter, setChapter] = useState(-1);
  const [phase, setPhase] = useState(0);
  const [failed, setFailed] = useState(false);
  const s = content.scepter;

  const goTo = (i: number) => {
    const t = st.current;
    if (!t) return;
    window.scrollTo({ top: t.start + (t.end - t.start) * (START + 0.2 * i + 0.1), behavior: 'smooth' });
  };

  useLayoutEffect(() => {
    const mobile = window.innerWidth < 860;
    st.current = ScrollTrigger.create({
      trigger: root.current, start: 'top top', end: () => `+=${window.innerHeight * 4}`, pin: stage.current, scrub: true, anticipatePin: 1,
      onUpdate: (self) => {
        api.current?.setProgress(self.progress);
        const c = chapterAt(self.progress);
        api.current?.setChapter(c);
        setChapter(c);
        setPhase(self.progress);
      },
    });
    let disposed = false;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || api.current) return;
      io.disconnect();
      try {
        const probe = document.createElement('canvas');
        if (!probe.getContext('webgl2') && !probe.getContext('webgl')) throw new Error('no webgl');
        const { createScepter } = await import('./scepter3d');
        if (disposed) return;
        api.current = await createScepter(canvas.current!, {
          modelUrl: content.media.scepterModel || undefined, mobile,
          onPick: () => goTo(Math.min(2, Math.max(0, chapterAt(st.current!.progress) + 1)) % 3),
        });
        api.current.setProgress(st.current!.progress);
      } catch {
        setFailed(true);
      }
    }, { rootMargin: '800px 0px' });
    io.observe(root.current!);
    return () => { disposed = true; io.disconnect(); st.current?.kill(); api.current?.dispose(); api.current = undefined; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const intro = 1 - Math.min(1, Math.max(0, (phase - 0.26) / 0.08));
  return (
    <section id="zepter" ref={root} className="sz" aria-label="Das Prinzenszepter">
      <div className="sz-stage" ref={stage}>
        <div className="sz-floor" aria-hidden />
        <canvas ref={canvas} className="sz-canvas" aria-label="Interaktives 3D-Prinzenszepter – ziehen zum Drehen" role="img" />
        {failed && (
          <div className="sz-fallback">
            <img src={content.media.scepterRef} alt="Das Prinzenszepter" />
            <p>Ihr Browser unterstützt kein WebGL – hier sehen Sie das Zepter als Foto.</p>
          </div>
        )}
        <div className="sz-intro" style={{ opacity: intro, transform: `translateY(${(1 - intro) * -30}px)` }}>
          <p className="kicker">Das Prinzenszepter</p>
          <h2 className="section-title">Zeichen der <em className="gold-text">närrischen Regentschaft</em></h2>
          <p className="sz-lead">{s.intro}</p>
          <p className="sz-hint"><span aria-hidden>⟲</span> Ziehen zum Drehen · Antippen für mehr</p>
        </div>

        <div className={`sz-panels ${chapter >= 0 ? 'is-on' : ''}`}>
          <div className="sz-tabs" role="tablist" aria-label="Kapitel">
            {[s.motto.kicker, s.session.kicker, s.team.kicker].map((label, i) => (
              <button key={i} role="tab" aria-selected={chapter === i} className={chapter === i ? 'is-active' : ''} onClick={() => goTo(i)}>
                <span className="sz-num">{['I', 'II', 'III'][i]}</span>{label}
              </button>
            ))}
          </div>
          <div className="sz-panel-wrap">
            <Panel on={chapter === 0}>
              <p className="kicker">{s.motto.kicker}</p>
              <p className="sz-motto">{s.motto.text}</p>
            </Panel>
            <Panel on={chapter === 1}>
              <p className="kicker">{s.session.kicker}</p>
              <h3 className="sz-h">{s.session.title}</h3>
              <p>{s.session.text}</p>
              <dl className="sz-list">
                {s.session.items.map((it, i) => (
                  <div key={i}><dt>{it.label}</dt><dd>{it.value}</dd></div>
                ))}
              </dl>
            </Panel>
            <Panel on={chapter === 2}>
              <p className="kicker">{s.team.kicker}</p>
              <p className="sz-h">{s.team.text}</p>
              <ul className="sz-team">
                {content.team.map((m) => (
                  <li key={m.key}><span>{m.title}</span>{m.name}</li>
                ))}
              </ul>
              <a className="pill pill--gold" href="#team">Zum Prinzenteam</a>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <div className={`sz-panel ${on ? 'is-on' : ''}`} aria-hidden={!on}>
      <svg className="sz-arc" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <path pathLength={1} d="M2 98 V30 Q2 2 50 2 Q98 2 98 30 V98" />
      </svg>
      <div className="sz-panel-body">{children}</div>
    </div>
  );
}
