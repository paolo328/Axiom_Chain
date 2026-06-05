/**
 * Generate careers index and job detail pages from contact.html shell.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APPLY_EMAIL = 'lazare.kasradze@axiom-net.io';

const JOBS = [
  {
    slug: 'blockchain-developer',
    title: 'Blockchain Developer / Smart Contract Engineer',
    location: 'US or EU only',
    tags: ['Blockchain', 'Solidity', 'DeFi', 'Remote'],
    summary:
      'Design, build, and maintain secure smart contracts for decentralised applications, DeFi products, and blockchain protocols.',
    cardDesc:
      'Join our engineering team to write secure, gas-efficient Solidity, review contracts for vulnerabilities, and ship DeFi systems with a security-first mindset.',
    accent: 'green',
  },
  {
    slug: 'fullstack-trading-platform',
    title: 'FullStack Developer – Trading Platform',
    location: 'US or EU only',
    tags: ['React', 'TypeScript', 'Fintech', 'Remote'],
    summary:
      'Help deliver core trading features, robust risk management flows, and reliable copy trading logic on a React + Express platform.',
    cardDesc:
      'Build scalable frontend and backend components for a next-generation trading platform with full copy trading functionality.',
    accent: 'accent',
  },
];

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function breadcrumbChevron() {
  return (
    '<svg aria-hidden="true" class="h-3 w-3 shrink-0 translate-y-px text-foreground-50" viewBox="0 0 320 512" fill="currentColor">' +
    '<path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path></svg>'
  );
}

function breadcrumb(items, prefix) {
  const crumbs = items
    .map((item, i) => {
      const isLast = i === items.length - 1;
      const sep = i > 0 ? breadcrumbChevron() : '';
      const inner = item.href
        ? `<a class="text-foreground-70 hover:text-theme-accent transition-colors" href="${prefix}${item.href}">${esc(item.label)}</a>`
        : `<span class="text-foreground-50">${esc(item.label)}</span>`;
      return `<li class="flex items-baseline gap-2">${sep}${inner}</li>`;
    })
    .join('');
  return (
    '<nav aria-label="Breadcrumb" class="flex items-center gap-2 text-sm font-mono">' +
    `<ol class="flex flex-wrap items-start gap-2">${crumbs}</ol></nav>`
  );
}

function pageHeader({ prefix, crumbs, label, title, subtitle, meta, wide }) {
  const metaHtml = meta
    ? `<div class="pt-8 md:pt-10"><div class="flex flex-wrap items-end gap-8">${meta
        .map(
          (m) =>
            `<div><p class="label-caps mb-2 text-xs">${esc(m.k)}</p><p class="text-sm font-semibold text-foreground-70">${esc(m.v)}</p></div>`
        )
        .join('')}</div></div>`
    : '';

  const headerClass = wide
    ? 'relative min-h-fit flex flex-col bg-background w-full pb-10 axiom-job-hero'
    : 'relative min-h-fit flex flex-col bg-background w-full pb-10';
  const colClass = wide
    ? 'relative z-10 flex w-full flex-col'
    : 'relative z-10 flex w-full flex-col md:w-1/2';
  const h1Class = wide
    ? 'axiom-job-hero__title font-bold tracking-tight text-foreground'
    : 'text-2xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl';
  const sideCol = wide ? '' : '<div class="hidden md:block md:w-1/2" aria-hidden="true"></div>';

  return (
    `<header class="${headerClass}">` +
    '<div class="pointer-events-none absolute inset-0 z-0 md:left-1/2" aria-hidden="true">' +
    '<div class="w-full h-full bg-background"></div></div>' +
    '<div class="container-page relative flex flex-1 min-h-[15vh] md:min-h-[30vh]">' +
    `<div class="${colClass}">` +
    '<div class="relative flex flex-1 max-w-3xl md:max-w-none flex-col gap-3 md:gap-6 pt-4 md:pt-12">' +
    '<div class="pointer-events-none absolute -inset-y-12 -inset-x-8 -z-10 rounded-full bg-background/80 blur-2xl md:bg-background/40 md:blur-3xl" aria-hidden="true"></div>' +
    breadcrumb(crumbs, prefix) +
    `<span class="label-caps">${esc(label)}</span>` +
    `<h1 class="${h1Class}">${title}</h1>` +
    (subtitle ? `<p class="text-sm font-medium leading-[1.6] text-foreground-50 sm:text-base md:text-lg">${subtitle}</p>` : '') +
    metaHtml +
    '</div></div>' +
    sideCol +
    '</div>' +
    '<div class="pointer-events-none absolute right-0 top-0 bottom-0 z-[1] w-3/4 md:w-1/2" style="background:radial-gradient(circle at 100% 100%, var(--color-secondary) 0%, transparent 70%);opacity:0.15" aria-hidden="true"></div>' +
    '</header>'
  );
}

function jobListSection(prefix) {
  const cards = JOBS.map((job) => {
    const tags = job.tags.map((t) => `<span class="axiom-career-card__tag">${esc(t)}</span>`).join('');
    return (
      `<a class="axiom-career-card group" href="${prefix}careers/${job.slug}.html">` +
      `<div class="axiom-career-card__meta">${tags}</div>` +
      `<h2 class="axiom-career-card__title">${esc(job.title)}</h2>` +
      `<p class="axiom-career-card__desc">${esc(job.cardDesc)}</p>` +
      `<span class="axiom-career-card__link">View role <span aria-hidden="true">→</span></span>` +
      '</a>'
    );
  }).join('');

  return (
    '<section class="bg-background border-t border-foreground-10 pb-24 pt-(--content-padding)">' +
    '<div class="container-page">' +
    '<div class="mb-10 max-w-[680px] md:mb-14">' +
    '<p class="section-label">Open Roles</p>' +
    '<h2 class="mb-3 text-[clamp(22px,3.5vw,44px)] font-extrabold tracking-[-0.5px]">Current opportunities.</h2>' +
    '<p class="text-sm font-semibold leading-relaxed text-foreground-50 md:text-base">We are growing our engineering team with senior talent across blockchain and fintech. All roles listed below are remote within the US or EU.</p>' +
    '</div>' +
    '<div class="axiom-careers-layout">' +
    `<div class="axiom-careers-grid">${cards}</div>` +
    '<aside class="axiom-careers-enquiries">' +
    '<p class="section-label mb-3">General enquiries</p>' +
    '<p class="text-sm font-medium leading-relaxed text-foreground-50 md:text-base">Don\'t see the right role? Send your CV and a short note about what you\'d like to work on to ' +
    `<a class="font-mono font-semibold text-theme-accent underline underline-offset-4" href="mailto:${APPLY_EMAIL}">${APPLY_EMAIL}</a>.</p>` +
    '</aside></div></div></section>'
  );
}

function listSection(title, items) {
  return (
    `<div class="axiom-job-detail__section"><h2>${esc(title)}</h2><ul>` +
    items.map((item) => `<li>${esc(item)}</li>`).join('') +
    '</ul></div>'
  );
}

function applyBlock(extra, subject) {
  const subj = encodeURIComponent(subject || 'Application — Axiom Chain');
  return (
    '<div class="axiom-job-apply">' +
    '<h2>How to Apply</h2>' +
    `<p>${esc(extra || 'Please send your CV along with portfolio links or examples of relevant work.')}</p>` +
    `<a data-slot="button" data-variant="default" data-size="default" class="group/button inline-flex cursor-pointer items-center justify-center font-accent font-medium transition-[color,background-color,border-color] duration-300 whitespace-nowrap select-none bg-theme-accent text-surface border border-transparent hover:border-theme-accent/30 dark:text-primary h-12 px-6 text-base" href="mailto:${APPLY_EMAIL}?subject=${subj}">` +
    `Email ${APPLY_EMAIL}` +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right ml-2 size-4 transition-transform duration-300 group-hover/button:translate-x-1" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a>' +
    '</div>'
  );
}

function blockchainJobContent() {
  return (
    '<section class="bg-background border-t border-foreground-10 pb-24 pt-(--content-padding)">' +
    '<div class="container-page"><div class="axiom-job-detail">' +
    '<p class="axiom-job-detail__intro">We are looking for a skilled Blockchain Developer / Smart Contract Engineer to join our engineering team and help design, build, and maintain secure smart contracts for decentralised applications, DeFi products, and blockchain protocols. The ideal candidate has strong Solidity and EVM experience, a solid understanding of DeFi mechanics, and a security-first mindset when developing and reviewing smart contract systems.</p>' +
    listSection('Responsibilities', [
      'Design, build, and maintain smart contracts for DeFi and blockchain applications.',
      'Write secure, clean, gas-efficient, and maintainable Solidity code.',
      'Develop and maintain automated tests using Foundry, Hardhat, Anchor, or similar frameworks.',
      'Review smart contracts for security vulnerabilities, bugs, edge cases, and protocol-level risks.',
      'Analyse and mitigate risks related to flash loans, oracle manipulation, MEV, governance attacks, and other DeFi threat vectors.',
      'Use security and analysis tools such as Slither, Mythril, Echidna, Certora, Tenderly, or similar platforms.',
      'Support audits, bug fixes, secure deployments, and post-deployment monitoring.',
      'Optimise gas usage, storage layout, and contract performance.',
      'Document technical decisions, protocol assumptions, and security considerations.',
    ]) +
    listSection('Requirements', [
      'Strong experience with Solidity and EVM-based smart contracts.',
      'Hands-on experience with Foundry and/or Hardhat.',
      'Good understanding of Ethereum, gas optimisation, storage layout, events, and upgradeable contract patterns.',
      'Knowledge of DeFi concepts, including token standards, staking, lending, AMMs, bridges, vaults, and governance.',
      'Ability to write secure, reliable, and maintainable smart contract code.',
      'Experience testing, debugging, and reviewing smart contracts.',
      'Understanding of common smart contract vulnerabilities, including reentrancy, access control issues, oracle risks, precision errors, and front-running.',
      'Familiarity with OpenZeppelin libraries and proxy patterns.',
      'Strong attention to detail, ownership, and clear communication skills.',
    ]) +
    listSection('Nice to Have', [
      'Experience with Rust, TypeScript, Solana, Anchor, NEAR, or other blockchain ecosystems.',
      'Previous experience building or auditing DeFi protocols.',
      'Knowledge of fuzz testing, formal verification, symbolic execution, or invariant testing.',
      'Experience with Ethereum, Arbitrum, Base, Optimism, Solana, NEAR, or similar networks.',
      'Experience with AMMs, lending protocols, bridges, staking systems, vaults, or governance mechanisms.',
      'Familiarity with Tenderly, Etherscan, Blockscout, The Graph, or other blockchain monitoring and indexing tools.',
    ]) +
    listSection('What We Offer', [
      'Competitive salary.',
      'Healthcare benefits.',
      'Company-provided computer.',
      'Paid holidays.',
      'Flexible working hours.',
      'Career growth opportunities.',
      'A friendly, supportive, and collaborative engineering team.',
    ]) +
    applyBlock(
      'Please send your CV along with portfolio links or examples of relevant smart contract and DeFi work.',
      'Application — Blockchain Developer / Smart Contract Engineer'
    ) +
    '</div></div></section>'
  );
}

function tradingJobContent() {
  return (
    '<section class="bg-background border-t border-foreground-10 pb-24 pt-(--content-padding)">' +
    '<div class="container-page"><div class="axiom-job-detail">' +
    '<p class="axiom-job-detail__intro">We are building a next-generation trading platform with full copy trading functionality and a clean, intuitive user experience. The platform is built with React + TypeScript on the frontend and Express + TypeScript on the backend. We are looking for an experienced full-stack developer to help deliver core trading features, robust risk management flows, and reliable copy trading logic.</p>' +
    listSection('Requirements', [
      '5+ years of professional full-stack development experience.',
      'Strong experience with React, TypeScript, Node.js, and Express.',
      'Solid understanding of backend testing and writing reliable, maintainable code.',
      'Experience with trading, fintech, or finance-related platforms is highly desirable.',
      'Must be based in the US or EU.',
      'Strong problem-solving skills and excellent attention to detail.',
    ]) +
    listSection('Responsibilities', [
      'Build scalable frontend and backend components.',
      'Implement trading logic, risk checks, and copy trading features.',
      'Contribute to the architecture and design of a high-performance trading platform.',
      'Write and maintain tests for critical backend and trading workflows.',
      'Collaborate closely with the team to deliver secure, reliable, and user-friendly features.',
    ]) +
    applyBlock(
      'Please send your CV along with portfolio links or examples of relevant work, especially any experience with trading, fintech, or financial platforms.',
      'Application — FullStack Developer – Trading Platform'
    ) +
    '</div></div></section>'
  );
}

function extractShell() {
  const contact = fs.readFileSync(path.join(ROOT, 'contact.html'), 'utf8');
  const mainStart = contact.indexOf('<main id="main-content"');
  const headerEnd = contact.indexOf('<div class="h-[var(--header-height)]', mainStart);
  const footerStart = contact.indexOf('<footer class="flex flex-col bg-surface text-white">');
  const mainEnd = contact.indexOf('</main>', footerStart) + '</main>'.length;
  const afterMain = contact.slice(mainEnd);

  return {
    beforeContent: contact.slice(0, headerEnd),
    afterContent: contact.slice(footerStart),
    scriptsTail: afterMain,
  };
}

function adjustPaths(html, prefix) {
  if (!prefix) return html;
  return html
    .replace(/href="(?!https?:|#|mailto:)([^"]+)"/g, (m, p) => {
      if (p.startsWith('../') || p.startsWith('./')) return m;
      return `href="${prefix}${p}"`;
    })
    .replace(/src="(?!https?:|data:)([^"]+)"/g, (m, p) => {
      if (p.startsWith('../') || p.startsWith('./')) return m;
      return `src="${prefix}${p}"`;
    })
    .replace(/href="assets\//g, `href="${prefix}assets/`)
    .replace(/src="assets\//g, `src="${prefix}assets/`)
    .replace(/href="_next\//g, `href="${prefix}_next/`)
    .replace(/src="_next\//g, `src="${prefix}_next/`);
}

function stripHomeScripts(html) {
  return html
    .replace(/<script src="[^"]*axiom-home\.js" defer><\/script>\s*/g, '')
    .replace(/<script src="[^"]*axiom-home-data\.js"><\/script>\s*/g, '')
    .replace(/<script src="[^"]*axiom-marquee\.js" defer><\/script>\s*/g, '')
    .replace(/<script src="[^"]*axiom-hero-grid\.js" defer><\/script>\s*/g, '')
    .replace(/<script src="[^"]*axiom-accordion\.js" defer><\/script>\s*/g, '');
}

