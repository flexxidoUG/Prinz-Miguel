import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { Content } from '../api';
import { celebrate, reducedMotion } from '../confetti';

export function Finale({ content }: { content: Content }) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (reducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 75%', end: 'center center', scrub: 1 } });
      tl.from('.fi-photo', { scale: 0.7, rotateX: 18, y: 120, filter: 'brightness(.3)', ease: 'power2.out' })
        .from('.fi-ray', { scaleY: 0, autoAlpha: 0, stagger: 0.05 }, 0)
        .from('.fi-curtain--l', { xPercent: 0 }, 0)
        .from('.fi-curtain--r', { xPercent: 0 }, 0);
      gsap.from('.fi-motto .ch', {
        yPercent: 120, rotateX: -90, autoAlpha: 0, stagger: 0.025, duration: 1, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: '.fi-motto', start: 'top 80%' },
      });
      gsap.from('.fi-actions > *', { y: 30, autoAlpha: 0, stagger: 0.12, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.fi-actions', start: 'top 92%' } });
    }, root);
    let last = 0;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && Date.now() - last > 8000) { last = Date.now(); setTimeout(() => celebrate({ x: 0.5, y: 0.45 }, 1.6), 400); }
    }, { threshold: 0.7 });
    io.observe(root.current!.querySelector('.fi-motto')!);
    return () => { ctx.revert(); io.disconnect(); };
  }, []);
  const motto = content.scepter.motto.text;
  return (
    <section className="fi" ref={root} aria-label="Finale">
      <div className="fi-rays" aria-hidden>{Array.from({ length: 7 }, (_, i) => <span key={i} className="fi-ray" style={{ ['--i' as string]: i }} />)}</div>
      <div className="fi-curtain fi-curtain--l" aria-hidden />
      <div className="fi-curtain fi-curtain--r" aria-hidden />
      <div className="fi-inner">
        <img className="fi-photo" src={content.media.group} alt="Kinderprinz Miguel I. mit Laura und Louisa" loading="lazy" />
        <p className="kicker fi-kick">{content.finale.kicker} · {content.finale.text}</p>
        <h2 className="fi-motto" aria-label={motto}>
          {motto.split(' ').map((w, i) => (
            <span key={i} className="fi-word" aria-hidden>{[...w].map((c, j) => <span key={j} className="ch">{c}</span>)}</span>
          ))}
        </h2>
        <div className="fi-actions">
          <a className="pill pill--gold btn-lg" href="#termine">Unsere nächsten Auftritte</a>
          <a className="pill btn-lg" href="#gaestebuch">Karnevalsgruß hinterlassen</a>
        </div>
      </div>
    </section>
  );
}
