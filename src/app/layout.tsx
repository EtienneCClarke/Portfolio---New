import type { Metadata } from 'next';
import { Red_Hat_Mono, Schibsted_Grotesk } from 'next/font/google';
import { CONFIG } from '@/content/home';
import './globals.css';

const display = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-schibsted', display: 'swap' });
const mono = Red_Hat_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-redhat', display: 'swap' });

export const metadata: Metadata = {
  title: 'Etienne Cellier-Clarke, software engineer in Manchester',
  description: 'Full-stack and mobile engineer in Manchester, building bespoke software, SaaS products and mobile apps.',
};

// Decides before first paint whether the intro plays, so returning visitors never see it flash and
// first-time visitors can't scroll behind it. Adds `ecc-intro` (play, scroll locked) or `ecc-no-intro`.
const INTRO_SCRIPT = `(function(){var d=document.documentElement,on=${JSON.stringify(CONFIG.loader)};var play=on!=='off';try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)play=false;else if(on==='first visit'&&localStorage.getItem('ecc-intro')==='1')play=false}catch(e){}d.classList.add(play?'ecc-intro':'ecc-no-intro')})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
