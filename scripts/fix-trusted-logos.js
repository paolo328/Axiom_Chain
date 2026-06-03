const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');

const PARTNERS = [
  { file: 'ethereum.svg', alt: 'Ethereum' },
  { file: 'defi.svg', alt: 'DeFi' },
  { file: 'ai-systems.svg', alt: 'AI Systems' },
  { file: 'smart-contracts.svg', alt: 'Smart Contracts' },
  { file: 'layer2.svg', alt: 'Layer 2' },
  { file: 'cloud.svg', alt: 'Cloud Infrastructure' },
  { file: 'security.svg', alt: 'Security' },
  { file: 'web3.svg', alt: 'Web3' },
  { file: 'indexing.svg', alt: 'Indexing' },
  { file: 'enterprise.svg', alt: 'Enterprise' },
  { file: 'cross-chain.svg', alt: 'Cross-Chain' },
  { file: 'tokenization.svg', alt: 'Tokenization' },
];

const logoCell = (p) =>
  `<div class="flex h-12 items-center justify-center rounded-sm px-3 py-2 text-foreground-50 marquee-logo-dark-bg dark:text-foreground-70">
  <img alt="${p.alt}" src="images/logos/partners/${p.file}" width="140" height="40" loading="lazy" decoding="async" class="h-8 w-auto max-w-[9rem] object-contain opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 dark:opacity-80"/>
</div>`;

const TRUSTED_BLOCK = `<div class="flex flex-col gap-5">
  <div class="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-6 md:gap-x-8 md:gap-y-8">
    ${PARTNERS.map(logoCell).join('\n    ')}
  </div>
</div>`;

let html = fs.readFileSync(INDEX, 'utf8');

const startMarker =
  '<p class="mb-5 text-center text-2xs font-bold uppercase tracking-[3px] text-foreground-25">Trusted By</p><div class="flex flex-col gap-5">';
const endMarker =
  '</div></div></div></div></section><section class="relative bg-background text-foreground py-(--content-padding)">';

const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker);

if (start === -1 || end === -1) {
  console.error('Could not find Trusted By section markers');
  process.exit(1);
}

const before = html.slice(0, start + startMarker.length);
const after = html.slice(end);
html = before + TRUSTED_BLOCK + after;

// Fix stats watermark logos (broken srcSet)
html = html.replace(
  /<img alt="" aria-hidden="true"[^>]*srcSet="[^"]*logo_dark[^"]*"[^>]*src="_next\/logo_darkf67a\.svg"\/>/g,
  '<img alt="" aria-hidden="true" loading="lazy" width="284" height="280" decoding="async" class="opacity-[0.08] dark:hidden" src="brand/logo/axiom-mark-dark.svg"/>'
);
html = html.replace(
  /<img alt="" aria-hidden="true"[^>]*srcSet="[^"]*logo_light[^"]*"[^>]*src="_next\/logo_lighte611\.svg"\/>/g,
  '<img alt="" aria-hidden="true" loading="lazy" width="284" height="280" decoding="async" class="hidden opacity-[0.08] dark:block" src="brand/logo/axiom-mark-light.svg"/>'
);

// Update company stats for Axiom Chain
html = html.replace(
  /<span class="block text-2xl font-extrabold tracking-tight">2017<\/span><span class="text-xs font-bold text-foreground-50">Established<\/span>/,
  '<span class="block text-2xl font-extrabold tracking-tight">2024</span><span class="text-xs font-bold text-foreground-50">Founded</span>'
);
html = html.replace(
  /<span class="block text-2xl font-extrabold tracking-tight">Brisbane<\/span><span class="text-xs font-bold text-foreground-50">Australia<\/span>/,
  '<span class="block text-2xl font-extrabold tracking-tight">Global</span><span class="text-xs font-bold text-foreground-50">Delivery</span>'
);

fs.writeFileSync(INDEX, html, 'utf8');
console.log('Replaced Trusted By section with', PARTNERS.length, 'partner icons.');
console.log('index.html size:', (html.length / 1024).toFixed(0), 'KB');
