'use client';
import { useCallback, useMemo, useState } from 'react';
import { PROJECTS } from '@/content/home';
import { useScrollScene, type SceneEnv, type SceneHost } from '@/hooks/useScrollScene';
import { isCaseWide, isDesk, isStage } from '@/lib/motion';
import { Atmosphere } from './Atmosphere';
import { CaseStudy } from './CaseStudy';
import { Cursor } from './Cursor';
import { DustField } from './DustField';
import { FooterBurst } from './FooterBurst';
import { HeroStack } from './HeroStack';
import { HomeContext, type HomeMode } from './HomeContext';
import { KeepScrolling } from './KeepScrolling';
import { Loader } from './Loader';
import { MobileMenu } from './MobileMenu';
import { PillNav } from './PillNav';
import { ScrollDepth } from './ScrollDepth';
import { ServicesFlight } from './ServicesFlight';
import s from './Home.module.css';

// Server render assumes a desktop, motion-on viewport; the scene corrects it before first paint.
const SSR_ENV: SceneEnv = { w: 1440, h: 900, touch: false, rm: false, lite: false, loaderOn: true, booted: false };

export default function Home() {
  const [env, setEnv] = useState<SceneEnv>(SSR_ENV);
  const host = useMemo<SceneHost>(() => ({
    setViewport: (w, h) => setEnv((e) => (e.w === w && e.h === h ? e : { ...e, w, h })),
    setEnv: (next) => setEnv(next),
  }), []);
  const scene = useScrollScene(env, host);

  const wide = isDesk(env.w, env.h);
  const caseWide = isCaseWide(env.w, env.h);
  const stage = isStage(env.w, env.h, env.rm);
  const mode = useMemo<HomeMode>(() => ({
    scene, wide, caseWide, stage, touch: env.touch, lite: env.lite, rm: env.rm, booted: env.booted, tScale: env.touch ? 1.2 : 1,
  }), [scene, wide, caseWide, stage, env.touch, env.lite, env.rm, env.booted]);

  const onBoot = useCallback(() => setEnv((e) => (e.booted ? e : { ...e, booted: true })), []);
  const onDone = useCallback(() => { scene.endIntro(); setEnv((e) => ({ ...e, loaderOn: false, booted: true })); }, [scene]);

  return (
    <HomeContext.Provider value={mode}>
      <div
        className={s.home}
        data-layout={wide ? 'wide' : 'narrow'}
        data-case={caseWide ? 'wide' : 'narrow'}
        data-scene={stage ? 'on' : 'off'}
        data-touch={env.touch ? 'on' : 'off'}
        data-lite={env.lite ? 'on' : 'off'}
      >
        <Atmosphere />
        <DustField />
        <Cursor />
        {env.loaderOn && <Loader onBoot={onBoot} onDone={onDone} />}
        <ScrollDepth />
        <KeepScrolling />
        {/* Everything interactive is inert while the intro plays, so focus can't move the page behind it. */}
        <div className={s.home__chrome} inert={env.loaderOn}>
          <a href="#work" className={s.home__skip}>Skip to work</a>
          {!wide && <MobileMenu />}
          {wide && <PillNav />}
        </div>
        <main id="main" className={s.home__main} inert={env.loaderOn}>
          <HeroStack />
          <section id="work" aria-labelledby="work-h" className={s.home__work}>
            <h2 id="work-h" className={s.home__sr}>Selected work</h2>
            {PROJECTS.map((p, i) => <CaseStudy key={p.slug} project={p} index={i} />)}
          </section>
          <ServicesFlight />
          <FooterBurst />
        </main>
      </div>
    </HomeContext.Provider>
  );
}
