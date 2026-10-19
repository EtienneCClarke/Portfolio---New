'use client';
import { useEffect, useRef } from 'react';
import type { MediaAsset } from '@/content/home';
import { useHome } from './HomeContext';

// Muted loop that only plays while it is on screen (and never under reduced motion).
export function CaseVideo({ asset, className }: { asset: MediaAsset; className?: string }) {
  const { rm } = useHome();
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || rm || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => { /* autoplay refused: poster stays */ });
      else v.pause();
    });
    io.observe(v);
    return () => { io.disconnect(); v.pause(); };
  }, [rm]);
  return (
    <video ref={ref} className={className} muted playsInline loop preload="metadata" poster={asset.poster} aria-label={asset.label} width={asset.width} height={asset.height}>
      {asset.av1 && <source src={asset.av1} type='video/mp4; codecs="av01.0.05M.08"' />}
      <source src={asset.src} type="video/mp4" />
    </video>
  );
}
