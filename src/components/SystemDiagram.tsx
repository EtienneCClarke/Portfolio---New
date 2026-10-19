'use client';
// Boxe system diagram: builds node by node on scroll. Hover or focus a node to trace it, click to pin.
import Image from 'next/image';
import type { SystemDiagramMedia } from '@/content/home';
import { DIAGRAM_CELLS } from '@/lib/scene-data';
import { useHome } from './HomeContext';
import { OccCorners } from './OccCorners';
import s from './SystemDiagram.module.css';

export function SystemDiagram({ media }: { media: SystemDiagramMedia }) {
  const { scene, caseWide: wide } = useHome();
  const flow = media.nodes.flatMap((nd, ni, arr) => [
    { kind: 'node' as const, title: nd.title, tech: nd.tech.join(', '), bc: nd.highlight ? '#EDEBE6' : '#4A4B4B' },
    ...(ni < arr.length - 1 ? [{ kind: 'link' as const, label: nd.link || '', bc: '#4A4B4B' }] : []),
  ]).concat(media.loop ? [{ kind: 'link' as const, label: media.loop.label, bc: '#E8A33A' }] : []);

  return (
    <figure data-media="" data-tilt="3" className={s['system-diagram']}>
      <OccCorners />
      <div className={s['system-diagram__frame']} aria-hidden="true">
        <Image src={media.frame.src} alt="" fill sizes="(min-width: 1025px) 40vw, 90vw" className={s['system-diagram__frame-img']} />
      </div>
      <figcaption className={s['system-diagram__caption']}>
        <span>{media.caption}</span>
        <span>{wide ? 'Point at a component to trace its stack, click to pin' : 'Boxe, 2025'}</span>
      </figcaption>
      {wide ? (
        <div className={s['system-diagram__grid']}>
          {DIAGRAM_CELLS.map((c) => {
            const pos = { gridColumn: c.col, gridRow: c.row };
            if (c.type === 'node') return (
              <div
                key={c.b} data-node={c.i} data-bc={c.bc} data-build={c.b} data-cursor-text="Pin" tabIndex={0}
                className={s['system-diagram__node']} style={{ ...pos, borderColor: c.bc }}
                onPointerEnter={() => scene.setHover(c.i)} onPointerLeave={() => scene.hoverOff()}
                onFocus={() => scene.setHover(c.i)} onBlur={() => scene.hoverOff()} onClick={() => scene.pin(c.i)}
              >
                <p className={s['system-diagram__node-title']}>{c.title}</p>
                <p className={s['system-diagram__node-tech']}>{c.tech}</p>
              </div>
            );
            if (c.type === 'h' || c.type === 'hl') return (
              <div key={c.b} data-build={c.b} data-wire="h" className={s['system-diagram__wire']} style={pos}>
                <span className={s['system-diagram__wire-label']}>{c.label}</span>
                {c.type === 'h' ? (
                  <span data-wire-line="" className={s['system-diagram__wire-line']}><span className={s['system-diagram__wire-rule']} /><span className={s['system-diagram__wire-tip']} /></span>
                ) : (
                  <span data-wire-line="" className={`${s['system-diagram__wire-line']} ${s['system-diagram__wire-line--rev']}`}><span className={s['system-diagram__wire-tip']} /><span className={s['system-diagram__wire-rule']} /></span>
                )}
              </div>
            );
            if (c.type === 'v') return (
              <div key={c.b} data-build={c.b} data-wire="v" className={s['system-diagram__vwire']} style={pos}>
                <span data-wire-line="" className={s['system-diagram__vwire-line']} style={{ transformOrigin: c.origin }} />
                <span className={s['system-diagram__vwire-label']}>{c.label}</span>
              </div>
            );
            if (c.type === 'loop') return (
              <div key={c.b} data-build={c.b} data-wire="hr" className={s['system-diagram__loop']} style={pos}>
                <span data-packet="" className={s['system-diagram__packet']} />
                <span className={s['system-diagram__loop-label']}>{c.label}</span>
                <span data-wire-line="" className={`${s['system-diagram__wire-line']} ${s['system-diagram__wire-line--rev']}`}><span className={`${s['system-diagram__wire-tip']} ${s['system-diagram__wire-tip--amber']}`} /><span className={s['system-diagram__wire-rule']} /></span>
              </div>
            );
            return (
              <div key={c.b} data-build={c.b} data-wire="vu" className={s['system-diagram__up']} style={pos}>
                <span data-wire-line="" className={s['system-diagram__up-line']} />
              </div>
            );
          })}
        </div>
      ) : (
        <ol className={s['system-diagram__flow']}>
          <span aria-hidden="true" className={s['system-diagram__flow-return']} />
          <span aria-hidden="true" className={s['system-diagram__flow-stub']} />
          <span aria-hidden="true" className={s['system-diagram__flow-tip']} />
          {flow.map((fw, i) => fw.kind === 'node' ? (
            <li key={i} className={s['system-diagram__flow-node']} style={{ borderColor: fw.bc }}>
              <p className={s['system-diagram__flow-title']}>{fw.title}</p>
              <p className={s['system-diagram__node-tech']}>{fw.tech}</p>
            </li>
          ) : (
            <li key={i} className={s['system-diagram__flow-link']} style={{ borderLeftColor: fw.bc }}>{fw.label}</li>
          ))}
        </ol>
      )}
    </figure>
  );
}
