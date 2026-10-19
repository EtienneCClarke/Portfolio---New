'use client';
// Layered outline echoes that converge into the solid word, then fly past the camera (driven by fxEcho).
// Each echo is a stroked copy with a #131414 fill on top, so glyph overlaps never show through.
import type { ReactNode } from 'react';
import { useHome } from './HomeContext';
import s from './EchoHeading.module.css';

const ECHO_N = [6, 5, 4, 3, 2, 1, 0];
const HIDDEN = { opacity: 0, visibility: 'hidden' } as const;
const CLEAR = { color: 'rgba(237,235,230,0)' } as const;

function Echoes({ text }: { text: string }) {
  return (
    <>
      {ECHO_N.map((j) => (
        <span key={j} data-echo={j} aria-hidden="true" className={s['echo-heading__layer']} style={HIDDEN}>
          <span className={s['echo-heading__stroke']}>{text}</span>
          <span className={s['echo-heading__fill']}>{text}</span>
        </span>
      ))}
    </>
  );
}

// "Selected work": decorative (the section has its own visually hidden h2).
export function WorkEcho() {
  const { wide } = useHome();
  const letters = 'Selected work'.split('').map((c) => (c === ' ' ? (wide ? ' ' : ' ') : c));
  return (
    <div data-echo-root="" className={s['echo-heading']}>
      <Echoes text="Selected work" />
      <span data-front-stroke="" className={`${s['echo-heading__stroke']} ${s['echo-heading__stroke--front']}`}>Selected work</span>
      <span className={s['echo-heading__fill']}>Selected work</span>
      <span className={s['echo-heading__letters']}>
        {letters.map((lt, i) => <span key={i} data-fill="" style={CLEAR}>{lt}</span>)}
      </span>
    </div>
  );
}

// "Services": the real section heading, letters revealed by fill.
export function ServicesEcho({ id }: { id: string }) {
  const { stage } = useHome();
  const masked = (c: string, i: number): ReactNode => (
    <span key={i} className={s['echo-heading__mask']}><span data-fill="" data-sl={i} className={s['echo-heading__letter']}>{c}</span></span>
  );
  return (
    <div data-echo-root="" data-svc-echo="" className={`${s['echo-heading']} ${s['echo-heading--services']}`}>
      <Echoes text="Services" />
      {stage && (
        <span aria-hidden="true" className={s['echo-heading__layer']}>
          <span data-front-stroke="" className={`${s['echo-heading__stroke']} ${s['echo-heading__stroke--front']}`}>Services</span>
          <span className={s['echo-heading__fill']}>Services</span>
        </span>
      )}
      <h2 id={id} aria-label="Services" className={s['echo-heading__title']}>{'Services'.split('').map(masked)}</h2>
    </div>
  );
}
