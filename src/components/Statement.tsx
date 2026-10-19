'use client';
// The hero statement. Each word rises in once the loader hands over; the three service phrases link to Services.
import type { CSSProperties, ReactNode } from 'react';
import { CONFIG, STATEMENT_SEQ } from '@/content/home';
import { useHome } from './HomeContext';
import s from './Statement.module.css';

const LB = [0, 0, 0, 0, 1, 2, 2, 2];

export function Statement({ offset }: { offset: boolean }) {
  const { scene, rm, booted } = useHome();
  const anim = CONFIG.statementReveal && !rm;
  let wi = 0;
  const word = (w: string): ReactNode => {
    const i = wi++;
    if (!anim) return w;
    return (
      <span key={'w' + i} className={s.statement__mask}>
        <span className={s.statement__word} style={{ '--d': 40 + i * 36 + 'ms' } as CSSProperties}>{w}</span>
      </span>
    );
  };
  const out: ReactNode[] = [], outL: ReactNode[][] = [[], [], []];
  STATEMENT_SEQ.forEach((it, k) => {
    const tgt = offset ? outL[LB[k] ?? 2] : out;
    if (k && !('p' in it) && (!offset || tgt.length)) tgt.push(' ');
    if ('w' in it) tgt.push(word(it.w));
    else if ('p' in it) { const pv = STATEMENT_SEQ[k - 1]; if (!pv || !('g' in pv)) tgt.push(word(it.p)); }
    else {
      const g = it.g;
      const kids: ReactNode[] = [];
      it.ws.forEach((w, j) => { if (j) kids.push(' '); kids.push(word(w)); });
      const nx = STATEMENT_SEQ[k + 1];
      if (nx && 'p' in nx) { const last = kids.pop(); kids.push(<span key={'nw' + g} className={s.statement__nowrap}>{last}{word(nx.p)}</span>); }
      tgt.push(
        <a key={'g' + g} href="#services" className={s.statement__link} onClick={(e) => { e.preventDefault(); e.stopPropagation(); scene.goService(g); }}>
          {kids}
        </a>,
      );
    }
  });
  const cls = s.statement + (anim && booted ? ' ' + s['statement--go'] : '');
  if (!offset) return <span className={cls}>{out}</span>;
  return (
    <span className={cls}>
      <span className={s.statement__line}>{outL[0]}</span>{' '}
      <span className={`${s.statement__line} ${s['statement__line--right']}`}>{outL[1]}</span>{' '}
      <span className={`${s.statement__line} ${s['statement__line--indent']}`}>{outL[2]}</span>
    </span>
  );
}
