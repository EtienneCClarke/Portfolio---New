'use client';
// Palestine Journal: phone recording and browser screenshot, drifting at different parallax rates.
import Image from 'next/image';
import type { DeviceShowcaseMedia } from '@/content/home';
import { CaseVideo } from './CaseVideo';
import { OccCorners } from './OccCorners';
import s from './DeviceShowcase.module.css';

export function DeviceShowcase({ media, eager }: { media: DeviceShowcaseMedia; eager: boolean }) {
  const [phone, browser] = media.devices;
  return (
    <div data-media="" data-tilt="3" className={s['device-showcase']}>
      <OccCorners />
      <div data-par="-0.9" className={s['device-showcase__phone']}>
        <CaseVideo asset={phone} className={s['device-showcase__media']} />
      </div>
      <div data-par="0.5" className={s['device-showcase__browser']}>
        <Image src={browser.src} alt={browser.label} fill loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'low' : undefined} sizes="(min-width: 1025px) 45vw, 100vw" className={`${s['device-showcase__media']} ${s['device-showcase__media--top']}`} />
      </div>
    </div>
  );
}
