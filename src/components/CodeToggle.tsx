'use client';
// Ardoda code excerpt with a Code / Plain English toggle; each line cross-fades with a blur, staggered 22ms.
import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import type { CodeSnippetMedia } from '@/content/home';
import { OccCorners } from './OccCorners';
import s from './CodeToggle.module.css';

export function CodeToggle({ media }: { media: CodeSnippetMedia }) {
  const [plain, setPlain] = useState(false);
  return (
    <div data-media="" data-tilt="3" className={s['code-toggle'] + (plain ? ' ' + s['code-toggle--plain'] : '')}>
      <OccCorners />
      <div className={s['code-toggle__shot']}>
        <Image src={media.screenshot.src} alt={media.screenshot.label} fill sizes="(min-width: 1025px) 50vw, 100vw" className={s['code-toggle__shot-img']} />
      </div>
      <figure className={s['code-toggle__panel']}>
        <figcaption className={s['code-toggle__caption']}>
          <span>{media.filename}, {media.note}</span>
          <span role="group" aria-label="Read as" className={s['code-toggle__group']}>
            <button type="button" aria-pressed={!plain} className={s['code-toggle__button']} onClick={() => setPlain(false)}>Code</button>
            <button type="button" aria-pressed={plain} className={s['code-toggle__button']} onClick={() => setPlain(true)}>Plain English</button>
          </span>
        </figcaption>
        <pre className={s['code-toggle__pre']}>
          <code>
            {media.lines.map((ln, i) => (
              <span key={i} data-line={i} className={s['code-toggle__line']} style={{ '--d': i * 22 + 'ms' } as CSSProperties}>
                <span aria-hidden={plain} className={s['code-toggle__code']}>{ln.code}<span className={s['code-toggle__comment']}>{ln.comment}</span></span>
                <span aria-hidden={!plain} className={s['code-toggle__plain']}>{ln.plain}</span>
              </span>
            ))}
          </code>
        </pre>
      </figure>
    </div>
  );
}
