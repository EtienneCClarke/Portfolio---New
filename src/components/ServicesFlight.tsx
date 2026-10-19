'use client';
// Services: the camera flies between four monoliths that alternate left and right, lighting each as it arrives.
import { PROJECTS, SERVICES } from '@/content/home';
import { SVC_VH } from '@/lib/motion';
import { ServicesEcho } from './EchoHeading';
import { useHome } from './HomeContext';
import { OccCorners } from './OccCorners';
import s from './ServicesFlight.module.css';

const FADED = { opacity: 0 } as const;

export function ServicesFlight() {
  const { scene, wide, stage, tScale } = useHome();
  return (
    <section
      id="services"
      data-act="services"
      data-enter={stage ? 'depth' : 'flow'}
      data-span="5"
      data-phase={stage ? 's-1' : ''}
      aria-labelledby="services-h"
      className={s['services-flight']}
      style={{ zIndex: 6, height: stage ? Math.round(SVC_VH * tScale) + 'vh' : 'auto', marginTop: stage ? '-100vh' : '0' }}
    >
      <div data-stage="" className={s['services-flight__stage']}>
        {stage && (
          <div data-svc-floor="" aria-hidden="true" className={s['services-flight__floor']} style={FADED}>
            <div data-svc-grid="" className={s['services-flight__grid']} />
          </div>
        )}
        <div data-svc-track="" className={s['services-flight__track']}>
          <div data-svc-panel="0" className={s['services-flight__intro']}>
            <div data-svc-inner="" className={s['services-flight__intro-inner']}>
              <span className={s['services-flight__eyebrow']}>What I do</span>
              <ServicesEcho id="services-h" />
              <p data-svc-lede="" className={s['services-flight__lede']}>You work with me directly, from the first call to the last deploy.</p>
            </div>
          </div>
          {SERVICES.map((sv, i) => {
            const links = sv.related.map((nm) => { const pj = PROJECTS.find((x) => x.name === nm); return { label: nm, href: '#' + (pj ? pj.slug : 'work') }; });
            return (
              <article
                key={sv.id}
                id={sv.id}
                data-svc-panel={i + 1}
                data-tilt={wide ? '6' : '0'}
                data-phase={stage ? '' : 's-' + (i + 1)}
                aria-labelledby={'h-' + sv.id}
                className={s['services-flight__panel']}
              >
                <OccCorners />
                <span data-svc-rule="" aria-hidden="true" className={s['services-flight__rule']} />
                <span data-svc-bar="" aria-hidden="true" className={s['services-flight__bar']} />
                <div data-svc-d="0" className={s['services-flight__meta']}>
                  <span className={s['services-flight__related']}>
                    <span>{sv.related.length ? 'Related' : 'New work, no case study yet'}</span>
                    {links.map((lk) => <a key={lk.label} href={lk.href} data-cursor-text="View" className={s['services-flight__link']} onClick={scene.onNav}>{lk.label}</a>)}
                  </span>
                </div>
                <div data-svc-inner="" className={s['services-flight__body']}>
                  <h3 id={'h-' + sv.id} aria-label={sv.name} className={s['services-flight__title']}>
                    {sv.name.split(' ').map((t, wi) => (
                      <span key={wi} aria-hidden="true" className={s['services-flight__word-mask']}><span data-sw={wi} className={s['services-flight__word']}>{t}</span></span>
                    ))}
                  </h3>
                  <div className={s['services-flight__details']}>
                    <p data-svc-d="1" className={s['services-flight__desc']}>{sv.desc}</p>
                    <dl data-svc-d="2" className={s['services-flight__dl']}>
                      <dt className={s['services-flight__dt']}>You get</dt><dd className={s['services-flight__dd']}>{sv.gets.join(', ')}</dd>
                      <dt className={s['services-flight__dt']}>Suits</dt><dd className={s['services-flight__dd']}>{sv.suits}</dd>
                    </dl>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
