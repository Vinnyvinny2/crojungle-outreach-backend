// ══ MEASUREMENT ONLY — NOT WIRED INTO THE PIPELINE ═════════════════════════
// Goal: answer one number — of the leads on a live run that named NOBODY, how
// many would a STATE BUSINESS FILING have named, judged by THIS repo's own
// officer rules and not by a looser parser.
//
// This file is a probe. It is not required by src/all.js, it is not in
// src/manifest.js, no route calls it, and it costs a lead nothing. It reads
// src/all.js, lifts the real OC_AGENT_RE / OC_OWNER_POS_RE /
// pickOpenCorporatesOfficer / ownerNameDoor / looksLikeRealName source out of
// it, and executes THOSE against filings collected by hand from the official
// state registries (every record carries its source URL below). Nothing here is
// re-implemented: if the rule changes in src/all.js, this probe changes with it.
//
// Run: node probe-state-filings-officers.js
//
// The filings were read on 2026-09-11. Officer payloads are shaped the way the
// OpenCorporates API shapes them — [{ officer: { name, position, inactive } }] —
// because that is what pickOpenCorporatesOfficer parses.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ── 1. LIFT THE REAL RULES OUT OF src/all.js ──────────────────────────────
// Grow the slice one line at a time until the JS parser accepts it. That uses
// the real parser instead of a brace counter, which regex literals defeat.
const SRC = fs.readFileSync(path.join(__dirname, 'src', 'all.js'), 'utf8').split(/\r?\n/);
const lift = (decl) => {
  const start = SRC.findIndex(l => l.startsWith(`const ${decl} `) || l.startsWith(`const ${decl}=`));
  if (start < 0) throw new Error(`probe cannot find "const ${decl}" in src/all.js — the rule moved or was renamed`);
  for (let end = start; end < start + 80 && end < SRC.length; end++) {
    const chunk = SRC.slice(start, end + 1).join('\n');
    // A declaration may end with a trailing line comment (CORP_ONE does), so
    // test the statement with that comment stripped rather than the raw line.
    if (!/;\s*(\/\/[^\n]*)?$/.test(chunk)) continue;
    try { new Function(chunk); return chunk; } catch (e) { /* not a whole statement yet */ }
  }
  throw new Error(`probe could not lift a complete "const ${decl}" out of src/all.js`);
};

const NEEDED = [
  'normalizePersonName', 'looksLikeRealName',
  'normalizeTitleWords', 'ROLE_WORDS', 'allRoleWords',
  'OWNER_WORD_RE', 'NAV_WORD_RE', 'ORG_TOKEN_RE', 'HEADLINE_WORD_RE', 'PLACE_HEAD_RE',
  // Round 139: the door reads BOTH of the file's role-word lists now.
  'FIND_ROLE_NOUN',
  'US_STATE_NAMES',
  // Round 139 added the surname-first reader to the door, so the probe must
  // lift it and its evidence lists too - a records filing writes "HOWES, LUCAS B"
  // and whether that is read as a person is now part of the rule being measured.
  'CORP_WORDS', 'CORP_ONE', 'GIVEN_NAMES',
  'PERSON_INITIAL_RE', 'PERSON_SUFFIX_RE', 'PERSON_SUFFIX_ONE', 'uninvertPersonName',
  'ownerNameDoor',
  'OC_AGENT_RE', 'OC_OWNER_POS_RE', 'pickOpenCorporatesOfficer',
];
const ctx = { console };
vm.createContext(ctx);
// `const` in a vm script is a lexical binding, not a context property, so the
// last line hands the lifted rules back out.
vm.runInContext(NEEDED.map(lift).join('\n') + `\nObject.assign(globalThis, { ${NEEDED.join(', ')} });`, ctx);

