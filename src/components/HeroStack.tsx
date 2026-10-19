'use client';
// Hero flythrough: the statement sits on a stack of planes that tilts back, spreads, then the camera dives through.
import type { CSSProperties } from 'react';
import { CONTACT } from '@/content/home';
import { HERO_VH } from '@/lib/motion';
import { LAYER_DATA } from '@/lib/scene-data';
import { WorkEcho } from './EchoHeading';
import { useHome } from './HomeContext';
import { OccCorners } from './OccCorners';
import { Statement } from './Statement';
import s from './HeroStack.module.css';

const HIDDEN = { opacity: 0, visibility: 'hidden' } as const;
const FADED = { opacity: 0 } as const;
const LEDE = 'Full-stack and mobile engineer in Manchester, available for new projects. I work directly with founders, product leads and agencies, from the first conversation to production.';

function Status() {
  return <span className={s['hero-stack__status']}><span className={s['hero-stack__dot']} />Available now</span>;
}

function Actions({ className }: { className: string }) {
  const { scene } = useHome();
  return (
    <div className={className}>
      <a href="#contact" data-magnet="" className={s['hero-stack__cta']} onClick={scene.onNav}>Start a project</a>
      <a href={`mailto:${CONTACT.email}`} data-magnet="" className={`${s['hero-stack__cta']} ${s['hero-stack__cta--ghost']}`}>{CONTACT.email}</a>
    </div>
  );
}

export function HeroStack() {
  const { scene, wide, stage, tScale } = useHome();
  return (
    <section data-act="hero" data-span="11" data-phase="profile" aria-labelledby="statement" className={s['hero-stack']}
      style={{ zIndex: 1, height: stage ? Math.round(HERO_VH * tScale) + 'vh' : 'auto' }}>
      <div data-hero-stage="" className={s['hero-stack__stage']}>
        <div data-world="" className={s['hero-stack__world']}>
          <div data-hero-ui="" className={s['hero-stack__ui']}>
            {wide ? (
              <>
                <header className={`${s['hero-stack__header']} ${s['hero-stack__header--offset']}`}><Status /></header>
                <div className={`${s['hero-stack__body']} ${s['hero-stack__body--offset']}`}>
                  <h1 id="statement" className={`${s['hero-stack__statement']} ${s['hero-stack__statement--offset']}`}><Statement offset /></h1>
                  <p className={`${s['hero-stack__lede']} ${s['hero-stack__lede--offset']}`}>{LEDE}</p>
                </div>
                <Actions className={`${s['hero-stack__actions']} ${s['hero-stack__actions--offset']}`} />
              </>
            ) : (
              <>
                <header className={s['hero-stack__header']}>
                  <a href="#" className={s['hero-stack__name']} onClick={scene.toTop}>Etienne Cellier‑Clarke</a>
                </header>
                <div className={s['hero-stack__body']}>
                  <h1 id="statement" className={s['hero-stack__statement']}><Statement offset={false} /></h1>
                  <div className={s['hero-stack__row']}>
                    <p className={s['hero-stack__lede']}>{LEDE}</p>
                    <Actions className={s['hero-stack__actions']} />
                  </div>
                </div>
              </>
            )}
          </div>
          {stage && LAYER_DATA.map((L) => (
            <div key={L.i} data-plane={L.i} aria-hidden="true" className={s['hero-stack__plane']} style={HIDDEN}>
              <OccCorners />
              <div className={s['hero-stack__plane-meta']}>
                <span className={s['hero-stack__plane-tag']}><span className={s['hero-stack__plane-square']} />Stack layer</span>
                <span>{L.count}</span>
              </div>
              <div data-plane-body="" className={s['hero-stack__plane-body']}>
                <div className={s['hero-stack__plane-name']} style={{ '--fs': L.fs } as CSSProperties}>{L.name}</div>
                <div className={s['hero-stack__plane-items']}>
                  {L.items.map((t) => <span key={t} className={s['hero-stack__plane-item']}><span className={s['hero-stack__plane-bullet']} />{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
        {stage && (
          <div className={s['hero-stack__overlay']}>
            <p data-dive-intro="" className={s['hero-stack__intro']} style={FADED}>Every build, through the whole stack.</p>
            <button type="button" data-dive-skip="" className={s['hero-stack__skip']} style={HIDDEN} onClick={scene.skipDive}>Skip to work</button>
            <div data-dive-out="" aria-hidden="true" className={s['hero-stack__out']} style={FADED}>
              <WorkEcho />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
