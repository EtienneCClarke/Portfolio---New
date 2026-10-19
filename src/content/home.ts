// Hardcoded homepage content: copy, case studies, services and contact details.

export type MediaAsset = {
  label: string;
  src: string;
  kind: 'image' | 'video';
  poster?: string;
  av1?: string; // smaller AV1 encode, offered before the H.264 fallback
  width: number;
  height: number;
};

export type ComparisonMedia = { blockType: 'comparison'; before: MediaAsset; after: MediaAsset; aside?: MediaAsset };
export type DeviceShowcaseMedia = { blockType: 'deviceShowcase'; devices: [MediaAsset & { frame: 'phone' }, MediaAsset & { frame: 'browser' }] };
export type DiagramNode = { title: string; tech: string[]; link?: string; highlight?: boolean };
export type SystemDiagramMedia = {
  blockType: 'systemDiagram';
  caption: string;
  nodes: DiagramNode[];
  loop?: { label: string };
  frame: MediaAsset;
};
export type CodeLine = { code: string; comment: string; plain: string };
export type CodeSnippetMedia = { blockType: 'codeSnippet'; filename: string; note: string; lines: CodeLine[]; screenshot: MediaAsset };
export type ProjectMedia = ComparisonMedia | DeviceShowcaseMedia | SystemDiagramMedia | CodeSnippetMedia;

export type Project = {
  slug: string;
  n: string;
  span: number;
  name: string;
  year: string;
  sector: string;
  task: string;
  summary: string;
  deliverables: string[];
  stack: string[];
  outcome: string;
  media: ProjectMedia;
};

export type Service = {
  id: string;
  name: string;
  desc: string;
  gets: string[];
  suits: string;
  related: string[];
  stack: string[];
};

export type StatementItem = { w: string } | { p: string } | { g: number; ws: string[] };

export const STATEMENT = 'I build bespoke software, SaaS products and mobile apps.';

export const STATEMENT_SEQ: StatementItem[] = [
  { w: 'I' }, { w: 'build' }, { g: 0, ws: ['bespoke', 'software'] }, { p: ',' },
  { g: 1, ws: ['SaaS', 'products'] }, { w: 'and' }, { g: 2, ws: ['mobile', 'apps'] }, { p: '.' },
];

export const CONTACT = {
  email: 'etienne@arkcel.com',
  // Contact is mailto-only for now. Add a LinkedIn URL here and the footer shows a LinkedIn button.
  linkedin: '',
  caseStudyUrl: 'https://www.arkcel.com/our-work',
};

export const ROWS: [string, string[]][] = [
  ['Lang', ['TypeScript', 'Python', 'Java', 'Rust', 'Solidity']],
  ['Client', ['React', 'React Native', 'Expo', 'Next.js']],
  ['Server', ['Node', 'Express']],
  ['Data', ['Postgres', 'MySQL', 'Drizzle', 'Airtable', 'Bitquery']],
  ['Infra', ['AWS', 'Vercel']],
  ['Chain', ['Solana', 'Ethereum']],
  ['Other', ['Stripe', 'Vision Camera', 'React-Vision']],
];

export const LAYERS: [string, string][] = [['Client', 'Interface'], ['Server', 'Server'], ['Data', 'Data'], ['Infra', 'Infrastructure'], ['Chain', 'On-chain']];

export const PROFILE = {
  ctx: 'Profile',
  title: 'Etienne Cellier‑Clarke',
  fields: [
    { label: 'Status', kind: 'status', value: 'Available now' },
    { label: 'Based', value: 'Manchester, UK' },
    { label: 'Local time', value: '__clock' },
    { label: 'Builds', value: ['Bespoke software', 'SaaS products', 'Mobile apps'] },
    { label: 'Languages', value: 'English, French' },
    { label: 'Education', value: 'Software Engineering, First-class' },
    { label: 'Previously', value: 'Co-founder of a fintech building payment tools for unbanked communities' },
  ],
  stack: ['TypeScript', 'React', 'React Native', 'Expo', 'Next.js', 'Node', 'Postgres', 'AWS'],
};