// ── 2. THE FILINGS, AS READ FROM THE OFFICIAL REGISTRIES ──────────────────
// verdictFloor: what the STATE published, before this repo's rules are applied.
//   'officers'    the filing names at least one person in an owner-ish role
//   'no-officers' the state does not publish officers at all (policy, not luck)
//   'unread'      the state does publish them, but the record could not be read
//                 from this sandbox (noindex / POST-only / API key required)
const LEADS = [
  {
    business: 'Jax Paver Guys LLC',
    domain: 'jaxpaverguys.com',
    state: 'FL',
    howState: 'domain "jax" + Jacksonville FL address on their own site',
    filedName: 'JAX PAVER GUYS LLC',
    entityNo: 'L23000443317',
    status: 'ACTIVE',
    agent: 'Hoffman, Henry (13270-2 Boney Road, Jacksonville FL)',
    match: 'exact — filed name equals the trade name',
    confidence: 'high',
    source: 'https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResultDetail?inquirytype=EntityName&directionType=ForwardList&searchNameOrder=JAXPAVERGUYS%20L230004433170&aggregateId=flal-l23000443317-4ba15626-dcbd-46eb-8527-ec203fea9730&listNameOrder=JAXPAVERGUYS%20L230004433170',
    verdictFloor: 'officers',
    officers: [{ officer: { name: 'Hoffman, Henry', position: 'President' } }],
  },
  {
    business: 'Paver Rescue Paver Sealing Tampa',
    domain: 'paverrescuellc.com',
    state: 'FL',
    howState: 'listing name says Tampa; domain matches the filed name',
    filedName: 'PAVER RESCUE LLC',
    entityNo: 'L16000070066',
    status: 'ACTIVE',
    agent: 'HOWES, LUCAS B (10810 Carrollwood Dr, Tampa FL)',
    match: 'high — domain paverrescuellc.com = PAVER RESCUE LLC; the twin filing '
         + 'PAVER RESCUE PAVER SEALING TAMPA LLC (L23000256026, INACTIVE) shares the '
         + 'same address and the same person (HOWES, LUCAS, title MGR)',
    confidence: 'high',
    source: 'https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResultDetail?inquirytype=EntityName&directionType=Initial&searchNameOrder=RESCUEPAVERS%20L160000700660&aggregateId=flal-l16000070066-d2abc4ee-0589-4cf9-99f1-07607d375e7f',
    verdictFloor: 'officers',
    officers: [{ officer: { name: 'HOWES, LUCAS B', position: 'AMBR' } }],
  },
  {
    business: 'All Engineered (All Engineered HVAC)',
    domain: 'allengineeredhvac.com',
    state: 'OH',
    howState: '2383 Miramar Blvd, University Heights OH on every page of their site',
    filedName: '(no officer is published for any Ohio entity — see source)',
    entityNo: '',
    status: '',
    agent: 'statutory agent only',
    match: 'n/a — the state publishes no officer to match against',
    confidence: 'n/a',
    source: 'https://www.ohiosos.gov/business/business-reports (published field list: '
          + 'charter no., name, STATUTORY AGENT, filer, incorporator — no officers)',
    verdictFloor: 'no-officers',
    officers: [],
  },
  {
    business: 'Everguard Exterior LLC',
    domain: 'everguardexterior.com',
    state: 'OH',
    howState: '667 Lakeview Plaza, Worthington OH / 1840 Progress Ave, Columbus OH',
    filedName: 'EVERGUARD EXTERIOR LLC (Columbus, OH)',
    entityNo: '',
    status: '',
    agent: 'statutory agent only',
    match: 'n/a — the state publishes no officer to match against',
    confidence: 'n/a',
    source: 'https://www.ohiosos.gov/business/business-reports',
    verdictFloor: 'no-officers',
    officers: [],
  },
  {
    business: 'EcoView Windows & Doors (DFW)',
    domain: 'ecoviewdfw.com',
    state: 'TX',
    howState: 'their own Terms of Service: "We are Design5 Group LLC, doing business as '
            + 'EcoView Windows and Doors, a company registered in Texas"',
    filedName: 'DESIGN5 GROUP, LLC (Mabank, TX)',
    entityNo: '',
    status: '',
    agent: 'not read',
    match: 'the filed name is NOT the trade name — a name-only lookup for "EcoView '
         + 'Windows & Doors" would miss, or land on a stranger',
    confidence: 'entity identified from their own legal page; officer record unread',
    source: 'https://www.ecoviewdfw.com/terms-of-service + '
          + 'https://comptroller.texas.gov/taxes/franchise/pir-oir-filing-req.php',
    verdictFloor: 'unread',
    officers: [],
  },
  {
    business: 'Together Design & Build',
    domain: 'togetherdesignbuild.com',
    state: 'TX',
    howState: 'Austin TX and Dallas TX addresses on their own contact page',
    filedName: 'TOGETHER DESIGN AND BUILD LLC (Austin, TX), formed 2020-02-19',
    entityNo: '',
    status: 'Active',
    agent: 'not read',
    match: 'high — their own SMS consent line names TOGETHER DESIGN AND BUILD LLC; a '
         + 'second filing, TOGETHER DESIGN AND BUILD DALLAS LLC, also exists',
    confidence: 'entity identified; officer record unread',
    source: 'https://togetherdesignbuild.com/about-us/ + '
          + 'https://comptroller.texas.gov/taxes/franchise/pir-oir-filing-req.php',
    verdictFloor: 'unread',
    officers: [],
  },
  {
    business: 'Above & Beyond Pool Remodeling, Pool Builder & Landscape Design',
    domain: 'aboveandbeyondpoolremodeling.com',
    state: 'AZ',
    howState: '1757 E Baseline Rd Ste 114, Gilbert AZ on their site, BBB and Houzz',
    filedName: 'unresolved — an AZ entity behind ROC 361588 / 261054 / 257866 / '
             + '317598 / 320411 / 350639; "Above and Beyond Pools, Inc." is one candidate',
    entityNo: '',
    status: '',
    agent: 'not read',
    match: 'LOW — several Arizona entities carry "Above and Beyond Pool(s)", including '
         + 'one in Tucson with a different principal',
    confidence: 'entity NOT confidently matched',
    source: 'https://ecorp.azcc.gov (noindex to this crawler) + https://roc.az.gov/search',
    verdictFloor: 'unread',
    officers: [],
  },
];

