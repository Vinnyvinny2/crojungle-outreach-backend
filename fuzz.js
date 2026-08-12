// ══ FUZZ THE COMPOSER WITH SYNTHETIC LEADS ═══════════════════════════════════
// Running real audits cannot find these bugs. 33 rungs × 3 urgencies ×
// 4 business models × 4 skeletons × 2 variants is 3,168 paths, and one audit
// costs $0.09 and three minutes while covering about six of them. Twenty audits
// tonight touched maybe 120. That is an arithmetic problem, not a work problem.
//
// Every bug found tonight was reachable by calling a pure function with a made-up
// object. So: generate thousands of synthetic leads, compose an email for each,
// and assert INVARIANTS — things that must be true of every email regardless of
// input — rather than checking exact output.
//
//   node fuzz.js            2000 leads
//   node fuzz.js 20000      a deeper run
const N = Number(process.argv[2]) || 2000;
const PORT = 4900;

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const maybe = (p, v, d = null) => (Math.random() < p ? v : d);

// Every rung id, harvested from the live ladder so the fuzzer can never drift
// from what the system actually has.
const fs = require('fs');
const src = fs.readFileSync('server.js', 'utf8');
const la = src.indexOf('const HARM_LADDER');
let d = 0, le = la;
for (let i = la; i < src.length; i++) { if (src[i] === '[') d++; if (src[i] === ']') { d--; if (d === 0) { le = i; break; } } }
const RUNGS = [...src.slice(la, le).matchAll(/id: '([a-z_]+)'/g)].map(m => m[1]);
const BANDS = ['DEAD', 'INVISIBLE', 'BLOCKS', 'CONTRADICTS', 'OPINION'];
const TRADES = ['plumber', 'lasik surgery', 'water damage restoration', 'kitchen remodeling',
  'garage door repair', 'CPA', 'label manufacturer', 'roofing contractor', '', 'orthodontist'];

// Names chosen to hit the shapes that broke things: middle initials, suffixes,
// shared surnames, single words, honorifics, empty.
const NAMES = ['Tom Freund', 'Jeffrey D. Horn', 'Deirdre L Taylor', 'Bob Smith Jr',
  'Dr. Amaka Nwubah', 'William', '', 'Mary-Jane O\'Brien', 'Kelly Brooks'];

const synth = () => {
  const n = 1 + Math.floor(Math.random() * 8);
  const picked = [...RUNGS].sort(() => Math.random() - 0.5).slice(0, n);
  return {
    company: rand(['Acme Co', 'Smith & Sons, LLC', '', 'Ünïcode Ltd', 'A'.repeat(120)]),
    founderName: rand(NAMES),
    tradeWord: rand(TRADES),
    brainAudit: {
      measuredNumbers: {
        reviewCount: maybe(0.8, Math.floor(Math.random() * 900)),
        rating: maybe(0.8, +(3 + Math.random() * 2).toFixed(1)),
        reviewsRead: maybe(0.7, Math.floor(Math.random() * 40)),
        ownerReplies: maybe(0.7, Math.floor(Math.random() * 40)),
        tradeWord: rand(TRADES),
        tenure: maybe(0.5, Math.floor(Math.random() * 80)),
      },
      problemCount: n,
      businessModel: maybe(0.3, { model: rand(['B2B_INSTITUTIONAL', 'LOCAL_CONSUMER', 'NATIONAL_REMOTE']), verified: true, why: 'x' }),
      situationRead: maybe(0.6, { headline: rand([
        'The reputation is real and the path to it is blocked',
        'The work is being done and none of it is visible',
        '', 'A'.repeat(400),
      ]) }),
      patternLine: maybe(0.4, rand(['phone-only intake usually survives because it worked when the business was smaller', ''])),
      harmsRanked: picked.map((id, i) => ({
        id, band: rand(BANDS),
        harm: 90 - i * 7,
        selfFix: 1 + Math.floor(Math.random() * 5),
        finding: `Synthetic finding for ${id} number ${i}`,
        costs: maybe(0.75, `it costs them something measurable in ${id}`, ''),
        reframe: maybe(0.6, 'people comparing three options go with whichever one lets them start', ''),
      })),
      allowedReframes: [],
    },
  };
};

