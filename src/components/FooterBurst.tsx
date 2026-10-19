'use client';
// Footer: the camera pushes into the last service card and amber bursts out to fill the screen.
import { CONTACT } from '@/content/home';
import { useHome } from './HomeContext';
import s from './FooterBurst.module.css';
import { useMemo } from 'react';

const WORDS = ['Tell', 'me', 'what', 'you’re', 'building.'];

export function FooterBurst() {

  const { stage } = useHome();

  const currentYear = useMemo(() => {
    const now = new Date();
    return now.getFullYear();
  }, [])

  return (
    <section id="contact" data-act="contact" data-enter="collapse" data-span="1.9" data-on-amber="" aria-labelledby="contact-h"
      className={s['footer-burst']} style={{ zIndex: 7, height: stage ? '240vh' : 'auto', marginTop: stage ? '-240vh' : '0' }}>
      <div data-contact-layer="" className={s['footer-burst__layer']}>
        <div data-contact-in="" className={s['footer-burst__inner']}>
          <h2 id="contact-h" className={s['footer-burst__title']}>
            {WORDS.map((w, i) => (
              <span key={i}>
                {i > 0 && ' '}
                <span className={s['footer-burst__word-mask']}><span data-cw={i} className={s['footer-burst__word']}>{w}</span></span>
              </span>
            ))}
          </h2>
          <div className={s['footer-burst__row']}>
            <div className={s['footer-burst__email-block']}>
              <span className={s['footer-burst__label']}>Email</span>
              <a data-magnet="" href={`mailto:${CONTACT.email}`} className={s['footer-burst__email']}>{CONTACT.email}</a>
            </div>
            <div className={s['footer-burst__actions']}>
              <a href={`mailto:${CONTACT.email}?subject=New%20project`} className={s['footer-burst__cta']}>Send an enquiry</a>
              {CONTACT.linkedin && <a href={CONTACT.linkedin} target="_blank" rel="noopener" className={s['footer-burst__ghost']}>LinkedIn</a>}
            </div>
          </div>
        </div>
        <footer className={s['footer-burst__footer']}>
          <span>British engineer based in Sydney.</span>
          <span>© {currentYear} Etienne Cellier-Clarke</span>
        </footer>
      </div>
    </section>
  );
}
