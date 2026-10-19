import s from './OccCorners.module.css';

// Zero-size corner markers. The dust field reads their projected positions to cut particles out behind 3D panels.
export function OccCorners() {
  return (
    <>
      <i data-occ="" aria-hidden="true" className={`${s['occ-corners']} ${s['occ-corners--tl']}`} />
      <i data-occ="" aria-hidden="true" className={`${s['occ-corners']} ${s['occ-corners--tr']}`} />
      <i data-occ="" aria-hidden="true" className={`${s['occ-corners']} ${s['occ-corners--br']}`} />
      <i data-occ="" aria-hidden="true" className={`${s['occ-corners']} ${s['occ-corners--bl']}`} />
    </>
  );
}