function setHead(html, { title, description, canonical, prefix }) {
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  out = out.replace(/meta name="description" content="[^"]*"/, `meta name="description" content="${esc(description)}"`);
  out = out.replace(/meta property="og:title" content="[^"]*"/, `meta property="og:title" content="${esc(title)}"`);
  out = out.replace(/meta property="og:description" content="[^"]*"/, `meta property="og:description" content="${esc(description)}"`);
  out = out.replace(/meta name="twitter:title" content="[^"]*"/, `meta name="twitter:title" content="${esc(title)}"`);
  out = out.replace(/meta name="twitter:description" content="[^"]*"/, `meta name="twitter:description" content="${esc(description)}"`);
  if (canonical) {
    out = out.replace(/link rel="canonical" href="[^"]*"/, `link rel="canonical" href="${prefix}${canonical}"`);
  }
  return out;
}

function fixFooterCareers(html, prefix) {
  return html.replace(
    /href="(?:\.\.\/)?contact\.html">Careers/g,
    `href="${prefix}careers.html">Careers`
  ).replace(
    /href="contact\.html" target="_blank" rel="noopener noreferrer" class="inline-flex text-sm font-semibold text-white\/70 transition-colors duration-300 hover:text-theme-accent">Careers/g,
    `href="${prefix}careers.html" class="inline-flex text-sm font-semibold text-white/70 transition-colors duration-300 hover:text-theme-accent">Careers`
  );
}

