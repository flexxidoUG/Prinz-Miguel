import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { Content, Member } from '../api';
import { reducedMotion } from '../confetti';

const Chars = ({ text }: { text: string }) => (
  <span className="chars" aria-label={text}>
    {[...text].map((c, i) => <span key={i} className="ch" aria-hidden>{c === ' ' ? ' ' : c}</span>)}
  </span>
);

function Info({ m }: { m: Member }) {
  return (
    <div className="tm-text">
      <p className="kicker tm-kick">{m.title}</p>
      <h3 className="tm-name"><Chars text={m.name} /></h3>
      {m.motto && <p className="tm-motto">„{m.motto}“</p>}
      <p className="tm-body">{m.text}</p>
      {m.facts.length > 0 && (
        <dl className="tm-facts">
          {m.facts.map((f, i) => (
            <div key={i} className="tm-fact"><dt>{f.label}</dt><dd>{f.value}</dd></div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function Team({ content }: { content: Content }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [miguel, laura, louisa] = content.team;
  const photos = { miguel: content.media.miguel, laura: content.media.laura, louisa: content.media.louisa };

  useLayoutEffect(() => {
    if (reducedMotion()) { root.current!.classList.add('tm--static'); return; }
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(stage.current);
      const cv = canvas.current!, g = cv.getContext('2d')!;
      const N = window.innerWidth < 700 ? 320 : 700;
      type Pt = { sx: number; sy: number; mx: number; my: number; tx: number; ty: number; r: number; c: string; d: number };
      let pts: Pt[] = [];
      const measure = () => {
        const s = stage.current!.getBoundingClientRect();
        const dpr = Math.min(devicePixelRatio, 2);
        cv.width = s.width * dpr; cv.height = s.height * dpr;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const rect = (sel: string) => { const r = q(sel)[0].getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; };
        const a = rect('.tm-scene--laura .tm-slot'), b = rect('.tm-scene--louisa .tm-slot');
        const cols = ['#f3d48a', '#d4a64a', '#fff1c4', '#c99a3e', '#ffe7a3'];
        pts = Array.from({ length: N }, (_, i) => {
          const sx = a.x + Math.random() * a.w, sy = a.y + Math.random() * a.h;
          const ang = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 380;
          const th = (i / N) * Math.PI * 2, jit = 1 + (Math.random() - 0.5) * 0.08;
          return {
            sx, sy, mx: sx + Math.cos(ang) * dist, my: sy + Math.sin(ang) * dist * 0.6,
            tx: b.x + b.w / 2 + Math.cos(th) * (b.w / 2) * jit, ty: b.y + b.h / 2 + Math.sin(th) * (b.h / 2) * jit,
            r: 0.6 + Math.random() * 1.8, c: cols[i % cols.length], d: Math.random() * 0.15,
          };
        });
      };
      const io = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
      const o3 = (x: number) => 1 - (1 - x) ** 3;
      const pState = { p: 0, a: 0 };
      const draw = () => {
        const { width, height } = stage.current!.getBoundingClientRect();
        g.clearRect(0, 0, width, height);
        if (pState.a <= 0.01) return;
        g.globalCompositeOperation = 'lighter';
        for (const p of pts) {
          const k = Math.min(1, Math.max(0, (pState.p - p.d) / (1 - p.d)));
          let x, y;
          if (k < 0.45) { const e = o3(k / 0.45); x = p.sx + (p.mx - p.sx) * e; y = p.sy + (p.my - p.sy) * e; }
          else { const e = io((k - 0.45) / 0.55); x = p.mx + (p.tx - p.mx) * e; y = p.my + (p.ty - p.my) * e; }
          g.globalAlpha = pState.a * (0.55 + 0.45 * Math.sin(k * 9 + p.r * 5) ** 2);
          g.fillStyle = p.c;
          g.beginPath(); g.arc(x, y, p.r * (1 + Math.sin(k * Math.PI)), 0, 6.283); g.fill();
        }
      };

      gsap.set(q('.tm-scene--miguel .tm-photo, .tm-scene--laura, .tm-scene--louisa'), { autoAlpha: 0 });
      gsap.set(q('.tm-scene--miguel .tm-photo'), { autoAlpha: 1, clipPath: 'circle(0% at 50% 22%)' });
      gsap.set(q('.tm-scene--louisa .tm-photo'), { clipPath: 'ellipse(0% 0% at 50% 50%)' });
      gsap.set(q('.tm-scene--laura .tm-card'), { rotateY: 68, xPercent: 30, z: -200, autoAlpha: 0 });
      gsap.set(q('.tm-text .ch'), { yPercent: 110 });
      gsap.set(q('.tm-scene--laura .ch'), { yPercent: 0, xPercent: -60, skewX: 24, autoAlpha: 0 });
      gsap.set(q('.tm-scene--louisa .ch'), { yPercent: -60, filter: 'blur(10px)', autoAlpha: 0 });
      gsap.set(q('.tm-kick, .tm-motto, .tm-body, .tm-fact'), { autoAlpha: 0, y: 26 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: () => `+=${window.innerHeight * 5.2}`, scrub: 0.8, pin: stage.current,
          anticipatePin: 1, invalidateOnRefresh: true, onRefresh: () => { measure(); draw(); },
        },
      });
      const textIn = (scene: string, at: number, chars: gsap.TweenVars) => {
        tl.to(q(`${scene} .tm-kick`), { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, at)
          .to(q(`${scene} .ch`), { ...chars, duration: 0.7, stagger: 0.045, ease: 'power3.out' }, at + 0.1)
          .to(q(`${scene} .tm-motto, ${scene} .tm-body, ${scene} .tm-fact`), { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, at + 0.45);
      };

      // 0 → intro: the group portrait from the hero, then zoom into Miguel
      tl.to(q('.tm-intro-photo'), { scale: 2.1, yPercent: 22, duration: 1.3, ease: 'power2.in' }, 0.4)
        .to(q('.tm-intro-head'), { autoAlpha: 0, y: -50, duration: 0.6 }, 0.4)
        .to(q('.tm-intro'), { autoAlpha: 0, duration: 0.4 }, 1.4)
        .to(q('.tm-scene--miguel .tm-photo'), { clipPath: 'circle(85% at 50% 45%)', duration: 1.1, ease: 'power2.inOut' }, 1.2)
        .fromTo(q('.tm-scene--miguel .tm-photo img'), { scale: 1.35 }, { scale: 1, duration: 1.6, ease: 'power2.out' }, 1.2)
        .fromTo(q('.tm-band'), { xPercent: -160 }, { xPercent: 560, duration: 1.4, stagger: 0.14, ease: 'power1.inOut' }, 1.3);
      textIn('.tm-scene--miguel', 2.1, { yPercent: 0, rotate: 0 });

      // Miguel → Laura: page turn in 3D, ribbons draw themselves around the portrait
      tl.to(q('.tm-scene--miguel .tm-photo'), { rotateY: -70, z: -300, xPercent: -20, autoAlpha: 0, duration: 1.1, ease: 'power2.in' }, 4.0)
        .to(q('.tm-scene--miguel .tm-text > *'), { y: -60, autoAlpha: 0, stagger: 0.05, duration: 0.6, ease: 'power2.in' }, 4.0)
        .set(q('.tm-scene--laura'), { autoAlpha: 1 }, 4.5)
        .to(q('.tm-scene--laura .tm-card'), { rotateY: 0, xPercent: 0, z: 0, autoAlpha: 1, duration: 1.2, ease: 'power3.out' }, 4.6)
        .fromTo(q('.tm-ribbon path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.5, stagger: 0.2, ease: 'power1.inOut' }, 4.6)
        .fromTo(q('.tm-scene--laura .tm-card img'), { xPercent: -6 }, { xPercent: 4, duration: 3, ease: 'none' }, 4.6);
      textIn('.tm-scene--laura', 5.3, { xPercent: 0, skewX: 0, autoAlpha: 1 });

      // Laura → Louisa: the scene dissolves into gold particles that form Louisa's oval
      tl.to(q('.tm-scene--laura .tm-card'), { autoAlpha: 0, scale: 0.92, filter: 'blur(14px) brightness(1.6)', duration: 0.9 }, 7.0)
        .to(q('.tm-scene--laura .tm-text, .tm-scene--laura .tm-ribbon'), { autoAlpha: 0, filter: 'blur(10px)', duration: 0.8 }, 7.0)
        .to(pState, { a: 1, duration: 0.3, onUpdate: draw }, 6.95)
        .to(pState, { p: 1, duration: 1.6, ease: 'none', onUpdate: draw }, 6.95)
        .set(q('.tm-scene--louisa'), { autoAlpha: 1 }, 8.1)
        .to(q('.tm-scene--louisa .tm-photo'), { clipPath: 'ellipse(72% 72% at 50% 50%)', duration: 1.0, ease: 'power2.inOut' }, 8.45)
        .to(pState, { a: 0, duration: 0.7, onUpdate: draw }, 8.9)
        .fromTo(q('.tm-scene--louisa .tm-photo img'), { scale: 1.25, filter: 'brightness(1.8)' }, { scale: 1, filter: 'brightness(1)', duration: 1.2, ease: 'power2.out' }, 8.45);
      textIn('.tm-scene--louisa', 9.0, { yPercent: 0, filter: 'blur(0px)', autoAlpha: 1 });
      tl.to({}, { duration: 0.9 }, 10.2);
    }, root);
    return () => ctx.revert();
  }, [content]);

  return (
    <section id="team" ref={root} className="tm" aria-label="Unser Prinzenteam">
      <div className="tm-stage" ref={stage}>
        <div className="tm-intro">
          <div className="tm-intro-head">
            <p className="kicker">Unser Prinzenteam</p>
            <h2 className="section-title">Ein Prinz. <em className="gold-text">Zwei Paginnen.</em></h2>
          </div>
          <img className="tm-intro-photo" src={content.media.group} alt={`Gruppenportrait: ${louisa.name}, ${miguel.name}, ${laura.name}`} />
        </div>

        <div className="tm-scene tm-scene--miguel">
          <Info m={miguel} />
          <div className="tm-slot">
            <div className="tm-photo tm-photo--arch">
              <img src={photos.miguel} alt={`${miguel.title} ${miguel.name}`} loading="lazy" />
              <span className="tm-band" /><span className="tm-band" /><span className="tm-band" />
            </div>
          </div>
        </div>

        <div className="tm-scene tm-scene--laura">
          <div className="tm-slot">
            <svg className="tm-ribbon tm-ribbon--back" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden>
              <path pathLength={1} d="M-60 120 C 120 40, 300 220, 460 90" />
            </svg>
            <div className="tm-card">
              <div className="tm-photo"><img src={photos.laura} alt={`${laura.title} ${laura.name}`} loading="lazy" /></div>
            </div>
            <svg className="tm-ribbon tm-ribbon--front" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden>
              <path pathLength={1} d="M-60 520 C 100 380, 260 640, 460 470" />
              <path pathLength={1} className="red" d="M-60 560 C 120 430, 280 690, 460 520" />
            </svg>
          </div>
          <Info m={laura} />
        </div>

        <div className="tm-scene tm-scene--louisa">
          <Info m={louisa} />
          <div className="tm-slot">
            <div className="tm-photo tm-photo--oval"><img src={photos.louisa} alt={`${louisa.title} ${louisa.name}`} loading="lazy" /></div>
          </div>
        </div>
        <canvas ref={canvas} className="tm-particles" aria-hidden />
      </div>
    </section>
  );
}
