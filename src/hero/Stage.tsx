// Static SVG markup of the hero stage. show.ts animates it frame by frame.
// Composition space: 1000 x 1000. Portrait (2:3) sits at x 290..710, y 95..725.
export const P = { x: 290, y: 95, w: 420, h: 630 };

type ElfProps = { id: string; c1: string; c2: string; hair: string; prop?: 'brush' | 'pole' };

function Elf({ id, c1, c2, hair, prop }: ElfProps) {
  const leg = (cls: string, x: number) => (
    <g transform={`translate(${x} -46)`}>
      <g className={cls}>
        <rect x="-5.5" y="-2" width="11" height="42" rx="5.5" fill="#3a0a12" />
        <path d="M-7 36 h12 q11 0 14 -8 q1 -4 -3 -2 q-3 5 -11 4 h-12z" fill="url(#hs-gold)" />
        <circle cx="19" cy="26" r="2.6" fill="url(#hs-gold)" />
      </g>
    </g>
  );
  const arm = (cls: string, x: number, back = false) => (
    <g transform={`translate(${x} -94)`}>
      <g className={cls}>
        {!back && prop === 'brush' && (
          <g>
            <rect x="-2.6" y="30" width="5.2" height="62" rx="2" fill="#6b3d1c" />
            <rect x="-5" y="90" width="10" height="9" rx="1.5" fill="url(#hs-gold)" />
            <path d="M-6.5 98 h13 l-2 22 q-4.5 6 -9 0z" fill="#f1cf7a" />
            <path d="M-4.6 112 h9.2 l-.9 8 q-3.7 4 -7.4 0z" fill="#d79a2b" />
          </g>
        )}
        {!back && prop === 'pole' && (
          <g>
            <rect className="pole" x="-2.2" y="30" width="4.4" height="200" rx="2" fill="url(#hs-steel)" />
            <g className="cloth" transform="translate(0 230)">
              <path d="M-15 -6 q-6 10 2 18 q8 9 20 2 q10 -6 6 -16 q-5 -12 -16 -10 q-8 1 -12 6z" fill="#fbf1dc" />
              <path d="M-10 0 q6 5 14 0 M-8 8 q7 4 13 -1" stroke="#d9c39a" strokeWidth="1.6" fill="none" />
            </g>
          </g>
        )}
        <rect x="-5.5" y="-2" width="11" height="34" rx="5.5" fill={back ? shade(c2) : c2} />
        <circle cx="0" cy="2" r="7.5" fill={back ? shade(c1) : c1} />
        <circle cx="0" cy="35" r="6.8" fill="#fffaf0" stroke="#e6dccb" strokeWidth="1" />
      </g>
    </g>
  );
  return (
    <g id={id} className="elf">
      <g className="pos">
        <ellipse className="shadow" cx="0" cy="0" rx="30" ry="6" fill="#000" opacity=".35" />
        <g className="lean">
          {leg('legL', -8)}
          {leg('legR', 8)}
          <g className="bob">
            {arm('armB', -14, true)}
            <path d="M0 -102 L-15 -101 Q-21 -80 -25 -47 L-19 -42 L-12.5 -47 L-6 -42 L0 -47Z" fill={c1} />
            <path d="M0 -102 L15 -101 Q21 -80 25 -47 L19 -42 L12.5 -47 L6 -42 L0 -47Z" fill={c2} />
            <path d="M0 -102 L-15 -101 Q-21 -80 -25 -47 L-19 -42 L-12.5 -47 L-6 -42 L0 -47 L6 -42 L12.5 -47 L19 -42 L25 -47 Q21 -80 15 -101Z" fill="url(#hs-shade)" />
            <rect x="-22" y="-67" width="44" height="6.5" rx="2" fill="url(#hs-gold)" />
            <rect x="-4" y="-68.5" width="8" height="9.5" rx="1.5" fill="none" stroke="#fff0b8" strokeWidth="1.6" />
            <circle cx="0" cy="-90" r="2.3" fill="url(#hs-gold)" />
            <circle cx="0" cy="-80" r="2.3" fill="url(#hs-gold)" />
            <circle cx="-23" cy="-44" r="2.2" fill="url(#hs-gold)" />
            <circle cx="23" cy="-44" r="2.2" fill="url(#hs-gold)" />
            {[-15, -9, -3, 3, 9, 15].map((x) => (
              <circle key={x} cx={x} cy="-101" r="4.8" fill="#fffaf0" stroke="#e3d6c0" strokeWidth=".8" />
            ))}
            <g transform="translate(0 -116)">
              <g className="head">
                <ellipse cx="-18.5" cy="1" rx="4" ry="5.5" fill="#efc3a4" />
                <ellipse cx="18.5" cy="1" rx="4" ry="5.5" fill="#efc3a4" />
                <circle r="19" fill="url(#hs-skin)" />
                <path d="M-17 -6 q3 -9 10 -10 q-2 5 2 6 q2 -6 9 -6 q-1 5 4 5 q4 -4 9 0 q-2 -10 -17 -12 q-15 1 -17 17z" fill={hair} />
                <circle cx="-10" cy="5" r="4.2" fill="#ec8a86" opacity=".45" />
                <circle cx="10" cy="5" r="4.2" fill="#ec8a86" opacity=".45" />
                <g className="eyes">
                  <ellipse cx="-6.8" cy="-1.5" rx="2.7" ry="3.5" fill="#2a1410" />
                  <ellipse cx="6.8" cy="-1.5" rx="2.7" ry="3.5" fill="#2a1410" />
                  <circle cx="-6" cy="-2.6" r=".95" fill="#fff" />
                  <circle cx="7.6" cy="-2.6" r=".95" fill="#fff" />
                </g>
                <ellipse cx="0" cy="3.5" rx="2.4" ry="2" fill="#e2a283" />
                <path className="smile" d="M-6.5 8 Q0 14 6.5 8" stroke="#8a2a1e" strokeWidth="2" fill="none" strokeLinecap="round" />
                <g className="mouthO" opacity="0">
                  <ellipse cx="0" cy="10" rx="5" ry="4.6" fill="#6b1515" />
                  <ellipse cx="0" cy="12.6" rx="3" ry="1.6" fill="#e0605f" />
                </g>
                <g className="cap">
                  <path d="M-17 -10 C-22 -32 -37 -44 -50 -31 C-39 -35 -27 -27 -3 -15Z" fill={c1} />
                  <path d="M17 -10 C22 -32 37 -44 50 -31 C39 -35 27 -27 3 -15Z" fill={c2} />
                  <path d="M-8 -14 C-7 -40 4 -54 15 -58 C7 -46 8 -31 8 -14Z" fill={shade(c1)} />
                  <circle cx="-50" cy="-31" r="4.6" fill="url(#hs-gold)" />
                  <circle cx="50" cy="-31" r="4.6" fill="url(#hs-gold)" />
                  <circle cx="15" cy="-58" r="4.2" fill="url(#hs-gold)" />
                  <path d="M-20 -9 Q0 -19 20 -9 L19 -2 Q0 -11 -19 -2Z" fill="url(#hs-gold)" />
                  {[-12, -4, 4, 12].map((x) => (
                    <circle key={x} cx={x} cy={-9 - (x === -4 || x === 4 ? 2 : 0.6)} r="1.6" fill={x % 8 === 0 ? '#c0182f' : '#fff6dc'} />
                  ))}
                </g>
              </g>
            </g>
            {arm('armF', 14)}
          </g>
        </g>
      </g>
    </g>
  );
}