// Window Wise is deliberately NOT in LEADS. See the note printed at the end.

// ── 3. JUDGE EACH FILING BY THE REPO'S OWN RULES ──────────────────────────
const verdictOf = (lead) => {
  if (lead.verdictFloor === 'no-officers') return { verdict: 'NO OFFICERS', pick: null };
  if (lead.verdictFloor === 'unread') return { verdict: 'NOT READ', pick: null };
  const pick = ctx.pickOpenCorporatesOfficer(lead.officers, lead.business);
  if (pick) return { verdict: 'HIT', pick };
  // Say WHY the repo refused, using the same three tests in the same order.
  const why = lead.officers.map(o => {
    const off = o.officer || o;
    const name = String(off.name || ''), pos = String(off.position || '');
    if (ctx.OC_AGENT_RE.test(pos)) return `"${pos}" reads as a registered agent`;
    if (!ctx.OC_OWNER_POS_RE.test(pos)) return `"${pos}" is not an owner-level position the code knows`;
    if (off.inactive === true) return `${name} is marked inactive`;
    const door = ctx.ownerNameDoor(name, lead.business);
    if (door) return `the name door refused "${name}" as ${door}`;
    if (!ctx.looksLikeRealName(name)) return `"${name}" does not look like a person`;
    return 'refused for an unknown reason';
  });
  return { verdict: 'REFUSED BY OUR RULES', pick: null, why };
};

const rows = LEADS.map(l => ({ lead: l, ...verdictOf(l) }));

const pad = (s, n) => String(s).padEnd(n);
console.log('\n══ STATE FILINGS OFFICER PROBE — measurement only, nothing is wired in ══\n');
for (const r of rows) {
  console.log(`${pad(r.lead.state, 3)} ${pad(r.lead.business.slice(0, 46), 48)} ${r.verdict}`);
  if (r.pick) console.log(`      -> ${r.pick.name} (${r.pick.title})  [${r.lead.filedName} ${r.lead.entityNo}]`);
  if (r.why) r.why.forEach(w => console.log(`      x ${w}`));
  if (r.verdict === 'NO OFFICERS') console.log(`      x ${r.lead.state} publishes a statutory agent and no officer list`);
  if (r.verdict === 'NOT READ') console.log(`      ? ${r.lead.state} does publish officers; this probe could not read the record`);
}

const hits = rows.filter(r => r.verdict === 'HIT').length;
const stateHasOfficers = rows.filter(r => r.lead.verdictFloor === 'officers').length;
const refused = rows.filter(r => r.verdict === 'REFUSED BY OUR RULES').length;
const noOff = rows.filter(r => r.verdict === 'NO OFFICERS').length;
const unread = rows.filter(r => r.verdict === 'NOT READ').length;