function addCareersNav(html, prefix, active) {
  const navMarker = 'aria-label="Main navigation"';
  const navStart = html.indexOf(navMarker);
  if (navStart === -1) return html;
  const navEnd = html.indexOf('</nav>', navStart);
  if (navEnd === -1) return html;

  const nav = html.slice(navStart, navEnd);
  if (nav.includes(`href="${prefix}careers.html">Careers</a>`)) return html;

  const careersLink =
    `<a class="flex items-center py-6 md:py-8 -my-6 md:-my-8 font-manrope text-sm font-semibold leading-[1.6] -tracking-[0.4px] ${active === 'careers' ? 'text-theme-accent' : 'text-nav-item transition-colors duration-300 hover:text-theme-accent-muted lg:text-base'}" href="${prefix}careers.html">Careers</a>`;

  const updatedNav = nav.replace(
    /(<a[^>]+href="[^"]*about\.html"[^>]*>About Us<\/a>)/,
    `$1${careersLink}`
  );
  if (updatedNav === nav) return html;
  return html.slice(0, navStart) + updatedNav + html.slice(navEnd);
}

function buildPage({ prefix, depth, head, header, body, activeNav }) {
  const shell = extractShell();
  let html =
    adjustPaths(shell.beforeContent, prefix) +
    header +
    '<div class="h-[var(--header-height)] w-full shrink-0" aria-hidden="true"></div>' +
    body +
    adjustPaths(shell.afterContent, prefix);

  html = setHead(html, { ...head, prefix });
  html = fixFooterCareers(html, prefix);
  html = addCareersNav(html, prefix, activeNav);
  html = stripHomeScripts(html);
  return html;
}