const shade = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v * 0.72).toString(16).padStart(2, '0');
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
};

const star = 'M0 -10 C1.5 -2 2 -1.5 10 0 C2 1.5 1.5 2 0 10 C-1.5 2 -2 1.5 -10 0 C-2 -1.5 -1.5 -2 0 -10Z';

/** Frame outline (outer rect minus portrait window), even-odd. */
const FRAME = `M262 67 H738 V753 H262Z M${P.x} ${P.y} V${P.y + P.h} H${P.x + P.w} V${P.y}Z`;

export function Stage({ group }: { group: string }) {
  return (
    <svg className="hs-svg" viewBox="0 0 1000 1000" role="img" aria-label="Animierte Bühne: Karnevalshelfer enthüllen das Gruppenportrait">
      <defs>
        <linearGradient id="hs-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a5c18" />
          <stop offset=".28" stopColor="#f7dc8f" />
          <stop offset=".5" stopColor="#b88630" />
          <stop offset=".72" stopColor="#fff0b8" />
          <stop offset="1" stopColor="#8f6420" />
        </linearGradient>
        <linearGradient id="hs-framegrad" x1="262" y1="67" x2="738" y2="753" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7a5216" />
          <stop offset=".18" stopColor="#f6dc8e" />
          <stop offset=".36" stopColor="#a87925" />
          <stop offset=".55" stopColor="#ffefb8" />
          <stop offset=".75" stopColor="#9a6d23" />
          <stop offset="1" stopColor="#e9c26a" />
        </linearGradient>
        <linearGradient id="hs-shine" x1="0" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hs-steel" x1="0" x2="1">
          <stop offset="0" stopColor="#6a4a2a" />
          <stop offset=".5" stopColor="#c99b60" />
          <stop offset="1" stopColor="#5a3a1e" />
        </linearGradient>
        <linearGradient id="hs-wood" x1="0" x2="1">
          <stop offset="0" stopColor="#5b2e12" />
          <stop offset=".5" stopColor="#a8682f" />
          <stop offset="1" stopColor="#4a240e" />
        </linearGradient>
        <linearGradient id="hs-shade" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".28" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".12" />
          <stop offset="1" stopColor="#000" stopOpacity=".3" />
        </linearGradient>
        <radialGradient id="hs-skin" cx=".4" cy=".35" r=".75">
          <stop offset="0" stopColor="#ffe3cf" />
          <stop offset="1" stopColor="#eab593" />
        </radialGradient>
        <radialGradient id="hs-gem" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#ff8a96" />
          <stop offset=".45" stopColor="#c0102a" />
          <stop offset="1" stopColor="#4d0410" />
        </radialGradient>
        <linearGradient id="hs-conegrad" x1="0" x2="1">
          <stop offset="0" stopColor="#fff2c8" stopOpacity=".75" />
          <stop offset="1" stopColor="#ffd77a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hs-topcone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4d0" stopOpacity=".6" />
          <stop offset="1" stopColor="#ffd77a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hs-sweep" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".85" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hs-burst">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".7" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id="hs-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="hs-ghost">
          <feColorMatrix type="matrix" values=".33 .33 .33 0 .1  .3 .3 .3 0 .07  .25 .25 .25 0 .04  0 0 0 .26 0" />
        </filter>
        <mask id="hs-mask" maskUnits="userSpaceOnUse" x={P.x} y={P.y} width={P.w} height={P.h}>
          <g id="hs-reveal" filter="url(#hs-soft)" fill="#fff" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
          <rect id="hs-sweeprect" x={P.x - 60} y={P.y} width="0" height={P.h} fill="url(#hs-sweep)" />
          <rect id="hs-full" x={P.x} y={P.y} width={P.w} height={P.h} fill="#fff" opacity="0" />
        </mask>
        <clipPath id="hs-clip">
          <rect x={P.x} y={P.y} width={P.w} height={P.h} />
        </clipPath>
      </defs>

      {/* floor */}
      <rect x="-200" y="880" width="1400" height="160" fill="url(#hs-floor)" />
      <linearGradient id="hs-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3d0d14" />
        <stop offset="1" stopColor="#120306" />
      </linearGradient>
      <rect x="-200" y="878" width="1400" height="4" fill="url(#hs-gold)" opacity=".55" />
      <g id="hs-foot">
        {Array.from({ length: 11 }, (_, i) => (
          <ellipse key={i} cx={60 + i * 88} cy="985" rx="22" ry="5" fill="#ffe4a0" opacity=".9" />
        ))}
      </g>


      {/* easel */}
      <g fill="url(#hs-wood)">
        <path d="M330 700 l14 0 l-40 200 l-14 0z" />
        <path d="M656 700 l14 0 l40 200 l-14 0z" />
        <rect x="300" y="722" width="400" height="12" rx="3" />
      </g>

      {/* portrait: linen canvas, ghosted sketch, revealed original */}
      <rect x={P.x} y={P.y} width={P.w} height={P.h} fill="#efe3c8" />
      <image href={group} x={P.x} y={P.y} width={P.w} height={P.h} preserveAspectRatio="xMidYMid slice" filter="url(#hs-ghost)" />
      <image id="hs-photo" href={group} x={P.x} y={P.y} width={P.w} height={P.h} preserveAspectRatio="xMidYMid slice" mask="url(#hs-mask)" />
      <g id="hs-splat" clipPath="url(#hs-clip)" opacity="0">
        <path d="M500 610 q30 -40 60 -10 q40 -10 30 30 q40 20 0 50 q10 40 -40 30 q-30 30 -60 0 q-50 10 -40 -40 q-40 -30 10 -50 q0 -30 40 -10z" fill="#f2c45a" />
        <circle cx="610" cy="600" r="12" fill="#f2c45a" />
        <circle cx="395" cy="700" r="9" fill="#f2c45a" />
        <circle cx="540" cy="560" r="7" fill="#f2c45a" />
      </g>
      <g id="hs-rings" fill="none" stroke="#ffe7a3" />

      {/* frame (lowered from the rigging) */}
      <g id="hs-frame">
        <line id="hs-ropes1" x1="300" y1="67" x2="300" y2="-1400" stroke="#c8a56a" strokeWidth="3" />
        <line id="hs-ropes2" x1="700" y1="67" x2="700" y2="-1400" stroke="#c8a56a" strokeWidth="3" />
        <path d={FRAME} fill="url(#hs-framegrad)" fillRule="evenodd" />
        <path d={FRAME} fill="url(#hs-shine)" fillRule="evenodd" id="hs-shinepath" opacity="0" style={{ mixBlendMode: 'screen' }} />
        <rect x="270" y="75" width="460" height="670" fill="none" stroke="#6b4714" strokeWidth="2" />
        <rect x="277" y="82" width="446" height="656" fill="none" stroke="#fff3c4" strokeWidth="5" strokeDasharray="0 13" strokeLinecap="round" />
        <rect x="286" y="91" width="428" height="638" fill="none" stroke="#5a3a0e" strokeWidth="3" />
        {[[262, 67], [738, 67], [262, 753], [738, 753]].map(([x, y]) => (
          <g key={`${x}${y}`} transform={`translate(${x} ${y})`}>
            <circle r="22" fill="url(#hs-gold)" stroke="#6b4714" strokeWidth="1.5" />
            <circle r="9" fill="url(#hs-gem)" />
            <circle cx="-3" cy="-3" r="2.4" fill="#fff" opacity=".8" />
          </g>
        ))}
        <g transform="translate(500 62)">
          <path d="M-60 8 L-48 -28 L-24 -6 L0 -44 L24 -6 L48 -28 L60 8Z" fill="url(#hs-gold)" stroke="#6b4714" strokeWidth="1.5" />
          <circle cy="-48" r="7" fill="url(#hs-gold)" />
          <circle cx="-50" cy="-32" r="5.5" fill="url(#hs-gold)" />
          <circle cx="50" cy="-32" r="5.5" fill="url(#hs-gold)" />
          <circle cy="-6" r="9" fill="url(#hs-gem)" />
        </g>
        <g id="hs-plaque" transform="translate(500 778)">
          <rect x="-150" y="-20" width="300" height="40" rx="6" fill="url(#hs-gold)" stroke="#6b4714" strokeWidth="1.5" />
          <text className="hs-plaque-text" textAnchor="middle" y="8">
            <tspan id="hs-pl-laura" opacity="0">Laura · </tspan>
            <tspan id="hs-pl-miguel" opacity="0">Miguel I.</tspan>
            <tspan id="hs-pl-louisa" opacity="0"> · Louisa</tspan>
          </text>
        </g>
      </g>
      <g id="hs-sparkles" fill="#fff6d6" />

      {/* props */}
      <g id="hs-ladder">
        <rect x="-26" y="-528" width="9" height="528" rx="3" fill="url(#hs-wood)" />
        <rect x="17" y="-528" width="9" height="528" rx="3" fill="url(#hs-wood)" />
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x="-20" y={-30 - i * 50} width="40" height="7" rx="2" fill="#8a5426" />
        ))}
      </g>
      <g id="hs-lamp">
        <path d="M0 -92 L-30 0 M0 -92 L30 0 M0 -92 L0 0" stroke="#2a1a14" strokeWidth="5" strokeLinecap="round" />
        <g id="hs-lamphead" transform="translate(0 -104)">
          <rect x="-26" y="-20" width="44" height="40" rx="8" fill="#2a1418" stroke="url(#hs-gold)" strokeWidth="3" />
          <ellipse id="hs-lens" cx="19" cy="0" rx="6" ry="17" fill="#5a4a3a" />
        </g>
      </g>
      {[['hs-cannonL', 1], ['hs-cannonR', -1]].map(([id, f]) => (
        <g key={id} id={id as string} transform={`translate(${f === 1 ? 52 : 948} 900) scale(${f} 1)`}>
          <g className="barrel" transform="translate(0 -34) rotate(-48)">
            <rect x="-14" y="-17" width="78" height="34" rx="12" fill="#8e1020" stroke="url(#hs-gold)" strokeWidth="3" />
            <rect x="56" y="-21" width="14" height="42" rx="5" fill="url(#hs-gold)" />
            <rect x="12" y="-17" width="7" height="34" fill="url(#hs-gold)" />
            <rect x="32" y="-17" width="7" height="34" fill="#fff6dc" />
          </g>
          <circle cy="-20" r="20" fill="#3a1a10" stroke="url(#hs-gold)" strokeWidth="4" />
          <circle cy="-20" r="5" fill="url(#hs-gold)" />
        </g>
      ))}
      <g id="hs-bucket">
        <path d="M-17 0 L-13 34 H13 L17 0Z" fill="#c0182f" stroke="url(#hs-gold)" strokeWidth="2.5" />
        <ellipse cy="0" rx="17" ry="5" fill="#f2c45a" />
        <path d="M-17 0 Q0 -26 17 0" fill="none" stroke="#3a2a1a" strokeWidth="2.2" />
      </g>
      <line id="hs-rope" x1="0" y1="0" x2="0" y2="0" stroke="#c8a56a" strokeWidth="3" />

      <Elf id="elfC" c1="#c0182f" c2="#fff4dc" hair="#4a2a14" />
      <Elf id="elfD" c1="#7a0f1d" c2="#e8b84e" hair="#8a4a1e" />
      <Elf id="elfB" c1="#fff4dc" c2="#b5162b" hair="#2e1a10" prop="pole" />
      <Elf id="elfA" c1="#e8b84e" c2="#b5162b" hair="#5a2e12" prop="brush" />
      <g id="hs-stars" fill="#ffe08a" />
      <g id="hs-puffs" fill="#ffe7a3" />

      <rect id="hs-dark" x="-200" y="-200" width="1400" height="1400" fill="#0d0205" opacity=".7" pointerEvents="none" />
      {/* top spots (Bühne frei) */}
      <g id="hs-topspots" style={{ mixBlendMode: 'screen' }} opacity="0">
        <path d="M300 -40 L320 -40 L560 900 L120 900Z" fill="url(#hs-topcone)" />
        <path d="M680 -40 L700 -40 L880 900 L440 900Z" fill="url(#hs-topcone)" />
      </g>
      <g id="hs-conewrap">
          <g id="hs-cone" opacity="0" style={{ mixBlendMode: 'screen' }}>
            <path d="M18 -14 L760 -230 L760 230 L18 14Z" fill="url(#hs-conegrad)" opacity=".55" />
            <path d="M18 -9 L760 -120 L760 120 L18 9Z" fill="url(#hs-conegrad)" />
          </g>
      </g>
    </svg>
  );
}

export { star };
