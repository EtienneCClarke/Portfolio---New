import s from './KeepScrolling.module.css';

// "Keep scrolling" cue; the scene shows it after the visitor pauses (and never over a button).
export function KeepScrolling() {
  return (
    <div data-keep="" className={s['keep-scrolling']} aria-hidden="true">
      <span className={s['keep-scrolling__label']}>Keep scrolling</span>
      <span className={s['keep-scrolling__track']}><span data-keep-line="" className={s['keep-scrolling__line']} /></span>
    </div>
  );
}