export const PROJECTS: Project[] = [
  {
    slug: 'sneakar', n: '01', span: 3.2, name: 'SNEAKAR', year: '2023/24', sector: 'Augmented reality, Fashion',
    task: 'An augmented reality platform for SNEAKAR’s marketing and sales.',
    summary: 'SNEAKAR puts augmented reality into physical sneakers. Scan a shoe with the app and interactive content appears on it. A dashboard lets the team build, test and deploy those activations, and brands used it at B2B conferences as a sales funnel prospects could hold.',
    deliverables: ['iOS & Android app', 'Activation dashboard', 'Web integration API'],
    stack: ['TypeScript', 'React', 'React Native', 'Expo', 'Next.js', 'Node', 'Express', 'Postgres', 'Drizzle', 'AWS', 'Vercel', 'React-Vision'],
    outcome: 'A measurable lift in conversion for brands using AR footwear at B2B conferences.',
    media: {
      blockType: 'comparison',
      before: { label: 'Sneaker, before scanning', src: '/case-studies/sneakar/dashboard.png', kind: 'image', width: 1914, height: 909 },
      after: { label: 'Same sneaker, AR activation running', src: '/case-studies/sneakar/hero.mp4', av1: '/case-studies/sneakar/hero.av1.mp4', kind: 'video', poster: '/case-studies/sneakar/poster.jpg', width: 720, height: 1280 },
      aside: { label: 'Activation dashboard', src: '/case-studies/sneakar/dashboard.png', kind: 'image', width: 1914, height: 909 },
    },
  },
  {
    slug: 'palestine-journal', n: '02', span: 3.1, name: 'Palestine Journal', year: '2024/25', sector: 'Journalism, Publishing',
    task: 'A digital home for long-form Palestinian journalism.',
    summary: 'A publishing platform for long-form journalism. Writers release full works, serialise stories chapter by chapter and update them as events develop. Readers subscribe on web or mobile, and publishers manage content, readers and revenue from one dashboard.',
    deliverables: ['Website', 'iOS & Android app', 'CMS and admin dashboard', 'Subscription paywall'],
    stack: ['TypeScript', 'React', 'React Native', 'Expo', 'Next.js', 'Node', 'Express', 'Postgres', 'Drizzle', 'AWS', 'Vercel', 'Stripe'],
    outcome: 'Subscription revenue for writers, on web and mobile.',
    media: {
      blockType: 'deviceShowcase',
      devices: [
        { frame: 'phone', label: 'App screen recording', src: '/case-studies/pj/app.mp4', av1: '/case-studies/pj/app.av1.mp4', kind: 'video', poster: '/case-studies/pj/poster.jpg', width: 384, height: 832 },
        { frame: 'browser', label: 'Subscription and paywall screen', src: '/case-studies/pj/pricing.png', kind: 'image', width: 1387, height: 777 },
      ],
    },
  },
  {
    slug: 'boxe', n: '03', span: 3.6, name: 'Boxe', year: '2025', sector: 'Marketing, Connected devices',
    task: 'A marketing platform running on a network of electronic displays.',
    summary: 'Boxe turns low-cost electronic devices into a city-wide network of advertising screens. A lightweight app runs on each device, a central dashboard pushes campaigns to every screen at once, and on-device sensors report foot traffic and attention back.',
    deliverables: ['Device app', 'Campaign dashboard', 'Real-time analytics'],
    stack: ['TypeScript', 'React', 'React Native', 'Expo', 'Next.js', 'Node', 'Express', 'Python', 'Postgres', 'Drizzle', 'AWS', 'Vercel', 'Vision Camera'],
    outcome: 'Street campaigns with measured reach: foot traffic, attention time and demographics.',
    media: {
      blockType: 'systemDiagram', caption: 'System overview',
      nodes: [
        { title: 'Campaign dashboard', tech: ['Next.js', 'React', 'Vercel', 'TypeScript'], link: 'campaigns' },
        { title: 'API', tech: ['Node', 'Express', 'Postgres', 'Drizzle', 'AWS'], link: 'content sync' },
        { title: 'Device app, every screen', tech: ['React Native', 'Expo'], link: 'camera feed', highlight: true },
        { title: 'Sensors and computer vision', tech: ['Vision Camera', 'Python'] },
      ],
      loop: { label: 'foot traffic, attention time and demographics, back to the dashboard' },
      frame: { label: 'Boxe dashboard, device detail', src: '/case-studies/boxe/device.png', kind: 'image', width: 1390, height: 795 },
    },
  },
  {
    slug: 'ardoda', n: '04', span: 3.2, name: 'Ardoda Books', year: '2023/24', sector: 'Accounting, Blockchain',
    task: 'Multi-currency accounting for teams that transact in cryptocurrency.',
    summary: 'Accounting software for businesses that transact in crypto. It tracks fiat and digital currencies side by side, keeps an audit trail of every transaction for compliance, and exports to Xero and QuickBooks so finance teams keep their existing books.',
    deliverables: ['SaaS accounting platform', 'Audit trail and compliance', 'Xero and QuickBooks sync', 'Team dashboards'],
    stack: ['TypeScript', 'React', 'Next.js', 'Node', 'Java', 'Python', 'MySQL', 'Bitquery', 'AWS', 'Ethereum', 'Solidity'],
    outcome: 'Auditable crypto records that sync with the accounting tools teams already use.',
    media: {
      blockType: 'codeSnippet', filename: 'ledger/entry.ts', note: 'illustrative excerpt',
      screenshot: { label: 'Ardoda Books dashboard', src: '/case-studies/ardoda/dashboard.jpg', kind: 'image', width: 1818, height: 780 },
      lines: [
        { code: 'type Money = { amount: bigint; currency: Fiat | Token };', comment: '', plain: 'Every amount carries its currency, fiat or crypto.' },
        { code: ' ', comment: '', plain: ' ' },
        { code: 'interface LedgerEntry {', comment: '', plain: 'Each ledger entry records:' },
        { code: '  id: string;', comment: '', plain: '  a unique reference,' },
        { code: '  occurredAt: Date;', comment: '', plain: '  when it happened,' },
        { code: '  source: Money;       ', comment: '// as transacted', plain: '  the amount exactly as it was paid,' },
        { code: '  reporting: Money;    ', comment: '// converted at the rate on occurredAt', plain: '  the same amount in your reporting currency,' },
        { code: '  rate: { pair: string; value: string; via: "bitquery" };', comment: '', plain: '  the exchange rate used, and where it came from,' },
        { code: '  txHash?: string;     ', comment: '// on-chain reference, when there is one', plain: '  the blockchain transaction, if there was one,' },
        { code: '  audit: AuditEvent[]; ', comment: '// append-only', plain: '  and a history of every change that can’t be edited.' },
        { code: '}', comment: '', plain: ' ' },
        { code: ' ', comment: '', plain: ' ' },
        { code: 'export function syncLedger(e: LedgerEntry) { return journalLine(e.reporting, e.audit); }', comment: '', plain: 'Each entry becomes a journal line in Xero or QuickBooks.' },
      ],
    },
  },
];