console.log('\n-- THE NUMBER ----------------------------------------------------------');
console.log(`${hits} of ${rows.length} leads would gain a named, owner-level officer under the rules as written.`);
console.log(`${stateHasOfficers} of ${rows.length} had a filing that NAMES a person; ${refused} of those was refused by our own picker.`);
console.log(`${noOff} are in a state that publishes no officers at all. ${unread} could not be read from here.`);
console.log('\nWindow Wise is excluded from the denominator: the run log says it got its owner');
console.log('from the paid wave, and with no domain and no city the lead cannot be tied to any');
console.log('one of the several "Window Wise" companies. 7, not 8.\n');

// ── 4. WHAT THE SAME FILINGS WOULD YIELD WITH TWO SMALL REPAIRS ───────────
// Neither repair is applied to src/all.js by this probe. They are measured so
// the cost of NOT making them is a number rather than an opinion.
const FL_TITLE_CODES = { AMBR: 'Authorized Member', MGR: 'Manager', MGRM: 'Managing Member', AP: 'Authorized Person', PRES: 'President', VP: 'Vice President', TREA: 'Treasurer', SECR: 'Secretary', DIR: 'Director', CEO: 'Chief Executive Officer' };
const expand = (pos) => FL_TITLE_CODES[String(pos).trim().toUpperCase()] || pos;
const withCodes = LEADS.filter(l => l.verdictFloor === 'officers').map(l => {
  const officers = l.officers.map(o => ({ officer: { ...o.officer, position: expand(o.officer.position) } }));
  return { l, pick: ctx.pickOpenCorporatesOfficer(officers, l.business) };
});
console.log('-- REPAIR 1: EXPAND THE STATE TITLE CODES (AMBR/MGR/MGRM/AP) -----------');
for (const w of withCodes) console.log(`  ${pad(w.l.business.slice(0, 44), 46)} ${w.pick ? 'HIT  -> ' + w.pick.name + ' (' + w.pick.title + ')' : 'still refused'}`);
console.log(`  ${withCodes.filter(w => w.pick).length} of ${withCodes.length} readable filings would name somebody.\n`);

// REPAIR 2. A registry prints a person LAST, FIRST MIDDLE. Two things break on
// that shape and both are proven here by executing the real functions:
//   a) looksLikeRealName tests the LAST token as the surname, and on
//      "HOWES, LUCAS B" the last token is the middle INITIAL "B", which fails
//      /^[A-Z][a-zA-Z'-]{1,}$/ — so the name door refuses a real person.
//   b) even when it passes, the greeting is built from the first token, so the
//      email opens "Hi Hoffman".
const flipRegistryName = (n) => {
  const s = String(n || '').trim();
  const m = s.match(/^([^,]+),\s*(.+)$/);
  return m ? `${m[2].trim()} ${m[1].trim()}` : s;
};
console.log('-- REPAIR 2: THE REGISTRY PRINTS "LAST, FIRST MIDDLE" ------------------');
const bothRepairs = LEADS.filter(l => l.verdictFloor === 'officers').map(l => {
  const officers = l.officers.map(o => ({ officer: { ...o.officer, name: flipRegistryName(o.officer.name), position: expand(o.officer.position) } }));
  return { l, raw: l.officers[0].officer.name, pick: ctx.pickOpenCorporatesOfficer(officers, l.business) };
});
for (const w of bothRepairs) {
  const before = ctx.ownerNameDoor(w.raw, w.l.business);
  console.log(`  "${w.raw}" -> name door says ${JSON.stringify(before)}; flipped "${flipRegistryName(w.raw)}" -> ${JSON.stringify(ctx.ownerNameDoor(flipRegistryName(w.raw), w.l.business))}`);
  console.log(`     ${w.pick ? 'HIT  -> ' + w.pick.name + ' (' + w.pick.title + ')' : 'still refused'}`);
}
console.log(`\n  WITH BOTH REPAIRS: ${bothRepairs.filter(w => w.pick).length} of ${bothRepairs.length} readable filings name somebody`);
console.log(`  — which is ${bothRepairs.filter(w => w.pick).length} of ${rows.length} leads, against ${hits} of ${rows.length} today.\n`);