function writeAll() {
  fs.mkdirSync(path.join(ROOT, 'careers'), { recursive: true });

  const indexHtml = buildPage({
    prefix: '',
    depth: 0,
    activeNav: 'careers',
    head: {
      title: 'Careers at Axiom Chain | Blockchain & AI Engineering Jobs',
      description:
        'Join Axiom Chain — open roles for blockchain developers and full-stack trading platform engineers. Remote within US or EU.',
      canonical: 'careers.html',
    },
    header: pageHeader({
      prefix: '',
      crumbs: [
        { label: 'Home', href: 'index.html' },
        { label: 'Careers' },
      ],
      label: 'Careers',
      title: 'Build hard products with us.',
      subtitle:
        'We are a senior, on-shore engineering studio shipping blockchain, AI, and fintech products. We are hiring talented developers to join our growing team.',
    }),
    body: jobListSection(''),
  });
  fs.writeFileSync(path.join(ROOT, 'careers.html'), indexHtml, 'utf8');

  const blockchainHtml = buildPage({
    prefix: '../',
    depth: 1,
    activeNav: null,
    head: {
      title: 'Blockchain Developer / Smart Contract Engineer | Careers at Axiom Chain',
      description:
        'Remote blockchain developer role (US/EU). Build secure Solidity smart contracts, DeFi protocols, and automated tests with Foundry or Hardhat.',
      canonical: 'careers/blockchain-developer.html',
    },
    header: pageHeader({
      prefix: '../',
      crumbs: [
        { label: 'Home', href: 'index.html' },
        { label: 'Careers', href: 'careers.html' },
        { label: 'Blockchain Developer' },
      ],
      label: 'Open Role',
      title: 'Blockchain Developer / Smart Contract Engineer',
      subtitle: 'Design, build, and maintain secure smart contracts for DeFi and blockchain applications.',
      meta: [
        { k: 'Location', v: 'US or EU only' },
        { k: 'Type', v: 'Full-time or part-time · Remote' },
        { k: 'Team', v: 'Blockchain Engineering' },
      ],
      wide: true,
    }),
    body: blockchainJobContent(),
  });
  fs.writeFileSync(path.join(ROOT, 'careers', 'blockchain-developer.html'), blockchainHtml, 'utf8');

  const tradingHtml = buildPage({
    prefix: '../',
    depth: 1,
    activeNav: null,
    head: {
      title: 'FullStack Developer – Trading Platform | Careers at Axiom Chain',
      description:
        'Remote full-stack developer role (US/EU). React, TypeScript, Node.js, and Express on a next-generation copy trading platform.',
      canonical: 'careers/fullstack-trading-platform.html',
    },
    header: pageHeader({
      prefix: '../',
      crumbs: [
        { label: 'Home', href: 'index.html' },
        { label: 'Careers', href: 'careers.html' },
        { label: 'FullStack Developer' },
      ],
      label: 'Open Role',
      title: 'FullStack Developer – Trading Platform',
      subtitle: 'Build core trading features, risk management flows, and copy trading logic.',
      meta: [
        { k: 'Location', v: 'US or EU only' },
        { k: 'Type', v: 'Full-time or part-time · Remote' },
        { k: 'Stack', v: 'React · TypeScript · Express' },
      ],
      wide: true,
    }),
    body: tradingJobContent(),
  });
  fs.writeFileSync(path.join(ROOT, 'careers', 'fullstack-trading-platform.html'), tradingHtml, 'utf8');

  console.log('Generated careers.html and 2 job pages.');
}

function patchExistingPages() {
  function walk(dir, files = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'hts-cache', 'scripts', 'assets', 'careers'].includes(ent.name)) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p, files);
      else if (ent.name.endsWith('.html') && ent.name !== 'careers.html') files.push(p);
    }
    return files;
  }

  let patched = 0;
  for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const depth = rel.split('/').length - 1;
    const prefix = depth ? '../'.repeat(depth) : '';
    let html = fs.readFileSync(file, 'utf8');
    const before = html;

    html = fixFooterCareers(html, prefix);
    html = addCareersNav(html, prefix, null);

    if (html !== before) {
      fs.writeFileSync(file, html, 'utf8');
      patched++;
    }
  }
  console.log(`Patched Careers links in ${patched} existing page(s).`);
}

writeAll();
patchExistingPages();
