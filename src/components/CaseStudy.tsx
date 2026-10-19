'use client';
// One pinned case-study scene. Enter/exit ("depth" cut), the media fly-in and the readout are driven by the scene.
import { CONFIG, CONTACT, type Project } from '@/content/home';
import { CS_LEAD } from '@/lib/motion';
import { kindOf } from '@/lib/scene-data';
import { CodeToggle } from './CodeToggle';
import { CompareWipe } from './CompareWipe';
import { DeviceShowcase } from './DeviceShowcase';
import { useHome } from './HomeContext';
import { Readout } from './Readout';
import { SystemDiagram } from './SystemDiagram';
import s from './CaseStudy.module.css';

const HIDDEN = { opacity: 0, visibility: 'hidden' } as const;
const TAG_X = [-0.62, 0.58, -0.5, 0.66], TAG_Y = [-0.62, 0.55, 0.66, -0.58];

export function CaseStudy({ project: p, index }: { project: Project; index: number }) {
  const { caseWide: wide, stage, tScale } = useHome();
  const ro = CONFIG.readout;
  const enter = index === 0 ? 'dissolve' : 'depth';
  const span = +(p.span * (stage ? tScale : 1) + (stage ? CS_LEAD : 0)).toFixed(2);
  const kind = kindOf(p.media.blockType);
  const cardsOn = stage && wide && ro === 'in-scene';
  const hudOn = stage && wide && ro === 'hud';
  const tags = !wide || ro === 'in-scene' ? [] : p.deliverables.map((t, ti) => ({ t, x: TAG_X[ti % 4], y: TAG_Y[ti % 4], z: 0.22 + ti * 0.2 }));
  const facts = [{ k: 'Year', v: p.year }, { k: 'Sector', v: p.sector }, { k: 'Delivered', v: p.deliverables.join(', ') }, { k: 'Stack', v: p.stack.join(', ') }, { k: 'Outcome', v: p.outcome }];
  const m = p.media;

  return (
    <article
      id={p.slug}
      data-act={kind}
      data-enter={enter}
      data-span={span}
      data-phase={p.slug}
      aria-labelledby={'h-' + p.slug}
      className={s['case-study']}
      style={{ zIndex: index + 2, height: stage ? span * 100 + 'vh' : 'auto', marginTop: stage ? '-100vh' : '0' }}
    >
      <div data-stage="" className={s['case-study__stage']}>
        <span data-enter-edge="" className={s['case-study__edge']} />
        {stage && tags.length > 0 && (
          <div aria-hidden="true" className={s['case-study__depth']}>
            <div data-dworld="" className={s['case-study__dworld']}>
              {tags.map((tg) => <span key={tg.t} data-dz="" data-x={tg.x} data-y={tg.y} data-z={tg.z} className={s['case-study__tag']} style={HIDDEN}>{tg.t}</span>)}
            </div>
          </div>
        )}
        {cardsOn && <Readout project={p} variant="in-scene" />}
        {hudOn && <Readout project={p} variant="hud" />}
        <div data-recede="" className={s['case-study__recede'] + (cardsOn ? ' ' + s['case-study__recede--cards'] : '') + (hudOn ? ' ' + s['case-study__recede--hud'] : '')}>
          <div className={s['case-study__head']}>
            <h3 id={'h-' + p.slug} className={s['case-study__title']}>
              <span className={s['case-study__mask']}><span data-rise="" className={s['case-study__rise']}>{p.name}</span></span>
            </h3>
            <a href={CONTACT.caseStudyUrl} target="_blank" rel="noopener" data-fadeup="" className={s['case-study__link']}>Read the case study</a>
          </div>
          <p data-fadeup="" className={s['case-study__summary']}>{p.summary}</p>

          {m.blockType === 'comparison' && <CompareWipe media={m} eager={index === 0} />}
          {m.blockType === 'deviceShowcase' && <DeviceShowcase media={m} eager={index === 0} />}
          {m.blockType === 'systemDiagram' && <SystemDiagram media={m} />}
          {m.blockType === 'codeSnippet' && <CodeToggle media={m} />}

          {!wide && !stage && (
            <dl className={s['case-study__facts']}>
              {facts.map((f) => [
                <dt key={f.k + 't'} className={s['case-study__fact-key']}>{f.k}</dt>,
                <dd key={f.k + 'd'} className={s['case-study__fact-value']}>{f.v}</dd>,
              ])}
            </dl>
          )}
          {wide && (
            <dl className={s['case-study__sr']}>
              {facts.map((f) => [<dt key={f.k + 't'}>{f.k}</dt>, <dd key={f.k + 'd'}>{f.v}</dd>])}
            </dl>
          )}
        </div>
      </div>
    </article>
  );
}