export const SERVICES: Service[] = [
  {
    id: 'service-bespoke', name: 'Bespoke software',
    desc: 'Web platforms, dashboards and internal tools, built around the way your business already works.',
    gets: ['Web application', 'Admin dashboard', 'APIs and integrations'],
    suits: 'Teams that have outgrown spreadsheets or off-the-shelf tools.', related: ['Ardoda Books', 'Boxe'],
    stack: ['TypeScript', 'React', 'Next.js', 'Node', 'Postgres', 'AWS'],
  },
  {
    id: 'service-saas', name: 'SaaS products',
    desc: 'From first version to paying customers: accounts, billing, permissions and infrastructure that can grow with you.',
    gets: ['MVP', 'Subscriptions and payments', 'Roles and permissions', 'Usage analytics'],
    suits: 'Founders who need a product in front of customers, built to keep going after launch.', related: ['Palestine Journal', 'Ardoda Books'],
    stack: ['TypeScript', 'React', 'Next.js', 'Node', 'Postgres', 'Drizzle', 'AWS', 'Vercel', 'Stripe'],
  },
  {
    id: 'service-mobile', name: 'Mobile apps',
    desc: 'iOS and Android apps from one React Native codebase, including camera, AR and device features.',
    gets: ['iOS & Android apps', 'App Store and Play releases', 'Admin dashboard'],
    suits: 'Products where the phone is the main way people use you.', related: ['SNEAKAR', 'Boxe', 'Palestine Journal'],
    stack: ['TypeScript', 'React Native', 'Expo', 'Node', 'Postgres', 'AWS', 'Vision Camera'],
  },
  {
    id: 'service-consult', name: 'Technical consultancy',
    desc: 'Architecture reviews, AWS set-up and a second opinion before you commit a budget.',
    gets: ['Architecture review', 'Technical roadmap', 'Code and infrastructure audit'],
    suits: 'Teams about to build, or unsure about what they already have.', related: [],
    stack: ['TypeScript', 'Node', 'Postgres', 'AWS'],
  },
];

// Site settings.
export const CONFIG = {
  readout: 'in-scene' as 'in-scene' | 'hud',
  smoothScroll: true,
  loader: 'first visit' as 'first visit' | 'every load' | 'off',
  scrollMotion: true,
  statementReveal: true,
  perfMode: 'auto' as 'auto' | 'full' | 'lite',
};
