const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const CHUNK = path.join(ROOT, '_next/static/chunks/0z483dkqssm4rd07a.js');
const OUT = path.join(ROOT, 'assets/js/axiom-home-data.js');

function readRscPayload(html) {
  const chunks = [];
  const re = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  let m;
  while ((m = re.exec(html))) {
    chunks.push(
      m[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\u0026/g, '&')
        .replace(/\\u0027/g, "'")
        .replace(/\\"/g, '"')
    );
  }
  return chunks.join('\n');
}

function parseGroupsAt(all, startIdx) {
  const gi = all.indexOf('"groups":[', startIdx);
  if (gi < 0) return null;
  let depth = 0;
  let buf = '';
  for (let i = gi + 9; i < all.length; i++) {
    const ch = all[i];
    if (ch === '[') depth++;
    if (depth > 0) buf += ch;
    if (ch === ']') {
      depth--;
      if (depth === 0) break;
    }
  }
  return JSON.parse(buf).map(function (g) {
    return {
      label: g.label,
      cards: g.services.map(function (s) {
        return {
          title: s.data.title,
          subtitle: s.data.subtitle,
          slug: s.data.slug,
          lane: s.data.lane,
          summary: s.summary,
        };
      }),
    };
  });
}

function parseAiGroups(all) {
  const labels = ['Advisory', 'Product', 'Solutions', 'Engineering'];
  const groups = [];
  for (let li = 0; li < labels.length; li++) {
    const label = labels[li];
    const marker = '"label":"' + label + '","services":[';
    const start = all.indexOf(marker);
    if (start < 0) continue;
    const end =
      li + 1 < labels.length
        ? all.indexOf('"label":"' + labels[li + 1] + '","services":[', start + 1)
        : all.indexOf('}]}],"accent"', start);
    const slice = all.slice(start, end > start ? end : start + 50000);
    const cards = [];
    const re =
      /"lane":"ai","slug":"([^"]+)"[\s\S]*?"title":"([^"]*?)"[\s\S]*?"subtitle":"([^"]*?)"[\s\S]*?"summary":"((?:\\.|[^"\\])*)"/g;
    let m;
    while ((m = re.exec(slice))) {
      cards.push({
        slug: m[1],
        title: m[2],
        subtitle: m[3],
        lane: 'ai',
        summary: m[4].replace(/\\"/g, '"'),
      });
    }
    groups.push({ label: label, cards: cards });
  }
  return groups;
}

function parseProjects(chunk, html) {
  const erMatch = chunk.match(
    /eR=\{([\s\S]*?)\};e\.s\(\["PROJECT_ITEMS"/
  );
  if (!erMatch) return { verticals: [], byVertical: {} };

  const erSrc = '({' + erMatch[1] + '})';
  // eslint-disable-next-line no-new-func
  const byVertical = Function('return ' + erSrc)();

  const heroImages = {};
  const imgRe = /projects\/([a-z0-9-]+)\.html[\s\S]{0,2500}?src="([^"]+)"/g;
  let im;
  while ((im = imgRe.exec(html))) {
    heroImages[im[1]] = im[2];
  }

  const nextDir = path.join(ROOT, '_next');
  const nextFiles = fs.existsSync(nextDir) ? fs.readdirSync(nextDir) : [];

  function heroForSlug(slug) {
    if (heroImages[slug]) return heroImages[slug];
    const hit = nextFiles.find(function (f) {
      return f.startsWith(slug + '-hero');
    });
    return hit ? '_next/' + hit : 'images/projects/' + slug + '-hero.webp';
  }

  function metaForSlug(slug) {
    const re = new RegExp(
      'slug:"' +
        slug.replace(/-/g, '\\-') +
        '",title:"([^"]+)",description:"((?:\\\\.|[^"\\\\])*)",metadata:"[^"]*",tags:\\[([^\\]]*)\\]'
    );
    const m = chunk.match(re);
    if (!m) {
      return {
        slug: slug,
        title: slug.replace(/-/g, ' ').replace(/\b\w/g, function (c) {
          return c.toUpperCase();
        }),
        description: '',
        tags: '',
      };
    }
    return {
      slug: slug,
      title: m[1],
      description: m[2].replace(/\\"/g, '"'),
      tags: m[3]
        .replace(/"/g, '')
        .split(',')
        .slice(0, 3)
        .join(' — '),
      image: heroForSlug(slug),
    };
  }

  const verticals = ['DeFi', 'RWA', 'Infrastructure', 'AI', 'Fintech'];
  const out = {};
  for (const v of verticals) {
    const entry = byVertical[v];
    if (!entry) continue;
    out[v] = {
      hero: metaForSlug(entry.hero),
      supporting: entry.supporting.map(metaForSlug),
    };
  }

  return { verticals: verticals, byVertical: out };
}

function main() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const chunk = fs.readFileSync(CHUNK, 'utf8');
  const rsc = readRscPayload(html);

  const bcStart = rsc.indexOf('"lane":"blockchain"');
  const blockchain = parseGroupsAt(rsc, bcStart - 500);
  const ai = parseAiGroups(rsc);
  const projects = parseProjects(chunk, html);

  const data = {
    serviceSections: [
      { accent: 'secondary', groups: blockchain || [] },
      { accent: 'accent', groups: ai },
    ],
    projects: projects,
  };

  const body =
    'window.AXIOM_HOME_DATA = ' +
    JSON.stringify(data, null, 2) +
    ';\n';

  fs.writeFileSync(OUT, body, 'utf8');
  console.log(
    'Wrote',
    OUT,
    '- blockchain tabs:',
    (blockchain || []).length,
    'ai tabs:',
    ai.length,
    'verticals:',
    projects.verticals.length
  );
}

main();
