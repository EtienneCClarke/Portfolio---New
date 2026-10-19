'use client';
// Desktop readout for a case study: facts as floating in-scene cards (default) or a bottom HUD.
import type { Project } from '@/content/home';
import { OccCorners } from './OccCorners';
import s from './Readout.module.css';

const FADED = { opacity: 0 } as const;

export function Readout({ project: p, variant }: { project: Project; variant: 'in-scene' | 'hud' }) {
  if (variant === 'hud') {
    const facts = [['Year', p.year], ['Sector', p.sector], ['Delivered', p.deliverables.join(', ')], ['Outcome', p.outcome]];
    return (
      <div data-hud="" className={s.readout__hud}>
        <span data-hud-line="" className={s['readout__hud-line']} />
        <dl className={s['readout__hud-list']}>
          {facts.map(([k, v], i) => (
            <div key={k} data-hud-f={i} className={s['readout__hud-fact']} style={FADED}>
              <dt className={s.readout__key}>{k}</dt>
              <dd className={s['readout__hud-value']}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
  const cards = [['Sector', p.sector, p.year], ['Delivered', p.deliverables.join(', '), ''], ['Stack', p.stack.join(', '), ''], ['Outcome', p.outcome, '']];
  return (
    <div data-cards="" className={s.readout}>
      {cards.map(([k, v, n], i) => (
        <div key={k} data-card={i} data-tilt="7" className={s.readout__card} style={FADED}>
          <OccCorners />
          <div className={s.readout__meta}><span>{k}</span><span className={s.readout__num}>{n}</span></div>
          <div className={s.readout__value}>{v}</div>
        </div>
      ))}
    </div>
  );
}
