'use client';
import { createContext, useContext } from 'react';
import type { Scene } from '@/hooks/useScrollScene';

export type HomeMode = {
  scene: Scene;
  wide: boolean; // desktop layout (isDesk)
  caseWide: boolean; // case studies in their desktop arrangement (above tablet widths)
  stage: boolean; // pinned, scroll-driven scenes (isStage)
  touch: boolean;
  lite: boolean;
  rm: boolean;
  booted: boolean;
  tScale: number; // pinned scroll lengths × 1.2 on coarse pointers
};

export const HomeContext = createContext<HomeMode | null>(null);

export function useHome() {
  const ctx = useContext(HomeContext);
  if (!ctx) throw new Error('useHome must be used inside <Home>');
  return ctx;
}
