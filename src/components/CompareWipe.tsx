'use client';
// SNEAKAR before/after wipe. Scroll drives the split; drag the handle (springs back) or use the arrow keys.
import Image from 'next/image';
import type { ComparisonMedia } from '@/content/home';
import { CaseVideo } from './CaseVideo';
import { useHome } from './HomeContext';
import { OccCorners } from './OccCorners';
import s from './CompareWipe.module.css';

export function CompareWipe({ media, eager }: { media: ComparisonMedia; eager: boolean }) {
  const { scene, caseWide: wide } = useHome();
  const { before, after, aside } = media;
  return (
    <div data-media="" data-tilt="3" className={s['compare-wipe']}>
      <OccCorners />
      <div className={s['compare-wipe__frame']}>
        <Image src={before.src} alt={before.label} fill loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'low' : undefined} sizes="(min-width: 1025px) 45vw, 100vw" className={s['compare-wipe__media']} />
        <div data-wipe="" className={s['compare-wipe__after']}>
          <CaseVideo asset={after} className={s['compare-wipe__media']} />
        </div>
        <div
          data-wipe-handle=""
          data-cursor-text="Drag"
          role="slider"
          tabIndex={0}
          aria-label="Compare the sneaker before and after AR activation"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
          className={s['compare-wipe__handle']}
          onPointerDown={scene.wipeDown}
          onKeyDown={scene.wipeKey}
        >
          <span className={s['compare-wipe__line']} />
          <span className={s['compare-wipe__knob']}><span className={s['compare-wipe__bar']} /><span className={s['compare-wipe__bar']} /></span>
        </div>
      </div>
      {aside && wide && (
        <div className={s['compare-wipe__aside']}>
          <Image src={aside.src} alt={aside.label} fill loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'low' : undefined} sizes="25vw" className={s['compare-wipe__media']} />
        </div>
      )}
    </div>
  );
}
