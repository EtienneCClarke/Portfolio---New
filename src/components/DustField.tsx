import s from './DustField.module.css';

// The particle canvas. Drawing happens in the scene loop (see lib/dust.ts).
export function DustField() {
  return <canvas data-dust="" className={s['dust-field']} aria-hidden="true" />;
}