// ══ THE INVARIANTS ═══════════════════════════════════════════════════════════
// Each one is a bug found tonight, generalised. They must hold for EVERY email
// the composer can produce, on any input.
const INVARIANTS = [
  ['dangling conjunction', b => /\b(so|and|but|because|which)\s*[.!?]/i.test(b),
    'a template rendered with an empty field — live as "...mention this, so."'],
  ['double punctuation', b => /[.!?]\s*[.!?]/.test(b) || /\s,|,,/.test(b)],
  ['unreplaced placeholder', b => /\$\{|\{\{|undefined|NaN|\[object/.test(b)],
  ['literal null', b => /\bnull\b/i.test(b), 'live: "your Google listing has null photos"'],
  ['greeting is a page heading', b => /^(About|Our Team|Contact|Get Started)\s*[,—-]/i.test(b),
    'live: the email opened "About —" at DuraMark'],
  ['em-dash greeting returned', b => /^[A-Z][a-z]+\s+—\s/.test(b),
    'the AI tell we removed; a skeleton edit could reintroduce it'],
  ['pronoun collision', b => /\b(people|customers|visitors|strangers)\b[^.]{0,40}\bwhoever tells you\b/i.test(b),
    'live: "people generally ask whoever tells you first"'],
  ['double space or ragged newline', b => /  +/.test(b.replace(/\n/g, '')) || /\n\n\n/.test(b)],
  // Two sentences joined with a space and no full stop. endSentence terminates
  // the END of a string, so a skeleton that joined reframe + costs + pattern and
  // called it once punctuated only the last of the three. Live on Dr Craig
  // Wooten: "...a stranger comparing three companies will find A practice that
  // asks for a quote...". A lowercase word, a single space, then a capitalised
  // article or determiner is not a shape English produces mid-sentence.
  ['two sentences fused, no full stop', b => /[a-z] (?:A|An|The|That|This|There|These|Those|Nothing|Someone|Somebody|People|When|Their|Your|His|Her|Most|Every|Each|Anyone|And) [a-z]/.test(b),
    'endSentence punctuates the end of a joined string, not the seams inside it'],
  // The same clause twice in one email. reframe and costs are written
  // independently and both reach for the comparison shopper, so they collide:
  // "A stranger comparing three companies reads the reviews before anything
  // else. A complaint that repeats is the one a stranger comparing three
  // companies will find." Reads as a template talking to itself.
  ['same long phrase repeated in one email', b => {
    const words = b.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
    const seen = new Set();
    for (let i = 0; i + 5 <= words.length; i++) {
      const gram = words.slice(i, i + 5).join(' ');
      if (seen.has(gram)) return true;
      seen.add(gram);
    }
    return false;
  }, 'two different fields reached for the same image and both shipped'],
  ['opens on lowercase', b => /^[a-z]/.test(b.trim())],
  // The break-up deliberately asks nothing — "asks nothing and counts nothing,
  // that is what makes it reply" — so this only applies to the other four.
  ['no closing question', (b, key) => key !== 'breakup' && !/[?]/.test(b),
    'every touch except the break-up must end on an ask'],
  ['runaway length', b => b.split(/\s+/).length > 140, 'first touches perform under 80 words'],
  ['empty body', b => !b || b.trim().length < 20],
];

(async () => {
  const { spawn } = require('child_process');
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 9000));

  const fails = new Map();
  let composed = 0, blocked = 0, threw = 0;

  for (let i = 0; i < N; i++) {
    const lead = synth();
    let res;
    try {
      const r = await fetch(`http://localhost:${PORT}/api/compose-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      res = await r.json();
    } catch (e) { threw++; continue; }

    const c = res && res.composed;
    if (!c) { blocked++; continue; }

    for (const key of ['variantA', 'variantB', 'followUp1', 'followUp2', 'breakup']) {
      const e = c[key];
      const body = (e && typeof e === 'object' ? e.body : e) || '';
      if (!body) continue;
      composed++;
      for (const [name, test, note] of INVARIANTS) {
        let bad = false;
        try { bad = test(body, key); } catch { bad = true; }
        if (!bad) continue;
        if (!fails.has(name)) fails.set(name, { count: 0, note, sample: null, where: key, lead: null });
        const f = fails.get(name);
        f.count++;
        if (!f.sample) { f.sample = body.slice(0, 150).replace(/\n/g, ' '); f.lead = lead; }
      }
    }
    if (i && i % 500 === 0) process.stdout.write(`  ${i}/${N} leads, ${composed} emails...\n`);
  }

  srv.kill();
  console.log('');
  console.log(`  ${N} synthetic leads -> ${composed} emails composed, ${blocked} correctly blocked, ${threw} request errors`);
  console.log('');
  if (!fails.size) {
    console.log('  ✓ every invariant held across every email');
  } else {
    console.log(`  ${fails.size} INVARIANT(S) VIOLATED:`);
    for (const [name, f] of [...fails].sort((a, b) => b[1].count - a[1].count)) {
      console.log('');
      console.log(`  ⛔ ${name} — ${f.count} time(s), first in ${f.where}`);
      if (f.note) console.log(`     ${f.note}`);
      console.log(`     "${f.sample}"`);
      if (f.lead) fs.writeFileSync(`/tmp/fuzzfail_${name.replace(/\W/g, '_')}.json`, JSON.stringify(f.lead, null, 2));
    }
    console.log('');
    console.log('  Failing leads written to /tmp/fuzzfail_*.json — replay one to debug.');
  }
  process.exit(fails.size ? 1 : 0);
})();
