// ══ THE CLIENT HAD NO AUTOMATED CHECK AT ALL ════════════════════════════════
// index.html is half this system — 10,000 lines of compiled React with no build
// step — and the only thing ever run against it was dupkeys.js. That found nine
// separate collisions in one function, each silently blanking data that had just
// loaded correctly, which is a fair indication of what else is in there.
//
// This checks the one thing that decides what the SERVER gets to work with: the
// research request. Two call sites build that request by hand, and on
// 2026-08-19 they disagreed about twenty fields — pressing "Run Research" sent
// neither the rating, the review count, the phone, the multi-market coverage nor
// the lead channel, while the discovery path sent all five and none of the
// browser measurements. Neither body was complete, and which audit you got
// depended on which button you pressed.
//
// That is the dominant bug class in this project stated exactly: a value that is
// computed in one place and never reaches the thing that consumes it.
//
//   node clientcheck.js            exits non-zero on failure
const acorn = require('acorn'), fs = require('fs'), path = require('path');
const root = path.dirname(require.main.filename);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
// The sections BOTH render surfaces must carry, in this order. One list,
// checked against the exported sheet and against the audit screen, so a
// section added to one and not the other fails the build. The apostrophe in
// the scoreboard heading is HTML-escaped on the sheet, so it is matched on the
// half of it that survives escaping.
// Round 110: the two tiers are gone. Vin, after reading a live pair: "theres
// no need to have al that extra detail on my screen lets just incoprate the
// missing stuff ... into the teir 1." With the reprint removed there was not
// enough left below the rule to be a second document.
const SHEET_ORDER = ['The story', 's working, what', 'The biggest leaks',
  'The sell', 'The conversation', 'Do not say on this call', 'The funnel'];
const src = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');
const ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'script', locations: true });

const fails = [];
const notes = [];

// ══ IT MUST NOT BE POSSIBLE TO PASS THIS BY MOVING THE OBJECT ═════════════
// The first version of this check read the keys off the object literal at each
// call site. The moment both sites were changed to call one builder, there were
// no literals left to read, and the check reported a clean pass while seeing
// nothing at all — a check that cannot fail, which is the thing this project
// names as worse than no check.
//
// So it follows the builder: the keys are read from what buildResearchBody
// RETURNS, and a call site that hands researchViaQueue anything other than that
// builder is itself the failure, because a second hand-written body is exactly
// how the two came to disagree.
const walk = (n, fn) => {
  if (!n || typeof n !== 'object') return;
  fn(n);
  for (const k of Object.keys(n)) {
    const v = n[k];
    if (Array.isArray(v)) v.forEach(c => walk(c, fn));
    else if (v && typeof v === 'object' && v.type) walk(v, fn);
  }
};

// 1. THE BUILDER, AND THE FIELDS IT ACTUALLY SENDS.
let builderKeys = null, builderLine = 0, builderCount = 0;
walk(ast, (n) => {
  const isBuilder = (n.type === 'VariableDeclarator' && n.id && n.id.name === 'buildResearchBody')
    || (n.type === 'FunctionDeclaration' && n.id && n.id.name === 'buildResearchBody');
  if (!isBuilder) return;
  builderCount++;
  builderLine = n.loc.start.line;
  let keys = null;
  walk(n, (m) => {
    if (keys || m.type !== 'ReturnStatement' || !m.argument) return;
    if (m.argument.type !== 'ObjectExpression') return;
    keys = m.argument.properties.filter(p => p.type === 'Property' && !p.computed)
      .map(p => p.key.name || String(p.key.value));
  });
  builderKeys = keys;
});
if (!builderCount) fails.push('buildResearchBody is gone — the research request is being assembled somewhere else again, which is how the two paths came to disagree about seventeen fields');
else if (builderCount > 1) fails.push(`buildResearchBody is defined ${builderCount} times — two builders is the same defect as two hand-written bodies`);
else if (!builderKeys) fails.push('buildResearchBody no longer returns a plain object, so nothing can verify what the server is actually sent');

// 2. EVERY CALL SITE GOES THROUGH IT. An object literal here is a body written
// by hand, and the next field somebody adds will go into one of them only.
const calls = [];
walk(ast, (n) => {
  if (n.type !== 'CallExpression' || !n.callee || n.callee.name !== 'researchViaQueue') return;
  const arg = n.arguments[0];
  const viaBuilder = arg && arg.type === 'CallExpression' && arg.callee && arg.callee.name === 'buildResearchBody';
  calls.push({ line: n.loc.start.line, viaBuilder, kind: arg ? arg.type : 'none' });
});
if (!calls.length) fails.push('no call to researchViaQueue was found at all — this check is reading the wrong file, or the request is built somewhere new');
for (const c of calls) {
  if (!c.viaBuilder) {
    fails.push(`the research request at line ${c.line} is a ${c.kind} written by hand instead of buildResearchBody — that is how "Run Research" came to send neither the rating, the review count, the phone, the multi-market coverage nor the lead channel`);
  }
}

// 3. THE FIELDS NOTHING DOWNSTREAM CAN RECOVER. A request that omits one of
// these does not degrade, it deletes: marketsSeen and marketsAbsent ARE the
// coverage finding, and leadChannel is what routes a business with no website to
// a phone call instead of to an audit with nothing to read.
const MUST_SEND = ['company', 'website', 'placeId', 'location', 'industry',
  'marketsSeen', 'marketsAbsent', 'noWebsite', 'builderSite', 'leadChannel',
  'reviewCount', 'rating', 'phone', 'browserData', 'priorEmail'];
if (builderKeys) {
  for (const k of MUST_SEND) {
    if (!builderKeys.includes(k)) {
      fails.push(`the research request no longer sends "${k}" — nothing downstream can recover it, so every finding built on it is dead`);
    }
  }
}

// 4. WHAT THE SERVER READS AND THE CLIENT NEVER SENDS. Reported, not failed:
// the server reads req.body across several routes and only some of those belong
// to research. A number to read, not a verdict — but it was never visible.
const serverReads = [...new Set([...server.matchAll(/req\.body\.([A-Za-z_$][A-Za-z0-9_$]*)/g)].map(m => m[1]))];
const sends = new Set(builderKeys || []);
const never = serverReads.filter(k => !sends.has(k)).sort();
if (never.length) console.log(`  \u00b7 ${never.length} req.body field(s) the server reads somewhere and the research request does not send: ${never.slice(0, 20).join(', ')}${never.length > 20 ? ` +${never.length - 20} more` : ''}\n    (several belong to the compose route, not to research \u2014 a list to read, not a failure)`);

// ══ 5. THE MERGE, RUN FOR REAL ══════════════════════════════════════════════
// Everything above reads structure. This EXECUTES the client: it lifts
// applyResearchResult out of index.html with the two helpers it calls, runs it
// against a synthetic research response where every field carries a unique
// marker, and asserts each marker comes out the other side on the lead.
//
// That is this project's dominant bug class made testable on the client for the
// first time. The server-side version of it — MEASUREMENT DELIVERY CHECK — was
// written after five fixes shipped dead because a value was computed and never
// reached the thing that consumes it. The same disease has hit this exact merge
// repeatedly, and every instance is recorded in a comment inside it: lsa
// ("instance eighteen of computed-but-not-passed"), the three positioning
// fields, and the flat audit copies the UI actually renders. Each was found by a
// person looking at a screen and noticing a row that said "Not checked" forever.
//
// A structural check cannot find the next one, because the code always looks
// right — the assignment simply is not there. Running it can.
const runMergeCheck = () => {
  let fnSrc = null, deps = [];
  const WANT = new Set(['applyResearchResult', 'measuredFieldsFrom', 'finalLeadScore']);
  walk(ast, (n) => {
    if (n.type !== 'VariableDeclaration') return;
    for (const d of n.declarations) {
      if (!d.id || !WANT.has(d.id.name) || !d.init) continue;
      const text = 'const ' + d.id.name + ' = ' + src.slice(d.init.start, d.init.end) + ';';
      if (d.id.name === 'applyResearchResult') fnSrc = text; else deps.push(text);
    }
  });
  if (!fnSrc) {
    fails.push('applyResearchResult is gone — the research merge is being written somewhere else again, and a second copy of it is how "Two implementations of one operation" is described in its own comment');
    return null;
  }
  if (deps.length !== 2) {
    fails.push(`the merge's helpers could not be lifted (${deps.length} of 2 found), so it cannot be executed and this check is not running`);
    return null;
  }

  // ══ THE REQUIREMENT COMES FROM THE SERVER, NOT FROM THE CLIENT ═══════════
  // The first version of this read the field list off the merge itself — every
  // `data.X` it mentions. Deleting the lsa assignment then deleted the data.lsa
  // read with it, the list got one shorter, and the check reported a clean pass
  // on the build with the bug in it. A check whose requirement is derived from
  // the code under test cannot fail; this file already records the identical
  // trap one section up ("passed vacuously the moment it worked").
  //
  // So the list is the SERVER's res.json for the research route, parsed from
  // server.js. That is the contract: the server measured it, paid for it and
  // sent it. Anything in there that does not come out of the merge was bought
  // and thrown away, and deleting the client line makes the gap BIGGER now
  // instead of making it disappear.
  const at = server.replace(/\r\n/g, '\n').indexOf('    res.json({\n      reachability: reach.score,');
  if (at < 0) {
    fails.push('the research response object could not be found in server.js — this check cannot read the contract it exists to enforce, so it is not checking anything');
    return null;
  }
  const sNorm = server.replace(/\r\n/g, '\n');
  let bs = sNorm.indexOf('{', at), depth = 0, be = -1;
  for (let j = bs; j < sNorm.length; j++) {
    const c = sNorm[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { be = j + 1; break; } }
  }
  let reads;
  try {
    const obj = acorn.parse('(' + sNorm.slice(bs, be) + ')', { ecmaVersion: 2022 }).body[0].expression;
    reads = new Set(obj.properties.filter(p => p.type === 'Property' && !p.computed)
      .map(p => p.key.name || String(p.key.value)));
  } catch (e) {
    fails.push(`the research response object in server.js could not be parsed (${e.message}), so the merge is not being checked against anything`);
    return null;
  }
  if (reads.size < 40) {
    fails.push(`only ${reads.size} fields were read off the server's research response — that is too few to be the real contract, so this check is looking at the wrong object`);
    return null;
  }

  // ── DECLARED, NOT GUESSED ────────────────────────────────────────────────
  // These five decide WHICH answer the merge gives; they are not part of the
  // answer, so they are correctly absent from the lead. Anything else that goes
  // in and does not come out is a field that was computed, paid for, returned,
  // and dropped one line before use.
  //
  // Only two of the server's fields belong here. Everything else it returns is
  // an answer, and an answer that does not reach the lead was paid for twice:
  // once to measure and once to measure again on the re-run that will not fix
  // it either. Adding a name to this list is a decision to throw that field
  // away, written down where a reviewer sees it.
  //
  // It is currently EMPTY, and that is the finding: every single field the
  // server returns now reaches the lead. Adding a name here is a decision to
  // throw that field away, written down where a reviewer sees it.
  const CONTROL_ONLY = new Set([]);

  // BRANCH FLAGS are a different thing from CONTROL_ONLY and must not be
  // confused with it. CONTROL_ONLY means "this field is deliberately thrown
  // away". A branch flag is a BOOLEAN MODE the merge switches on, and a string
  // marker cannot survive `data.x === true` however correctly the merge is
  // written - so the marker scan would report a working wire as lost. Entries
  // here are exempt from the SCAN only, and each one is instead covered by an
  // executed test that runs the real merge with the flag set, which is a
  // stronger guard than marker propagation and not a weaker one. Adding a name
  // here without also adding that test is how this becomes a hole.
  const BRANCH_FLAGS = new Set(['contactOnly']);

  // Type-shaped markers where the merge inspects the value rather than copying
  // it. A string where the code reads .length or spreads an object would fail
  // for the wrong reason, and a check that fails for the wrong reason is one
  // somebody switches off.
  const SHAPE = {
    reachability: 90210,
    researchBonus: 913,
    flaws: ['MK_flaws'],
    signals: { mkSignals: 'MK_signals' },
    richData: { mkRichData: 'MK_richData' },
    reachabilityReasons: ['MK_reachabilityReasons'],
    publicPainSignals: ['MK_publicPainSignals'],
    companyTriggers: ['MK_companyTriggers'],
    localVisibility: { checked: true, mk: 'MK_localVisibility' },
    gbpHealth: { reviewCount: 'MK_gbpReviewCount', mk: 'MK_gbpHealth' },
    decisionMaker: { corroborated: true, mk: 'MK_decisionMaker' },
    brainAudit: { topThreeProducts: ['MK_topThreeProducts'], mk: 'MK_brainAudit' },
    pageShots: ['MK_pageShots'],
    realSpeed: { checked: true, mk: 'MK_realSpeed' },
  };

  const data = {};
  for (const k of reads) {
    if (CONTROL_ONLY.has(k)) { data[k] = false; continue; }
    data[k] = Object.prototype.hasOwnProperty.call(SHAPE, k) ? SHAPE[k] : ('MK_' + k);
  }
  // The three the merge branches on are not in the server's response object at
  // all (they are set on the refusal and failure paths), so the success run has
  // to say so explicitly rather than leave them undefined.
  data.notAnOwner = false; data.brainFailed = false; data.outOfCredits = false;
  // contactOnly is the fourth of that kind and the only one that IS in the
  // response object: a MODE the merge branches on, not an answer that has to
  // land. A string marker would make `data.contactOnly === true` false and the
  // field would look lost; setting it TRUE would put this whole run down the
  // contact branch and make every other assertion below vacuous. So the success
  // run states it false, and the contact branch gets its own executed test
  // (THE WIPE, below) which is a far stronger guard than marker propagation.
  data.contactOnly = false;

  let out;
  try {
    out = new Function(deps.join('\n') + '\n' + fnSrc + '\nreturn applyResearchResult;')()(
      {}, data, { website: 'MK_website', emailData: {}, companyData: {}, pageSpeed: {}, httpStatus: 200 });
  } catch (e) {
    fails.push(`the research merge threw when executed: ${e.message} — it cannot be run, so nothing here is being checked`);
    return null;
  }
  if (!out || out.outcome !== 'researched') {
    fails.push(`the merge returned outcome "${out && out.outcome}" on a clean response, so the success path is not the one being measured`);
    return null;
  }

  const json = JSON.stringify(out.lead);
  const lost = [];
  for (const k of reads) {
    if (CONTROL_ONLY.has(k) || BRANCH_FLAGS.has(k)) continue;
    const marker = Object.prototype.hasOwnProperty.call(SHAPE, k)
      ? (typeof SHAPE[k] === 'number' ? String(SHAPE[k]) : 'MK_' + k)
      : 'MK_' + k;
    if (json.indexOf(marker) < 0) lost.push(k);
  }
  if (lost.length) {
    fails.push(`the research merge reads ${lost.length} field(s) off the server's answer and puts ${lost.length === 1 ? 'it' : 'them'} nowhere on the lead: ${lost.sort().join(', ')} — measured, paid for, returned, and dropped one line before use. That is the exact shape of the lsa row that read "Not checked" on every lead for a week`);
  }
  // ══ THE WIPE — a contact run must not destroy an audit ═══════════════════
  // applyResearchResult writes brainAudit and then Object.assigns
  // measuredFieldsFrom(brainAudit) UNCONDITIONALLY, and measuredFieldsFrom(null)
  // returns seventeen empty defaults. So a response with no audit in it BLANKED
  // the audit already on the lead - and leadToRow persists that blanking to
  // Supabase, permanently, flipping the whole board from Audited to Not audited
  // with nothing on screen saying why. Running a contact pass over an existing
  // pipeline to harvest addresses would have destroyed every audit already paid
  // for. The merge check above could not see it: it builds a response where
  // every key is present, so the destructive shape is unreachable by it.
  //
  // This runs the REAL merge over an ALREADY-AUDITED lead with a contact-only
  // response, and asserts the audit survives while the contact fields land.
  try {
    const _prev = {
      company: 'Prior Audit Co', status: 'researched',
      brainAudit: { pitchAngle: 'KEEP_pitchAngle', recommendedProduct: 'KEEP_product' },
      problemList: [{ id: 'KEEP_problem', problem: 'KEEP_problem_text' }],
      factualSpine: 'KEEP_spine', situationRead: { headline: 'KEEP_headline' },
      harmsRanked: [{ id: 'KEEP_harm' }], theOneThing: { layer: 'KEEP_layer' },
    };
    const _contactData = {
      contactOnly: true, contactRank: 82, contactRankWhy: 'KEEP_why',
      email: 'owner@example.com', founderName: 'Real Owner', founderTitle: 'Owner',
      phone: '+1 512-555-0134', reachability: 88,
      notAnOwner: false, brainFailed: false, outOfCredits: false,
    };
    const _res = new Function(deps.join('\n') + '\n' + fnSrc + '\nreturn applyResearchResult;')()(
      _prev, _contactData, { website: 'https://example.com', emailData: {}, companyData: {}, pageSpeed: {}, httpStatus: 200 });
    const _lead = (_res && _res.lead) || {};
    const _blob = JSON.stringify(_lead);
    const _keeps = ['KEEP_pitchAngle', 'KEEP_problem_text', 'KEEP_spine', 'KEEP_headline', 'KEEP_harm', 'KEEP_layer'];
    const _gone = _keeps.filter(k => _blob.indexOf(k) < 0);
    if (_gone.length) {
      fails.push(`a CONTACT-ONLY response destroyed ${_gone.length} piece(s) of an audit already paid for on this lead (${_gone.join(', ')}). Object.assign(L, measuredFieldsFrom(null)) writes seventeen empty defaults, and leadToRow persists them to Supabase permanently`);
    }
    if (_lead.contactOnly !== true) fails.push('a contact-only response does not mark the lead as one, so nothing downstream can tell which kind of run produced what is on it');
    if (_lead.contactRank !== 82) fails.push(`the contact rank did not land on the lead (got ${_lead.contactRank})`);
    if (_lead.status !== 'researched' || _prev.status !== 'researched') {
      // The prior status here is 'researched' BECAUSE it was audited; the point
      // is that a contact run neither grants nor removes that word. The
      // never-audited direction is asserted immediately below.
      fails.push('a contact run changed the status of an already-audited lead');
    }
    const _fresh = new Function(deps.join('\n') + '\n' + fnSrc + '\nreturn applyResearchResult;')()(
      { company: 'Never Audited Co', status: 'new' }, _contactData,
      { website: 'https://example.com', emailData: {}, companyData: {}, pageSpeed: {}, httpStatus: 200 });
    if (_fresh && _fresh.lead && _fresh.lead.status === 'researched') {
      fails.push("a contact run marked a never-audited lead 'researched' — batchCandidates then excludes it from the audit batch it still needs, while the Generate queue admits it as ready to have an email written with nothing behind it");
    }
    if (_fresh && _fresh.lead && _fresh.lead.email !== 'owner@example.com') {
      fails.push('a contact run on a fresh lead did not land the address, which is the entire deliverable');
    }
  } catch (e) {
    fails.push(`the contact-only merge could not be executed: ${e.message}`);
  }

  // A branch flag exempted from the scan and NOT covered by an executed test is
  // exactly the hole the exemption could become. Assert the cover exists.
  for (const _f of BRANCH_FLAGS) {
    if (_f === 'contactOnly') continue;   // covered by THE WIPE above
    fails.push(`${_f} is exempt from the merge scan and no executed test covers it, so its wire is unguarded`);
  }
  return { fields: reads.size, kept: reads.size - CONTROL_ONLY.size - BRANCH_FLAGS.size - lost.length };
};
const mergeStat = runMergeCheck();

// ══ 6. A NEW AUDIT MUST CLEAR THE WHOLE OF THE OLD EMAIL ════════════════════
// applyResearchResult ends by dropping the previous draft, because approving
// copy is approving THAT copy against THAT evidence — when the evidence is
// re-measured the approval refers to nothing. It cleared three fields.
// applyGeneratedEmail writes eleven, and the two it was leaving behind, subject
// and pitch, are the two the send path reads.
//
// Two hand-kept lists of one thing is the disease this file is full of, so
// neither list is trusted: both are read off the code and compared. A twelfth
// field added to the writer fails the build until the clear knows about it.
{
  const writesOf = (name, objName) => {
    const out = new Set();
    walk(ast, (n) => {
      if (n.type !== 'VariableDeclarator' || !n.id || n.id.name !== name) return;
      walk(n, (m) => {
        if (m.type !== 'AssignmentExpression' || m.left.type !== 'MemberExpression' || m.left.computed) return;
        if (!m.left.object || m.left.object.type !== 'Identifier' || m.left.object.name !== objName) return;
        if (m.left.property && m.left.property.name) out.add(m.left.property.name);
      });
    });
    return out;
  };
  const written = writesOf('applyGeneratedEmail', 'L');
  const merged = writesOf('applyResearchResult', 'L');
  // status is set by both on purpose and is not part of the draft.
  written.delete('status');
  if (!written.size) {
    fails.push('applyGeneratedEmail writes nothing to the lead, so this comparison is measuring an empty set and cannot fail');
  } else {
    const missed = [...written].filter(k => !merged.has(k)).sort();
    if (missed.length) {
      fails.push(`a re-research does not clear ${missed.length} field(s) the email writer sets: ${missed.join(', ')} — the lead keeps the previous audit's email in them while showing a fresh audit, and subject and pitch are what actually mail`);
    }
  }
}

// ══ 6a. THE MARKET LIST MUST NOT BE A SECOND COPY ═══════════════════════════
// The Find picker held its own hardcoded array of the twenty cities the server
// searches. A market added to GP_CITIES would not have appeared in the picker,
// and a city picked here that the server does not search returns nothing at all
// — which reads as "Find is broken" rather than "two lists drifted apart". The
// list is served from /api/find-options now; this refuses a copy coming back.
{
  const _cityish = (src.match(/'[A-Z][a-zA-Z .]+ (?:AZ|TX|NC|FL|CO|TN|OH|MO|IN|UT|OK|KY|VA|ID|SC|CA|NY|PA|GA|MI|WA|OR|NV|AZ)'/g) || []);
  if (_cityish.length >= 5) {
    fails.push(`index.html holds ${_cityish.length} hardcoded "City ST" strings (${_cityish.slice(0, 3).join(', ')}) — the market list belongs to the server and a second copy silently drifts, so a picked market can return nothing while looking fine`);
  }
  if (src.indexOf('/api/find-options') < 0) {
    fails.push('the client no longer asks the server which markets it searches, so the picker is back to guessing');
  }
}

// ══ 6b. A CRITICAL FABRICATION MUST BLOCK APPROVE ═══════════════════════════
// Donna Krummen's checklist said confidence 3/10 and listed CRITICAL fact-check
// findings — wrong city, wrong count, wrong rank — and the green Approve button
// sat under it, enabled. A warning beside an enabled button is a decoration.
{
  // ── AN UNKNOWN COLUMN MUST NOT KILL EVERY SAVE ─────────────────────────
  // Live 2026-08-21: two new leadToRow keys with no Supabase columns made every
  // save fail with HTTP 400 — the red NOT SAVING banner on launch night. The
  // recovery hinges on parsing which column Supabase could not find, so that
  // parser is executed here against the real PGRST204 body shape.
  {
    let pSrc = null;
    walk(ast, (n) => {
      if (n.type === 'VariableDeclarator' && n.id && n.id.name === 'sbUnknownColumnFrom' && n.init) pSrc = src.slice(n.init.start, n.init.end);
    });
    if (!pSrc) fails.push('sbUnknownColumnFrom is gone — a 400 from one unknown column takes every save down again, which was the launch-night NOT SAVING banner');
    else {
      let fn; try { fn = new Function('return ' + pSrc)(); } catch (e) { fn = null; }
      if (!fn) fails.push('sbUnknownColumnFrom no longer compiles standalone');
      else {
        const real = JSON.stringify({ code: 'PGRST204', details: null, hint: null, message: "Could not find the 'held_back_contact' column of 'leads' in the schema cache" });
        if (fn(400, real) !== 'held_back_contact') fails.push('the real PGRST204 body does not yield the column name, so the strip-and-retry can never fire and a new field still kills every save');
        if (fn(500, real) !== null) fails.push('a 500 is being treated as an unknown column — 500 is a size symptom with its own halve-and-retry path');
        if (fn(400, '{"message":"permission denied for table leads"}') !== null) fails.push('an RLS refusal is misread as a missing column, which would strip fields forever instead of naming the policy problem');
        if (fn(400, 'not json at all') !== null) fails.push('garbage in the body crashes or misparses the recovery');
      }
    }
  }

  // claimRisksOf is lifted with it: the fact-check lives in two places (the
  // lead top level before a reload, brainAudit after one) and three readers used
  // to hand-write that two-place read. The EXPORT got it wrong and printed no
  // "Do not say" heading at all on every lead that had been through Supabase —
  // absence of checking rendering as a clean audit. One accessor now, so this
  // check must exercise it too or it verifies a shell.
  let fnSrc = null, accSrc = null;
  walk(ast, (n) => {
    if (n.type === 'VariableDeclarator' && n.id && n.id.name === 'criticalClaimsOf' && n.init) {
      fnSrc = src.slice(n.init.start, n.init.end);
    }
    if (n.type === 'VariableDeclarator' && n.id && n.id.name === 'claimRisksOf' && n.init) {
      accSrc = src.slice(n.init.start, n.init.end);
    }
  });
  if (!accSrc) fails.push('claimRisksOf is gone, so each reader is back to hand-writing its own two-place read of the fact-check — which is how the export came to print no "Do not say" heading at all');
  if (!fnSrc) {
    fails.push('criticalClaimsOf is gone, so nothing separates a CRITICAL fabrication from an advisory note and Approve is enabled over both');
  } else {
    let fn, acc;
    try {
      acc = accSrc ? new Function('return ' + accSrc)() : null;
      fn = new Function('claimRisksOf', 'return ' + fnSrc)(acc || (() => ({ all: [], critical: [], internal: [] })));
    } catch (e) { fn = null; }
    if (!fn) fails.push('criticalClaimsOf no longer compiles standalone, so it cannot be verified');
    else {
      if (fn({ _claimRisks: ['fact-check: CRITICAL: wrong city, wrong rank'] }).length !== 1) {
        fails.push('a CRITICAL fact-check claim is not recognised, so the fabricated audit that reached Donna Krummen approves cleanly again');
      }
      if (fn({ _claimRisks: ['marketing jargon banned in the email voice'] }).length !== 0) {
        fails.push('an advisory note is being treated as CRITICAL, which blocks approval on every routine flag and teaches the operator to want the gate gone');
      }
      // ── AND THE SHAPE THAT COMES BACK FROM SUPABASE ────────────────────
      // After a reload the top-level copy is gone and everything lives inside
      // brainAudit. That is the shape the export was blind to, so it is the
      // shape this check must run.
      if (acc) {
        const reloaded = { brainAudit: {
          _claimRisks: ['fact-check: CRITICAL: says he has no reviews, he has 341'],
          _criticalFactCheck: ['the pitch names a competitor we never measured'],
        } };
        if (acc(reloaded).all.length !== 1) fails.push('a reloaded lead loses _claimRisks, so the export prints no "Do not say" heading at all and a missing check reads as a clean audit');
        if (acc(reloaded).critical.length !== 1) fails.push('_criticalFactCheck is not read off brainAudit, which is the ONLY place anything writes it — the export has never printed a claim the prospect could disprove');
        if (fn(reloaded).length !== 1) fails.push('a CRITICAL flag on a reloaded lead no longer blocks Approve');
        // And the live-merge shape must still work, or one fix breaks the other.
        if (acc({ _claimRisks: ['x'] }).all.length !== 1) fails.push('the freshly-merged shape (top-level _claimRisks) is no longer read');
      }
    }
    // The GATE condition, not any mention — the banner body also names the
    // function, so counting mentions passed with a gate deleted (falsified).
    const gates = (src.match(/!lead\.approved && sendBlockersOf\(lead\)\.length/g) || []).length;
    if (gates < 2) {
      fails.push(`only ${gates} of the 2 approve buttons gate on sendBlockersOf — the other one still approves a lead the system itself refused`);
    }
    // ══ AND THE THREE REFUSALS THAT WERE ONLY EVER DECORATION ═══════════════
    // Donna Krummen again, one build later: the screen said "NOTHING HERE IS
    // WORTH A FIRST EMAIL" and the Approve button under it was enabled, because
    // approval was gated on fabrication ALONE. The opener verdict and the
    // under-floor body were computed, rendered as a red panel, and had no
    // mechanical effect on anything.
    let blkSrc = null;
    walk(ast, (n) => {
      if (n.type === 'VariableDeclarator' && n.id && n.id.name === 'sendBlockersOf' && n.init) {
        blkSrc = src.slice(n.init.start, n.init.end);
      }
    });
    if (!blkSrc) {
      fails.push('sendBlockersOf is gone, so the system\'s own "do not send this" verdict is back to being a warning beside an enabled button');
    } else {
      let blk;
      try { blk = new Function('criticalClaimsOf', 'return ' + blkSrc)(fn || (() => [])); } catch (e) { blk = null; }
      if (!blk) fails.push('sendBlockersOf no longer compiles standalone, so it cannot be verified');
      else {
        const cases = [
          ['TOO_WEAK', { brainAudit: { openerStrength: { verdict: 'TOO_WEAK' } } },
            'a lead whose own verdict is "nothing here is worth a first email" can still be approved'],
          ['CALL_INSTEAD', { brainAudit: { openerStrength: { verdict: 'CALL_INSTEAD' } } },
            'a lead the system routed to the phone can still be approved for email'],
          ['tooThin', { composedEmail: { variantA: { tooThin: true } } },
            'a body under the word floor can still be approved, and it reads as a mail-merge that failed'],
          ['CRITICAL', { _claimRisks: ['fact-check: CRITICAL: wrong city'] },
            'a CRITICAL fabrication no longer blocks approval'],
        ];
        for (const [name, lead, why] of cases) {
          if (!blk(lead).length) fails.push(`${why} (${name})`);
        }
        // And a clean lead must still be approvable, or the gate is a wall.
        if (blk({ brainAudit: { openerStrength: { verdict: 'STRONG' } } }).length) {
          fails.push('a lead with no fabrication and a strong opener is being blocked, which makes the gate something the operator will want removed');
        }
      }
    }
  }
}

// ══ 6b-2. THE STRATEGIC READ MUST SURVIVE A RELOAD ══════════════════════════
// Two different values are called situationRead: the audit brain's ONE SENTENCE
// (on brain_audit) and the separate synthesis OBJECT with the headline, the 3-5
// sentence read, the character rows, "what is actually worth selling them" and
// the single diagnostic question the system generates for a salesperson (on
// _persisted). rowToLead read the sentence first and `??` only falls through on
// null, so the summary replaced the real thing on the first reload of every lead
// ever audited. The screen still rendered, which is why it survived.
//
// Executed, not read: the picker is lifted out and run against both shapes.
{
  let fnSrc = null;
  walk(ast, (n) => {
    if (n.type === 'VariableDeclarator' && n.id && n.id.name === 'pickSituationRead' && n.init) {
      fnSrc = src.slice(n.init.start, n.init.end);
    }
  });
  if (!fnSrc) {
    fails.push('pickSituationRead is gone, so the rich strategic read is back to losing to its own one-sentence summary on every page reload');
  } else {
    let fn;
    try { fn = new Function('return ' + fnSrc)(); } catch (e) { fn = null; }
    if (!fn) fails.push('pickSituationRead no longer compiles standalone, so it cannot be verified');
    else {
      const FLAT = 'Fifty years of proof that almost no one sees.';
      const RICH = { shape: 'EARNED_BUT_BLOCKED', headline: 'Earned and blocked',
        read: 'Three to five sentences of actual diagnosis.',
        rows: [{ label: 'Reputation machine', says: 'He runs it personally.' }],
        whatHeNeeds: 'One recommendation.', askOnTheCall: 'Is he trying to grow, or is he full?' };
      const got = fn(FLAT, RICH);
      if (!got || got.read !== RICH.read) {
        fails.push('the one-sentence summary still wins over the strategic object, so the headline, the read, the character rows, what-to-sell and the call sheet question are all discarded on reload');
      }
      if (fn(FLAT, null) !== FLAT) fails.push('a lead audited before the synthesis call existed loses its one sentence too');
      if (fn(null, null) !== null) fails.push('an unaudited lead no longer resolves to null');
      // A persisted value that is NOT the rich shape must not beat a rich flat one.
      if (fn(RICH, 'a stale string') !== RICH) fails.push('a stale persisted string outranks a rich read');
    }
    // And the wiring: the picker has to be what rowToLead actually uses.
    if (!/situationRead:\s*pickSituationRead\(/.test(src)) {
      fails.push('rowToLead is not using pickSituationRead, so the fix is present and unwired');
    }
  }
}

// ══ 6b-3. THE AUDIT EXPORT MUST CARRY THE WHOLE AUDIT ═══════════════════════
// After a bulk run there are fifty audits on screen. The export is the only way
// they leave, and the failure that matters is silent: a section that quietly
// arrives empty, so the file looks complete and is missing the diagnosis.
//
// Executed, not read. auditRecordFor and auditExportHtml are lifted out with the
// one helper they call and run against a lead whose every field is a unique
// marker; then every marker is looked for in the rendered page.
{
  // claimRisksOf joins the list because auditRecordFor now calls it. Lifting a
  // function without its dependencies is how a harness starts lying: it would
  // throw here rather than silently pass, which is the good failure mode, but
  // only if the name is actually required.
  const NEED = ['csvCell', 'CONTACT_TIER_SAY', 'contactConfidence', 'contactListRows', 'CONTACT_CSV_COLUMNS', 'contactListCsv', 'auditRecordFor', 'auditExportHtml', 'buildAuditRows', 'claimRisksOf', 'corpusWarningFor', 'leadHasAudit', 'adsFactsLabel', 'PILLAR_LABEL', 'PILLAR_PRODUCT', 'dedupeOwnWords', 'trimRepeatedJobValue', 'trimRepeatedLead', 'RISK_REASONS', 'replyLatencySay', 'websiteForReading', 'plainRisk', 'LAYER_PLAIN', 'layerPlain', 'groupAuditFindings', 'FUNNEL_STAGE_DEFS', 'PILLAR_TO_STAGE', 'normalizedLeakRows', 'groupByFunnelStage', 'FUNNEL_TAPER', 'funnelSegClip', 'funnelSegFill', 'WALK_TO_STAGE', 'walkTextsByStage', 'scoreSentence', 'SIGNAL_RUNGS', 'signalRowsFor', 'leakWhereFor', 'scoreboardFor'];
  const found = {};
  walk(ast, (n) => {
    if (n.type === 'VariableDeclarator' && n.id && NEED.includes(n.id.name) && n.init) {
      found[n.id.name] = 'const ' + n.id.name + ' = ' + src.slice(n.init.start, n.init.end) + ';';
    }
    if (n.type === 'FunctionDeclaration' && n.id && NEED.includes(n.id.name)) {
      found[n.id.name] = src.slice(n.start, n.end);
    }
  });
  const missing = NEED.filter(k => !found[k]);
  if (missing.length) {
    fails.push(`the audit export cannot be verified: ${missing.join(', ')} not found at module scope — auditRecordFor calls buildAuditRows directly, so if that stops being a hoisted module-scope declaration the measured-signals section silently exports empty`);
  } else {
    let mod = null;
    try {
      mod = new Function(found.csvCell + '\n' + found.CONTACT_TIER_SAY + '\n' + found.contactConfidence + '\n' + found.contactListRows + '\n' + found.CONTACT_CSV_COLUMNS + '\n' + found.contactListCsv + '\n' + found.groupAuditFindings + '\n' + found.FUNNEL_STAGE_DEFS + '\n' + found.PILLAR_TO_STAGE + '\n' + found.normalizedLeakRows + '\n' + found.groupByFunnelStage + '\n' + found.FUNNEL_TAPER + '\n' + found.funnelSegClip + '\n' + found.funnelSegFill + '\n' + found.WALK_TO_STAGE + '\n' + found.walkTextsByStage + '\n' + found.scoreSentence + '\n' + found.SIGNAL_RUNGS + '\n' + found.signalRowsFor + '\n' + found.leakWhereFor + '\n' + found.scoreboardFor + '\n' + found.RISK_REASONS + '\n' + found.replyLatencySay + '\n' + found.websiteForReading + '\n' + found.plainRisk + '\n' + found.LAYER_PLAIN + '\n' + found.layerPlain + '\n' + found.adsFactsLabel + '\n' + found.PILLAR_LABEL + '\n' + found.PILLAR_PRODUCT + '\n' + found.dedupeOwnWords + '\n' + found.trimRepeatedJobValue + '\n' + found.trimRepeatedLead + '\n'
        + found.corpusWarningFor + '\n' + found.claimRisksOf + '\n' + found.leadHasAudit + '\n' + found.buildAuditRows + '\n' + found.auditRecordFor + '\n' + found.auditExportHtml
        + '\nreturn { rec: auditRecordFor, html: auditExportHtml, norm: normalizedLeakRows, adsLabel: adsFactsLabel, dedupe: dedupeOwnWords, trim: trimRepeatedJobValue, trimLead: trimRepeatedLead, plain: plainRisk, replyLatency: replyLatencySay, web: websiteForReading, layer: layerPlain, group: groupAuditFindings, groupStage: groupByFunnelStage, taper: FUNNEL_TAPER, segClip: funnelSegClip, segFill: funnelSegFill, walkStage: walkTextsByStage, scoreLine: scoreSentence, sig: signalRowsFor, board: scoreboardFor, leakWhere: leakWhereFor, csvCell, contactConfidence, contactListRows, contactListCsv, CONTACT_CSV_COLUMNS };')();
    } catch (e) {
      fails.push('the audit export no longer compiles standalone, so it cannot be verified: ' + e.message);
    }
    // ══ ONE DOOR OUT ══════════════════════════════════════════════════════
    // There used to be two export buttons in two places with two different
    // scopes, and neither showed what was in the file. Vin, 2026-08-21: "that
    // skinny bar displaying is not big enough we need to widen it out or change
    // the whole fomrat." Both now open one screen, and there is one call that
    // actually writes the file. A second call site is how the two scopes drifted
    // apart in the first place.
    {
      const calls = (src.match(/downloadAudits\(/g) || []).length;
      const defs = (src.match(/const downloadAudits\s*=/g) || []).length;
      if (defs !== 1) fails.push(`${defs} definition(s) of downloadAudits — the exported sheet is what Mike dials from and it must have one implementation`);
      // The definition reads `const downloadAudits = (leads, title)`, so it does
      // NOT match `downloadAudits(` — the first version subtracted it anyway and
      // reported a correct build as broken. Count the call sites as they are.
      if (calls !== 1) {
        fails.push(`${calls} place(s) call downloadAudits — there must be exactly one, or two export buttons drift into two different scopes again and neither shows what is in the file`);
      }
      // And the blind-read badge must read the SHARED rule, not a private copy.
      if (!/const blindOf[\s\S]{0,220}corpusWarningFor\(/.test(src)) {
        fails.push('the export screen decides "did we read their site" from its own copy of the rule rather than from corpusWarningFor — the copy that rots is always the one that only runs where nobody looks');
      }
    }
    if (mod) {
      // == THE CONTACT LIST, EXECUTED ======================================
      // The whole standing goal is this file: 50 leads ranked, with an owner
      // email and a phone number. It is the first CSV this repo has ever
      // written, and the one CSV writer that already existed has no
      // formula-injection guard - so every rule below is run rather than read.
      const _Q = String.fromCharCode(34);
      const _nl = (s) => String(s).replace(/^\uFEFF/, '').split('\r\n');
      // ONE - formula injection. A cell beginning =, +, - or @ executes when
      // the file is opened in Excel or Sheets, and these values are business
      // names scraped off arbitrary web pages, opened by a junior rep.
      for (const _bad of ['=cmd|calc', '+1+1', '-2+3', '@SUM(A1)', '\tstart']) {
        const _c = mod.csvCell(_bad);
        if (_c.indexOf("\"'") !== 0) fails.push(`the contact CSV does not neutralise a formula cell starting "${_bad.slice(0, 4)}" — it opens as a live formula in Excel`);
      }
      // A legitimate value must NOT be mangled: a guard that eats real data is
      // the more expensive failure.
      if (mod.csvCell('Smith & Sons') !== '"Smith & Sons"') fails.push('the contact CSV mangles an ordinary company name');
      if (mod.csvCell('Say ' + _Q + 'hi' + _Q) !== _Q + 'Say ' + _Q + _Q + 'hi' + _Q + _Q + _Q) fails.push('the contact CSV does not double an embedded quote, so the row shape breaks');
      // TWO - the ORDER. Highest rank first, and an UNRANKED lead sorts LAST
      // rather than as a zero: it was never scored, and a confident 0 reads as
      // "we checked and it is bad".
      // 'Aaa Co' is UNRANKED and sorts first alphabetically; 'Zzz Co' was
      // MEASURED at zero. Anything that laundered an absent rank into a number
      // makes them tie and the name decides, which is how a lead nobody scored
      // overtakes one we scored and found bad. The fixture is built this way on
      // purpose: with every other rank above zero it could not tell the two
      // rules apart, and reverting the guard left it green.
      const _rows = mod.contactListRows([
        { name: 'Mid Co', contactRank: 55 },
        { name: 'Aaa Co' },
        { name: 'Top Co', contactRank: 91 },
        { name: 'Zzz Co', contactRank: 0 },
      ]);
      const _order = _rows.map(r => r.company).join(',');
      if (_order !== 'Top Co,Mid Co,Zzz Co,Aaa Co') fails.push(`the contact list is not ranked highest-first with unranked last: ${_order}`);
      // THREE - the CONFIDENCE columns. Both existing captions derive
      // confidence by regex over the human-readable label, so four materially
      // different states collapse into one sentence. Each must be its own
      // answer, read from the TIER.
      const _tierSay = (t, extra) => mod.contactConfidence({ emailResult: Object.assign({ tier: t, sendable: t <= 3 }, extra || {}) });
      const _t1 = _tierSay(1), _t3 = _tierSay(3), _t4 = _tierSay(4);
      if (_t1.say === _t3.say || _t3.say === _t4.say) fails.push('the contact CSV gives two different email tiers the same confidence sentence, which is the defect the existing captions have');
      if (_t4.sendable !== false) fails.push('a tier-4 address does not report as unsafe to send, and the row would read like any other');
      if (!/cache/i.test(_tierSay(2, { label: 'SMTP-verified (cached)' }).say)) {
        fails.push('a CACHED address up to 60 days old still reports as confirmed live, with nothing on the row saying when it was checked');
      }
      if (/cache/i.test(_t1.say)) fails.push('a fresh address is being labelled as cached');
      // THREE-AND-A-HALF - AN AUDITED LEAD IS ALREADY A CONTACT ROW.
      // contactRank is written by the contact-run path, so on the day this
      // shipped it existed on nothing: a 189-lead pipeline with 128 audited
      // leads, every one carrying a resolved owner, an address and a phone, and
      // the export matched ZERO of them. The button never rendered and there
      // was no way to tell why. The ranking is a formula over reachability and
      // every audited lead has reachability - only the leads that happened to
      // take one code path were allowed to use it.
      const _audited = mod.contactListRows([
        { name: 'Audited Co', reachability: 74, email: 'a@b.com', phone: '5125550100' },
      ])[0];
      if (!_audited || _audited.rank !== 74) {
        fails.push(`a lead audited before the contact ranking existed does not rank at its reachability (got ${_audited && _audited.rank}) — the export would show nothing for a pipeline full of resolved owners and addresses`);
      }
      if (!/reachability alone/i.test(_audited.whyThisRank || '')) {
        fails.push('a fallback rank does not say it is a fallback, so it reads as the full contact ranking');
      }
      // FOUR - a free page builder is not a domain the business owns, so an
      // address built at it can be well-formed and undeliverable to them.
      const _wix = mod.contactListRows([{ name: 'Z', website: 'https://z.wixsite.com/z' }])[0];
      if (!_wix.websiteWarning) fails.push('a free-page-builder site carries no warning, so a CSV row offers an address at a domain the business does not own');
      if (mod.contactListRows([{ name: 'Y', website: 'https://y.com' }])[0].websiteWarning) fails.push('an ordinary domain is being flagged as a free page builder');
      // FIVE - "rank" means SEARCH POSITION nearly everywhere else in this
      // codebase, so the column has to say which one it is or a rep reads a
      // reachability score as a Google position.
      const _head = (mod.CONTACT_CSV_COLUMNS.find(c => c[0] === 'rank') || [])[1] || '';
      if (!/not a google position/i.test(_head)) fails.push('the rank column does not say it is NOT a Google position, and every other use of "rank" in this app is a search position');
      // SIX - the file itself: one header, one row per lead, no row lost.
      const _csv = _nl(mod.contactListCsv([{ name: 'A', contactRank: 5 }, { name: 'B', contactRank: 9 }]));
      if (_csv.length !== 4 || _csv[3] !== '') fails.push(`the contact CSV emitted ${_csv.length} line(s) for two leads plus a header`);
      if (_csv[0].split('","').length !== mod.CONTACT_CSV_COLUMNS.length) fails.push('the header does not have one cell per declared column');
      if (String(mod.contactListCsv([{ name: 'A' }])).charCodeAt(0) !== 0xFEFF) fails.push('the contact CSV has no byte-order mark, so Excel reads it as Latin-1 and mangles every accented name');

      const LEAD = {
        id: 'x1', name: 'Smith & Sons <Roofing>', website: 'https://smith.example',
        verifiedCEO: 'MARKER_OWNER', verifiedCEOTitle: 'MARKER_TITLE', email: 'a@b.example',
        phoneDisplay: 'MARKER_PHONE', location: 'Indianapolis, IN', tradeWord: 'roofer', icpScore: 71,
        situationRead: { background: 'MARKER_BACKGROUND', headline: 'MARKER_HEADLINE',
          read: 'MARKER_READ', rows: [{ label: 'MARKER_ROWLABEL', says: 'MARKER_ROWSAYS' }],
          whatHeCaresAbout: 'MARKER_CARES', whatHeNeeds: 'MARKER_NEEDS', askOnTheCall: 'MARKER_ASK' },
        adsTransparency: { checked: true, found: true },
        sitePages: { unlinkedPages: { checked: true, unlinkedCount: 2, campaignCount: 1, pages: ['https://x.example/lp/MARKER_LANDING'] } },
        growthConstraint: { layer: 'MARKER_LAYER', condition: 'c', product: 'p' },
        theOneThing: { layer: 'MARKER_LAYER', diagnosis: 'MARKER_DIAGNOSIS', why: 'MARKER_WHY',
          firstBrokenLink: 'CONVERSION', firstBrokenLinkWhy: 'MARKER_FIRSTBROKEN',
          earnedButBlocked: true, frictionCount: 2, friction: ['MARKER_FRICTION1', 'MARKER_FRICTION2'],
          costliest: { id: 'r', problem: 'MARKER_COSTLIEST', costs: 'MARKER_COSTS', harm: 74 } },
        brainAudit: { originalFindings: [{ finding: 'MARKER_ORIGINAL', quote: 'MARKER_QUOTE' }],
          localRank: { checked: true, found: true, rank: 4, scanned: 20 } },
        auditFacts: { ads: 'yes', adLanding: 'unlinked', booking: 'form', formFields: 8, roiStatus: 'blind' },
        problemList: [{ area: 'MARKER_AREA2', problem: 'MARKER_PROBLEM', costs: 'MARKER_PCOSTS', harm: 80,
          id: 'no_recurring_offer', pillar: 'ROTTING', funnelStage: 'after', moneyRank: 5, leakRank: 1, callOpener: 'MARKER_OPENQ' },
          // A second, UNSTAGED row: the staged row above renders at its funnel
          // stage (problem + costs), so the area label has to survive through
          // the unstaged list, where it has always rendered.
          { area: 'MARKER_AREA', problem: 'An unstaged finding', costs: 'its cost', harm: 40 }],
        _claimRisks: ['MARKER_RISK'], _criticalFactCheck: ['MARKER_CRITICAL'],
        subject: 'MARKER_SUBJECT', pitch: 'MARKER_PITCH',
        pageShots: [{ label: 'MARKER_SHOTLABEL', shot: 'https://shot.example/1.png' }],
      };
      let page = '';
      try { page = mod.html([mod.rec(LEAD)], { title: 'T', at: 'now' }); }
      catch (e) { fails.push('the audit export threw on a normal lead: ' + e.message); }
      // == THE SHEET IS READ AS A PDF, AND A PDF DROPS BACKGROUNDS =========
      // The funnel's tapered segments are a clip-path over a background
      // FILL, and so are the red leak badges, the drips and the stop
      // banners. Browsers print no background colour unless the page asks,
      // so the whole funnel came out of Save-as-PDF blank while its text
      // survived - which reads as "the image did not transfer" and is
      // really a two-word stylesheet omission. Every sheet that reaches the
      // rep goes through this print path, so it is not a cosmetic rule.
      if (page.indexOf('print-color-adjust:exact') < 0) {
        fails.push('the export prints no background colours — the funnel segments, the leak badges and the stop banners all come out of Save-as-PDF blank, with only their text left');
      }
      // Seven audits printed at 37 pages, and sizing `body` alone did almost
      // nothing about it: nearly every block on this sheet sets its OWN pixel
      // size, which overrides the body rule. Measured on a real export, one
      // audit is 1,567px tall and the funnel is 798 of them - all of it in
      // classes body cannot reach. So the count of components typeset for
      // paper is the thing to hold: sizing a handful of them is the state
      // this was in when it printed at five pages an audit.
      const _ptRules = (page.match(/font-size:[0-9.]+pt/g) || []).length;
      if (_ptRules < 25) {
        fails.push(`only ${_ptRules} component(s) are typeset for paper — the sheet is printing at screen sizes again, which is what made seven audits 37 pages`);
      }
      // And a break through the middle of a funnel stage or a Do-not-say box
      // reads as a printing accident. Deliberately NOT `section`: one taller
      // than a page would be pushed whole and then split anyway, buying a
      // blank page for nothing.
      if (page.indexOf('break-inside:avoid') < 0 || page.indexOf('break-after:avoid') < 0) {
        fails.push('the export lost its page-break rules — a page break can land mid funnel stage again, or strand a heading at the foot of a page');
      }
      // The three-openers section and the signals-at-their-stage grid (Vin,
      // 2026-08-25: "3 options for this section at all times based on the top
      // revenue leaks" and "matching [the signals] up with the funnel is ideal").
      // Round 108: the opener moved ONTO the leak card, beside the finding it
      // is about, and this asserts that home rather than the old list — the
      // card must carry the number, the question and the Open-with label in
      // one block, so a rep never has to match a question to a leak by eye.
      {
        const _card = (page.match(/<div class="lk">[\s\S]*?<\/div>\s*<\/div>/) || [''])[0];
        if (page.indexOf('MARKER_OPENQ') < 0) fails.push("a numbered leak's conversation opener never reaches the sheet at all");
        else if (_card.indexOf('MARKER_OPENQ') < 0 || _card.indexOf('Open with') < 0 || _card.indexOf('LEAK 1') < 0) {
          fails.push("the leak card does not carry its own opening question — the opener is back in a separate list a rep has to match up by eye");
        }
        if ((page.match(/MARKER_OPENQ/g) || []).length !== 1) {
          fails.push('the leak opener renders more than once — the leak cards and the call block are printing the same question twice');
        }
      }
      if (page.indexOf('Ad clicks land on') < 0 || page.indexOf('never links') < 0) {
        fails.push('the ad-landing signal row never reaches the sheet\'s funnel stage — the measurement Vin called very important information');
      }
      if (page.indexOf('Booking route') < 0 || page.indexOf('#4 of 20') < 0) {
        fails.push('the signal rows are not lined up at their funnel stages on the sheet (booking at the door, the map read at getting-found)');
      }
      if (page.indexOf('nothing visible on the pages we read') < 0) {
        fails.push('a blind conversion read does not reach the door stage as a signal row (with the only-their-account-can-say scope the thank-you-page invisibility demands)');
      }

      // ══ THE SURFACES AND THE WALK BRIEF, EXECUTED (round 97) ══════════════
      // The Axiom failure on the client side: the pest company held the #2
      // Sponsored slot and nothing on the sheet could show it. And the walk's
      // brief must dedupe the funnel without erasing old leads' walk text.
      if (mod.sig) {
        const _af97 = { ads: 'yes', lsa: { blockPresent: true, us: true, shown: 2 }, aiOverview: { present: true, citesUs: true }, liveChat: true };
        const _found97 = mod.sig('found', { af: _af97, rows: [], rank: { checked: true, found: true, rank: 26, scanned: 100, query: 'pest control company in Charlotte, NC' } });
        const _fv97 = _found97.rows.map(r => r.label + ': ' + r.value).join(' | ');
        if (!/pay-per-lead block on our pull/.test(_fv97)) fails.push('their own LSA ad never reaches the found-stage signal rows — the Axiom blindness, on the client');
        if (!/AI answer/.test(_fv97) || !/cites their site/.test(_fv97)) fails.push("Google's AI answer citing them never reaches the signal rows");
        if (!/Check it yourself/.test(_fv97) || !/pest control company in Charlotte, NC/.test(_fv97)) fails.push('the hand-check search line is missing — the caller cannot rerun the exact search we measured');
        const _abs97 = mod.sig('found', { af: {}, rows: [], rank: { checked: true, found: false, absenceConfirmed: true, scanned: 100 } });
        const _av97 = _abs97.rows.map(r => String(r.value)).join(' | ');
        if (!/among the 100 listings returned/.test(_av97)) fails.push('the absence row still says "not in the results" without the window it scanned — the depth-20 overclaim, on the sheet');
        const _door97 = mod.sig('door', { af: { liveChat: true }, rows: [] });
        if (!_door97.rows.some(r => /Live chat/.test(r.label))) fails.push('a live-chat widget never reaches the door signal rows — the George Sink popup, invisible on the client');
        const _rot97 = mod.sig('found', { af: { lsa: { blockPresent: true, us: false, shown: 3 } }, rows: [] });
        const _rv97 = _rot97.rows.map(r => String(r.value)).join(' | ');
        if (!/proves nothing/.test(_rv97)) fails.push('the rotating-block caption lost its "not seeing their ad proves nothing" bound — one pull of a rotating surface must never read as their absence');
        // ══ ROUND 99: the pack second-source, the LSA slot number and the
        // named traffic — Vin's "where they ranked for sponsored for places
        // and for businesses", on the sheet. Positive-only both ways.
        const _r99 = mod.sig('found', { af: { ads: 'yes', lsa: { blockPresent: true, us: true, usIndex: 2, shown: 2 }, pack: { us: true, usIndex: 2 } }, rows: [], traffic: { organicEtvMonthly: 210, paidKeywords: 0, topKeywords: [{ keyword: 'pest control charlotte', position: 9, volume: 320 }] } });
        const _r99v = _r99.rows.map(r => r.label + ': ' + r.value).join(' | ');
        if (!/The map beside the results/.test(_r99v)) fails.push("their listing in the page's own map pack never reaches the found rows — the second free read of the map question is invisible on the sheet");
        if (!/shown #2/.test(_r99v)) fails.push('the LSA slot number is measured and never shown — the sponsored position was the direct ask');
        if (!/What already brings traffic/.test(_r99v) || !/pest control charlotte/.test(_r99v)) fails.push('the ranked keywords never reach the sheet — the named top of their funnel, bought and invisible');
        const _r99n = mod.sig('found', { af: { lsa: { blockPresent: false, us: false } }, rows: [] });
        if (_r99n.rows.some(r => /map beside the results/i.test(String(r.label)))) fails.push('a pack row renders with no pack sighting — absence consumed as a fact, the direction the positive-only rule forbids');
        // ══ ROUND 101: every search row names its query, the service pages
        // get their own rows, the price row has four honest states, the chat
        // row earns its place, and the ads hand-check ships. All off the live
        // Windows Plus / TriStar / Burbank hand-check.
        const _q101 = 'window replacement contractor in Louisville, KY';
        const _f101 = mod.sig('found', { af: {}, rows: [], rank: { checked: true, found: true, rank: 2, scanned: 99, query: _q101 } });
        const _f101v = _f101.rows.map(r => r.label + ': ' + r.value).join(' | ');
        if (_f101v.indexOf('for "' + _q101 + '" (their named trade)') < 0) fails.push('the map row does not name its query — the Windows Plus "section at war with itself" is back on the sheet');
        const _v101 = mod.sig('found', { af: {}, rows: [{ id: 'service_invisibility' }], rank: { checked: true, found: true, rank: 2, scanned: 99, query: _q101 }, vis: { results: [
          { kind: 'their own service page', checked: true, found: false, absenceConfirmed: true, scanned: 100, query: 'bathroom remodeling in Louisville, KY' },
          { kind: 'primary trade', checked: true, found: true, rank: 2, scanned: 99, query: _q101 },
        ] } });
        const _v101v = _v101.rows.map(r => r.label + ': ' + r.value).join(' | ');
        if (!/Their own service page.*"bathroom remodeling in Louisville, KY"/.test(_v101v)) fails.push('a confirmed service-page absence does not render as its own named row');
        if (!/checked twice/.test(_v101v)) fails.push('the confirmed service absence lost its two-look claim on the sheet');
        const _v101red = _v101.rows.find(r => /service page/.test(String(r.label)));
        if (!_v101red || _v101red.red !== true) fails.push('a twice-confirmed service absence renders without its red mark while its rung fired — the row and the finding disagree about one measurement');
        if (mod.sig('door', { af: { liveChat: null }, rows: [] }).rows.some(r => /Live chat/.test(String(r.label)))) fails.push('the chat row renders on a lead with no chat found — Vin: "does not need to be in the audits unless weve found one"');
        const _pr101 = (p) => { const g = mod.sig('door', { af: p === undefined ? {} : { price: p }, rows: [] }); const r = g.rows.find(x => /Price on the site/.test(String(x.label))); return r ? String(r.value) : null; };
        if (_pr101('shown') !== 'shown on the pages we read') fails.push('the price row does not render the shown state');
        if (_pr101('unread') !== 'a pricing page exists that we did not open') fails.push('the unread-pricing state does not render — "Not measured: Price" prints about a page one click away, the exact complaint');
        if (_pr101('none') !== 'none on the pages we read') fails.push('the price row does not render the measured absence');
        if (_pr101(undefined) !== null) fails.push('an unmeasured price hardened into a rendered state');
        if (!mod.sig('door', { af: { ads: 'yes' }, rows: [] }).rows.some(r => /Check their ads yourself/.test(String(r.label)) && /adstransparency\.google\.com/.test(String(r.value)))) fails.push('the ads hand-check row is missing on an ads-wired lead — "we need to know 100% they are running ads" has no ten-second check');
        if (mod.sig('door', { af: { ads: 'no' }, rows: [] }).rows.some(r => /Check their ads yourself/.test(String(r.label)))) fails.push('the ads hand-check renders on a lead with no ad code — a row telling the caller to verify nothing');
        const _em101 = mod.sig('door', { af: { emergencyMismatch: true }, rows: [] }).rows.find(r => /Emergency copy/.test(String(r.label)));
        if (!_em101 || _em101.internal !== true) fails.push('emergency copy over a scheduled door does not render as an INTERNAL door row — the Burbank contradiction stays invisible (or leaks outward)');
        // ══ ROUND 102: the search-code rows, the chat wording, the thin
        // score. The noindex row is RED only when the rung actually fired
        // (the §69 rule), builder boilerplate renders as internal context
        // carrying the ~15% bound, no SEO read renders no row, and a thin
        // score renders the refusal instead of a flattering /10.
        const _seoRed = mod.sig('found', { af: { seo: { checked: true, noindex: true } }, rows: [{ id: 'site_noindexed' }] });
        const _seoRow = _seoRed.rows.find(r => /Search setup/.test(String(r.label)));
        if (!_seoRow || !/tells Google not to list/.test(String(_seoRow.value))) fails.push('a measured noindex never reaches the found rows — the one kill-switch search finding is invisible on the sheet');
        if (_seoRow && _seoRow.red !== true) fails.push('the noindex row is not marked red when its rung fired');
        const _seoInt = mod.sig('found', { af: { seo: { checked: true, noindex: false, schema: 'boilerplate', titleIsDefault: false, titleHasCity: true, titleHasTrade: true } }, rows: [] });
        const _seoIntRow = _seoInt.rows.find(r => /Search setup/.test(String(r.label)));
        if (!_seoIntRow || !/builder-generated/.test(String(_seoIntRow.value)) || _seoIntRow.internal !== true) fails.push('the classified-schema state does not render as an internal row — builder boilerplate reads like a claim to the owner');
        if (_seoIntRow && !/never the reason for a map position/.test(String(_seoIntRow.value))) fails.push('the SEO row lost its bound — an on-page note can be read as the reason for a map position, the exact overclaim the industry numbers forbid');
        if (mod.sig('found', { af: {}, rows: [] }).rows.some(r => /Search setup/.test(String(r.label)))) fails.push('a lead with no SEO read still renders a Search setup row');
        // ══ ROUND 103: the partial bands. Each of these fired only on its most
        // extreme value, so the ordinary cases - a title naming the trade but
        // not the city, two of forty images, a sitemap eight months cold - were
        // measured on every lead and rendered nowhere.
        const _sb = mod.sig('found', { af: { seo: { checked: true, noindex: false, schema: 'business',
          titleIsDefault: false, titleHasTrade: true, titleHasCity: false,
          imgAlt: { withAlt: 2, of: 40 },
          sitemapNewest: new Date(Date.now() - 240 * 86400000).toISOString().slice(0, 10) } }, rows: [] })
          .rows.find(r => /Search setup/.test(String(r.label)));
        if (!_sb || !/not the city/.test(String(_sb.value))) fails.push('a title naming the trade but not the city renders nothing - the band only ever fired when BOTH were missing, so the ordinary case was measured and invisible');
        if (_sb && !/only 2 of their 40/.test(String(_sb.value))) fails.push('a partial image-text count renders nothing - the band only fired at zero');
        if (_sb && !/nothing on the site has changed since/.test(String(_sb.value))) fails.push('a sitemap eight months cold renders nothing - the band only fired past a year');
        const _sbClean = mod.sig('found', { af: { seo: { checked: true, noindex: false, schema: 'business',
          titleIsDefault: false, titleHasTrade: true, titleHasCity: true,
          imgAlt: { withAlt: 38, of: 40 },
          sitemapNewest: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10) } }, rows: [] })
          .rows.find(r => /Search setup/.test(String(r.label)));
        if (_sbClean && /(not the city|only \d+ of their|has changed since)/.test(String(_sbClean.value))) fails.push('a site with its title, its images and its sitemap all in order is being given a fault - a row that flags every site tells a caller nothing');
        // ══ ROUND 106: A MEASURED ABSENCE IS NOT AN UNMEASURED SURFACE ═════
        // Tuck & Howell, live 2026-08-27: the funnel printed "Not measured:
        // Search, blue links" while the ladder eleven lines below said "They do
        // not appear anywhere in the first 19 search results". ONE measurement,
        // two readings, on one page. The row could only carry a POSITION, so
        // the exact state organic_invisible exists for rendered as a blank.
        {
          const _abs = mod.sig('found', { af: { organicState: 'absent', organicAbsentOf: 19,
            searchQuery: 'HVAC contractor in Greenville, SC' }, rows: [] });
          const _absRow = _abs.rows.find(r => /blue links/i.test(String(r.label)));
          if (!_absRow) fails.push('a MEASURED absence from the blue links renders no row at all - the sheet says "not measured" beside a ladder finding built on that same measurement');
          if (_absRow && !/not in the 19 results/i.test(String(_absRow.value))) fails.push('the blue-links absence does not say the window it was read over - "not in the results" without the depth is the overclaim round 97 removed everywhere else');
          if ((_abs.unmeasured || []).some(u => /blue links/i.test(String(u)))) fails.push('a measured absence is still reported as an unmeasured surface');
          const _pos = mod.sig('found', { af: { organicState: 'found', organicPosition: 14, organicScanned: 19 }, rows: [] })
            .rows.find(r => /blue links/i.test(String(r.label)));
          if (!_pos || !/#14 of 19/.test(String(_pos.value))) fails.push('a measured blue-links POSITION stopped rendering');
          const _none = mod.sig('found', { af: {}, rows: [] });
          if (_none.rows.some(r => /blue links/i.test(String(r.label)))) fails.push('a surface nobody read renders a blue-links row - unmeasured has become a third claim');
        }
        // ══ ROUND 106: ONE MAP POSITION PER SHEET ══════════════════════════
        // Live 2026-08-27: "Search, map: #2 of 100" three rows above "The map
        // beside the results: their listing is in it at #1". Both reads are
        // honest and pulled separately, so they disagree by a place - and a
        // caller handed two positions for one surface cannot say either.
        {
          const _packWithPos = mod.sig('found', { af: { pack: { us: true, usIndex: 1 } },
            rank: { found: true, rank: 2, scanned: 100, query: 'plumber in Dallas, TX' }, rows: [] })
            .rows.find(r => /map beside the results/i.test(String(r.label)));
          if (!_packWithPos) fails.push('the second map read stopped rendering entirely - the proof that they ARE in the map went with it');
          if (_packWithPos && /#\d/.test(String(_packWithPos.value))) fails.push('the second map read still prints its own slot beside a stated finder position - two positions for one surface, and the caller can quote neither');
          const _packNoPos = mod.sig('found', { af: { pack: { us: true, usIndex: 1 } }, rows: [] })
            .rows.find(r => /map beside the results/i.test(String(r.label)));
          if (!_packNoPos || !/#1/.test(String(_packNoPos.value))) fails.push('with no finder position on the sheet the second read withholds the only slot we have - the guard is eating real information');
        }
        const _chat102 = mod.sig('door', { af: { liveChat: true }, rows: [] }).rows.find(r => /Live chat/.test(String(r.label)));
        if (!_chat102 || !/installed/.test(String(_chat102.value))) fails.push('the chat row went back to asserting a visitor CAN ask — installation is not operation, and nobody measured whether anyone answers it');
        if (mod.scoreLine({ checked: false, thin: true, graded: [], basedOn: '2 of 9' }, false) !== '') fails.push('scoreSentence invents a caption for a thin score');
        const _thinLead = { ...LEAD, websiteScore: { checked: false, thin: true, basedOn: 'MARKER_THIN of 9 components measured', graded: [], skipped: [] } };
        const _thinHtml = mod.html([mod.rec(_thinLead)], { title: 'T', at: 'now' });
        if (!/site build not graded/.test(_thinHtml) || !/MARKER_THIN/.test(_thinHtml)) fails.push('a thin score renders nothing on the sheet — the operator cannot tell "not graded" from "nobody graded it", and the old shape printed a flattering /10 exactly here');
        if (/undefined<span>/.test(_thinHtml)) fails.push('a thin score prints undefined/10 on the sheet');
        // ══ ROUND 103: the old-build finds render in WORDS, with the honest
        // scope on a code-only build, and a pre-103 lead keeps its count row.
        const _bm103 = mod.sig('door', { af: { buildMarkers: ['MARKER_OLDCODE find'], buildVisibleCount: 0, siteAgeMarkers: 3 }, rows: [] });
        const _bm103r = _bm103.rows.find(r => /Site build/.test(String(r.label)));
        if (!_bm103r || !/MARKER_OLDCODE/.test(String(_bm103r.value))) fails.push('the named old-build finds never render — the sheet is back to a bare count of the finds the owner called great');
        if (_bm103r && !/page code/.test(String(_bm103r.value))) fails.push('a code-only old build lost its scope note — the sentence can be read as what customers see, the exact overclaim the visible-marker rule exists to stop');
        const _bm103f = mod.sig('door', { af: { siteAgeMarkers: 3 }, rows: [] }).rows.find(r => /Site build/.test(String(r.label)));
        if (!_bm103f || !/3 old-build markers/.test(String(_bm103f.value))) fails.push('a lead audited before the named markers existed loses its build row entirely');
        // ══ ROUND 103: FACTS RENDER CHECK — the client half of "every fact
        // must have a home". The server's own boot check proves every measured
        // fact has a row in FACTS_RENDER; only THIS file can see both sides, so
        // only this check can prove a row marked 'client' is actually read by
        // something a person looks at. The old-build finds were measured,
        // delivered, persisted and rendered as a bare count for weeks, and
        // every wire looked healthy the whole time - a count IS a render, so
        // nothing downstream could tell the difference.
        try {
          const _fr = server.replace(/\r\n/g, '\n');
          const _at = _fr.indexOf('const FACTS_RENDER = {');
          if (_at < 0) {
            fails.push('FACTS_RENDER is gone from server.js - nothing declares where a measured fact goes, so the next decluttering pass can delete a render and no check will notice');
          } else {
            const _end = _fr.indexOf('\n};', _at);
            const _tbl = _fr.slice(_at, _end);
            // Escaped apostrophes are legal inside a reason and the naive
            // [^']* stopped at the first one, truncating the text and failing a
            // correct build. A reason is exactly the kind of string that
            // contains an apostrophe, so this had to be fixed rather than
            // worked around.
            const _rows = [..._tbl.matchAll(/^  ([a-zA-Z_][a-zA-Z0-9_]*):\s*'((?:\\.|[^'\\])*)'/gm)].map(m => [m[1], m[2]]);
            if (_rows.length < 20) fails.push('the FACTS_RENDER table parsed to ' + _rows.length + ' rows - the parser is not reading the real table, so this check is measuring nothing');
            const _clientRows = _rows.filter(([, v]) => v === 'client');
            if (_clientRows.length < 15) fails.push('only ' + _clientRows.length + " facts are declared as reaching the caller - the sheet has quietly become a summary");
            for (const [k] of _clientRows) {
              const _re = new RegExp('\\b(?:af|auditFacts|facts|_af97|_fx)\\.' + k + '\\b');
              if (!_re.test(html)) {
                fails.push('"' + k + '" is declared as something the caller reads and NOTHING in index.html reads it - it is measured, delivered, persisted and invisible, which is the exact shape of the old-build finds Vin had to notice by hand');
              }
            }
            // And the reasons must be reasons. A one-word "internal" is how an
            // accident gets filed as a decision.
            for (const [k, v] of _rows) {
              if (v === 'client') continue;
              if (!/^(derived|internal):\s*.{25,}/.test(v)) fails.push('"' + k + '" is held back from the sheet with no real reason written down (' + v.slice(0, 40) + ') - an undocumented omission cannot be told apart from a bug');
            }
          }
        } catch (e) { fails.push('the facts-render contract could not be read: ' + e.message); }

        // The renderRefused note lives inside a React component the harness
        // cannot execute, so its branch is pinned at the source — two real
        // halves, assembled here (a literal needle finds itself).
        const _nn101 = (a, b) => a + b;
        if (html.indexOf(_nn101('(!lead.screenshotUrl && lead.render', 'Refused) && React.createElement')) < 0) fails.push('the discarded-render note is gone from the screen — a quarantined 403 render reads as "no screenshot was taken"');
        if (html.indexOf(_nn101('No picture of their homepage on this run: ', "' + lead.renderRefused")) < 0) fails.push('the discarded-render note lost its reason — the sheet cannot say WHY there is no picture');
      } else {
        fails.push('signalRowsFor is not exposed for execution, so none of the surface rows can be verified');
      }
      if (mod.walkStage) {
        const _wt97 = mod.walkStage({ stages: [
          { id: 'money_out', text: 'FULLTEXT-A', brief: '' },
          { id: 'who_finds_them', text: 'FULLTEXT-B covered. BRIEF-B verdict.', brief: 'BRIEF-B verdict.' },
          { id: 'the_door', text: 'OLD-LEAD-TEXT' },
        ] });
        const _joined97 = [..._wt97.found, ..._wt97.door, ..._wt97.after].join(' ');
        if (/FULLTEXT-A/.test(_joined97)) fails.push('an empty brief still renders the full walk text — the funnel repeats every signal row a second time');
        if (!/BRIEF-B verdict/.test(_joined97) || /FULLTEXT-B/.test(_joined97)) fails.push('the walk brief is not preferred over the full text — the dedupe Vin asked for never reaches the screen');
        if (!/OLD-LEAD-TEXT/.test(_joined97)) fails.push('a lead audited before the brief existed loses its walk text entirely — old sheets go blank at their stages');
      }

      // ══ THE SEGMENT BRIEF RENDERS ONCE PER TRADE, NOT ONCE PER LEAD ══════
      // A 50-lead export printed the identical crew-trades brief fifty times —
      // a full page of static text per lead burying the numbers Mike dials
      // from. Two leads sharing one brief must produce ONE copy of its body
      // and a pointer in each article.
      try {
        const briefLead = { ...LEAD, nicheBrief: { label: 'MARKER_BRIEF', unit: 'MARKER_UNIT', buyer: 'the owner',
          vocabulary: [{ term: 'a square', means: 'one hundred square feet' }], software: [], sourced: [], askOnCall: ['who picks up?'], verifiedAt: '2026-08-21' } };
        const two = mod.html([mod.rec(briefLead), mod.rec({ ...briefLead, name: 'Second Co' })], { title: 'T', at: 'now' });
        const bodies = (two.match(/MARKER_UNIT/g) || []).length;
        if (bodies !== 1) fails.push('two leads sharing one segment brief rendered its body ' + bodies + ' time(s), not once — the export re-buries the numbers under repeated static text');
        const pointers = (two.match(/printed ONCE at the end/g) || []).length;
        if (pointers !== 2) fails.push('the per-lead brief pointer rendered ' + pointers + ' time(s) for two leads — a lead whose article does not name its brief loses the appendix');
      } catch (e) { fails.push('the brief-appendix export threw: ' + e.message); }

      // ══ A BLIND AUDIT MUST NOT PRINT AS A NORMAL ONE ═══════════════════════
      // Stanley Schultze, live 2026-08-21: BOTH homepage requests came back 402
      // (Firecrawl out of credits), we opened not one page of his site, and his
      // exported call sheet was indistinguishable from the three built on real
      // reads. Executed, not read: the warning only exists if a blind record
      // actually produces it and a healthy one actually does not.
      {
        const blind = mod.rec({ ...LEAD, corpusRead: { homepageChars: 0, interiorPages: 0 }, firecrawlOutOfCredits: true });
        if (!blind.corpusWarning) {
          fails.push('an audit built on ZERO pages of their website carries no warning, so it exports looking exactly like one built on seven — which is what happened to Stanley Schultze');
        }
        let blindPage = '';
        try { blindPage = mod.html([blind], { title: 'T', at: 'now' }); } catch (e) { blindPage = ''; }
        if (blindPage && blindPage.indexOf('never read a single page') < 0) {
          fails.push('the blind-audit warning is computed and never rendered on the sheet Mike dials from');
        }
        // And the other direction, which matters just as much: a banner on every
        // lead is a banner nobody reads, and it would bury the real ones.
        const healthy = mod.rec({ ...LEAD, corpusRead: { homepageChars: 9000, interiorPages: 6 }, firecrawlOutOfCredits: false });
        if (healthy.corpusWarning) {
          fails.push(`a normal audit (9000 chars, 6 interior pages) carries a degraded-corpus warning: "${healthy.corpusWarning}" — a warning on every sheet is one nobody reads`);
        }
        // A homepage-only read is a real limit and must be said, because every
        // "nothing on their site" sentence becomes a claim about one page.
        const thin = mod.rec({ ...LEAD, corpusRead: { homepageChars: 9000, interiorPages: 0 }, firecrawlOutOfCredits: false });
        if (!thin.corpusWarning) fails.push('a homepage-only audit is presented as a full read of their site');
      }
      // ══ THE FUNNEL WALK IS THE STORY'S SPINE ══════════════════════════════
      // Server-assembled from measurements, attached beside theOneThing, and —
      // because a code block bypasses the strippers — its render is the only
      // place a dropped wire would show. Executed: a lead carrying a walk must
      // render every part of it, and the one-thing's copy of the same
      // bottleneck must NOT render beside the walk's own fix-first (nothing
      // said twice, the V2 rule).
      try {
        // The walk is the story only when the model read is absent — the
        // fixture drops the read so the fallback path is the one executed.
        const fsLead = { ...LEAD, situationRead: null, funnelStory: { checked: true,
          stages: [{ id: 'money_out', label: 'Money out', text: 'MARKER_FSTAGE' }],
          fixFirst: { link: 'FOUNDATION', plain: 'MARKER_FIXPLAIN', why: 'MARKER_FIXWHY', join: 'MARKER_FIXJOIN' } } };
        const fsPage = mod.html([mod.rec(fsLead)], { title: 'T', at: 'now' });
        for (const mk of ['MARKER_FSTAGE', 'MARKER_FIXPLAIN', 'MARKER_FIXWHY', 'MARKER_FIXJOIN']) {
          if (fsPage.indexOf(mk) < 0) fails.push('the funnel walk drops ' + mk + ' — the code-assembled spine is computed on the server and never reaches the sheet');
        }
        if (fsPage.indexOf('MARKER_FIRSTBROKEN') >= 0) {
          fails.push("the one-thing fix-first still renders beside the walk's own fix-first — the same bottleneck said twice");
        }
      } catch (e) { fails.push('the funnel-walk export threw: ' + e.message); }

      // ══ THE FUNNEL GROUPING AND THE 1-2-3, EXECUTED BOTH WAYS ═════════════
      // Vin's two conditions on the funnel layout: every finding at its proper
      // stage, and the top three leaks numbered. Both run here on the real
      // grouping, plus the render: the badge must reach the page.
      try {
        const gfs = mod.groupStage([
          { problem: 'not in the results', funnelStage: 'found', moneyRank: 3, harm: 90, leakRank: 1, pillar: 'INVISIBLE', moneyLine: 'ml1' },
          { problem: 'nothing bookable', funnelStage: 'door', moneyRank: 4, harm: 80, leakRank: 2, pillar: 'LEAKING' },
          { problem: 'reviews slowed', funnelStage: 'work', internalOnly: true, moneyRank: 6, pillar: 'TAXED' },
          { problem: 'legacy pillar row', pillar: 'UNCAUGHT', moneyRank: 2, harm: 85 },
          { problem: 'workmanship repeats', funnelStage: 'work', moneyRank: 6, pillar: 'TAXED' },
        ], { measured: { found: true, door: true, after: false } });
        const st = Object.fromEntries(gfs.stages.map(x => [x.id, x]));
        if (!st.found || !st.found.rows.some(r => r.problem === 'not in the results') || st.found.status !== 'broken') {
          fails.push('a staged finding did not land at its declared funnel stage, or a stage with findings does not read broken');
        }
        if (st.after.status !== 'no_read') fails.push('an unmeasured stage with no findings does not read NOT MEASURED — silence hardened into a verdict');
        // A stage the walk measured as WORKING (trusted top-three) that still
        // carries leak rows is 'mixed', never 'broken' — "BROKEN" printed
        // directly above "That part works." on a live sheet. Without the
        // strength flag the same rows still read broken.
        const gmx = mod.groupStage([
          { problem: 'weaker rival above', funnelStage: 'found', moneyRank: 3, harm: 92, leakRank: 1, pillar: 'INVISIBLE' },
        ], { measured: { found: true, door: true, after: false }, strong: { found: true } });
        const mxFound = gmx.stages.find(x => x.id === 'found');
        if (!mxFound || mxFound.status !== 'mixed') fails.push('a stage the walk measured as WORKING still reads BROKEN beside "That part works." — the strength flag never reaches the chip');
        const gmx2 = mod.groupStage([
          { problem: 'weaker rival above', funnelStage: 'found', moneyRank: 3, harm: 92, leakRank: 1, pillar: 'INVISIBLE' },
        ], { measured: { found: true, door: true, after: false } });
        const mxFound2 = gmx2.stages.find(x => x.id === 'found');
        if (!mxFound2 || mxFound2.status !== 'broken') fails.push('a stage with leaks and NO measured strength stopped reading BROKEN — the mixed state fired on nothing');
        // ══ THE FUNNEL IS THE ROWS (round 98) ═══════════════════════════
        // Vin approved Direction A with one rule: the funnel must always fit
        // the text beside it. So the segments and the cards are the same grid
        // rows, and what this can verify is the SHAPE CONTRACT: the rows join
        // into one continuous funnel (his complaint about the first draft was
        // "its boxes its suppose to be a funnel"), it genuinely narrows, and
        // red fill marks only a broken stage.
        for (let ti = 0; ti < mod.taper.length - 1; ti++) {
          if (mod.taper[ti].bot !== mod.taper[ti + 1].top) fails.push('funnel row ' + ti + ' does not join row ' + (ti + 1) + ' — the segments are boxes again, not one funnel');
          if (mod.taper[ti + 1].top <= mod.taper[ti].top) fails.push('the funnel stops narrowing at row ' + (ti + 1));
        }
        for (const tr of mod.taper) { if (tr.bot <= tr.top) fails.push('a funnel row widens downward — that is not a funnel'); if (tr.bot >= 50) fails.push('a funnel row narrows past its own midline and the shape inverts'); }
        if (mod.segClip(0).indexOf('polygon(0% 0%, 100% 0%') !== 0) fails.push('the funnel mouth is not full width');
        if (mod.segClip(99) !== mod.segClip(mod.taper.length - 1)) fails.push('an out-of-range row does not clamp to the last taper');
        for (const dk of [false, true]) {
          if (mod.segFill('broken', dk) === mod.segFill('clean', dk)) fails.push('a broken segment fills like a clean one — colour no longer marks the stop');
          if (mod.segFill('mixed', dk) === mod.segFill('broken', dk)) fails.push('a working-with-leaks stage fills red — mixed is a working stage whose drips are red, not a broken one');
        }
        if (!st.door.rows.some(r => r.problem === 'legacy pillar row')) fails.push('a legacy row with only a pillar did not fall back to a stage — old audits dump everything in the reference tail');
        if (gfs.work.some(r => r.internalOnly)) fails.push('an internal review metric reached the funnel context strip — the reference owns the internal list');
        if (!gfs.work.some(r => r.problem === 'workmanship repeats')) fails.push('the workmanship context row is missing from under the funnel');
        if (gfs.rankOf.get(gfs.stages[0].rows[0]) !== 1) fails.push('the server-assigned leak number did not reach the grouping');
        // Legacy numbering: no leakRank anywhere derives the same 1-2-3.
        const legacyRows = [
          { problem: 'a', funnelStage: 'found', moneyRank: 2, pillar: 'UNCAUGHT' },
          { problem: 'b', funnelStage: 'door', moneyRank: 4, pillar: 'LEAKING' },
          { problem: 'int', funnelStage: 'work', internalOnly: true, moneyRank: 3 },
        ];
        const gl = mod.groupStage(legacyRows, null);
        // Depth order, mirroring the server: the door row (deeper) anchors
        // over the found row even though the found row's pillar ranks higher.
        if (gl.rankOf.get(legacyRows[1]) !== 1 || gl.rankOf.get(legacyRows[0]) !== 2) fails.push('a legacy lead does not derive the depth-first leak numbers the server assigns');
        if (gl.rankOf.get(legacyRows[2])) fails.push('a legacy internal row took a leak number');
        // A legacy copy row (fromTheirPages) may fill but never anchor.
        const glc = mod.groupStage([
          { problem: 'copy quote', funnelStage: 'door', moneyRank: 6, harm: 90, fromTheirPages: true },
          { problem: 'real find', funnelStage: 'found', moneyRank: 3, harm: 60, pillar: 'INVISIBLE' },
        ], null);
        const glcRows = [...glc.rankOf.entries()];
        if ((glcRows.find(x => x[0].problem === 'copy quote') || [])[1] === 1) fails.push('a legacy copy observation anchored at leak 1');
        if ((glcRows.find(x => x[0].problem === 'real find') || [])[1] !== 1) fails.push('the measured row did not anchor when a copy row was present');
        // The walk mapper: money_out and who_finds_them both land on Getting
        // found; what_repeats never reaches a stage (the work strip owns it).
        const wt = mod.walkStage({ stages: [
          { id: 'money_out', text: 'MO' }, { id: 'who_finds_them', text: 'WF' },
          { id: 'the_door', text: 'TD' }, { id: 'after_contact', text: 'AC' }, { id: 'what_repeats', text: 'WR' },
        ] });
        if (wt.found.join(' ') !== 'MO WF' || wt.door.join(' ') !== 'TD' || wt.after.join(' ') !== 'AC') fails.push('the walk texts do not land at their drawn stages');
        // Inside one stage the numbered leaks lead, in rank order — LEAK 3
        // printed above LEAK 2 on the first sample of this layout.
        const gOrd = mod.groupStage([
          { problem: 'ranked three', funnelStage: 'found', moneyRank: 1, harm: 70, leakRank: 3 },
          { problem: 'ranked two', funnelStage: 'found', moneyRank: 3, harm: 96, leakRank: 2 },
        ], null);
        const foundRows = (gOrd.stages.find(x => x.id === 'found') || { rows: [] }).rows;
        if (!foundRows[0] || foundRows[0].problem !== 'ranked two') fails.push('the numbered leaks inside a stage do not render in rank order');
        // Stored ranks NORMALIZE, never copy: Wolf's live sheet carried two
        // LEAK 1 badges from rows numbered by two different numbering eras.
        const dup = [
          { problem: 'outranked row', funnelStage: 'found', harm: 92, leakRank: 1 },
          { problem: 'door row', funnelStage: 'door', harm: 62, leakRank: 1 },
        ];
        const gDup = mod.groupStage(dup, null);
        const dupRanks = [gDup.rankOf.get(dup[0]), gDup.rankOf.get(dup[1])].sort().join(',');
        if (dupRanks !== '1,2') fails.push('two stored LEAK 1 rows still render two LEAK 1 badges (— the exact Wolf symptom); got ranks ' + dupRanks);
        const nrm = mod.norm([
          { problem: 'int', internalOnly: true, leakRank: 1 },
          { problem: 'r2', leakRank: 2 }, { problem: 'r2b', leakRank: 2 },
          { problem: 'r4', leakRank: 4 }, { problem: 'r5', leakRank: 5 },
        ]);
        if (nrm.length !== 3) fails.push('the normalizer kept ' + nrm.length + ' ranked rows, not the top three');
        if (nrm.some(pair => pair[0].internalOnly)) fails.push('an internal row with a stored rank survived normalization — internal metrics can never take a number');
        if (!nrm[0] || nrm[0][1] !== 1 || nrm[1][1] !== 2 || nrm[2][1] !== 3) fails.push('normalized ranks are not sequential 1-2-3');
        if (JSON.stringify(wt).includes('WR')) fails.push('the what_repeats walk text leaked into a funnel stage — it belongs in the work strip');
        // The score sentence: one plain line, both directions.
        // Round 101: 8.0 reads as "a solid build" (the build-is-fine caption
        // now starts at 8.5), and a CAPPED score must say the door capped it -
        // "the build is fine" over a form-and-wait door is the caption the
        // owner rejected on the live Windows Plus 9/10.
        if (!/solid build|build is fine/i.test(mod.scoreLine({ checked: true, score: 8 }, true))) fails.push('a high score does not read as a healthy build');
        // Round 106: the cap has TWO reasons now (a door that cannot book a
        // time, and a numbered leak that is a measured fault on this site), so
        // the caption prints the SERVER'S reason instead of a second hand-kept
        // copy that would have said "nothing books a time" about a site whose
        // scheduler works fine. Assert the pass-through and the prefix trim.
        {
          const _capDoor = mod.scoreLine({ checked: true, score: 7.5, capped: 'capped at 7.5: nothing on the site books a time, and a clean build around a form-and-wait door is still a form-and-wait door' }, true);
          if (!/nothing on the site books a time/i.test(_capDoor)) fails.push('a capped score does not say WHY it stopped where it did - a silently capped number reads as an earned one');
          if (/^capped at/i.test(_capDoor)) fails.push('the caption repeats the machine prefix instead of the reason');
          const _capLeak = mod.scoreLine({ checked: true, score: 7.5, capped: 'capped at 7.5: leak 2 is a measured fault on this site (their form asks for 11 things)' }, true);
          if (!/leak 2 is a measured fault/i.test(_capLeak)) fails.push('a leak-capped score still prints the door sentence - the client is keeping its own copy of a reason the server already wrote');
        }
        if (!/part of the problem/i.test(mod.scoreLine({ checked: true, score: 3 }, true))) fails.push('a low score does not say the build itself is a problem');
        if (mod.scoreLine(null, true) !== '' || mod.scoreLine({ checked: false, score: 8 }, true) !== '') fails.push('an unmeasured score produced a sentence');
        // The rendered sheet: the segments, the spout and the drip actually
        // reach the page, and the funnel sizes off the rows — there is no
        // fixed-height drawing left to fall out of sync.
        {
          const fpage = mod.html([mod.rec(LEAD)], { title: 'T', at: 'now' });
          if ((fpage.match(/clip-path:polygon\(/g) || []).length < 3) fails.push('the export funnel lost its tapered segments — the drawing is gone or back to a fixed picture');
          // NOT the words 'booked jobs': LAYER_PLAIN translates CONVERSION as
          // "turning interest into booked jobs", so that text is on nearly
          // every sheet and the first version of this assertion passed with
          // the spout deleted — found by the falsification run, which is the
          // fixture-that-measures-nothing trap this file records. The spout's
          // own class can only come from the spout row.
          if (fpage.indexOf('class="fspoutlbl"') < 0) fails.push('the funnel spout row never reaches the sheet — the funnel ends without its narrow booked-jobs outlet');
          if (fpage.indexOf('&#128167;') < 0) fails.push('a broken stage renders no drip on the sheet');
          if (/<svg[^>]*aria-label="funnel"/.test(fpage)) fails.push('the retired fixed-size funnel SVG is back on the sheet beside the row funnel');
        }
        // Call sites, assembled at runtime: both surfaces must draw through
        // the ONE clip builder, or the export and the screen taper drift.
        {
          const _fn2 = (...p) => p.join('');
          if (!src.includes(_fn2("';clip-path:' + funnel", 'SegClip(si)'))) fails.push('the export no longer clips its segments through funnelSegClip — two tapers can drift');
          if (!src.includes(_fn2('clipPath: funnel', 'SegClip(si)'))) fails.push('the screen no longer clips its segments through funnelSegClip');
        }
        // The render: badge, stage row and money line reach the page.
        const stagedLead = { ...LEAD, problemList: [
          { problem: 'MARKER_STAGEROW', funnelStage: 'found', moneyRank: 3, harm: 90, leakRank: 1, pillar: 'INVISIBLE', moneyLine: 'MARKER_STAGEMONEY', rankNote: 'MARKER_RANKNOTE' }] };
        const sp = mod.html([mod.rec(stagedLead)], { title: 'T', at: 'now' });
        const dupLead = { ...LEAD, problemList: [
          { problem: 'dup A', funnelStage: 'door', harm: 80, leakRank: 2, callOpener: 'Is the front desk picking up after five?' },
          { problem: 'dup B', funnelStage: 'found', harm: 70, leakRank: 2, callOpener: 'Who shows up when you search your own trade?' }] };
        const dpp = mod.html([mod.rec(dupLead)], { title: 'T', at: 'now' });
        // Two cards, numbered 1 and 2 (both rows carry a STORED rank of 2 —
        // the normalizer is what makes them distinct), each carrying its own
        // opener exactly once. The badge itself legitimately appears in three
        // places (the index, the card, the position marker at its funnel
        // stage), so the badge count proves nothing and the QUESTION does.
        if ((dpp.match(/<div class="lk">/g) || []).length !== 2
          || dpp.indexOf('class="lkb">LEAK 1</span><span class="lkw">') < 0
          || dpp.indexOf('class="lkb">LEAK 2</span><span class="lkw">') < 0
          || (dpp.match(/Is the front desk picking up after five\?/g) || []).length !== 1
          || (dpp.match(/Who shows up when you search your own trade\?/g) || []).length !== 1) {
          fails.push('two legacy rank-2 findings do not render as two cards numbered LEAK 1 and LEAK 2, each carrying its own opener once — the cards are reading raw stored ranks again');
        }
        for (const mk of ['MARKER_STAGEROW', 'LEAK 1', 'MARKER_STAGEMONEY', 'MARKER_RANKNOTE', 'Getting found']) {
          if (sp.indexOf(mk) < 0) fails.push('the funnel render drops "' + mk + '" — the stage, the number or the money line never reaches the sheet');
        }
        // The walk's measured sentences render AT their stages (the mock's
        // grey evidence line), the fallback-search caveat travels with the
        // found stage instead of a header chip, and the score renders as one
        // plain sentence. Each was a header chip or nothing before this.
        const walkLead = { ...LEAD,
          problemList: [],
          websiteScore: { checked: true, score: 8, basedOn: 'MARKER_BASEDON', graded: [{ what: 'phone layout', got: 2, of: 2 }] },
          auditFacts: { checked: true, searchSource: 'places' },
          funnelStory: { checked: true, stages: [
            { id: 'money_out', label: 'Money out', text: 'MARKER_WALK_MONEY.' },
            { id: 'the_door', label: 'What a click lands on', text: 'MARKER_WALK_DOOR.' },
            { id: 'what_repeats', label: 'What repeats', text: 'MARKER_WALK_REPEATS.' },
          ], measured: { found: true, door: true, after: false }, fixFirst: null } };
        const wp = mod.html([mod.rec(walkLead)], { title: 'T', at: 'now' });
        for (const mk of ['MARKER_WALK_MONEY', 'MARKER_WALK_DOOR', 'MARKER_WALK_REPEATS', 'PARTLY MEASURED', 'fallback source this run', 'MARKER_BASEDON']) {
          if (wp.indexOf(mk) < 0) fails.push('the funnel render drops "' + mk + '" — a measured walk sentence, the fallback caveat or the score grading never reaches the sheet');
        }
        if (!/the leaks are in the path around it|build is fine|solid build|door caps the grade/.test(wp)) fails.push('the one-sentence score verdict never reaches the sheet — the chips block was removed and nothing replaced it');
        // A clean measured stage must NOT say "no fault found" when the search
        // was read on the fallback — that silence is a different fact.
        if (/NO FAULT FOUND/.test(wp) && wp.indexOf('PARTLY MEASURED') < 0) fails.push('a fallback-search lead still reads NO FAULT FOUND at Getting found');
        // ══ NO GREY TEXT ON THE SHEET — the owner's order, enforced ══════
        // "eliminate the grey text... it gets read right over cuz its smaller
        // font size and grey." Hierarchy lives in size and weight now; a grey
        // TEXT token reappearing in the export is the regression.
        for (const grey of ['color:#86868b', 'color:#515154', 'color:#6b7280', 'color:#a1a1a6']) {
          if (wp.indexOf(grey) >= 0 || sp.indexOf(grey) >= 0) fails.push('grey text is back on the sheet (' + grey + ') — the owner asked for full-contrast text with hierarchy from size and weight only');
        }
        // The paid half of the traffic estimate reaches the sheet's internal
        // list — "why doesnt it say anything about paid traffic".
        const paidLead = { ...LEAD, problemList: [], trafficEstimate: { checked: true, inIndex: true, organicEtvMonthly: 341, organicKeywords: 120, paidKeywords: 6, paidEtvMonthly: 220 } };
        const pp = mod.html([mod.rec(paidLead)], { title: 'T', at: 'now' });
        if (pp.indexOf('341') < 0 || pp.indexOf('Google-paid') < 0 || pp.indexOf('220') < 0) fails.push('the paid-traffic estimate never reaches the sheet — the organic half rendered alone for the life of the estimate');
        if (pp.indexOf('their own Analytics') < 0) fails.push('the sheet no longer says where the traffic-source question gets answered (their Analytics, on the call)');
        const zeroPaidLead = { ...LEAD, problemList: [], trafficEstimate: { checked: true, inIndex: true, organicEtvMonthly: 341, organicKeywords: 120, paidKeywords: 0 } };
        const zp = mod.html([mod.rec(zeroPaidLead)], { title: 'T', at: 'now' });
        if (!/never seen this domain buy a Google ad/.test(zp)) fails.push('a zero paid-keyword read no longer renders as the honest negative — the second independent answer to "are they running ads"');
        // plainRisk: a possessive apostrophe is not a quote delimiter — the
        // live Do-not-say bullet began "s observation. It should open with".
        // The LIVE shape needs the SECOND apostrophe downstream — without it
        // the old regex found no closing quote and the fixture measured
        // nothing (caught by its own falsification run).
        // == ONE DISPLAY FORM FOR THE WEBSITE ============================
        // The Contact block and the export record each built their own, so
        // one sheet could read "https://www.acme.com/" and the other
        // "acme.com". Executed here; the two CALL SITES are pinned in the
        // request block, because a fixture cannot see a caller.
        if (mod.web) {
          const _w = mod.web({ website: 'https://www.acme-roofing.com/?utm_source=gmb' });
          if (_w !== 'acme-roofing.com') fails.push(`the one website display form no longer normalises a real stored URL — got "${_w}"`);
          if (mod.web({}) !== '') fails.push('a lead with no website produces text instead of nothing');
          if (mod.web({ website: 'http://acme.com', auditedWebsite: 'https://audited.com' }) !== 'audited.com') {
            fails.push('the display form no longer prefers the domain we actually audited');
          }
        } else { fails.push('websiteForReading could not be lifted, so the one display form is unverified'); }
        const pr = mod.plain("The pitch reads as a template diagnosis rather than a founder's observation. It should open with the specific measured finding (search rank) without preamble, and skip the 'someone in Louisville searching' construction.");
        if (/^.s observation/.test(String(pr)) || /\u201cs observation/.test(String(pr))) fails.push('plainRisk still mistakes a possessive apostrophe for a quote — the mangled Do-not-say bullet is back');
      } catch (e) { fails.push('the funnel grouping check threw: ' + e.message); }
      if (page) {
        const MARKERS = ['MARKER_OWNER', 'MARKER_TITLE', 'MARKER_PHONE', 'MARKER_BACKGROUND',
          'MARKER_HEADLINE', 'MARKER_READ', 'MARKER_ROWLABEL', 'MARKER_ROWSAYS', 'MARKER_LAYER',
          'MARKER_DIAGNOSIS', 'MARKER_WHY', 'MARKER_FIRSTBROKEN', 'MARKER_FRICTION1',
          'MARKER_FRICTION2', 'MARKER_COSTLIEST', 'MARKER_COSTS', 'MARKER_ORIGINAL', 'MARKER_QUOTE',
          'MARKER_AREA', 'MARKER_PROBLEM', 'MARKER_PCOSTS', 'MARKER_NEEDS', 'MARKER_ASK',
          'MARKER_RISK', 'MARKER_CRITICAL', 'MARKER_SUBJECT', 'MARKER_PITCH', 'MARKER_SHOTLABEL',
          // Tier 2: the owner read, and the pages the site links nowhere.
          'MARKER_CARES', 'MARKER_LANDING'];
        const lost = MARKERS.filter(m => page.indexOf(m) < 0);
        if (lost.length) {
          fails.push(`the audit export drops ${lost.length} field(s) that are on the lead and on the screen: ${lost.join(', ')} — an export that looks complete and is missing the diagnosis is worse than no export`);
        }
        // A business name with an ampersand and angle brackets must not destroy
        // the page. Unescaped, everything after it renders as broken markup.
        if (page.indexOf('Smith &amp; Sons &lt;Roofing&gt;') < 0) {
          fails.push('the export does not escape the company name, so a business called "Smith & Sons <Roofing>" silently corrupts the file from that point on');
        }
        // ══ THE INFO-TRAVEL HELPERS, EXECUTED BOTH WAYS ═══════════════════
        // Breck's Paving, live 2026-08-24: header "Ads none found" beside a
        // leak claiming Google Ads tracking. One label now serves every
        // renderer, and a Meta-only advertiser must never read "none found".
        if (mod.adsLabel({ ads: 'no', metaPixel: true }) !== 'Ads: Facebook only') fails.push('a Meta-only advertiser reads "' + mod.adsLabel({ ads: 'no', metaPixel: true }) + '" instead of naming Facebook — the header/finding split-brain returns');
        if (mod.adsLabel({ ads: 'yes', metaPixel: true }) !== 'Ads: Google + Facebook') fails.push('both platforms do not read as both');
        if (mod.adsLabel({ ads: 'no', metaPixel: false }) !== 'Ads: no ad code on their pages') fails.push('a genuinely tag-free site lost its scoped label (a flat "none found" was false for LSA advertisers, whose product needs no site code)');
        if (mod.adsLabel({ ads: 'lsa_only', metaPixel: false }).indexOf('pay-per-lead seen live') < 0) fails.push('an LSA-only advertiser still reads as having no ads - the Axiom false label');
        if (mod.adsLabel({ ads: 'unreadable' }) !== 'Ads: could not read') fails.push('an unreadable page reads as a fact about the business');
        // The same finding printed twice in THE EVIDENCE on 2 of 3 live sheets:
        // merged copy-quote rows in problemList AND the standalone own-words list.
        const _dd = mod.dedupe([{ problem: 'Every service page opens with the same promise — the kitchen page says X' }],
          [{ finding: 'Every service page opens with the same promise — the kitchen page says X' }, { finding: 'A different original finding entirely' }]);
        if (_dd.length !== 1 || !/different original/.test(_dd[0].finding)) fails.push('own-words rows that already became problem rows still render twice (or a distinct one was eaten)');
        // Three leaks all opening "A kitchen or bathroom remodel runs $15k-$80k."
        // read as one template; later leaks keep only their specific half.
        const _ml1 = 'A remodel runs $15k-$80k. Every person who hit the same wall was one of those jobs.';
        const _ml2 = 'A remodel runs $15k-$80k. The ad budget is buying clicks and nothing counts them.';
        if (mod.trim(_ml2, _ml1, 1) !== 'The ad budget is buying clicks and nothing counts them.') fails.push('the repeated job-value sentence is not trimmed off later leaks');
        if (mod.trim(_ml1, _ml1, 0) !== _ml1) fails.push('leak #1 lost its job-value sentence');
        if (mod.trim('A different opener entirely. Tail.', _ml1, 2) !== 'A different opener entirely. Tail.') fails.push('a leak with its own money line was trimmed');
        // ══ THE WARNINGS READ AS A QUOTE PLUS ONE PLAIN LINE ══════════════
        // J Chester's live sheet carried three paragraphs of detector
        // rationale. The caller gets the sentence not to say and one reason.
        const _liveRisk = 'POST-CONTACT CLAIM: says what happens after a customer contacts THIS business, which we have never observed. Legal as a general truth about people, and legal marked as your own read; illegal stated as a report \u2014 "But someone who fills out your quote form right now is waiting on a human to call them back, an"';
        const _pr = mod.plain ? mod.plain(_liveRisk) : plainRiskMissing();
        if (!/waiting on a human to call them back/.test(_pr)) fails.push('the warning lost the quoted sentence — the one thing the caller must not say');
        if (/Legal as a general truth/.test(_pr)) fails.push('the warning still carries the detector rationale — engineering prose on a sales sheet');
        if (!/never watched what happens after someone contacts them/.test(_pr)) fails.push('the warning lost its plain-English reason');
        // And the quote must have ONE home. Three of five entries on two live
        // sheets printed the span twice, because the fallback reason is the raw
        // entry and the entry BEGINS with the quote. This fixture deliberately
        // matches no RISK_REASONS row, which is the only way to reach that
        // branch - the live fixture above matches one and never exercises it.
        const _dupeRisk = '\u201cthe form it lands on asks for 7 pieces of information first\u201d \u2014 Facebook ad code is present and no counting was visible';
        const _dp = mod.plain ? mod.plain(_dupeRisk) : plainRiskMissing();
        const _twice = _dp.split('asks for 7 pieces of information first').length - 1;
        if (_twice > 1) fails.push(`the warning prints its quoted span ${_twice} times — the quote and the reason are the same words`);
        if (!/Facebook ad code/.test(_dp)) fails.push('the quote strip ate the reason as well as the duplicate');
        // Layer codes translate; an unknown code passes through untouched.
        // Round 101: the raw code suffix is gone - Vin twice read '(LEADS)'
        // as noise. Plain words only on both surfaces.
        if (mod.layer('MARKET') !== 'how they position themselves') fails.push('MARKET does not translate — "The one thing \u2014 MARKET" confused the person who built this system');
        if (/\(MARKET\)/.test(mod.layer('MARKET'))) fails.push('the raw layer code is back on the sheet');
        if (mod.layer('SOMENEWLAYER') !== 'SOMENEWLAYER') fails.push('an unknown layer code is mangled instead of passed through');
        // ══ THE V2 GROUPING — the spine of the sheet, executed both ways ══
        // Every finding lands in exactly one place: nested under its leak
        // (same money pillar), in The smaller leaks (any other pillar), in the
        // reference tail (no pillar), or marked internal. Nothing may appear
        // twice and nothing with a pillar may be buried.
        const _g = mod.group([
          { id: 'lead1', problem: 'LEAK_ONE text', costs: 'c1', moneyRank: 1, pillar: 'BURNING' },
          { id: 'supp1', problem: 'SUPPORT_ROW text', costs: 'c2', pillar: 'BURNING' },
          { id: 'small1', problem: 'SMALL_LEAK text', costs: 'c3', pillar: 'ROTTING' },
          { id: 'plain1', problem: 'NO_PILLAR row', costs: 'c4' },
          { id: 'int1', problem: 'INTERNAL row', costs: 'c5', pillar: 'TAXED', internalOnly: true },
        ], { friction: ['FRICTION item'] });
        if (_g.leaks.length !== 1 || _g.leaks[0].problem !== 'LEAK_ONE text') fails.push('the grouping lost the leak');
        if (!_g.leaks[0].support.some(x => /SUPPORT_ROW/.test(x))) fails.push('a same-pillar fact is not NESTED under its leak — it will print as a duplicate row again');
        if (!_g.small.some(x => /SMALL_LEAK/.test(x.problem))) fails.push('a money-pillar finding fell out of The smaller leaks — a revenue signal buried, the thing the owner asked to never happen');
        if (!_g.other.some(x => /NO_PILLAR/.test(x.problem))) fails.push('a no-pillar row lost from the reference tail');
        if (!_g.internal.some(x => /INTERNAL row/.test(x.problem))) fails.push('an internal row vanished');
        if (_g.small.some(x => /SUPPORT_ROW/.test(x.problem)) || _g.other.some(x => /SUPPORT_ROW|SMALL_LEAK/.test(x.problem))) fails.push('a finding appears in two sections — the repetition V2 exists to kill');
        if (!/^<!doctype html>/i.test(page)) fails.push('the export is not a complete HTML document');
        // Self-contained means it LOADS nothing. A link the reader can click is
        // fine and a screenshot URL in the text is fine; a stylesheet, a script,
        // an <img>, a webfont or a CSS url() is not, because the file gets
        // emailed around and opened on machines that cannot reach any of them.
        const LOADS = /<script\b|<link\b|<img\b|<iframe\b|@import|url\(\s*['"]?https?:/i;
        if (LOADS.test(page)) {
          fails.push('the export is no longer self-contained — it loads a script, stylesheet, image or font over the network, so it cannot be relied on to open on a machine that has none of them');
        }
        // ══ THE TWO SURFACES ARE ONE DOCUMENT ════════════════════════════
        // Vin, on the first live pair: "for the actualy audit screen its even
        // mroe detial then before i wnat it to macth the export sheet." Three
        // sections differed (the sell, the conversation heading, where the
        // score and its internal notes sat). ONE ordered list is asserted
        // against both renderers here and against the screen below, so a
        // section added to one surface and not the other fails the build.
        for (let _si = 1; _si < SHEET_ORDER.length; _si++) {
          const a2 = page.indexOf(SHEET_ORDER[_si - 1]), b2 = page.indexOf(SHEET_ORDER[_si]);
          if (a2 < 0) { fails.push('the exported sheet no longer renders "' + SHEET_ORDER[_si - 1] + '"'); break; }
          if (b2 < 0) { fails.push('the exported sheet no longer renders "' + SHEET_ORDER[_si] + '"'); break; }
          if (b2 < a2) { fails.push('the exported sheet renders "' + SHEET_ORDER[_si] + '" before "' + SHEET_ORDER[_si - 1] + '" — the screen and the sheet are no longer one document'); break; }
        }
        // ══ ROUND 108: TWO TIERS, AND A TAKEAWAY ON EVERY POINT ═══════════
        // Vin's junior rep "has no clue what these audits mean" and the sheet
        // reads "like speaking in code". The approved answer is a sheet with a
        // TOP — everything needed to make the call above one rule, every
        // measurement below a second — and a "so what?" line on every point.
        // Executed here because a layout nothing runs is a layout that rots.
        {
          const _at = (needle) => page.indexOf(needle);
          // The apostrophe is HTML-escaped on the sheet, so the heading is
          // matched on the half of it that survives escaping.
          const _sb = _at('s working, what'), _lk = _at('The biggest leaks');
          const _dns = _at('Do not say on this call'), _fun = _at('The funnel');
          // Round 110: one document. The order that matters is that the
          // scoreboard comes before the leaks, the leaks before the
          // measurements, and Do-not-say before the measurements — a rep who
          // stops reading at the funnel must already have met the guardrails.
          if (_sb < 0 || _lk < 0 || _fun < 0) fails.push('the sheet lost one of the scoreboard, the numbered leaks or the funnel');
          else {
            if (!(_sb < _lk)) fails.push('the ten-second scoreboard renders after the leaks it is meant to introduce');
            if (!(_lk < _fun)) fails.push('the numbered leaks fell below the measurements — the three things the call is built on are no longer the first thing a rep meets');
            if (!(_dns > 0 && _dns < _fun)) fails.push('Do not say now renders after the measurements — a rep who stops reading at the funnel never meets the guardrails, which is exactly the reader they exist for');
          }
          // The tier rules are gone. A second document is what made the record
          // a reprint of the fold above it.
          if (page.indexOf('The full record') >= 0 || page.indexOf('class="tierl"') >= 0) {
            fails.push('the sheet is back to two tiers — the record was mostly a reprint of the fold above it, which is what "the full record has the saem info as the section above" was about');
          }
          // A numbered leak is written out in ONE place. At its funnel stage
          // it is a POSITION MARKER: the first version of this assertion
          // counted a marker that renders twice either way and passed on a
          // build with the whole dedupe reverted — the
          // fixture-that-measures-nothing trap, found by the falsification run.
          // The mechanism itself is what gets asserted now.
          {
            const _dupPage = mod.html([mod.rec({ ...LEAD, problemList: [{
              problem: 'DUPCHECK the only way in is a form', costs: 'DUPCOST a customer who is ready has to wait',
              moneyLine: 'DUPMONEY every one of those is a job', harm: 80, moneyRank: 1, leakRank: 1,
              pillar: 'LEAKING', funnelStage: 'door', id: 'form_only_no_booking', callOpener: 'DUPOPEN?' }] })], { title: 'T', at: 'now' });
            // A finding that is NOT numbered renders in the index above and
            // NOWHERE else. Reprinting it at its funnel stage is what made the
            // record "the saem info as the section above".
            const _rpPage = mod.html([mod.rec({ ...LEAD, problemList: [
              { problem: 'RANKEDROW the only way in is a form', harm: 80, moneyRank: 1, leakRank: 1, pillar: 'LEAKING', funnelStage: 'door', id: 'form_only_no_booking' },
              { problem: 'PLAINROW their pages repeat one promise', costs: 'a buyer sees no reason to pick them', harm: 50, pillar: 'LEAKING', funnelStage: 'door', id: 'undifferentiated' }] })], { title: 'T', at: 'now' });
            const _plain = (_rpPage.match(/PLAINROW/g) || []).length;
            if (_plain !== 1) {
              fails.push('a finding that is not one of the numbered three renders ' + _plain + ' times on one sheet, not once — the funnel is reprinting the index above it, which is exactly "the full record has the saem info as the section above"');
            }
            if (_dupPage.indexOf('written out in full above') < 0) {
              fails.push('a numbered leak prints in full at its funnel stage as well as on its card — the same finding twice on one sheet, the repetition the two-tier layout exists to remove');
            }
            for (const [mk, cap] of [['DUPCOST', 1], ['DUPMONEY', 1], ['DUPOPEN', 1]]) {
              const n = (_dupPage.match(new RegExp(mk, 'g')) || []).length;
              if (n > cap) fails.push('a numbered leak\'s ' + mk + ' renders ' + n + ' times on one sheet, not ' + cap);
            }
          }
          // The scoreboard, executed. A won item is suppressed by the finding
          // that would contradict it; a win on a DIFFERENT search survives.
          if (!mod.board) fails.push('scoreboardFor is not exposed for execution, so the ten-second read is unverified');
          else {
            const _bk = mod.board({ af: { booking: 'online_booking', https: true }, rows: [{ id: 'form_only_no_booking', problem: 'form only' }] });
            if (_bk.won.some(w => /book a time/.test(w.text))) {
              fails.push('the scoreboard claims the booking route works beside a finding that says it does not — the two columns contradict each other on one page');
            }
            // Leo Lantz: #1 for his named trade AND invisible for one service
            // page. Two true facts about two different searches. Suppressing
            // the win on the whole search GROUP would delete a real strength.
            const _rk = mod.board({ af: {}, rank: { found: true, rank: 1, scanned: 100, query: 'kitchen remodeling contractor in Glen Allen, VA' },
              rows: [{ id: 'service_invisibility', problem: 'a service page nobody finds', leakRank: 1 }] });
            if (!_rk.won.some(w => /#1 of 100/.test(w.text))) {
              fails.push('a top-three position is suppressed by a finding about a DIFFERENT search — the sheet loses the one strength that decides how the call opens');
            }
            // Round 109, Vin on the first live sheet: "this is cleaalry
            // reprtitive." The index printed the three numbered leaks VERBATIM
            // and the cards printed the identical sentences below it. The
            // column is now what is NOT already on a card — and nothing is
            // lost, because a finding is either on a card or in this list.
            const _idx = mod.board({ af: {}, rows: [
              { id: 'service_invisibility', problem: 'NUMBERED a service page nobody finds', leakRank: 1, pillar: 'INVISIBLE', funnelStage: 'found', harm: 90 },
              { id: 'long_form', problem: 'UNNUMBERED an eleven-field form', costs: 'people start and stop', pillar: 'LEAKING', funnelStage: 'door', harm: 60 }] });
            if (_idx.leaking.some(x => /NUMBERED a service page/.test(x.text))) {
              fails.push('the leaking column reprints a numbered leak that is written out in full a few centimetres below — the repetition Vin rejected on the first live sheet');
            }
            // The workmanship strip under the funnel owns the 'work' rows —
            // they are context, deliberately NOT a money leak, and listing one
            // in a column headed "leaking" is a reputation note sold as lost
            // revenue.
            const _wk = mod.board({ af: {}, rows: [
              { id: 'review_pain_pattern', problem: 'WORKROW quality complaints repeat', funnelStage: 'work', pillar: 'TAXED', harm: 50 },
              { id: 'long_form', problem: 'DOORROW an eleven-field form', funnelStage: 'door', pillar: 'LEAKING', harm: 60 }] });
            if (_wk.leaking.some(x => /WORKROW/.test(x.text))) {
              fails.push('the workmanship context row is listed as a money leak — the strip under the funnel owns it, and one home each is the rule');
            }
            if (!_wk.leaking.some(x => /DOORROW/.test(x.text))) fails.push('the work exclusion swallowed an ordinary staged finding');
            const _ar = mod.board({ af: {}, rows: [{ area: 'AREA_MARK', problem: 'a finding with no funnel stage at all', costs: 'its cost', harm: 40 }] });
            if (!_ar.leaking.some(x => /AREA_MARK/.test(String(x.area || '')))) {
              fails.push('a finding with no funnel stage loses its area label — it used to render under the funnel and that block was the reprint, so the index is its only home now');
            }
            if (!_idx.leaking.some(x => /UNNUMBERED an eleven-field form/.test(x.text))) {
              fails.push('a finding that is NOT one of the numbered leaks fell out of the index — that is a revenue signal with no home at all, which is the thing the owner said must never happen');
            }
            if (_idx.ranked !== 1) fails.push('the scoreboard does not report how many leaks are written out below, so its own column heading cannot say so');
            const _abs = mod.board({ af: {}, rank: { found: false }, rows: [{ id: 'absent_from_search', problem: 'not in the results' }] });
            if (_abs.won.some(w => /#/.test(w.text))) fails.push('a position renders as a win on a lead with no position');
            // Every won item must carry its takeaway: the whole point of the
            // column is that a rep knows what NOT to sell against.
            const _full = mod.board({ af: { booking: 'online_booking', liveChat: true, https: true, analytics: true, formFields: 3 },
              reviews: { count: 132, rating: 5, replies: 78, read: 78 }, rows: [] });
            if (!_full.won.length || _full.won.some(w => !w.so)) {
              fails.push('a won item renders with no takeaway — a bare measurement is the "speaking in code" complaint this round exists to fix');
            }
            if (_full.won.length > 6) fails.push('the won column is unbounded — a wall of green is the same unreadable page in a different colour');
          }
          // The takeaway is built in the SAME branch as the value it explains.
          const _sog = mod.sig('door', { af: { booking: 'form' }, rows: [] }).rows.find(r => /Booking route/.test(r.label));
          if (!_sog || !_sog.so) fails.push('a measured signal row carries no takeaway — the value is on the sheet and what it means for the call is not');
          const _sob = mod.sig('door', { af: { booking: 'online_booking' }, rows: [] }).rows.find(r => /Booking route/.test(r.label));
          if (!_sob || _sob.so === (_sog && _sog.so)) fails.push('two opposite booking measurements produce the same takeaway — the so-what is keyed on the label rather than written in the branch that produced the value');
          if (page.indexOf('class="sgso"') < 0) fails.push('the signal takeaways never reach the exported sheet');
          // The call sites, because a check that does not assert its call site
          // is half a check. Both surfaces must read the ONE builder.
          const _n108 = (...p) => p.join('');
          if (!src.includes(_n108('scoreboardFor({ af: af ', '|| {}'))) fails.push('the exported sheet no longer builds its scoreboard through scoreboardFor');
          if (!src.includes(_n108('scoreboardFor({ af: lead.', 'auditFacts'))) fails.push('the audit screen no longer builds its scoreboard through scoreboardFor');
          // ══ ROUND 109: NOTHING THE READER JUST READ IS PRINTED AGAIN ═════
          // Vin on the first live pair: "this is cleaalry reprtitive." Two
          // BURNING rungs are priced by one template, so leak 1 and leak 2
          // carried a word-for-word identical So-what and eight identical
          // opening words. Both are executed here, both directions.
          // Two sentences on purpose: with one, the head-trim that already
          // existed also returns '' and the fixture proves nothing — which is
          // what the falsification run reported.
          const _ML = 'A remodel runs $15k. Every click they pay for lands somewhere nothing happens.';
          if (mod.trim(_ML, _ML, 1, [_ML]) !== '') fails.push('two leaks priced by the same template print the identical So-what twice — a takeaway the reader has just read is not a takeaway');
          if (mod.trim('A different money line entirely.', _ML, 1, [_ML]) !== 'A different money line entirely.') fails.push('a leak with its own money line was eaten by the repeat check');
          const _L1 = "Google's ad code is on their homepage, and nothing on their homepage books a time";
          const _L2 = "Google's ad code is on their homepage, and nothing on any page we read counts whether a click ever became a call or a booked job";
          const _t2 = mod.trimLead(_L2, [_L1]);
          if (/^Google's ad code is on their homepage, and nothing on any page/.test(_t2)) fails.push('a leak card repeats the opening clause the card above it just stated — the eight identical words that made the pair read as padding');
          if (!/^Nothing on any page we read counts/.test(_t2)) fails.push('the repeated-clause trim did not leave a readable sentence behind');
          if (mod.trimLead(_L1, []) !== _L1) fails.push('the FIRST leak card lost its opening clause — there is nothing above it to repeat');
          if (mod.trimLead('A wholly different finding about their form, at some length.', [_L1]) !== 'A wholly different finding about their form, at some length.') fails.push('a leak with its own opening clause was trimmed against an unrelated one');
          // A trim that leaves a fragment is worse than the repetition. The
          // first version of this fixture had a 52-character remainder and so
          // exercised nothing — it went red on a correct build, which is how
          // it was caught.
          const _short = "Google's ad code is on their homepage, and nothing works";
          if (mod.trimLead(_short, [_L1]) !== _short) fails.push('the trim left a fragment shorter than a sentence instead of leaving the headline alone');
          const _ln = (src.match(new RegExp(_n108('trimRepeatedLead\\(x.', 'problem'), 'g')) || []).length;
          if (_ln !== 2) fails.push('trimRepeatedLead is called at ' + _ln + ' place(s), not both — one surface still repeats the clause the card above it stated');
          const _wn = (src.match(new RegExp(_n108('leakWhereFor\\(x, ', 'n\\)'), 'g')) || []).length;
          if (_wn !== 2) fails.push('leakWhereFor is called at ' + _wn + ' place(s), not both — one of the two surfaces has a leak card that no longer names where on the funnel it sits');
        }
        // ══ THE SAMPLE SIZE REACHES THE EXPORTED SHEET ═══════════════════
        // The export's own signal context passed r.reviewsRead from the day the
        // denominator was added and auditRecordFor never set it, so every
        // EXPORTED sheet said the sample size "was not recorded" while the
        // screen showed it. Computed, wired, dropped one line before use.
        {
          const _rr = mod.html([mod.rec({ ...LEAD, reviewsRead: 47, opsBuckets: [{ label: 'quotes take too long', mentions: 5 }] })], { title: 'T', at: 'now' });
          if (_rr.indexOf('of 47 reviews read') < 0) {
            fails.push('the review complaint reaches the sheet without the sample size it was read from — half a measurement, and the half that decides whether it is a pattern');
          }
          if (/was not recorded/.test(_rr)) fails.push('the sheet still reports the review sample size as unrecorded on a lead that carries it');
        }
      }
      // An empty run must produce nothing rather than an empty-looking file.
      try {
        const blank = mod.rec({});
        if (blank.company !== 'Unknown business') fails.push('a lead with no name breaks the export record');
      } catch (e) { fails.push('the export record throws on an empty lead: ' + e.message); }
    }
  }
}

// ══ 6b-4. THE AUDIT SCREEN IS EXECUTED, NOT READ ════════════════════════════
// LeadBriefing is the audit screen. Until 2026-08-24 nothing in this repo had
// ever run it — a throw anywhere in its tree takes the whole audit view down,
// which is a far worse failure than any one missing section. Executed with a
// recording React stub: the seven categories of the approved sheet must all
// render, askOnTheCall must appear exactly once (it moved from the selling
// block into The conversation — two homes is the drift this file records), and
// a null lead must return null rather than throw.
{
  const NEED = ['LeadBriefing', 'buildAuditRows', 'claimRisksOf', 'corpusWarningFor', 'leadHasAudit', 'adsFactsLabel', 'PILLAR_LABEL', 'PILLAR_PRODUCT', 'dedupeOwnWords', 'trimRepeatedJobValue', 'trimRepeatedLead', 'RISK_REASONS', 'replyLatencySay', 'websiteForReading', 'plainRisk', 'LAYER_PLAIN', 'layerPlain', 'groupAuditFindings', 'FUNNEL_STAGE_DEFS', 'PILLAR_TO_STAGE', 'normalizedLeakRows', 'groupByFunnelStage', 'FUNNEL_TAPER', 'funnelSegClip', 'funnelSegFill', 'WALK_TO_STAGE', 'walkTextsByStage', 'scoreSentence', 'SIGNAL_RUNGS', 'signalRowsFor', 'leakWhereFor', 'scoreboardFor'];
  const found = {};
  walk(ast, (n) => {
    if (n.type === 'VariableDeclarator' && n.id && NEED.includes(n.id.name) && n.init) {
      found[n.id.name] = 'const ' + n.id.name + ' = ' + src.slice(n.init.start, n.init.end) + ';';
    }
    if (n.type === 'FunctionDeclaration' && n.id && NEED.includes(n.id.name)) {
      found[n.id.name] = src.slice(n.start, n.end);
    }
  });
  const missing = NEED.filter(k => !found[k]);
  if (missing.length) {
    fails.push(`the audit screen cannot be verified: ${missing.join(', ')} not found at module scope`);
  } else {
    const texts = [];
    const ReactStub = { createElement: (type, props, ...kids) => {
      const flat = (a) => a.forEach(x => Array.isArray(x) ? flat(x) : (typeof x === 'string' || typeof x === 'number') && texts.push(String(x)));
      flat(kids);
      return { type, props, kids };
    } };
    let briefing = null;
    try {
      briefing = new Function('React', found.groupAuditFindings + '\n' + found.FUNNEL_STAGE_DEFS + '\n' + found.PILLAR_TO_STAGE + '\n' + found.normalizedLeakRows + '\n' + found.groupByFunnelStage + '\n' + found.FUNNEL_TAPER + '\n' + found.funnelSegClip + '\n' + found.funnelSegFill + '\n' + found.WALK_TO_STAGE + '\n' + found.walkTextsByStage + '\n' + found.scoreSentence + '\n' + found.SIGNAL_RUNGS + '\n' + found.signalRowsFor + '\n' + found.leakWhereFor + '\n' + found.scoreboardFor + '\n' + found.RISK_REASONS + '\n' + found.replyLatencySay + '\n' + found.websiteForReading + '\n' + found.plainRisk + '\n' + found.LAYER_PLAIN + '\n' + found.layerPlain + '\n' + found.adsFactsLabel + '\n' + found.PILLAR_LABEL + '\n' + found.PILLAR_PRODUCT + '\n' + found.dedupeOwnWords + '\n' + found.trimRepeatedJobValue + '\n' + found.trimRepeatedLead + '\n' + found.corpusWarningFor + '\n' + found.claimRisksOf + '\n' + found.leadHasAudit + '\n' + found.buildAuditRows + '\n' + found.LeadBriefing + '\nreturn LeadBriefing;')(ReactStub);
    } catch (e) { fails.push('the audit screen cannot be lifted: ' + e.message); }
    if (briefing) {
      const LEAD = {
        id: 'x1', name: 'Smith & Sons', website: 'https://smith.example',
        // verifiedCEO + a NAMELESS decisionMaker is the live no-resolver-hit
        // shape (Irwin's): the old render read lead.ownerName — a field that
        // exists nowhere — and printed an em-dash beside a resolved name.
        verifiedCEO: 'Jason Hicks', decisionMaker: { name: null, title: null },
        ownerNameEvidence: 'OWNER_EV_MARKER', email: 'info@x.example', phone: '2103613587',
        websiteScore: { checked: true, score: 8, basedOn: '5 of 6', graded: [] },
        funnelStory: { checked: true, stages: [{ id: 'money_out', label: 'Money out', text: 'SCREEN_WALK_MARKER.' }], measured: { found: true, door: false, after: false }, fixFirst: null },
        auditFacts: { ads: 'no', booking: 'online_booking', formFields: 4, campaignPages: 10, mobile: 'fine', https: true },
        opsBuckets: [{ label: 'quotes take too long', mentions: 5 }], reviewsNegativeUnanswered: 2,
        situationRead: { background: 'BG', headline: 'HL', read: 'RD', rows: [{ label: 'L', says: 'S' }],
          whatHeCaresAbout: 'C', whatHeNeeds: 'N', askOnTheCall: 'ASKQ_MARKER' },
        growthConstraint: { layer: 'MARKET', condition: 'c' },
        theOneThing: { layer: 'CONVERSION', diagnosis: 'DIAG', why: 'WHY', firstBrokenLink: 'CONVERSION', firstBrokenLinkWhy: 'FBLW', earnedButBlocked: true, frictionCount: 2, friction: ['F1', 'F2'], costliest: null },
        brainAudit: { originalFindings: [{ finding: 'OF', evidence: 'EV' }], _criticalFactCheck: ['CRIT'], _ladderFailed: null },
        problemList: [{ area: 'A', problem: 'PROB', costs: 'COSTS', harm: 80, moneyRank: 1, pillar: 'ROTTING', moneyLine: 'ML',
          id: 'no_recurring_offer', funnelStage: 'after', leakRank: 1, callOpener: 'OPENQ_MARKER', rankNote: 'RANKNOTE_MARKER' }],
        _claimRisks: ['RISK1'],
        subject: 'SUBJ', pitch: 'PITCHTEXT',
        generatedResult: { prospectSim: { reason: 'My jobs come from referrals and reviews, the website does nothing for me at all.' } },
      };
      let threw = '';
      try { briefing({ lead: LEAD }); } catch (e) { threw = e.message; }
      if (threw) {
        fails.push('the audit screen THROWS on a normal audited lead: ' + threw + ' — an exception here blanks the whole audit view');
      } else {
        const joined = texts.join('|');
        // The funnel layout (Vin, 2026-08-24): the story is the one narrator,
        // the funnel replaces the money/one-thing/smaller-leaks trio, and the
        // numbered leaks render AT their stages.
        if (joined.indexOf('RANKNOTE_MARKER') < 0) fails.push('the rank-causation note never reaches the audit screen \u2014 the sheet prints two review counts with nothing stopping the reviews-decide-rank misreading');
        for (const label of ['Not sendable as written', 'Who to talk to', 'The story', 'The funnel', 'The conversation',
          'The email led with', 'He will likely say', 'Also worth asking', 'Do not say',
          'The sell', "What's working, what's leaking", 'The biggest leaks']) {
          if (joined.indexOf(label) < 0) fails.push('the audit screen no longer renders "' + label + '" — a category of the approved funnel layout is dark');
        }
        for (const gone of ['The money', 'The one thing', 'The smaller leaks', 'For the call', 'The full record']) {
          if (joined.indexOf(gone) >= 0) fails.push('"' + gone + '" is back on the audit screen — its content lives at the funnel stages now, and a second copy is the exact repetition Vin flagged');
        }
        if (joined.indexOf('Jason Hicks') < 0) fails.push('the resolved contact name does not render under Who to talk to — the screen is back on the phantom lead.ownerName field, which exists nowhere and printed an em-dash beside shane.irwin@ on a live sheet');
        if (joined.indexOf('OWNER_EV_MARKER') < 0) fails.push('the code-checked owner-name evidence never reaches the screen');
        const askCount = texts.filter(t => t === 'ASKQ_MARKER').length;
        if (askCount !== 1) fails.push('askOnTheCall renders ' + askCount + ' time(s) on the audit screen, not once — it belongs in The conversation and nowhere else, or the two copies drift');
        // Round 108: on its own leak card, exactly once. Twice means the card
        // and the call block are both printing it.
        const _opCount = texts.filter(t => String(t).indexOf('OPENQ_MARKER') >= 0).length;
        if (_opCount < 1) fails.push("a numbered leak's conversation opener never reaches the audit screen — the three starts Vin asked for are dark");
        if (_opCount > 1) fails.push('the leak opener renders ' + _opCount + ' times on the screen — the leak card and the call block are printing the same question');
        if (joined.indexOf('Open with') < 0) fails.push('the leak card lost its Open-with label, so the question is not attached to the finding it belongs to');
        // ══ ROUND 108: the screen carries the SAME two tiers as the sheet ══
        // A rep and the person who built the audit must be reading one
        // document in two places. The recording stub captures text in
        // createElement order, which is source order for children — so the
        // order of these labels IS the order of the page.
        {
          // EXACT, not substring: a renamed section ("The conversationX")
          // still contains the old label, and the substring form stayed green
          // through exactly that revert.
          const _ix = (t) => texts.findIndex(x => String(x).trim() === t);
          // THE SAME list the sheet is checked against, with the escaped
          // fragment expanded — the screen's text is not HTML.
          const o = SHEET_ORDER.map(t => _ix(t === 's working, what' ? "What's working, what's leaking" : t));
          for (let k = 0; k < o.length; k++) {
            if (o[k] < 0) { fails.push('the audit screen no longer renders "' + SHEET_ORDER[k] + '" — the sheet has it and the screen does not, so the two are no longer one document'); break; }
            if (k && o[k] <= o[k - 1]) { fails.push('the audit screen renders "' + SHEET_ORDER[k] + '" before "' + SHEET_ORDER[k - 1] + '" — it no longer matches the order of the exported sheet'); break; }
          }
          if (joined.indexOf('So what') < 0) fails.push("a leak card on the screen carries no So-what line — the takeaway Vin asked for is missing from the surface he reads");
          if (joined.indexOf('ML') < 0) fails.push('the leak money line never reaches the screen leak card');
          if (joined.indexOf('do not sell against this') < 0) fails.push("the screen lost the won column — a rep cannot tell what NOT to sell against");
          // A numbered leak is written out ONCE. Its cost line used to print at
          // the card, at its funnel stage and in the leak list all at once.
          const _costN = texts.filter(t => String(t).indexOf('COSTS') >= 0).length;
          if (_costN > 2) fails.push("a numbered leak's cost line renders " + _costN + ' times on the screen — the repetition the two-tier layout exists to remove');
        }
        if (joined.indexOf('a visitor can book a time on the site') < 0) fails.push('the signal rows are not lined up at their funnel stages on the screen (the booking read never renders at the door)');
        // The walk's measured sentence renders at its stage ON THE SCREEN —
        // the export fixture cannot see the screen's separate wiring. HONEST
        // LIMIT: the recording stub captures text at createElement time, so it
        // sees an element CREATED and cannot see whether it was mounted — the
        // falsified regression is the creation being deleted, which is how the
        // feature would really be lost.
        if (joined.indexOf('SCREEN_WALK_MARKER') < 0) fails.push("the walk's measured evidence line never reaches the screen's funnel stage — the export shows it and the screen does not");
        // The one-sentence score verdict replaced the chips block on screen.
        if (!/build is fine|leaks are in the path around it/.test(joined)) fails.push('the one-sentence score verdict is missing from the screen — the chips block was removed and nothing replaced it');
        // No grey text on the audit SCREEN either — enforced on the lifted
        // source because the recording stub cannot see styles. var(--m) and
        // var(--m2) are the app's grey text tokens; the briefing may not use
        // them for text. (Non-color uses would trip this too, which is
        // accepted: the briefing has none and a new one deserves a look.)
        if (/var\(--m2?\)/.test(found.LeadBriefing || '')) {
          fails.push('grey text is back on the audit screen (var(--m) inside LeadBriefing) — the owner asked for white text with hierarchy from size and weight only');
        }
      }
      try {
        if (briefing({ lead: null }) !== null) fails.push('the audit screen does not return null for a null lead');
      } catch (e) { fails.push('the audit screen throws on a null lead: ' + e.message); }
    }
  }
}

// ══ 6d. THE BOARD — the one place that decides which tab a lead is on ═══════
// Vin, 2026-08-25: "i ran irwin and it didnt pop up in the audited seciton."
// Irwin WAS in the old sidebar — under Audited, which rendered below the whole
// not-audited section. The board replaces buried sections with tabs, and
// boardStatusFor/boardRowsFor are executed here because the old section
// filters lived inline in the render where nothing could run them.
{
  const NEEDB = ['boardStatusFor', 'boardRowsFor', 'phaseLabelFor', 'leadHasAudit', 'normalizedLeakRows'];
  const foundB = {};
  walk(ast, (n) => {
    if (n.type === 'VariableDeclarator' && n.id && NEEDB.includes(n.id.name) && n.init) {
      foundB[n.id.name] = 'const ' + n.id.name + ' = ' + src.slice(n.init.start, n.init.end) + ';';
    }
  });
  const missingB = NEEDB.filter(k => !foundB[k]);
  if (missingB.length) {
    fails.push('the board cannot be verified: ' + missingB.join(', ') + ' not found at module scope');
  } else {
    let modB = null;
    try {
      modB = new Function('PHASE_LABEL', foundB.leadHasAudit + '\n' + foundB.normalizedLeakRows + '\n' + foundB.phaseLabelFor + '\n' + foundB.boardStatusFor + '\n' + foundB.boardRowsFor
        + '\nreturn { status: boardStatusFor, rows: boardRowsFor, phase: phaseLabelFor };')({ queued: 'waiting for a worker', running: 'working', dead: 'finishing' });
    } catch (e) { fails.push('the board functions no longer compile standalone: ' + e.message); }
    if (modB) {
      const AUD = { id: 'a', name: "Irwin's Septic", icpScore: 81, problemList: [{ id: 'x', leakRank: 1, problem: 'Every job ends at the invoice' }], researchedAt: '2026-08-25T14:00:00Z' };
      const RUN = { id: 'b', name: 'A Team Garage Doors', icpScore: 79, problemList: [{ id: 'y' }] };
      const NEW = { id: 'c', name: 'Honda Of Fife', icpScore: 76 };
      const QUE = { id: 'd', name: 'CCM Overhead Doors', icpScore: 75 };
      const ctx = { isRunning: (l) => l.id === 'b', queuedNames: new Set(['CCM Overhead Doors']) };
      // Within Audited the FRESHEST audit leads. Live 2026-08-25: a 3-lead run
      // finished and the new audits sat buried under a week of stale
      // higher-score rows — "it needs to filter the just completed audit to
      // the top of the list." An older audit with a HIGHER score must lose.
      {
        const OLD_HI = { id: 'o1', name: 'Stale High Scorer', icpScore: 97, problemList: [{ id: 'z1' }], researchedAt: '2026-08-18T10:00:00Z' };
        const FRESH_LO = { id: 'f1', name: 'Fresh Low Scorer', icpScore: 88, problemList: [{ id: 'z2' }], researchedAt: '2026-08-25T21:00:00Z' };
        const fb = modB.rows([OLD_HI, FRESH_LO], { isRunning: () => false, queuedNames: new Set() });
        const audOrder = fb.rows.filter(r => r.status === 'audited').map(r => r.id);
        if (audOrder[0] !== 'f1') fails.push('a just-finished audit still sits below a stale higher-score row in the Audited tab — the operator scrolls past a week of old audits to find the run that just ended');
      }
      // The way BACK to the board. The "All leads" button sets the selection
      // to null, and the lead-loading effect only handled the FOUND case, so
      // nothing ever cleared the open lead — the operator was trapped on the
      // audit screen with a back button that looked dead. The effect lives
      // inside a React component this harness cannot execute, so the branch
      // is pinned at its call site, needle assembled at runtime.
      {
        const _rn = (...p) => p.join('');
        if (src.indexOf(_rn('} else if (!lead', 'Id) {')) < 0 || src.indexOf(_rn('      setLead(', 'null);')) < 0) {
          fails.push('the null-selection branch is gone from the lead-loading effect — the "All leads" button strands the operator on the audit screen again');
        }
      }
      const bd = modB.rows([NEW, AUD, RUN, QUE], ctx);
      const by = {}; for (const r of bd.rows) by[r.id] = r;
      if (!by.a || by.a.status !== 'audited') fails.push('an audited lead does not land on the Audited tab — the exact burial Vin reported');
      if (!by.b || by.b.status !== 'running') fails.push('a running lead with an old audit is not shown as running — running must beat audited or a re-run looks finished');
      if (!by.d || by.d.status !== 'queued') fails.push('a queued lead is not shown as queued');
      if (!by.c || by.c.status !== 'not_audited') fails.push('a fresh lead is not on the Not-audited tab');
      if (!bd.rows.length || bd.rows[0].id !== 'b') fails.push('running leads do not sort first on the board');
      if (!by.a || by.a.leak1 !== 'Every job ends at the invoice') fails.push('leak 1 does not reach the board row');
      const cts = bd.counts || {};
      if (cts.all !== 4 || cts.auditing !== 2 || cts.audited !== 1 || cts.notAudited !== 1) fails.push('the board counts are wrong: ' + JSON.stringify(cts));
      if (modB.phase('queued') !== 'waiting for a worker') fails.push('the queued phase does not translate for a person');
      if (modB.phase('reading their reviews') !== 'reading their reviews') fails.push('a real milestone label is rewritten instead of shown');
    }
    // Call sites — a fixture supplies its own arguments and cannot see them.
    const _bn = (...p) => p.join('');
    for (const [what, needle] of [
      ['the board never renders — boardRowsFor has no call site', _bn('const bd = boardRowsFor(', '_pool, _ctx);')],
      ['the way back from the audit to the board is gone', _bn('onSelectLead && onSelectLead(', 'null)')],
      ["the batch no longer reports each lead's live status to the bar", _bn("onStatus: (stx) => report({ phase: 'lead-status'", ', lead, leadPhase: stx.phase, workedMs: stx.workedMs })')],
      ['the poll loop no longer hands the phase outward — the milestones are computed and never delivered', _bn('if (typeof o.onStatus === ', "'function') { try { o.onStatus({ phase: st.phase || 'running', workedMs }); }")],
      ['the search box is destructive again — Export-all while a search is typed exports only the matches', _bn('onChange: e => setSearchQ(', 'e.target.value)')],
    ]) {
      if (!src.includes(needle)) fails.push(what);
    }
  }
}

// ══ 6c. THE SEND MUST CARRY BOTH SEQUENCES AND STAMP WHICH ONE FIRED ════════
// Rotation is a settings entry; these are the three client wires that make it
// real. Each is a needle for a line that, missing, silently reverts the send
// path to one domain carrying every bounce.
{
  for (const [what, needle] of [
    ['the send call no longer passes both sequences, so the server can only ever use the first domain',
      'sequenceIds: [settings.hunterSequenceId, settings.hunterSequenceId2].filter(Boolean)'],
    ['the sent snapshot no longer records which sequence carried the email, so a bounce cannot be charged to the domain that earned it',
      'sentVia: s.sentVia'],
    ['the outcome sync no longer reads the second sequence, so every lead sent through it sits at "no outcome" forever',
      '[settings && settings.hunterSequenceId, settings && settings.hunterSequenceId2].filter(Boolean)'],
  ]) {
    if (src.indexOf(needle) < 0) fails.push(what);
  }
}

// ══ THE SUPABASE ROUND TRIP, EXECUTED ═══════════════════════════════════════
// leadToRow and rowToLead are the ONLY door between Supabase and the app, and
// nothing in this repo had ever run them. They have produced nine duplicate-key
// collisions, each silently blanking data that had just loaded correctly, and
// on 2026-08-21 four more persistence defects at once:
//
//   · a lead added from Find took the short branch of a ternary and lost every
//     Find-time measurement on save - placeId included, which is what locates
//     their Google reviews
//   · problemList was written unconditionally as [], which is truthy, so after
//     one reload every never-researched lead read as AUDITED: filed under
//     Audited in the sidebar, pre-ticked in the export, and exported to Mike as
//     a call sheet with nothing on it
//   · the research-time email template outranked the model-written draft, so
//     the draft and its provenance were replaced on every reload
//   · the call outcome had no key at all, so the same conversation could be
//     logged twice into the only evidence this project will ever have
//
// A source scan cannot see any of these. This runs the real pair.
{
  const NEEDR = ['leadToRow', 'rowToLead', 'persistedFieldsFrom', 'persistedHasAnything',
                 'composedEmailFrom', 'leadHasAudit', 'pickSituationRead'];
  const gotR = {};
  walk(ast, (n) => {
    if (n.type === 'VariableDeclarator' && n.id && NEEDR.includes(n.id.name) && n.init) {
      gotR[n.id.name] = 'const ' + n.id.name + ' = ' + src.slice(n.init.start, n.init.end) + ';';
    }
    if (n.type === 'FunctionDeclaration' && n.id && NEEDR.includes(n.id.name)) {
      gotR[n.id.name] = src.slice(n.start, n.end);
    }
  });
  const missR = NEEDR.filter(k => !gotR[k]);
  if (missR.length) {
    fails.push(`the Supabase round trip cannot be verified: ${missR.join(', ')} not found at module scope. A check that cannot reach the code cannot guard it, and this pair is the only door between the app and its data.`);
  } else {
    let rt = null;
    try {
      rt = new Function(NEEDR.map(k => gotR[k]).join('\n')
        + '\nreturn { toRow: leadToRow, toLead: rowToLead, audited: leadHasAudit, persisted: persistedFieldsFrom };')();
    } catch (e) {
      fails.push('the Supabase round trip no longer compiles standalone, so it cannot be verified: ' + e.message);
    }
    if (rt) {
      const trip = (lead) => rt.toLead(rt.toRow(lead));

      // ── 0. WRITTEN AND NEVER READ BACK ─────────────────────────────────
      // The storage half of "computed but not passed", and it has the same
      // signature: the write succeeds, the log is clean, and the value is gone
      // on the next load. Six fields were in this state on 2026-08-21 -
      // marketsSeen, marketsAbsent, marketCount, noWebsite, builderSite and
      // leadChannel - all six written here, all six read by the research
      // request builder, not one of them read back. The coverage-gap finding
      // could not exist on a re-run at all.
      //
      // Both directions, like STEM_COMPLETE_WORDS: a name that stops being
      // written cannot sit in the exception list looking checked.
      {
        const WRITE_ONLY = {
          // The nested audit copy. leadToRow's own comment says nothing reads
          // either back; it exists so a reload-then-save cannot stack a fresh
          // copy per cycle.
          brainAudit: 'a storage artefact, not a field - nothing has ever read it back',
        };
        const pKeys = Object.keys(rt.persisted({ id: 'k' }) || {});
        if (pKeys.length < 50) {
          fails.push(`persistedFieldsFrom produced only ${pKeys.length} keys, so this sweep is looking at almost nothing`);
        }
        const neverRead = pKeys.filter(k => !WRITE_ONLY[k] && src.indexOf('_persisted.' + k) < 0);
        if (neverRead.length) {
          fails.push(`${neverRead.length} field(s) are written to Supabase and never read back - ${neverRead.join(', ')}. The save succeeds, the log is clean, and the value is gone on the next load, which is how the coverage table stopped being recoverable on a re-run.`);
        }
        const staleExceptions = Object.keys(WRITE_ONLY).filter(k => !pKeys.includes(k));
        if (staleExceptions.length) {
          fails.push(`${staleExceptions.join(', ')} is declared write-only and is not written at all any more - an exception nobody can see is how a list stops meaning anything`);
        }
      }

      // ── 1. A LEAD STRAIGHT OUT OF FIND, NEVER RESEARCHED ───────────────
      // leadFromCompany sets these and no brainAudit. They are the inputs to
      // research, so losing them means paying for a worse audit than the one
      // we could have had.
      const findLead = {
        id: 'find-1', name: 'Twin Pines Roofing', website: 'http://twinpines.example',
        placeId: 'ChIJ_test_place_id', industry: 'roofing contractor',
        reviewCount: 214, rating: 4.6, buyingLane: 'call',
        marketsSeen: ['Dallas, TX'], marketsAbsent: ['Plano, TX'],
        reachPredict: 0.71, jobPostedAt: '2026-08-01T00:00:00Z', icpProfile: 'CREW_TRADE',
      };
      const findBack = trip(findLead);
      for (const k of ['placeId', 'industry', 'reviewCount', 'rating', 'buyingLane', 'reachPredict']) {
        if (JSON.stringify(findBack[k]) !== JSON.stringify(findLead[k])) {
          fails.push(`a lead added from Find loses ${k} on save (${JSON.stringify(findBack[k])} came back for ${JSON.stringify(findLead[k])}) — that is the state every lead is in at the moment we decide to pay to research it`);
        }
      }
      if (!Array.isArray(findBack.marketsSeen) || findBack.marketsSeen[0] !== 'Dallas, TX') {
        fails.push('the multi-market coverage a Find run measured for free does not survive a save, and nothing downstream can recover it');
      }

      // ── 2. AND IT IS NOT AUDITED ───────────────────────────────────────
      if (rt.audited(findBack)) {
        fails.push('a lead nobody has researched reads as AUDITED after one round trip — it is filed under Audited in the sidebar, pre-ticked in the export screen, counted in "Export N audits", and handed to Mike as a call sheet with nothing on it');
      }
      if (rt.audited({ id: 'x' })) fails.push('a bare lead object reads as audited');
      if (!rt.audited({ id: 'x', problemList: [{ id: 'no_offer' }] })) {
        fails.push('a lead with a measured problem list does NOT read as audited, so real audits would vanish from the export');
      }
      if (!rt.audited({ id: 'x', brainAudit: { pitchAngle: 'something the brain wrote' } })) {
        fails.push('a lead carrying a written audit does NOT read as audited');
      }
      if (rt.audited({ id: 'x', brainAudit: { _persisted: { placeId: 'p' } } })) {
        fails.push('storage is being read as an audit — _persisted is where Find-time fields live and it exists on every saved lead');
      }

      // ── 3. THE MODEL'S DRAFT BEATS THE RESEARCH-TIME TEMPLATE ──────────
      const written = { variantA: { subject: 'S', body: 'the model wrote this', writtenBy: 'brain' }, brainWriter: { wrote: true } };
      const template = { variantA: { subject: 'S1', body: 'assembled at research time' } };
      const emailBack = trip({
        id: 'e-1', name: 'Co', composedEmail: written,
        brainAudit: { pitchAngle: 'p', composedEmail: template },
      });
      const gotBody = emailBack.composedEmail && emailBack.composedEmail.variantA && emailBack.composedEmail.variantA.body;
      if (gotBody !== 'the model wrote this') {
        fails.push(`the draft that survives a reload is "${gotBody}" — the research-time template, not what the writer actually produced. The provenance caption goes with it, and pressing Generate afterwards recomposes from the template.`);
      }
      // And a lead that never had a writer keeps the template rather than nothing.
      const tmplOnly = trip({ id: 'e-2', name: 'Co', brainAudit: { pitchAngle: 'p', composedEmail: template } });
      if (!tmplOnly.composedEmail) {
        fails.push('a lead whose email was only ever composed at research time comes back with no email at all');
      }

      // ── 4. THE CALL LOG ────────────────────────────────────────────────
      const callBack = trip({ id: 'c-1', name: 'Co', brainAudit: { pitchAngle: 'p' },
                              callOutcome: 'reached', callOutcomeAt: '2026-08-21T18:00:00Z' });
      if (callBack.callOutcome !== 'reached' || !callBack.callOutcomeAt) {
        fails.push('the call outcome does not survive a reload, so the button reads empty again and the same conversation is logged twice — and the server stamps a fresh id per POST with no dedupe');
      }

      // ── 5. AN EMPTY LEAD STILL STORES NOTHING ──────────────────────────
      // A _persisted block per lead whatever it holds is write-only bloat, and
      // this file has a 13.87MB PostgREST failure behind that kind of growth.
      const bareRow = rt.toRow({ id: 'z', name: 'Nothing Co' });
      if (bareRow.brain_audit !== null) {
        fails.push('a lead with nothing measured still writes a storage block, which is the row growth behind the documented 13.87MB PostgREST failure');
      }
      roundTrip = { fields: Object.keys(rt.persisted({ id: 'k' }) || {}).length };
    }
  }
}

// Assertions that need an await. Settled before the report is printed, so a
// green line can never appear ahead of a failure it does not know about yet.
const PENDING = [];

// ══ AN UNREADABLE CLOUD IS NOT AN EMPTY ONE ══════════════════════════════
// sbLoadLeads returned null for both, and boot answers null by pushing the
// whole local cache up as a first seed. On a genuinely empty table that is
// right; on a read that FAILED it writes this browser's stale copy over every
// row the cloud actually has, last write wins, and an audit done on another
// machine is gone. It is the one failure in this file that cannot be undone
// from the browser.
{
  let sbSrc = null;
  walk(ast, (n) => {
    if (n.type === 'VariableDeclarator' && n.id && n.id.name === 'sbLoadLeads' && n.init) {
      sbSrc = 'const sbLoadLeads = ' + src.slice(n.init.start, n.init.end) + ';';
    }
  });
  if (!sbSrc) {
    fails.push('sbLoadLeads is not a module-scope function any more, so the empty-versus-unreadable distinction cannot be verified');
  } else {
    const mk = (answer) => new Function('sbFetch', 'rowToLead',
      sbSrc + '\nreturn sbLoadLeads;')(async () => answer, (r) => ({ id: r.id }));
    PENDING.push((async () => {
      const failed = await mk(null)();
      const empty = await mk([])();
      const full = await mk([{ id: 'a' }])();
      if (failed !== null) fails.push('a failed read no longer reports itself as unreadable, so boot will seed the local cache over whatever the cloud holds');
      if (!Array.isArray(empty) || empty.length !== 0) fails.push(`a genuinely empty table came back as ${JSON.stringify(empty)} rather than [] - boot cannot tell it apart from a failure and the first seed never happens`);
      if (!Array.isArray(full) || full.length !== 1) fails.push('a normal read is broken');
      // And boot must act on the difference rather than on truthiness.
      const N = (...p) => p.join('');
      const bare = src.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
      if (bare.indexOf(N('cloudLeads === null ? [] : getLe', 'ads().filter')) < 0) {
        fails.push('boot seeds from a read it could not make - the whole local cache is pushed over the cloud whenever Supabase does not answer');
      }
      if (bare.indexOf(N('window._sbSyncEnabled = cloudLeads !', '== null;')) < 0) {
        fails.push('writes stay enabled while the cloud is unreadable, so every save this session is a blind upsert over rows nobody read');
      }
      // ══ PAGES, NOT ONE STATEMENT — executed both ways ════════════════════
      // Live 2026-08-25: one 500-row read died on Postgres 57014 "statement
      // timeout" (each lead row now carries the whole audit), the screen read
      // as "the leads disappeared", and only the null-guard above kept the
      // session from seeding over the cloud. The read is keyset-paginated now;
      // these fixtures prove (a) pages are walked and ASSEMBLED, (b) the walk
      // is keyset (id=gt.<last>), and (c) a page that fails MID-WALK returns
      // null for the whole load — a partial list served as the truth would
      // mark every unread cloud lead a stale local relic and drop it.
      const _rowsA = Array.from({ length: 40 }, (_, i) => ({ id: 'a' + String(i).padStart(2, '0') }));
      const _rowsB = [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }];
      const _paths = [];
      const _pageFetch = async (path) => {
        _paths.push(String(path));
        if (String(path).indexOf('id=gt.') < 0) return _rowsA;
        if (String(path).indexOf('id=gt.a39') >= 0) return _rowsB;
        return [];
      };
      const _paged = await (new Function('sbFetch', 'rowToLead', sbSrc + '\nreturn sbLoadLeads;')(_pageFetch, (r) => ({ id: r.id })))();
      if (!Array.isArray(_paged) || _paged.length !== 43) {
        fails.push('the leads read is not paginated (or pages are not assembled): a 43-row cloud came back as ' + (Array.isArray(_paged) ? _paged.length : _paged) + ' — one full-table statement is what died with 57014 on launch night');
      }
      if (!_paths.some(pth => pth.indexOf('id=gt.a39') >= 0)) {
        fails.push('the second page is not requested by keyset (id=gt.<last>) — offset pages re-sort under concurrent writes and rows shift between pages');
      }
      const _midFail = await (new Function('sbFetch', 'rowToLead', sbSrc + '\nreturn sbLoadLeads;')(async (path) => (String(path).indexOf('id=gt.') < 0 ? _rowsA : null), (r) => ({ id: r.id })))();
      if (_midFail !== null) {
        fails.push('a page that fails MID-WALK returns a PARTIAL list as the truth — every cloud lead on the unread pages would be dropped as a stale local relic, which is worse than no read at all');
      }
    })());
  }
}

// ══ A SAME-TAB WRITE MUST REACH THE SIDEBAR ══════════════════════════════
// Live 2026-08-25: the sidebar read "0 LEADS" over a 202-lead pipeline. It
// synced from the in-memory store only on mount and on the browser 'storage'
// event — which fires in OTHER tabs only, and never at all once the pipeline
// outgrows localStorage and the cache switches off. The boot's cloud load
// lands AFTER the sidebar first draws, so memory updated and no view heard.
// The one writer (setLeadsMem) now announces 'cj-leads-changed' in this tab
// and the sidebar listens. Needles assembled at runtime, both halves real.
{
  const N2 = (...p) => p.join('');
  const bare2 = src.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  if (bare2.indexOf(N2("window.dispatchEvent(new Event('cj-le", "ads-changed'))")) < 0) {
    fails.push("setLeadsMem no longer announces same-tab lead changes — with the cache off, a reload draws an empty sidebar over a full pipeline until the user pokes the search box");
  }
  if (bare2.indexOf(N2("window.addEventListener('cj-leads-cha", "nged', sync)")) < 0) {
    fails.push("the sidebar no longer listens for same-tab lead changes — the boot's cloud load updates memory and the list never redraws");
  }
}

// ══ A DEDUPED JOB MUST BE ABOUT THIS BUSINESS ════════════════════════════
// The server hands back an in-flight job rather than paying for a second run of
// the same business. The client polls by ID either way, so if that dedupe ever
// matches the wrong business this lead receives another company's audit — the
// worst bug this system has had, through a different door.
{
  const N = (...p) => p.join('');
  const bare = src.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  if (bare.indexOf(N('if (_sub.deduped && _sub.company && body', ' && body.company')) < 0) {
    fails.push('a deduped research job is collected without checking which business it is running for, so another company\'s audit can land on this lead');
  }
}

// ══ WHAT THE BULK CONTROLS SPEND ON ═══════════════════════════════════════
// Two defects on the path Vin uses every morning, both invisible to any test
// that does not read the call site. Needles assembled at runtime with comment
// lines stripped: a literal needle finds itself, and both comments quote the
// broken lines.
{
  const N = (...p) => p.join('');
  const bare = src.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  if (bare.indexOf(N('saveLeads([...existing, ...add', 'ed], added);')) < 0) {
    fails.push('moving companies from Find to the pipeline no longer pushes every lead to Supabase - it used to hand saveLeads the LAST one, so fifty moved and one was saved, and the other forty-nine existed only in that browser tab');
  }
  if (bare.indexOf(N('inflight: getInflightJobs(), pick', 'edIds: batchPick });')) < 0) {
    fails.push("startBatch no longer passes the operator's ticked leads - the board ticks decorate and the batch still pre-chooses");
  }
  if (bare.indexOf(N('checked: batchPick.has(', 'r.id),')) < 0) {
    fails.push('the board rows lost their tick box - there is no way to hand-pick a batch again');
  }
  if (bare.indexOf(N('const _batchPool = getLe', 'ads();')) < 0
      || bare.indexOf(N('batchCandidates(_batchP', 'ool, { limit: batchSize')) < 0) {
    fails.push('the bulk panel counts a different pool from the one startBatch spends on - it read allLeads, which the Search box above it REPLACES with a filtered subset, so typing three letters made the button say "3 ready" and then audit fifty');
  }
}

// 7. AND EVERY MERGE GOES THROUGH IT. A second call site that assembles the
// lead by hand is the same defect as a second research body, one stage later.
{
  let merges = 0;
  walk(ast, (n) => {
    if (n.type === 'CallExpression' && n.callee && n.callee.name === 'applyResearchResult') merges++;
  });
  if (!merges) fails.push('nothing calls applyResearchResult — the merge exists but the research path is applying results some other way');
}

// ══ THE HANDSHAKE CONSTANTS MUST BE EQUAL IN THE REPO ═══════════════════════
// The server sends CONTRACT_VERSION in every research response and the client
// compares it against CLIENT_CONTRACT to warn about a stale Netlify deploy.
// In the repo the two must be EQUAL — they may only differ in the wild,
// between a merge and the drag-in, which is the window the warning exists
// for. A pair that drifts inside the repo makes the warning fire forever (or
// never), and either way it becomes a banner nobody believes.
{
  const _srv = (server.match(/const CONTRACT_VERSION = (\d+);/) || [])[1];
  const _cli = (src.match(/const CLIENT_CONTRACT = (\d+);/) || [])[1];
  if (!_srv) fails.push('server.js no longer declares CONTRACT_VERSION, so the client can never learn it is stale');
  else if (!_cli) fails.push('index.html no longer declares CLIENT_CONTRACT, so the stale-page warning can never fire');
  else if (_srv !== _cli) fails.push(`the handshake constants differ in the repo (server ${_srv}, client ${_cli}) — bump BOTH together, or the stale-page banner fires on a page that is not stale`);
  // Two CALL sites (the declaration is an arrow assignment, not a call). The
  // calls are typeof-guarded so batchcheck's lifted sandbox — which does not
  // carry the helper — can still execute the batch runner.
  const _warnCalls = (src.match(/warnIfStaleClient\(data/g) || []).length;
  if (_cli && _warnCalls < 2) fails.push('warnIfStaleClient is not called at both merge call sites, so the server can be newer and the page never says so');
}

// ══ THE TWO CLOCKS MUST NOT DISAGREE ACROSS THE NETWORK ═════════════════════
// The browser abandons a lead on its own budget. On 2026-08-22 the server's
// budget learned to exclude the lead's wait in our own Firecrawl gate and the
// browser's did not, which is the two-hand-kept-copies disease with the copies
// on different machines. The server now SENDS its budget; this asserts the
// browser reads it, and that the outer abort cannot fire before the server's
// own wall ceiling has had its say.
{
  if (!/Number\(st\.workBudgetMs\)/.test(src)) {
    fails.push('the poller no longer reads workBudgetMs off the server, so the browser is back to its own private copy of the research budget and abandons leads the server is still working on');
  }
  const _wallM = (server.match(/RESEARCH_WALL_CEILING_MS[^\n]*?\|\|\s*(\d+) \* 60 \* 1000/) || [])[1];
  const _abortM = (src.match(/setTimeout\(\(\) => _ac\.abort\(\), (\d+) \* 60 \* 1000\)/) || [])[1];
  if (!_wallM) fails.push('server.js no longer declares a wall ceiling in minutes, so nothing can check the browser against it');
  else if (!_abortM) fails.push('index.html no longer has a single outer abort timeout, so it cannot be checked against the server wall ceiling');
  // +5 is the stale sweep, which also has to have run before the browser gives up.
  else if (Number(_abortM) <= Number(_wallM) + 5) {
    fails.push(`the browser aborts after ${_abortM} minutes and the server works a lead for up to ${_wallM} (swept at ${Number(_wallM) + 5}) — the browser gives up first and throws away a whole paid research cycle`);
  }
}

// ══ AND THE BLIND BANNER MUST KNOW WHICH READ IT IS TALKING ABOUT ═══════════
// "We never read a single page of their website" sat above a confident
// description of the site's conversion path on CTR, live 2026-08-22. Both were
// true, of different reads: the page TEXT was empty and the page SOURCE was
// not. A reader handed a flat contradiction stops believing the whole sheet.
{
  if (!/homepageMarkupChars/.test(server)) {
    fails.push('the server no longer reports how much page SOURCE it read, so the blind banner is back to deciding from the text alone');
  }
  if (!/homepageMarkupChars/.test(src)) {
    fails.push('the blind banner no longer reads the markup measurement, so it says we read nothing on a lead whose forms, tags and booking route were all measured from the source');
  }
}

// ══ THE RETRY WINDOW MUST OUTLAST THE BOOT IT WAITS FOR ═════════════════════
// Render switches traffic to a new instance at port-open, a full minute before
// the boot checks settle, and every POST answers 503 {booting:true} in between.
// The 2026-08-23 deploy measured ~80 seconds of that window; the client retried
// for 60 and gave up right before the door opened, so a healthy deploy read as
// a failed run. The window is read from the code on BOTH sides rather than
// asserted as a constant, so slowing the boot or shrinking the retry fails here
// instead of on the next deploy.
{
  const m = /if \(submit\.status !== 503 \|\| _try >= (\d+)\) break;[\s\S]{0,600}?setTimeout\(r, (\d+)\)/.exec(src);
  if (!m) {
    fails.push('the boot-window submit retry is gone or reshaped, so a deploy makes every submit in its first minute fail as "research is broken"');
  } else {
    const windowMs = Number(m[1]) * Number(m[2]);
    if (windowMs < 150000) {
      fails.push(`the client retries a booting server for only ${Math.round(windowMs / 1000)}s, and the 2026-08-23 Render deploy took ~80s from traffic cutover to a settled verdict — the retry gives up before the door opens and a healthy deploy reads as a failed run`);
    }
  }
}

// ══ A KEY THE SERVER READS AND THE APP HAS NO FIELD FOR IS A DEAD SETTING ═══
// measureRealWorldSpeed read `req.body.keys.pageSpeedKey` from the day it was
// written. There has never been a pageSpeedKey field anywhere in index.html —
// not in Settings, not in the request builder. So the key was always empty, the
// call always returned {checked:false}, and Google's record of what real phones
// experienced on the prospect's site was dark on every lead of this project's
// life. Nothing said so, because an absent key is indistinguishable from an API
// that answered "no data" — and I documented it as a Settings field, twice,
// without ever looking. Vin found it by going to add it: "no where to add
// pagespeed api."
//
// This is the same class the whole file exists for — a value that is read in one
// place and supplied by nothing — pointed at CONFIGURATION rather than at
// measurements. It is checkable mechanically and it should never again depend on
// somebody noticing.
//
// The rule: every name the server destructures out of `req.body.keys` must
// either have a field on the Settings screen, or be resolvable from the server's
// own environment. Nothing may be read from a place that cannot be filled in.
{
  // What the server pulls out of the keys object, from every destructure and
  // every direct property read.
  // Comments stripped first. The first run of this check reported "Falls" as a
  // missing setting, off the prose "The model's own keys. Falls back to..." —
  // which is the needle-finds-its-own-comment trap this project records nine
  // times, and a check that cries wolf is the one somebody switches off.
  const serverCode = server.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  const wanted = new Set();
  for (const m of serverCode.matchAll(/(?:const|let)\s*\{([^}]*)\}\s*=\s*(?:req\.body\.)?keys\s*\|\|/g)) {
    for (const raw of m[1].split(',')) {
      const n = raw.split(':')[0].trim();
      if (!/^[A-Za-z_$][\w$]*$/.test(n)) continue;
      // A name destructured and then never used is a dead BINDING, not a
      // setting with nowhere to come from. Only a name the code actually reads
      // can be a missing key. (indeedKey and crunchbaseKey were exactly this.)
      const uses = (serverCode.match(new RegExp('\\b' + n + '\\b', 'g')) || []).length;
      if (uses > 1) wanted.add(n);
    }
  }
  // Only the explicit request path. `keys.size` on a Set inside a boot check is
  // a different `keys` entirely, and counting it would put a phantom in the list.
  for (const m of serverCode.matchAll(/req\.body\.keys(?:\s*&&\s*req\.body\.keys)?\s*\.\s*([A-Za-z_$][\w$]*)/g)) wanted.add(m[1]);

  // What the Settings screen actually offers. The fields are declared as a
  // descriptor array, so this reads `k: 'name'` rather than guessing from
  // variable names — guessing from the name is exactly how pageSpeedKey got
  // written down as a Settings field it never was.
  const offered = new Set([...html.matchAll(/\bk:\s*'([A-Za-z_$][\w$]*)'/g)].map(m => m[1]));
  // And what the client actually puts in a keys payload, which is a different
  // question: a field can exist on the screen and never be sent.
  const sent = new Set();
  for (const m of src.matchAll(/keys:\s*\{([\s\S]{0,1200}?)\n\s*\}/g)) {
    for (const km of m[1].matchAll(/\b([A-Za-z_$][\w$]*)\s*:/g)) sent.add(km[1]);
  }
  // Where each key comes from is DECLARED in server.js, not inferred. The first
  // version of this treated a key as satisfied when an environment variable of a
  // similar name appeared anywhere in the file — so reverting the PageSpeed fix
  // left it green, because the boot check that sets PAGESPEED_KEY still mentions
  // the name. A premise that is a name match is a check that passes vacuously.
  const decl = {};
  {
    const m = /const KEY_SOURCES = \{([\s\S]*?)\n\};/.exec(serverCode);
    if (m) for (const km of m[1].matchAll(/([A-Za-z_$][\w$]*)\s*:\s*'([^']+)'/g)) decl[km[1]] = km[2];
  }
  if (!Object.keys(decl).length) {
    fails.push('server.js no longer declares KEY_SOURCES, so there is nothing saying where each API key is supposed to come from and this check can only guess');
  }

  // The declaration is the authority for WHICH keys exist; the scan above is
  // what catches a key that is read and never declared. Checking only the
  // scanned set left the original defect green: after the fix the key is
  // resolved inside a helper, so `req.body.keys.pageSpeedKey` no longer appears
  // literally and the key fell out of the scan entirely — the check reported a
  // clean pass while not looking at it at all.
  const every = new Set([...wanted, ...Object.keys(decl)]);
  const dead = [];
  for (const k of every) {
    const from = decl[k];
    if (!from) {
      dead.push(`${k} (no row in KEY_SOURCES — nobody has said where this key is supposed to come from)`);
      continue;
    }
    if (from.startsWith('env:')) {
      // The boot EXECUTES the resolver for these; all this side can check is
      // that the variable is real and that the app is not also being asked for it.
      if (!new RegExp('process\\.env\\.' + from.slice(4) + '\\b').test(serverCode)) {
        dead.push(`${k} (declared as ${from} and server.js never reads that variable)`);
      }
      continue;
    }
    if (!offered.has(k)) dead.push(`${k} (declared as a client key and there is no Settings field to fill it)`);
    else if (!sent.has(k)) dead.push(`${k} (a Settings field exists but no request payload sends it)`);
  }
  if (dead.length) {
    fails.push(`the server reads ${dead.length} key(s) out of req.body.keys that the app cannot supply: ${dead.join('; ')}. A key with nowhere to come from is silently empty forever, and the measurement behind it reads as "the API had nothing" rather than as "we never asked"`);
  } else if (every.size < 8) {
    fails.push(`only ${every.size} API key(s) could be resolved between the scan and KEY_SOURCES, so this check is not looking at the real set`);
  } else {
    const envN = [...every].filter(k => (decl[k] || '').startsWith('env:')).length;
    notes.push(`\u2713 config: all ${every.size} API key(s) this server consumes have a declared source \u2014 ${every.size - envN} with a Settings field the app actually sends, ${envN} resolved from the server's own environment and EXECUTED at boot. pageSpeedKey was read for the life of this project with no field anywhere, and no way to tell an empty key from an API with no data.`);
  }
}

{
  // ══ ROUND 99: the caption describes the ADDRESS ══════════════════════════
  // Axiom's sheet rendered an em-dash for the email with "Pattern-built, not
  // confirmed" beneath it — a confidence note about an address that does not
  // exist. Needles assembled at runtime, both halves real.
  const _n99 = (...p) => p.join('');
  if (html.indexOf(_n99('const emailNote = (lead.emailResult && ', 'email)')) < 0) {
    fails.push('the email caption no longer requires an address — a confidence note about a missing address reads as a measurement');
  }
  if (html.indexOf(_n99('No usable address', ' found')) < 0) {
    fails.push('the no-address state lost its honest caption');
  }
  // and a ticked audited lead IS the re-run intent (batchcheck executes the
  // behaviour; this pins the one-line decision at its site).
  if (html.indexOf(_n99('const includeDone = !!opts.includeResearched || ', '!!picked;')) < 0) {
    fails.push('a ticked audited lead needs the re-audit checkbox again — the multi-re-run flow dies back to one-at-a-time');
  }
  // == THE COMPLAINT AND ITS DENOMINATOR TRAVEL TOGETHER, BOTH WAYS =========
  // The browser seeds last run's pain signals into the research body. It sent
  // the strings and not the sample size, so the server held a complaint with
  // no denominator - and a live card printed "nobody responds (5 mentions)"
  // one line under "After they reach out — NOT MEASURED". They are one
  // measurement; sending one without the other is the defect.
  if (builderKeys.indexOf('publicPainSignals') >= 0 && builderKeys.indexOf('reviewsRead') < 0) {
    fails.push('the request builder seeds last run’s pain signals without the sample size behind them — the server then holds a complaint it is not licensed to state anything about');
  }
  // The three-state stage label, on BOTH surfaces. A stage we looked at but
  // could not say enough about is neither "no fault found" nor "not measured".
  // TWO surfaces render this, so ONE occurrence means a surface lost it.
  // Reverting the export alone left this green while the needle only asked
  // "does it appear anywhere" - the shared-needle trap, found by falsifying.
  const _thinUses = html.split(_n99("(s3.status === 'clean' && fThin[s3.id] ", '=== true)')).length - 1;
  if (_thinUses < 2) {
    fails.push(`only ${_thinUses} of the two surfaces still renders the partly-measured state — a thin read is a verdict again on the other one`);
  }
  for (const [what, needle] of [
    ['the exported sheet', _n99('const fThin = (r.funnelStory && r.funnelStory.thin)', ' || {};')],
    ['the screen own read of it', _n99('const fThin = (lead.funnelStory && lead.funnelStory.thin)', ' || {};')],
  ]) {
    if (html.indexOf(needle) < 0) fails.push(`${what} lost the partly-measured state — a thin read renders as a verdict again`);
  }
  // == ONE DISPLAY FORM FOR THE WEBSITE, EXECUTED =========================
  // The Contact block and the export record each built their own. A junior
  // rep reading "https://www.acme.com/" on one sheet and "acme.com" on the
  // other reads two facts. Executed on the real function, then pinned at
  // BOTH call sites - a fixture supplies its own arguments and therefore
  // cannot see a caller.
  for (const [what, needle] of [
    ['the export record', _n99('website: websiteFor', 'Reading(l),')],
    ['the contact block', _n99("L('Website', websiteFor", 'Reading(lead),')],
  ]) {
    if (html.indexOf(needle) < 0) fails.push(`${what} builds its own website display form again — two spellings of one fact on one sheet`);
  }
  // And the chip must carry what it rests on.
  if (html.indexOf(_n99("? ' of ' + rr + ", "' reviews read'")) < 0) {
    fails.push('the top-complaint chip no longer states its denominator — a mention count with no sample behind it is half a measurement');
  }
}

// ══ THE FIND-TAB CONTACT LIST, EXECUTED ═════════════════════════════════════
// This is the standing goal made into a file: fifty leads a day with an owner,
// an email, a phone number and a score. Every rule below is RUN, because the
// one CSV writer that existed before this had no formula-injection guard and
// the confidence caption it derives by regex is exactly the shape that
// collapses four different states into one sentence.
let contactStat = null;
let contactTally = null;
{
  const NEED2 = ['contactTabOf', 'CONTACT_TABS', 'findCsvCell', 'FIND_CSV_CTRL', 'FIND_CSV_COLUMNS', 'findContactRows', 'findContactCsv', 'findSheetPayload',
                 'contactFieldsFrom', 'contactRequestBody', 'contactYesNo', 'hasContactData',
                 // A contact read stamps the build that produced it, so the panel
                 // can say which rows predate a parser fix instead of re-exporting
                 // them forever. contactFieldsFrom reads the constant directly.
                 'CLIENT_CONTRACT',
                 // The CSV's affordability column reads the same labeller the card
                 // reads, so it has to be lifted with it.
                 'AFFORD_LABEL', 'affordLabel',
                 // The run tally - the first thing in this project that has ever
                 // counted whether the owner resolver and the email engine work.
                 'findRunTally', 'findTallyLine',
                 // The column CHOICE. Twenty-one columns were being deleted by
                 // hand after every paste, so the lean set is the default and
                 // the full set is a tick box - and both destinations have to
                 // read the same chooser or the CSV and the sheet drift.
                 'FIND_CSV_ESSENTIAL', 'findCsvColumns', 'FIND_SHEET_SCRIPT',
                 // Round 105: the view state, the run id, the export stamp and the
                 // resolved-domain provenance are pure so they can be executed here.
                 'FIND_VIEW_DEFAULTS', 'mergeFindView', 'latestRunIdOf', 'stampExportedRows', 'exportedCell', 'websiteProvenanceCell',
                 // A front-desk mailbox is kept on the sheet and marked, and the
                 // resolver's source ids are said the way a rep would say them.
                 'GENERIC_MAILBOX_RE', 'isGenericMailbox', 'OWNER_SOURCE_PLAIN'];
  const got2 = {};
  walk(ast, (n) => {
    if (n.type === 'VariableDeclarator' && n.id && NEED2.includes(n.id.name) && n.init) {
      got2[n.id.name] = 'const ' + n.id.name + ' = ' + src.slice(n.init.start, n.init.end) + ';';
    }
  });
  const miss2 = NEED2.filter(k => !got2[k]);
  if (miss2.length) {
    fails.push(`the contact list cannot be verified: ${miss2.join(', ')} not found at module scope — the whole 50-a-day goal is this file and it has to be runnable`);
  } else {
    let M = null;
    try {
      M = new Function(NEED2.map(k => got2[k]).join('\n')
        + '\nreturn { tabOf: contactTabOf, tabs: CONTACT_TABS, cell: findCsvCell, cols: FIND_CSV_COLUMNS, rows: findContactRows, csv: findContactCsv, sheet: findSheetPayload,'
        + ' lean: FIND_CSV_ESSENTIAL, pick: findCsvColumns,'
        + ' mergeView: mergeFindView, latestRun: latestRunIdOf, stamp: stampExportedRows, exportedCell, prov: websiteProvenanceCell,'
        + ' fields: contactFieldsFrom, body: contactRequestBody, yn: contactYesNo, has: hasContactData,'
        + ' tally: findRunTally, tallyLine: findTallyLine, script: FIND_SHEET_SCRIPT,'
        + ' generic: isGenericMailbox };')();
    } catch (e) {
      fails.push('the contact list no longer compiles standalone, so it cannot be verified: ' + e.message);
    }
    if (M) {
      const Q = String.fromCharCode(34);
      // ONE — formula injection. A cell beginning =, +, - or @ EXECUTES when
      // the file opens in Excel or Sheets, and every value here is a business
      // name scraped off an arbitrary web page, opened by a junior rep.
      for (const bad of ['=cmd|calc', '+1+1', '-2+3', '@SUM(A1)']) {
        if (M.cell(bad).indexOf(Q + "'") !== 0) fails.push(`the contact CSV does not neutralise a formula cell starting "${bad.slice(0, 3)}" — it opens as a live formula in Excel`);
      }
      // A guard that eats real data is the more expensive failure.
      if (M.cell('Smith & Sons') !== Q + 'Smith & Sons' + Q) fails.push('the contact CSV mangles an ordinary company name');
      if (M.cell('Say ' + Q + 'hi' + Q) !== Q + 'Say ' + Q + Q + 'hi' + Q + Q + Q) fails.push('the contact CSV does not double an embedded quote, so the row shape breaks');
      if (M.cell('a' + String.fromCharCode(0) + 'b') !== Q + 'ab' + Q) fails.push('the contact CSV lets a control character through, which corrupts every row after it');
      // A LINE BREAK INSIDE A CELL. Two columns carry prose - the score
      // explanation and the notes - and the row terminator is CRLF. RFC 4180
      // permits a newline inside quotes and plenty of readers do not, which is
      // a 4KB file that downloads and will not open. Live, 2026-08-28.
      if (/[\r\n]/.test(M.cell('one\ntwo'))) fails.push('a cell can still contain a line break, so the file has more rows than leads and a reader that does not honour quoted newlines opens nothing');
      // And the whole FILE, parsed: every row must have exactly as many cells
      // as the header. A count is what a spreadsheet actually does.
      {
        const _f = M.csv([
          { contactReadOk: true, name: 'A Co', contactEmail: 'a@a.com', contactIcpWhy: 'scored on 3 of 5 signals\nthe rest are left out', contactNotes: ['line one\r\nline two'] },
          { contactReadOk: true, name: 'B Co', contactOwner: 'Jo Blogs', contactNotes: ['plain'] },
        ]).replace(/^\uFEFF/, '');
        const _rows = _f.split('\r\n').filter(Boolean);
        if (_rows.length !== 3) fails.push(`the contact CSV produced ${_rows.length} row(s) for a header plus two leads - a cell is breaking the row structure`);
        const _cells = (r) => r.split('","').length;
        const _want = M.pick(false).length;
        for (const r of _rows) {
          if (_cells(r) !== _want) { fails.push(`a contact CSV row has ${_cells(r)} cells against ${_want} columns - the file will not open as a table`); break; }
        }
      }

      // ══ THE COLUMN CHOICE, AND THE THING IT NEARLY BROKE ═══════════════
      // Vin was deleting most of twenty-one columns after every paste, so the
      // default is the eight he asked for. Three properties, all executed:
      //   1. lean is genuinely fewer, and full is genuinely all of them;
      //   2. every essential KEY exists in the declared table - a key with no
      //      row would silently export a blank column under no heading;
      //   3. the CSV and the SHEET agree, because two destinations reading two
      //      column lists is how an operator gets a file he cannot reconcile.
      {
        const _lean = M.pick(false), _full = M.pick(true);
        if (_full.length !== M.cols.length) fails.push('the full CSV column set is no longer the whole declared table');
        if (_lean.length !== M.lean.length) {
          fails.push(`the lean CSV set produced ${_lean.length} column(s) for ${M.lean.length} declared key(s) - a key here does not exist in FIND_CSV_COLUMNS, so a column is silently missing`);
        }
        if (!(_lean.length < _full.length)) fails.push('the lean CSV set is not smaller than the full one, so the tick box changes nothing');
        const _co = [{ contactReadOk: true, name: 'A Co', contactOwner: 'Jo Blogs', contactEmail: 'a@a.com' }];
        const _h = (M.csv(_co, false).replace(/^\uFEFF/, '').split('\r\n')[0].match(/","/g) || []).length + 1;
        if (_h !== _lean.length) fails.push(`the lean CSV wrote ${_h} column(s) where the chooser says ${_lean.length} - findContactCsv is not reading the chooser`);
        if (M.sheet(_co, false).header.length !== _lean.length) fails.push('the Google Sheet export ignores the column choice, so the sheet and the CSV are two different files');
        if (M.sheet(_co, true).header.length !== _full.length) fails.push('the Google Sheet export cannot be asked for every column');
        // ══ THE APPS SCRIPT MUST NOT COUNT TO THREE ══════════════════════
        // It deduped on column 3 because 'company' was the third declared
        // column. In the lean set company is FIRST, so a hard-coded 3 would
        // have deduped a whole sheet against the decision-maker's name - and
        // the only thing holding the two in step was a comment, inside a
        // script pasted into a spreadsheet where nobody would look for it.
        const _script = String(M.script || '');
        if (_script && /getRange\(2,\s*3,/.test(_script)) fails.push('the Apps Script still dedupes on a hard-coded column 3, which is the decision-maker in the lean column set');
        if (_script && _script.indexOf("indexOf('Company')") < 0) fails.push('the Apps Script no longer finds the Company column from the header, so the column order and the dedupe can drift apart again');
      }

      // ══ ONE LEAD, ONE TAB ═════════════════════════════════════════════
      // Vin, with 80 of 80 read and no way forward: "i think we need a whole
      // format change becasue im getting confused." Three properties, all
      // executed, because the section filters this replaces lived inline in
      // the render where nothing could run them.
      {
        const _cases = [
          [{ name: 'Unread Co' }, 'unread'],
          [{ name: 'Read Co', contactReadOk: true }, 'read'],
          [{ name: 'Out Co', contactNotFit: true }, 'out'],
          // A READ LEAD RULED OUT IS STILL RULED OUT. The verdict is the
          // stronger fact: asking again cannot change it.
          [{ name: 'Both Co', contactReadOk: true, contactNotFit: true }, 'out'],
          // A FAILED READ IS NOT READ AND NOT RULED OUT. This is the one the
          // plan for the round got wrong, and it is the exact failure that
          // retired a hundred leads against a paused server: a dead server is
          // something that might work next time, so it has to come back.
          [{ name: 'Failed Co', contactFailedAt: Date.now(), contactNotes: ['no response'] }, 'unread'],
          [{ name: '' }, null],
        ];
        // ══ ROUND 105: THE FIND TAB REMEMBERS, AND NOTHING-TO-READ IS ITS OWN STATE ══
        {
          if (!M.tabs.some(t => t[0] === 'noread')) fails.push('the Nothing-to-read tab is gone, so a lead with no website and no listing has nowhere to go but back into the draw');
          if (M.tabOf({ name: 'x', contactUnreadable: true }) !== 'noread') fails.push('a lead the server said has nothing to read is not filed under Nothing to read, so it is drawn again on every press');
          if (M.tabOf({ name: 'x', contactUnreadable: true, contactNotFit: true }) !== 'out') fails.push('a verdict no longer beats the nothing-to-read state');
          // The export stamp: pure, over the whole queue, never a duplicate destination.
          const _st = M.stamp([{ name: 'A' }, { name: 'B', exportedTo: ['csv'] }], new Set(['B']), 'sheet', '2026-09-02T00:00:00Z');
          if (_st[0].exportedAt) fails.push('the export stamp touched a row that was not exported');
          if (_st[1].exportedAt !== '2026-09-02T00:00:00Z' || _st[1].exportedTo.join() !== 'csv,sheet') fails.push('the export stamp did not record when and where a row was handed out');
          if (M.stamp(_st, new Set(['B']), 'sheet', '2026-09-03T00:00:00Z')[1].exportedTo.join() !== 'csv,sheet') fails.push('a second export to the same place duplicates the destination');
          if (M.exportedCell({ exportedAt: '2026-09-02T10:00:00Z', exportedTo: ['csv'] }) !== '2026-09-02 to csv') fails.push('the exported cell does not say when and where');
          if (M.lean.indexOf('exported') < 0) fails.push('"exported" is not in the lean CSV, so the file a rep downloads cannot answer whether a row was already handed out');
          // The run survives a refresh: the newest run id in the data is the run.
          if (M.latestRun([{ contactRunId: 'run_1a' }, { contactRunId: 'run_zz' }, { contactRunId: 'bogus' }, {}]) !== 'run_zz') fails.push('the newest run id is not recovered from the data, so "the 10 you just read" dies on refresh');
          if (M.latestRun([]) !== '') fails.push('an empty queue yields a run id');
          // The view state: a saved key wins, an absent or null one keeps its default.
          if (M.mergeView({ verifiedOnly: false }).verifiedOnly !== false) fails.push('a saved "Show all" does not survive the merge, so a refresh silently narrows the queue again');
          if (M.mergeView({ verifiedOnly: false }).activeTab !== 'all') fails.push('an absent saved key lost its default');
          if (M.mergeView(null).verifiedOnly !== true || M.mergeView({ verifiedOnly: null }).verifiedOnly !== true) fails.push('a null saved key overrode its default');
          // Provenance for a domain WE found reaches the LEAN file, not only the full one.
          const _pr = [{ name: 'Acme Roofing', contactReadOk: true, contactOwner: 'Bob Acme', contactPhone: '5551234567',
                         contactWebsiteResolved: true, contactWebsite: 'https://acmeroofing.com', contactWebsiteConfirmed: true }];
          if (M.csv(_pr, false).indexOf('found by us') < 0) fails.push('the lean CSV carries an owner read off a domain we resolved with no word about where the domain came from');
          if (M.csv(_pr, true).indexOf('found by us from the name') < 0) fails.push('the full CSV website cell does not say the domain was resolved');
          if (M.prov({ contactWebsiteResolved: false }) !== '') fails.push('a published domain gets a provenance note it does not need');
        }
        const _keys = M.tabs.map(t => t[0]);
        if (_keys.join(',') !== 'unread,read,out,noread') fails.push('the contact tabs are no longer not-read / read / ruled-out / nothing-to-read, so the panel and this check disagree about what the tabs are');
        for (const [_c, _want] of _cases) {
          const _got = M.tabOf(_c);
          if (_got !== _want) fails.push(`a lead the panel calls "${_c.name || '(nameless)'}" lands in the ${_got} tab and belongs in ${_want}`);
          // Exactly one, or a lead is either invisible or counted twice.
          if (_want !== null && _keys.filter(k => M.tabOf(_c) === k).length !== 1) fails.push('a lead does not land in exactly one contact tab');
        }
      }

      // AND THE CALL SITES, because a fixture supplies its own arguments and
      // therefore cannot see a caller. Three wires, and the middle one is the
      // whole point: counting alone would leave "a read lead leaves the pool"
      // true of the numbers and false of the list.
      {
        const _need = [
          ['the panel no longer renders a tab per contact state', "CONTACT_TABS.map(([k, lab]) =>"],
          ['the rendered list is not filtered by the tab, so a read lead never leaves the pool on screen', "_cShown.filter(c => contactTabOf(c) === contactTab)"],
          ['the tab counts are not computed from the same pool the list is', "for (const c of _cShown) { const t = contactTabOf(c);"],
          ['the spending band is no longer confined to the not-read tab', "contactTab !== 'unread' ? null : _cUnread.length === 0 ? _band('Read',"],
        ];
        for (const [why, needle] of _need) if (src.indexOf(needle) < 0) fails.push(why);
      }

      // ══ A LEAD THE SERVER RULED OUT IS IN NO FILE ═════════════════════
      // Live on the 2026-09-01 run: Daniel Bortnick, MD was dropped as a branch
      // of a chain and his row was in the exported CSV, ICP 45, with the phone
      // number off his Google listing. hasContactData only asks whether there is
      // something to dial. The rule lives in findContactRows so the CSV and the
      // Google Sheet both inherit it rather than each carrying a copy.
      {
        const _dropped = { name: 'Chain Co', contactReadOk: true, contactNotFit: true,
          contactPhone: '+1 555 0199', contactIcp: 45 };
        const _good = { name: 'Real Co', contactReadOk: true, contactPhone: '+1 555 0100', contactIcp: 61 };
        const _co = M.rows([_dropped, _good]).map(r => r.company);
        if (_co.indexOf('Chain Co') >= 0) fails.push('a lead the server ruled out as a chain is still in the exported rows');
        if (_co.indexOf('Real Co') < 0) fails.push('a real read has been excluded from the export along with the chain drops');
        // A lead that was never read is not exportable either - the file is a
        // list of leads we actually looked at.
        if (M.rows([{ name: 'Never Read Co', contactPhone: '+1 555 0101' }]).length) {
          fails.push('a lead that was never read is in the exported rows');
        }
        if (M.sheet([_dropped, _good], false).rows.length !== 1) {
          fails.push('the Google Sheet export still carries the ruled-out lead, so the two destinations disagree');
        }
      }

      // ══ THE FOUR VALUES THE REQUEST NEVER CARRIED ═════════════════════
      // Each of these existed on the lead and was simply not sent, and each
      // one killed a whole mechanism on the server. Executed on the real
      // builder, because a fixture cannot see a request that is never made.
      {
        const _b = M.body({ name: 'A Co', website: 'https://a.example', placeId: 'ChIJ-test',
          outsideBand: true, aboveSizeCeiling: true }, { apifyToken: 'apify_x' });
        const _co = (_b && _b.company) || {}, _k = (_b && _b.keys) || {};
        if (_co.placeId !== 'ChIJ-test') {
          fails.push('the contact request does not send the place id, so the server cannot read who signs their Google review replies - the best free read of an owner-run shop owner');
        }
        if (_k.apifyToken !== 'apify_x') {
          fails.push('the contact request does not send the Apify token, so the review-reply owner source stays structurally unreachable');
        }
        if (_co.outsideBand !== true || _co.aboveSizeCeiling !== true) {
          fails.push('the contact request does not send what discovery already decided, so a demoted lead scores exactly like a clean one');
        }
        // A string is not a boolean, and a demotion is expensive enough that a
        // stray value must never spend it.
        const _s = M.body({ name: 'B Co', website: 'https://b.example', outsideBand: 'true' }, {});
        if ((_s.company || {}).outsideBand !== false) {
          fails.push('a non-boolean demotion flag is forwarded as true, so a stray string costs a good lead ten points');
        }
      }

      // Whether the chain read could LOOK has to reach the row. Without it a
      // site we failed to open renders exactly like a proven independent.
      {
        const _seen = M.fields({ signals: {}, notes: [], chain: { measured: true, isChain: false } });
        const _blind = M.fields({ signals: {}, notes: [], chain: { measured: false, isChain: false } });
        if (_seen.contactChainMeasured !== true || _blind.contactChainMeasured !== false) {
          fails.push('whether the chain read could look at all stops at the merge, so silence and a clean read land on the lead the same way');
        }
        const _r = M.rows([{ ..._blind, contactReadOk: true, name: 'C Co', contactPhone: '+1 555 0100' }])[0];
        if (!_r || !/not established/.test(String(_r.independence || ''))) {
          fails.push('a lead whose site we could not read exports no independence answer, so our blindness reads as a clean result');
        }
      }

      // ══ HOW SURE ARE WE THAT THIS IS HIM, AND CAN THE REP SEE IT ══════
      // The server grades the owner once. Every consumer must read THAT and
      // never re-decide, and the grade has to reach the CSV the rep dials
      // from - not just the screen.
      {
        const _mk = (g) => M.fields({ signals: {}, notes: [],
          owner: { name: 'John Smith', title: 'Owner', canBuy: g !== 'unconfirmed',
            grade: g, gradeWhy: 'because', askAs: g === 'confirmed'
              ? 'Confirmed - because. Ask for John.'
              : 'NOT confirmed - because. Ask for John; if he is not the owner, ask who is.' } });
        const _conf = _mk('confirmed'), _un = _mk('unconfirmed');
        if (_conf.contactOwnerGrade !== 'confirmed' || _un.contactOwnerGrade !== 'unconfirmed') {
          fails.push('the owner evidence grade stops at the merge, so a held-back name and a corroborated one land on the lead identically');
        }
        if (!_conf.contactOwnerAskAs || !_un.contactOwnerAskAs) {
          fails.push('the pivot sentence does not reach the lead, so the rep is told a name and not how sure we are of it');
        }
        // The CSV, which is the artefact he actually works from.
        const _rows = M.rows([{ ..._un, contactReadOk: true, name: 'A Co', contactPhone: '+1 555 0100' }]);
        if (!_rows.length || !/ask who is/.test(String(_rows[0].ownerHowSure || ''))) {
          fails.push('an unconfirmed owner reaches the CSV with no instruction to ask rather than assert');
        }
        if (M.lean.indexOf('ownerHowSure') < 0) {
          fails.push('how sure we are about the name is not one of the lean columns, so the file the rep dials from does not carry it');
        }
        if (M.lean.indexOf('emailConfidence') < 0) {
          fails.push('how sure we are about the address is not one of the lean columns');
        }
        // The card. A fixture cannot see a renderer, so the call site is pinned
        // with a needle assembled at runtime.
        const _nk = (a, b) => a + b;
        if (src.indexOf(_nk('co.contactOwnerGrade ===', " 'unconfirmed' ? '#fca5a5'")) < 0) {
          fails.push('the contact card no longer marks an unconfirmed owner, so the one row that needs a second question looks like every other');
        }
      }

      // ══ SIX EMAIL STATES REACH THE ROW, DECIDED ON THE SERVER ═════════
      {
        const _em = (g, say) => M.fields({ signals: {}, notes: [],
          email: { address: 'a@b.com', tier: 1, sendable: true, grade: g, gradeSay: say } });
        const _role = _em('published_role', 'Real and published, but a shared or recruiting inbox.');
        if (_role.contactEmailGrade !== 'published_role' || !_role.contactEmailGradeSay) {
          fails.push('the email confidence grade stops at the merge, so the client is back to deriving it by regex over a label');
        }
        const _r = M.rows([{ ..._role, contactReadOk: true, name: 'A Co' }])[0];
        if (!_r || !/recruiting inbox/.test(String(_r.emailConfidence || ''))) {
          fails.push("the server's own answer about an address does not reach the exported row");
        }
        // A row read by an OLDER build has no grade and must still say
        // something rather than going blank.
        const _old = M.rows([{ contactReadOk: true, name: 'B Co', contactEmail: 'a@b.com', contactEmailTier: 2 }])[0];
        if (!_old || !String(_old.emailConfidence || '').trim()) {
          fails.push('a lead read before the grade existed now exports an empty confidence cell rather than falling back to its tier');
        }
      }

      // ══ THE NUMBER THAT DECIDES EVERYTHING ════════════════════════════
      // repReady is the first count in this project of rows a rep can actually
      // pick up. A counter computed and never PRINTED is the exact defect this
      // round exists to close, so both are asserted.
      {
        // Every row carries a name because contactTabOf - the ONE membership
        // rule the tally, the tabs and the export now share - refuses a row
        // without one, and every real queue row has one.
        const _ready = { name: 'Acme', contactReadOk: true, contactOwner: 'A B', contactOwnerGrade: 'confirmed',
          contactEmail: 'a@b.com', contactEmailSendable: true, contactPhone: '5125550134' };
        const _t = M.tally([
          _ready, { ..._ready, name: 'B Co', contactOwnerGrade: 'stated' },
          { ..._ready, name: 'C Co', contactPhone: '' },              // no number to dial
          { ..._ready, name: 'D Co', contactEmailSendable: false },   // nothing that will deliver
          { ..._ready, name: 'E Co', contactOwnerGrade: 'unconfirmed' }, // a name we cannot stand behind
          { ..._ready, name: 'F Co', contactNotFit: true },           // the server ruled it out
        ]);
        // ══ A RULED-OUT LEAD IS NOT A READ ═══════════════════════════════
        // It used to be counted by the tally AND filed under Ruled out by the
        // tabs, so it sat inside "31 read of 31" and inside "Ruled out 4" and
        // in no exported file at all.
        if (_t.read !== 5) fails.push('the tally counts ' + _t.read + ' reads of a fixture with five reads and one lead the server ruled out, so the run total and the tabs describe different sets again');
        if (_t.repReady !== 2) fails.push('rep-ready counts ' + _t.repReady + ' of a fixture where exactly two rows are workable');
        if (!_t.pivotReady) fails.push('a lead with a phone and an unconfirmed name is counted as nothing, when the rep can still call and ask');
        // THREE of the six fixtures carry a confirmed owner that COUNTS: the
        // two that fail rep-ready on the phone and the address still have one,
        // and the ruled-out row's owner is deliberately no longer among them -
        // a lead the server refused is not a lead this run read, and its owner
        // does not belong in the run's own split. The property is that the
        // split accounts for every named owner it does count.
        if (_t.gConfirmed !== 3 || _t.gStated !== 1 || _t.gUnconfirmed !== 1) {
          fails.push(`the owner-grade split reads ${_t.gConfirmed}/${_t.gStated}/${_t.gUnconfirmed} against a fixture of 3/1/1`);
        }
        if (_t.gConfirmed + _t.gStated + _t.gInferred + _t.gUnconfirmed !== _t.owner) {
          fails.push('the owner-grade split does not add up to the owners counted, so some names are graded as nothing');
        }
        const _line = M.tallyLine(_t);
        if (!/ready to work/.test(_line)) {
          fails.push('the tally counts rep-ready rows and does not print them - a counter computed and never shown is the defect this round exists to close');
        }
        if (!/confirmed/.test(_line)) fails.push('the tally line does not report how many owners we actually stand behind');
        if (M.tally([]).repReady !== 0) fails.push('an empty run reports rep-ready rows');
      }

      // ══ THE WRONG-COMPANY STOP HAS A HOME ON THE SCREEN ═══════════════
      // quinnplasticsurgery.com served Surek Plastic Surgery's content on the
      // 2026-09-01 run and we read Chris Surek as Quinn's owner. The server
      // flags it; the flag has to reach a person.
      //
      // The wire is asserted at the MERGE and the render at its call site: the
      // note the server also pushes cannot carry this, because the notes line
      // renders only when there is no owner and no email, and this is exactly
      // the case where both exist and both may belong to another company. That
      // is the guard-in-the-wrong-place shape, and it was found before this
      // shipped by reading which branch the note lands in.
      {
        const _f = M.fields({ nameNotOnSite: true, signals: {}, notes: [] });
        if (!_f || _f.contactNameNotOnSite !== true) {
          fails.push('the wrong-company flag stops at the merge, so a lead whose pages name a different business ships unmarked');
        }
        const _g = M.fields({ signals: {}, notes: [] });
        if (!_g || _g.contactNameNotOnSite !== false) {
          fails.push('the wrong-company flag defaults to something other than false, so an ordinary lead can carry a stop nobody measured');
        }
        if (src.indexOf('co.contactNameNotOnSite === true') < 0) {
          fails.push('nothing on the contact card renders the wrong-company stop, so the flag is measured, carried and read by nobody');
        }
      }

      // ══ THE CALLING WINDOW REACHES THE ROW AND THE FILE ═══════════════
      // The motion for this list is calling. Two halves and both were broken:
      // the request builder never sent the published hours the server needs,
      // and there was no column for the answer. Both are asserted, because a
      // fixture that supplies its own arguments cannot see a caller.
      {
        const _b = M.body({ name: 'A Co', website: 'https://a.example',
          publishedHours: { checked: true, lines: ['Monday: 7:00 AM - 5:00 PM'] } }, {});
        const _ph = _b && _b.company && _b.company.publishedHours;
        if (!_ph || !Array.isArray(_ph.lines) || _ph.lines.length !== 1) {
          fails.push('the contact request no longer sends the published hours, so the server can compute neither a calling window nor the staffed half of the affordability band');
        }
        if (M.lean.indexOf('callWindow') < 0) fails.push('the calling window is not one of the lean CSV columns, so the file the rep dials from does not carry it');
        const _r = M.rows([{ contactReadOk: true, name: 'A Co', contactPhone: '+1 555 0100', contactCallWindow: 'Try 7-8am, before jobs start.' }])[0];
        if (!_r || _r.callWindow !== 'Try 7-8am, before jobs start.') fails.push('the server calling window does not reach the exported row');
        // A listing with no hours gets an EMPTY cell, never a guess. An
        // invented "any time is fine" is the unmeasured-as-measured class on
        // the one field a caller acts on directly.
        const _r2 = M.rows([{ contactReadOk: true, name: 'B Co', contactPhone: '+1 555 0101' }])[0];
        if (!_r2 || _r2.callWindow !== '') fails.push('a lead whose listing publishes no hours is given a calling window anyway');
      }

      // TWO — the ORDER, with the trap that matters. A MEASURED zero must sort
      // ABOVE an unscored lead: Number(null) is 0 and Number.isFinite(0) is
      // true, so a naive `x || 0` puts a business we never scored level with
      // one we scored zero, and a confident 0 reads as "we checked and it is
      // bad". The unscored lead is named first alphabetically on purpose, so
      // the tiebreak cannot rescue a broken comparator.
      const ord = M.rows([
        { contactReadOk: true, name: 'Aaa Unscored', contactEmail: 'a@a.com' },
        { contactReadOk: true, name: 'Zed Measured Zero', contactEmail: 'z@z.com', contactIcp: 0 },
        { contactReadOk: true, name: 'Mid Co', contactEmail: 'm@m.com', contactIcp: 55 },
      ]).map(r => r.company).join(',');
      if (ord !== 'Mid Co,Zed Measured Zero,Aaa Unscored') {
        fails.push(`the contact list is not ranked highest-first with UNSCORED last: ${ord} — an unscored lead is being treated as a measured zero`);
      }

      // THREE — the email confidence. Four materially different states, read
      // from the TIER and never from prose that happens to contain the word
      // "verified". A catch-all domain delivers and the RECIPIENT is unknown;
      // a pattern guess is a bounce risk charged to the sending domain.
      const say = (t) => M.rows([{ contactReadOk: true, name: 'X', contactEmail: 'a@b.com', contactEmailTier: t, contactEmailSendable: t <= 3 }])[0];
      const s1 = say(1), s2 = say(2), s3 = say(3), s4 = say(4);
      if (new Set([s1.emailConfidence, s2.emailConfidence, s3.emailConfidence, s4.emailConfidence]).size !== 4) {
        fails.push('two different email tiers get the same confidence sentence in the contact CSV, which is the defect the audit captions already have');
      }
      if (s4.emailSafeToSend.indexOf('NO') !== 0) fails.push('a tier-4 address does not report as unsafe to send, and the row reads like any other');
      if (M.rows([{ contactReadOk: true, name: 'X', contactOwner: 'A B' }])[0].emailConfidence !== '') fails.push('a lead with no address still carries an email-confidence sentence');

      // FOUR — the three-state answers. "no" about a thing we never looked at
      // is the unmeasured-as-zero failure wearing a tick box.
      if (M.yn(null, 'yes', 'no') !== 'not checked') fails.push('contactYesNo reports an unmeasured signal as a definite answer');
      if (M.yn(undefined, 'yes', 'no') !== 'not checked' || M.yn(0, 'yes', 'no') !== 'not checked') fails.push('contactYesNo laundered a non-boolean into a definite answer');
      const blind = M.rows([{ contactReadOk: true, name: 'X', contactEmail: 'a@b.com' }])[0];
      if (blind.payingForAds !== 'not checked' || blind.hiringMarketing !== 'not checked' || blind.teamSize !== 'not published') {
        fails.push('a lead whose site could not be read reports definite NOs for ads, hiring and team size — that is a claim about their business made from our own blindness');
      }

      // FOUR-b — A FRONT-DESK MAILBOX SAYS SO, AND A REAL ONE DOES NOT.
      // Vin's decision: keep it on the sheet, mark it clearly. The tier already
      // distinguishes it internally; the row never said it in words a rep reads
      // at a glance, so a caller opened with the owner's first name into a
      // mailbox the office manager reads first.
      for (const g of ['info@x.com', 'office@x.com', 'sales-team@x.com', 'no-reply@x.com', 'Contact@X.com']) {
        if (!M.generic(g)) fails.push(`"${g}" is not marked as a shared front-desk mailbox, so a rep opens with the owner's name into an inbox somebody else reads`);
      }
      // A guard that eats real addresses is the more expensive failure: a name
      // that merely CONTAINS one of these words is a person's mailbox.
      for (const r of ['dave@x.com', 'infosystems@x.com', 'billsales@x.com', 'j.helms@x.com', 'teamers@x.com']) {
        if (M.generic(r)) fails.push(`"${r}" is being called a shared mailbox, so a real personal address is marked as a front desk and the rep opens the wrong way`);
      }
      {
        const _rows = M.rows([
          { name: 'A Co', contactReadOk: true, contactEmail: 'info@a.com', contactOwner: 'Dana Reed' },
          { name: 'B Co', contactReadOk: true, contactEmail: 'dana@b.com', contactOwner: 'Dana Reed' },
        ]);
        if (!/front-desk/i.test(String(_rows[0].emailGoesTo || ''))) fails.push('the row does not say a published address is a shared front-desk mailbox');
        if (/front-desk/i.test(String(_rows[1].emailGoesTo || ''))) fails.push('a personal address is described as a front-desk mailbox on the row');
      }

      // FOUR-c — THREE FIELDS COMPUTED ON EVERY READ AND RENDERED NOWHERE.
      // contactOwnerSources, contactAdsWhy and the phone check were all
      // measured, stored, and read by nothing at all - the recorded
      // computed-but-not-passed class, three instances in one artefact.
      {
        const _r = M.rows([{
          name: 'C Co', contactReadOk: true,
          contactOwner: 'Dana Reed', contactOwnerSources: ['own_website_brain', 'business_name'],
          contactAdsCode: null, contactAdsWhy: 'a tag container could be hiding a tag we cannot see',
          contactPhone: '555-0100', contactPhoneOnSite: false,
        }])[0];
        if (!/own website/i.test(String(_r.ownerFrom || ''))) fails.push('the row does not say WHERE the owner was found, so a name read off a team page and one a model proposed look identical to the rep saying it out loud');
        if (!/tag container/i.test(String(_r.adsWhy || ''))) fails.push('the four phrasings behind the ads yes-or-no are still rendered nowhere, including the one that says a container could be hiding a tag');
        if (!/worth confirming/i.test(String(_r.phoneOnSite || ''))) fails.push('the row does not say their own site never printed this number, so an unchecked number reads exactly like a confirmed one');
        const _un = M.rows([{ name: 'D Co', contactReadOk: true, contactPhone: '555-0100' }])[0];
        if (String(_un.phoneOnSite || '') !== 'not checked') fails.push('a number nobody checked against their site is reported as agreeing or disagreeing rather than as unchecked');
      }

      // FIVE — the merge from the server. null must SURVIVE as null.
      const f = M.fields({ signals: { adsCode: null, teamCount: null, hiringAny: null, hiringMarketing: null }, icp: {}, owner: {}, email: {} });
      if (f.contactAdsCode !== null || f.contactTeamCount !== null || f.contactHiring !== null || f.contactHiringMarketing !== null) {
        fails.push('contactFieldsFrom converts an unmeasured signal into false or zero on the way onto the lead');
      }
      if (M.fields({ icp: {}, owner: {}, email: {}, signals: {} }).contactReadOk !== true) {
        fails.push('a real server answer does not set the read flag, so a lead that WAS read comes back into the next press and is paid for twice');
      }
      const f2 = M.fields({ signals: { adsCode: false, teamCount: 0, hiringAny: false }, icp: { score: 0 }, owner: {}, email: {} });
      if (f2.contactAdsCode !== false || f2.contactTeamCount !== 0 || f2.contactIcp !== 0) {
        fails.push('contactFieldsFrom throws away a genuine measured false or zero, which is the same defect pointed the other way');
      }

      // ══ THE DENOMINATOR TRAVELS, AND IT BREAKS THE TIE ═══════════════
      // The score is a percentage of what could be MEASURED, so a lead scored
      // on three signals and one scored on seven are divided by different
      // totals - and the bare number is what sorts this list. Without the
      // denominator a thin read outranks a full one and nothing says why.
      const fD = M.fields({ signals: {}, owner: {}, email: {}, icp: { score: 61, measured: 4, of: 7, why: 'scored on 4 of 7' } });
      if (fD.contactIcpMeasured !== 4 || fD.contactIcpOf !== 7) {
        fails.push('the number of signals behind a contact score is dropped on the way onto the lead, so the sort and the card cannot tell a thin read from a full one');
      }

      // SIX — the request the server actually reads. A field dropped here is a
      // signal measured for nothing: the review count and the rating are two
      // of the five terms in the score.
      const b = M.body({ name: 'X Co', website: 'https://x.com', phone: '555', reviewCount: 40, rating: 4.6, location: 'Denver, CO', industry: 'roofer' },
        { apiKey: 'k1', firecrawlKey: 'k2', verifierKey: 'k3' });
      for (const k of ['name', 'website', 'phone', 'location', 'industry', 'reviewCount', 'rating']) {
        if (b.company[k] === undefined || b.company[k] === null || b.company[k] === '') fails.push(`the contact request drops ${k}, so the server cannot use it`);
      }
      if (!b.keys.anthropicKey) fails.push('the contact request does not send the Anthropic key, so every lead is refused at preflight');
      if (M.body({ name: 'X', reviewCount: '40' }, {}).company.reviewCount !== null) fails.push('the contact request sends a review count that is not a number, which the score then treats as a measurement');
      // ══ THE PAID OWNER LOOKUP DEFAULTS ON ══════════════════════════════
      // The free stage of the owner ladder settles about half of leads and
      // this list is dialled AND emailed, so the paid stage is the default and
      // OFF is a Settings choice. The direction of the default is the whole
      // point: a browser that has never written the setting must still buy the
      // owner, because an absent setting means "nobody has chosen", never
      // "they asked us to save money". Both directions executed.
      if (M.body({ name: 'X' }, {}).paidOwnerLookup !== true) fails.push('an unset Settings switch stops the Find list buying the paid owner lookup, so a fresh browser silently gets no decision-maker on half the rows');
      if (M.body({ name: 'X' }, { findPaidOwner: true }).paidOwnerLookup !== true) fails.push('the paid owner lookup does not travel when it is switched ON');
      if (M.body({ name: 'X' }, { findPaidOwner: false }).paidOwnerLookup !== false) fails.push('switching the paid owner lookup OFF in Settings does not reach the server, so the operator cannot stop the spend');

      // SEVEN — the file shape. One header, one row per lead, and a BOM,
      // without which Excel reads it as Latin-1 and mangles every accented name.
      const csv = M.csv([{ contactReadOk: true, name: 'A', contactEmail: 'a@a.com' }, { contactReadOk: true, name: 'B', contactPhone: '555' }]);
      if (csv.charCodeAt(0) !== 0xFEFF) fails.push('the contact CSV has no byte-order mark, so Excel mangles every accented name in it');
      const lines = csv.replace(/^﻿/, '').split('\r\n');
      if (lines.length !== 4 || lines[3] !== '') fails.push(`the contact CSV emitted ${lines.length} line(s) for two leads plus a header`);
      if (lines[0].split('","').length !== M.pick(false).length) fails.push('the contact CSV header does not have one cell per column the caller asked for');
      // "rank"/"score" means a SEARCH POSITION nearly everywhere else in this
      // app, so the column has to say which one it is.
      const head = (M.cols.find(c => c[0] === 'icp') || [])[1] || '';
      if (!/not a google position/i.test(head)) fails.push('the ICP column does not say it is NOT a Google position, and every other use of "score" here is a search position');
      // The team column must never read as a headcount: it is a floor.
      const teamHead = (M.cols.find(c => c[0] === 'teamSize') || [])[1] || '';
      if (!/floor/i.test(teamHead)) fails.push('the team-size column reads as a headcount rather than as a floor, and it is the closest thing on the row to the revenue band the whole ICP is defined by');

      // SEVEN-B — THE GOOGLE SHEET IS THE SAME LIST, SOMEWHERE ELSE.
      // The sheet and the CSV must never be two shapes of one list: an operator
      // handed a sheet that disagrees with the file has no way to tell which is
      // right. So the payload is asserted against the SAME builder - same row
      // count, same column count, same header text, same order.
      {
        const _leads = [
          { name: 'Alpha Co', contactEmail: 'a@a.com', contactIcp: 71, contactOwner: 'Jo Blogs' },
          { name: 'Beta Co', contactPhone: '(317) 555-0134', contactIcp: 12,
            contactIcpWhy: 'scored on 3 of 5 signals\nthe rest are left out' },
        ];
        // Asked for EVERY column, so this block keeps testing the widest shape.
        const _p = M.sheet(_leads, true);
        const _r = M.rows(_leads);
        if (!_p || !Array.isArray(_p.header) || !Array.isArray(_p.rows)) {
          fails.push('the Google Sheet payload is not a header plus rows, so the export script has nothing to append');
        } else {
          if (_p.header.length !== M.cols.length) fails.push('the sheet header does not have one entry per declared column');
          if (_p.header.join('|') !== M.cols.map(c => String(c[1])).join('|')) {
            fails.push('the sheet header is not the declared column names in declared order, so the sheet and the CSV would disagree about what each column is');
          }
          if (_p.rows.length !== _r.length) fails.push(`the sheet got ${_p.rows.length} row(s) where the CSV builder produced ${_r.length} — they are not the same list`);
          for (const row of _p.rows) {
            if (row.length !== M.cols.length) { fails.push(`a sheet row has ${row.length} cell(s) against ${M.cols.length} columns`); break; }
            if (row.some(v => typeof v !== 'string')) { fails.push('a sheet cell is not a string, so Sheets would coerce it however it likes'); break; }
            if (row.some(v => /[\r\n]/.test(v))) { fails.push('a sheet cell still carries a line break — the same defect that made the CSV refuse to open'); break; }
          }
          // The ORDER must be the ranked order, not queue order: the whole point
          // of the score is that the rep works the top of the list first.
          // Read the company column from the HEADER rather than counting to
          // three, for the same reason the Apps Script now does: the lean set
          // makes company the first column, and an index typed into a check is
          // a second hand-kept copy of the column order.
          const _ci = _p.header.indexOf('Company');
          if (_ci < 0) fails.push('the sheet header has no Company column, so the Apps Script has nothing to dedupe on and every re-send duplicates the whole list');
          else if (_p.rows.length === 2 && _p.rows[0][_ci] !== 'Alpha Co') {
            fails.push('the sheet rows are not in the ranked order the CSV uses');
          }
        }
      }

      // EIGHT — who belongs in the file at all.
      if (M.has({}) || M.has({ name: 'X' })) fails.push('a lead with nothing to contact is being exported');
      // The bare Places phone is NOT a contact row. Every lead in the Find
      // queue carries one, so admitting it would put "Download CSV (167)" on
      // screen before anything was read and hand a rep a file of numbers he
      // already had.
      if (M.has({ name: 'X', phone: '(317) 555-0134' })) fails.push('a lead that was never read is in the contact file on the strength of the phone number Find already had');
      if (!M.has({ contactPhone: '(317) 555-0134' }) || !M.has({ contactOwner: 'A B' }) || !M.has({ contactEmail: 'a@b.com' })) {
        fails.push('a lead with a phone, an owner or an address is being left out of the contact file');
      }
      // ── THE RUN TALLY, EXECUTED ───────────────────────────────────────
      // Nothing in this project has ever counted whether the owner resolver or
      // the email engine work. The first thing that does must not be a number
      // nobody can check, so it is run here on a shaped queue.
      {
        const mk = (n, o) => Array.from({ length: n }, (_, i) => Object.assign({ name: 'C' + i, contactReadOk: true }, o));
        const q = [].concat(
          mk(4, { contactOwner: 'A B', contactOwnerTitle: 'Owner', contactOwnerCanBuy: true,
                  contactEmail: 'a@b.com', contactEmailTier: 1, contactEmailSendable: true, contactPhone: '3175550134' }),
          mk(3, { contactOwner: 'C D', contactEmail: 'c@d.com', contactEmailTier: 3, contactEmailSendable: false }),
          mk(5, { contactPhone: '3175550199' }),
          // Refused before anything was read. It must not count against the
          // resolver: a run that turned away enterprises did not fail to find
          // their owners.
          [{ name: 'Refused', contactFailedAt: 1, notIcp: true }],
        );
        const t = M.tally(q);
        if (t.read !== 12) fails.push('the tally counts leads that were never read: ' + t.read + ' of an expected 12');
        if (t.ofQueue !== 13) fails.push('the tally lost the size of the queue it was measured over');
        if (t.owner !== 7 || t.ownerTitled !== 4 || t.ownerCanBuy !== 4) {
          fails.push(`owners miscounted (${t.owner}/${t.ownerTitled}/${t.ownerCanBuy}) - this is the number Vin asked for by name`);
        }
        if (t.email !== 7 || t.tier1 !== 4 || t.tier3 !== 3) fails.push('the email tier split is wrong, and the split IS the answer - a published address and a guess are both "an email"');
        if (t.sendable !== 4) fails.push('safe-to-send is not being counted separately from "we produced an address"');
        if (t.phone !== 9) fails.push('phones miscounted: ' + t.phone);
        if (t.ownerPct !== 58 || t.emailPct !== 58) fails.push(`rates are over the wrong denominator (${t.ownerPct}%) - they must be over leads READ, never over leads tried`);
        if (t.readable !== true) fails.push('12 reads is the floor and is being called unreadable');
        // Under the floor there are no rates at all. A thin number believed is
        // worse than no number, which is the rule the call-outcome report uses.
        const thin = M.tally(mk(3, { contactOwner: 'A B' }));
        if (thin.readable !== false) fails.push('a three-lead run is being reported as a rate');
        if (/%/.test(M.tallyLine(thin))) fails.push('a run under the floor still prints percentages: ' + M.tallyLine(thin));
        if (!/counts and not rates/.test(M.tallyLine(thin))) fails.push('a thin run does not say that its numbers are not rates');
        if (!M.tallyLine(t) || !/owner 7 \(58%\)/.test(M.tallyLine(t))) fails.push('the tally line does not report the owner rate: ' + M.tallyLine(t));
        // ── AND THE SPLIT HAS TO REACH THE SENTENCE ──────────────────────
        // This assertion exists because the fix came back GREEN through a real
        // revert: deleting the tier lines from the RENDERED line changed
        // nothing, because everything above tests the tally OBJECT. The split
        // is the whole answer to "how well is our email finding working" - a
        // published address and a guess from a common pattern are both "an
        // email", and this project's two hard bounces came from the second
        // kind - so it has to be in the sentence somebody reads.
        {
          const line = M.tallyLine(t);
          if (!/4 published/.test(line)) fails.push('the tally line does not name how many addresses were published on their own site: ' + line);
          if (!/3 pattern-built/.test(line)) fails.push('the tally line does not name how many addresses were built from a pattern rather than confirmed - which is the kind both of this project hard bounces came from: ' + line);
          if (!/Addresses:/.test(line)) fails.push('the tier split has no heading in the line, so the numbers read as part of the sentence before them');
        }
        if (M.tallyLine(M.tally([])) !== '') fails.push('an empty queue prints a tally line about nothing');
        // A verifier that was not answering is a fact about US and has to be
        // said, or thirty downgraded addresses read as thirty bad prospects.
        // Read from the SERVER's own flag, not by grepping the notes for the
        // word "verifier". That is what this counter used to do, and no note
        // written anywhere on the contact path contains that word - so it was
        // dead and printed nothing on exactly the runs where every address was
        // silently downgraded. The fixture carries the flag now, and a run
        // whose NOTES merely mention a verifier must NOT be counted, because
        // guessing from prose is the defect.
        const off = M.tally(mk(12, { contactEmail: 'a@b.com', contactEmailTier: 3, contactEmailVerifierDown: true }));
        if (off.verifierOff !== 12 || !/verifier/i.test(M.tallyLine(off))) {
          fails.push('a run made while the verifier was down says nothing about it, so its tier-3 addresses read as a fact about those prospects');
        }
        const notesOnly = M.tally(mk(12, { contactEmail: 'a@b.com', contactEmailTier: 3, contactNotes: ['the email verifier was not answering'] }));
        if (notesOnly.verifierOff !== 0) {
          fails.push('the verifier outage is still being guessed from note prose rather than read from the flag the server sets');
        }
        contactTally = M.tallyLine(t);
      }
      // ══ THE TheirStack LANE'S OWN EVIDENCE MUST BE SENT ═══════════════
      // A TheirStack lead carries a VERIFIED headcount, the marketing role
      // titles, the posting date and its URL - free, in the same call that
      // found it. contactRequestBody sent none of them, so the strongest ICP
      // measurement this system holds was dropped at the door and the reason
      // the lead exists was re-derived from their careers page. Every row of
      // the 2026-09-01 CSV said "no" in the hiring column.
      {
        const body = M.body({
          name: 'Acme Roofing', website: 'https://acme.example', source: 'theirstack',
          verifiedEmployees: 34, marketingRoles: ['Marketing Manager', 'SEO Specialist'],
          jobPostedAt: '2026-08-25T00:00:00.000Z', signalAgeDays: 7,
          jobPostingUrl: 'https://jobs.example/1',
        }, {});
        const co = (body && body.company) || {};
        for (const [k, want] of [['source', 'theirstack'], ['verifiedEmployees', 34],
          ['jobPostedAt', '2026-08-25T00:00:00.000Z'], ['signalAgeDays', 7],
          ['jobPostingUrl', 'https://jobs.example/1']]) {
          if (String(co[k]) !== String(want)) {
            fails.push('the contact request no longer sends the TheirStack lane\'s ' + k + ', so the only clock this pipeline has stops at the door');
          }
        }
        if (!Array.isArray(co.marketingRoles) || co.marketingRoles.length !== 2) {
          fails.push('the contact request no longer sends the marketing roles that made the lead a lead');
        }
      }
      // ══ THE CLOCK AND THE OUTAGE REACH THE FILE ═══════════════════════
      {
        const withClock = M.rows([{ name: 'Acme', contactReadOk: true, contactOwner: 'Jo Smith',
          contactEmail: 'jo@acme.com', contactHiringDaysAgo: 11, contactHiringRoles: ['Marketing Manager'] }])[0];
        if (!withClock || !/11 days ago/.test(String(withClock.hiringPosted || ''))) {
          fails.push('a dated marketing posting no longer reaches the file, so the rep loses the one reason to call THIS week');
        }
        const undated = M.rows([{ name: 'B', contactReadOk: true, contactOwner: 'Jo Smith',
          contactEmail: 'jo@b.com', contactHiringRoles: ['Marketing Manager'] }])[0];
        if (!undated || /days ago/.test(String(undated.hiringPosted || '')) || !undated.hiringPosted) {
          fails.push('an undated posting is either inventing recency or saying nothing at all - it must say it carried no usable date');
        }
        const noPost = M.rows([{ name: 'C', contactReadOk: true, contactOwner: 'Jo Smith', contactEmail: 'jo@c.com' }])[0];
        if (noPost && noPost.hiringPosted) fails.push('a lead with no posting is being given a hiring date');
        // Our outage, not a fault of the address.
        const down = M.rows([{ name: 'D', contactReadOk: true, contactOwner: 'Jo Smith',
          contactEmail: 'jo@d.com', contactEmailTier: 3, contactEmailVerifierDown: true }])[0];
        if (!down || !/our outage/i.test(String(down.emailWhyUnconfirmed || ''))) {
          fails.push('an address resolved while the mailbox checker was down no longer says so, so it reads as a doubtful mailbox rather than a minute we could not ask');
        }
        // An empty calling window carries its reason.
        const noWin = M.rows([{ name: 'E', contactReadOk: true, contactOwner: 'Jo Smith', contactEmail: 'jo@e.com',
          contactCallWindowWhy: 'their Google listing publishes no opening hours' }])[0];
        if (!noWin || !/publishes no opening hours/.test(String(noWin.callWindow || ''))) {
          fails.push('a blank When-to-call cell still reaches the rep with no explanation, which reads as a bug in the file');
        }
      }
      contactStat = { cols: M.cols.length, lean: M.pick(false).length };
    }
  }

  // ── THE CALL SITES ────────────────────────────────────────────────────────
  // A fixture supplies its own arguments and therefore cannot see a caller.
  // Every wire below is what makes the panel actually do the thing.
  const _nn = (a, b) => a + b;
  // ══ THE TICK BOX MEANS WHAT IT SAYS, AND STARTS OFF ═══════════════════════
  // `|| c.source === 'google_places'` let a lead with NO place id through the
  // "only businesses with a Google listing" filter, and six of the twelve leads
  // on 2026-09-01 then printed "this lead carries no Google place id" on the
  // server. And the default is OFF now: the owner's instruction was that leads
  // from the other lanes "cost the same to read while ahving the same quality
  // as places", and the server recovers a listing for a lead without one.
  // Stops BEFORE the closing parens: counting them in a guard is how a green
  // build gets called RED, and this file records that trap already.
  if (html.indexOf(_nn("const _hasListing = (c) => !!(c && c.pla", "ceId)")) < 0) {
    fails.push('the Google-listing filter has its source escape hatch back, so it passes leads with no place id while claiming to filter on a listing');
  }
  if (html.indexOf(_nn('const [contactPlacesOnly, setContactPlacesOnly] = React.useState(', '_fv.contactPlacesOnly === true);')) < 0) {
    fails.push('the Google-listing filter no longer defaults OFF, so the other lanes are hidden by default again');
  }
  if (html.indexOf(_nn("BACKEND + '/api/find", "-contact'")) < 0) {
    fails.push('nothing in the client calls /api/find-contact — the Find tab button cannot produce a contact');
  }
  // The button reads how many to run from the operator's own number, and the
  // runner takes a POOL plus that number rather than a pre-cut slice - because a
  // lead the server refuses as a chain must not consume one of the five the
  // operator asked for. Slicing first is what made a refusal cost a slot.
  if (html.indexOf(_nn('onClick: () => runContactBatch(_cUnread, Math.max(1,', ' contactHowMany)),')) < 0) {
    fails.push('the contact panel button no longer starts a contact run for the number the operator chose, or it is pre-slicing the pool so a refused lead costs a slot');
  }
  if (html.indexOf(_nn('if (kept + inFlight >= want)', ' return;')) < 0) {
    fails.push('the runner no longer stops at the number of GOOD leads asked for, so a run of five that hits two chains comes back with three');
  }
  // Stop has to abort what is IN FLIGHT. The flag alone is read between leads,
  // and a lead ran for 155 seconds live - which is why Stop read as broken.
  if (html.indexOf(_nn('if (contactAbort.current) contactAbort.current', '.abort();')) < 0) {
    fails.push('Stop no longer aborts the requests in flight, so it cannot take effect until every running lead finishes');
  }
  if (html.indexOf(_nn("signal: contactAbort.current ? contactAbort.current.signal :", ' undefined,')) < 0) {
    fails.push('the contact request is not abortable, so Stop has nothing to cancel');
  }
  // An abort is the operator, not a failure: it must not be recorded on the
  // lead and it must not count toward the dead-server tally.
  if (html.indexOf(_nn("if (e && (e.name === 'AbortError' ||", ' contactStop.current)) {')) < 0) {
    fails.push('a cancelled request is being recorded as a failed read, so pressing Stop marks leads as tried');
  }
  if (html.indexOf(_nn('const n = downloadFindContacts(_cExport', 'able, csvFull);')) < 0) {
    fails.push('the Download CSV button is not wired to the contact export');
  }
  // ONE POPULATION. "14 read" counted the leads ON SCREEN and "Download CSV (8)"
  // counted the WHOLE QUEUE, so two numbers about the same thing disagreed on
  // one panel and the operator could not tell which was wrong. Live, 2026-08-28.
  // _scoped is that one population: the whole filtered queue, or just the leads
  // the last press read when the operator is looking at a run.
  // Both read contactTabOf now: the raw contactReadOk flag is TRUE on a lead the
  // server RULED OUT - a chain drop is read and answered - so counting it made
  // the tally and the exported file describe different sets of leads.
  // ══ ROUND 105 CALL SITES ═══════════════════════════════════════════════
  // A fixture supplies its own arguments and cannot see a caller.
  for (const [why, a, b] of [
    ['the draw pool no longer excludes a lead with nothing to read, so it is asked again on every press', '&& c.contactUnreadable !== true', ' && c.name);'],
    ['a lead with something to read no longer sorts above one with nothing, so name-only leads lead the draw again', 'const sorted = [...withReach].sort((a,b) =>\n        (_readable(b) - _readable(a))', ' || ((b.reachPredict||0)'],
    ['the CSV download no longer stamps the rows it handed out', "if (n) _stamp(_cExportable,", " 'csv'); },"],
    ['the sheet send no longer stamps the rows it handed out', "_stamp(_cExportable, 'sheet'", ');'],
    ['the view state is no longer written on change, so a refresh resets Show all', 'React.useEffect(() => saveFindView({ activeTab, verifiedOnly, winFilter,', ' contactPlacesOnly, contactSort, contactScope, contactTab, pullFilters }),'],
    ['the run id no longer rides every lead a run touched', "fields = Object.assign({ contactRunId: runId },", ' fields);'],
    ['the run set is no longer recovered from the data after a refresh', "const _runId = (contactRun && contactRun.runId) ||", ' latestRunIdOf(_cShown);'],
    ['the export band no longer says why it has nothing to export', "(_cRead.length && !_cExportable.length) ? _cap('Nothing to export: '", " + _cRead.length"],
    ['the runner no longer reads the server\'s nothing-to-read verdict', 'const _unreadable = d.unreadable', ' === true;'],
    ['a resolved domain reaches the research modal without its provenance', "modalSource = 'Found by us from the company name and confirmed by its own pages", " — NOT published by them';"],
    ['the request no longer sends the paid-search opt-in, so the server can never be asked for it', 'resolveWebsiteSearch: !!(settings && settings.resolveWebsiteSearch', ' === true),'],
  ]) {
    if (html.indexOf(_nn(a, b)) < 0) fails.push(why);
  }
  if (html.indexOf(_nn("const _cExportable = _scoped.filter(c => contactTabOf(c) === 'read'", ' && hasContactData(c));')) < 0
      || html.indexOf(_nn("const _cRead = _scoped.filter(c => contactTabOf(c)", " === 'read');")) < 0) {
    fails.push('the CSV count is taken from a different population than the read count beside it, so the two numbers on the panel contradict each other');
  }
  // And the run-scoped view has to exist at all: contactAt was stamped on every
  // read and consumed by nothing, so "where did the five I just ran go" had no
  // answer anywhere in the app.
  // Round 105: the set is keyed on the run id stamped on every lead, so it survives a refresh.
  if (html.indexOf(_nn('const _cRunSet = _runId ? _cShown.filter(c => c && c.contactRunId === _runId)', ' : _cShown.filter(c => c && _runNames.has(c.name));')) < 0) {
    fails.push('there is no run-scoped view of a contact press, so every number on the panel is a cumulative queue total again');
  }
  // ══ THE PANEL HAS A GRAMMAR, AND THE COUNTS AGREE ═══════════════════════
  // Vin: "this section is still messy and unorganized it needs to look
  // professional." It was twenty-two blocks in one flat vertical stack with
  // five paragraphs of prose interleaved between about fifteen controls.
  //
  // HONEST LIMIT, stated at the assertion: the panel lives inside FindView and
  // cannot be lifted and executed the way LeadBriefing is, so these are source
  // needles. What they can prove is that the four bands exist, that every
  // control that spends money still has its handler, and that the three counts
  // that disagreed now read one population.
  if (html.indexOf(_nn('const _band = (label, ...kids) =>', ' React.createElement(')) < 0) {
    fails.push('the contact panel is back to a flat vertical stack with no bands, which is the layout the owner called messy and unorganized');
  }
  for (const [needle, why] of [
    [_nn('_band(', "'Scope',"), 'the scope band is gone, so the control that decides what a press BUYS is no longer beside the press'],
    [_nn('_band(', "'Read',"), 'the read band is gone'],
    [_nn('_band(', "'Export',"), 'the export band is gone, so the CSV, the sheet and the column choice are loose in the stack again'],
    [_nn('_band(', "'Result',"), 'the result band is gone, so what came back is interleaved with what to press again'],
  ]) {
    if (html.indexOf(needle) < 0) fails.push(why);
  }
  // Every control that SPENDS or DESTROYS has to survive a layout change. This
  // is the button that buys real credits and the one that throws away work
  // already paid for, and section 39's rule is that they all survive.
  for (const [needle, why] of [
    [_nn('onClick: () => runContactBatch(_cUnread,', ' _cUnread.length),'), 'the "All N" button is gone, so a full queue can only be read a page at a time'],
    // A re-read is a SPEND, so it obeys the same number box the first read
    // does. It passed the whole stale set as the limit, so on a queue of 53
    // stale reads one confirm bought 53 leads of Firecrawl and model spend.
    [_nn('runContactBatch(_cStale,', ' _n);'), 'the re-read of stale contact reads is gone, or it is back to spending on every stale lead at once rather than the number the operator chose'],
    [_nn("setContactPlacesOnly(!!e.target", '.checked),'), 'the Google-listing scope tick box is gone, so the job-board lanes are back in the queue with no way to hide them'],
    [_nn('setCsvFull(!!e.target', '.checked),'), 'the every-column tick box is gone'],
    [_nn("setContactSort(v =>", ' !v),'), 'the sort-by-fit button is gone'],
    [_nn("setContactHowMany(Math.max(1, Math.min(500,", ' Number(e.target.value) || 1))),'), 'the how-many box is gone, so a press can no longer be sized'],
    [_nn('contactStop.current =', ' true;'), 'the Stop button is gone'],
    [_nn("findSheetPayload(_cExportable,", ' csvFull);'), 'the Google Sheet send is gone'],
    [_nn('saveDiscovered(cleared);', ' setDiscovered(cleared);'), 'the Clear-read button is gone, so there is no way back from a bad read'],
    [_nn('contactNotFit: false, contactFailedAt:', ' null, contactNotes: [] }) : x);'), 'the "Put them back" button is gone, so a lead the filter has wrong can never be re-read'],
  ]) {
    if (html.indexOf(needle) < 0) fails.push(why);
  }
  // The denominator has to reach the SORT and the CARD, not just the lead.
  if (html.indexOf(_nn('const Am = (typeof a.contactIcpMeasured ===', " 'number') ? a.contactIcpMeasured : 0;")) < 0) {
    fails.push('the fit sort no longer breaks a tie on how much we actually know, so a lead scored on three signals sorts level with one scored on seven');
  }
  if (html.indexOf(_nn("co.contactIcpMeasured + ' of ' +", ' co.contactIcpOf)')) < 0) {
    fails.push('the card no longer prints how many signals stood behind the fit score, so 45-of-3 and 45-of-7 look identical');
  }

  // ══ AND THE THREE COUNTS THAT DISAGREED ════════════════════════════════
  // The tally read the whole filtered queue while every stat above it read
  // _scoped, so with "This run" selected the header and the tally described
  // different sets of leads on one panel.
  if (html.indexOf(_nn('findTallyLine(findRunTally(', '_scoped))')) < 0) {
    fails.push('the contact tally is computed over a different population than the numbers directly above it, so one panel reports two answers about one set of leads');
  }
  // "68 of these 68 reads" - the stale count printed twice, which is true by
  // accident on a queue where every read is stale and false the moment one is
  // re-read.
  if (html.indexOf(_nn("_cStale.length + ' of these ' +", " _cRead.length + ' read'")) < 0) {
    fails.push('the stale-read banner prints the stale count where the read count belongs, so it says "N of these N reads" whatever the real numbers are');
  }

  // And the leads just read have to be movable into Research in one press.
  if (html.indexOf(_nn('const n = addManyToPipeline(', '_runMovable);')) < 0) {
    fails.push('the leads a press just read cannot be moved to the pipeline, so a contact run still has no route into an audit');
  }
  // The two can still legitimately differ - a lead can be read and carry no
  // owner, no address and no number - so the panel has to SAY so rather than
  // leave the gap to be guessed at.
  if (html.indexOf(_nn('const _cReadNoContact = _cRead.length -', ' _cExportable.length;')) < 0) {
    fails.push('the panel no longer explains why fewer leads are in the file than were read');
  }
  // The write-through must be PER LEAD. A closed tab or a Stop half way must
  // not throw away reads that were already paid for.
  if (html.indexOf(_nn('const live = loadDiscovered();', '\n      const merged = live.map(x => (x && results.has(x.name))')) < 0) {
    fails.push('the contact run no longer saves after every lead, so a Stop or a closed tab loses reads that were already paid for');
  }
  // The card strip must be gated on the READ FLAG, not on the timestamp. Live,
  // 2026-08-28: the server was paused, every request failed instantly, the
  // failure path stamped contactAt anyway, and a hundred leads were retired as
  // "read" in about two seconds with nothing on them and no way to press the
  // button again. contactReadOk is written in ONE place - the success path - so
  // it cannot be set by anything that did not read the business.
  if (html.indexOf(_nn('if (co.contactReadOk !== true) return', ' null;')) < 0) {
    fails.push('the card contact strip is no longer gated on the read flag, so a lead whose request FAILED renders as if it had been read');
  }
  // Unread is still decided by the READ FLAG, and now also excludes a lead the
  // server RULED OUT. Those are different states and they were one: a permanent
  // verdict ("this is a national brand, not a business we sell to") sat in the
  // unread pool forever, and the panel said so out loud - "they are still
  // counted as unread, so the button above picks them up again". A transient
  // failure must still come back, which is what stops a paused server retiring
  // a hundred leads.
  if (html.indexOf(_nn('const _cUnread = _cShown.filter(c => c && c.contactReadOk !== true && c.contactNotFit !==',
                       ' true && c.contactUnreadable !== true && c.name);')) < 0) {
    fails.push('the panel decides what is unread from something other than the read flag and the ruled-out flag — either a failed request retires a lead permanently, or a lead the server already ruled out is re-asked on every press forever');
  }
  // A verdict is written ONLY where the server said notIcp. Anything wider and
  // a dead server starts retiring leads permanently again.
  if (html.indexOf(_nn('const _verdict = d.notIcp ===', ' true;')) < 0) {
    fails.push('the client no longer reads the server\u2019s not-a-fit verdict, so a refusal it can never change is retried on every press');
  }
  {
    const writers = (html.match(/contactNotFit:\s*_verdict/g) || []).length;
    if (writers !== 1) fails.push(`contactNotFit is written from the verdict in ${writers} place(s); it must be written only where the server actually ruled the business out`);
  }
  // A per-lead verdict has ONE home. It rendered twice on one panel - in the
  // failed box AND as a toast - because the toast fired on every non-ok answer.
  // The toast is for facts about the RUN.
  if (html.indexOf(_nn('if (d.budgetStopped || d.busy || d.booting) setContactErr(d.error ||',
                       " '');")) < 0) {
    fails.push('a per-lead refusal is being raised as a run-level message again, so the same sentence renders twice on one panel');
  }
  // contactReadOk may be assigned true in exactly one place: the function that
  // reads a real server answer. A second writer is how a failure gets to claim
  // it read something.
  {
    const writers = (html.match(/contactReadOk:\s*true/g) || []).length;
    if (writers !== 1) fails.push(`contactReadOk is set to true in ${writers} place(s); it must be written only where the server actually answered`);
    // BOTH failure branches - a refusal and a thrown fetch - must say so on the
    // lead. This is the assertion the live defect needed and did not have: a
    // falsification that put the old `contactAt` stamp back on those branches
    // came back GREEN, because every other assertion here keys on the read flag
    // and the reverted branches simply wrote a field nothing consulted. Green
    // for the wrong reason is not a pass, so the branches are asserted directly.
    const deniers = (html.match(/contactReadOk:\s*false,\s*contactFailedAt:/g) || []).length;
    if (deniers !== 2) fails.push(`${deniers} of the 2 contact-run failure branches record the failure on the lead; a branch that records nothing leaves a failed lead indistinguishable from an unread one, and a branch that records a READ retires it forever`);
    // And no failure branch may write the read TIMESTAMP. contactAt is shown as
    // when we read this business; a failure writing it is a false claim about
    // work that never happened.
    const runner = html.slice(html.indexOf('const runContactBatch'), html.indexOf('const addManyToPipeline'));
    if (/contactNotes: \[(?:d\.error|\(e &&)/.test(runner) && /contactAt: new Date\(\)\.toISOString\(\), contactNotes:/.test(runner)) {
      fails.push('a contact-run failure branch stamps contactAt - the timestamp that says when we READ this business - on a request that never read anything');
    }
  }
  // A dead server must stop the run rather than burning through the whole queue
  // in two seconds and reporting it as finished.
  if (html.indexOf(_nn('if (transportFails >=', ' 3) {')) < 0) {
    fails.push('the contact run no longer stops after repeated transport failures — a paused server runs the entire queue instantly and reports it as done');
  }
  // The Find tab's runner must share NOTHING with the Research batch. Two
  // artefacts, two costs, two buttons - and one shared runner is how one
  // silently becomes the other.
  if (/runContactBatch/.test(html.slice(html.indexOf('function ResearchView'), html.indexOf('function GenerateView')))) {
    fails.push('ResearchView references the Find tab contact runner — the two runs are supposed to share nothing');
  }
  {
    const defs = (html.match(/const runContactBatch\s*=/g) || []).length;
    if (defs !== 1) fails.push(`${defs} definition(s) of runContactBatch — one implementation, or the second is the one that rots`);
  }
  // ══ "READ 25" MUST RETURN 25 ═════════════════════════════════════════════
  // Live 2026-09-01: 25 asked for, "31 read of 31" reported. The guard was
  // checked BEFORE the draw with a pool of six workers, so at kept === want - 1
  // all six passed it and drew at once. Ceiling was want + (CONTACT_POOL - 1).
  // The runner lives inside a React component, so this is a source assertion
  // and says so; the reservation itself is what the needles pin.
  {
    const runner2 = html.slice(html.indexOf('const runContactBatch'), html.indexOf('const addManyToPipeline'));
    if (runner2.indexOf(_nn('inFlight += 1;', '\n        try { await one(list[i]); } finally { inFlight -= 1; }')) < 0) {
      fails.push('the contact runner does not release its reservation, so a refusal or a failure permanently shrinks the run');
    }
    // A failed read stays in Not-read and the panel promises it will be picked
    // up again. Charging it a slot makes that promise false.
    if (runner2.indexOf(_nn('const _kept = fields.contactReadOk === true', ' && !_refused;')) < 0) {
      fails.push('a contact read that FAILED still consumes one of the leads asked for, while the panel says it will be picked up again');
    }
  }
  // The move bar must describe the same population the panel above it does.
  if (html.indexOf(_nn('const _allMovable = _cShown.filter(c => c && c.name', ' && !alreadyAdded(c.name));')) < 0) {
    fails.push('the move-to-pipeline bar ignores the Google-listing scope checkbox, so it offers to move the very leads the panel above says it is hiding');
  }
}

// == THE FIND RUN: ITS CLOCK, ITS QUEUE AND ITS CARD ========================
//
// A full-grid Find takes 102-120 seconds and something between the browser and
// Render cuts a request at 60, so three consecutive presses on 2026-08-28 each
// found 1,437 businesses, each completed, and each had its answer dropped with
// the connection. The run now outlives its request. These assert the three
// things that could quietly undo that.
let findStat = null;
{
  // ---- 1. The browser's wall must sit ABOVE the server's own sweep --------
  // Otherwise the browser becomes the thing that decides, and a healthy run is
  // killed by a clock in the wrong file. Both numbers are READ from their own
  // source, so moving either one past the other fails the build.
  const _cw = src.match(/const FIND_WALL_MS\s*=\s*([^;]+);/);
  const _ss = server.match(/const FIND_JOB_STALE_AFTER_MS\s*=\s*([^;]+);/);
  if (!_cw) fails.push('index.html no longer declares FIND_WALL_MS, so the Find poller has no bound at all');
  else if (!_ss) fails.push('server.js no longer declares FIND_JOB_STALE_AFTER_MS, so a hung Find run is never swept');
  else {
    let wall = null, sweep = null;
    try { wall = new Function('return (' + _cw[1] + ')')(); } catch (e) { wall = null; }
    try { sweep = new Function('return (' + _ss[1] + ')')(); } catch (e) { sweep = null; }
    if (!Number.isFinite(wall) || !Number.isFinite(sweep)) {
      fails.push('one of the two Find clocks no longer evaluates to a number');
    } else if (!(wall > sweep)) {
      fails.push(`the browser gives up on a Find run after ${Math.round(wall / 60000)} minutes while the server only sweeps it at ${Math.round(sweep / 60000)} — the browser is deciding again, which is the clock this whole change removed`);
    }
  }

  // ---- 2. The submit goes through the poller, and only the poller ---------
  // A fixture cannot see a caller. If runDiscover goes back to awaiting one
  // long fetch, every assertion here would still pass.
  if (!/const d = await discoverViaJob\(discoverAbort\.signal/.test(src)) {
    fails.push('runDiscover no longer submits through discoverViaJob, so a Find run is back to depending on one long HTTP request');
  }
  {
    // The sync door survives ONLY inside the helper, as the old-server
    // fallback. A second bare call anywhere else is the 60-second wall coming
    // straight back through a door nobody is watching.
    const _bare = (src.match(/post\('\/api\/discover'\)|BACKEND \+ '\/api\/discover'/g) || []).length;
    if (_bare !== 1) fails.push(`${_bare} call site(s) hit the synchronous /api/discover door — exactly one is expected, the old-server fallback inside discoverViaJob`);
  }

  // ---- 2b. The trigger lanes are off unless a person ticks them ----------
  // Vin's decision, 2026-08-31. A Places lead has a Google listing by
  // construction and every ICP rule in this system reads those fields; a
  // job-board or funding lead has none of them, so it arrives unjudged and is
  // then scored as though it had been judged. The default has to be OFF and it
  // has to be a real control, not a constant somebody has to edit.
  {
    if (!/extraLanes:\s*pullFilters\.extraLanes === true/.test(src)) {
      fails.push('the Find request no longer carries the lane choice, so the server falls back to its own default and the tick box decides nothing');
    }
    if (!/extraLanes:\s*false,/.test(src)) {
      fails.push('extraLanes is no longer declared false in pullFilters, so the trigger lanes are back on by default and every run buys four lanes nobody chose');
    }
    if (!/onChange:\s*e => setPullFilters\(p => \(\{ \.\.\.p, extraLanes: e\.target\.checked \}\)\)/.test(src)) {
      fails.push('there is no control that sets extraLanes, so the lanes can only be turned on by editing the file - a switch nobody can reach is a switch that rots');
    }
    // And Reset must not silently take the choice with it. It used to REPLACE
    // the whole filter object, so any field added to pullFilters was quietly
    // deleted by a button labelled Reset - which for a spend switch means an
    // operator turns the lanes on, presses Reset to clear a market, and buys a
    // different run than the screen describes.
    if (/setPullFilters\(\{ niches:\[\]/.test(src)) {
      fails.push('the Reset button REPLACES pullFilters rather than merging, so it silently clears every field added to that state - including the lane choice, which decides what a run spends');
    }
  }

  // ---- 3. The queue cap is ONE number ------------------------------------
  // It was 200, hand-written in the merge, the Supabase upsert and the Supabase
  // restore, so raising it meant finding all three. A run banks over a thousand
  // leads it paid for; a cap somebody forgets to raise throws them away.
  {
    const _decl = src.match(/const FIND_QUEUE_MAX\s*=\s*(\d+);/);
    if (!_decl) fails.push('FIND_QUEUE_MAX is gone, so the Find queue cap is a hand-written number again');
    else {
      const uses = (src.match(/FIND_QUEUE_MAX/g) || []).length;
      if (uses < 4) fails.push(`FIND_QUEUE_MAX is used ${uses - 1} time(s) after its declaration — the merge, the Supabase write and the Supabase read all need it`);
      if (/discovered_queue\?order=icp_score\.desc&limit=200/.test(src)) {
        fails.push('the Supabase queue read still asks for a hardcoded 200, so raising the cap silently does nothing on reload');
      }
    }
  }

  // ---- 4. The card stops guessing once we have measured ------------------
  // findScoreLine reads affordLabel, so both are lifted together. Executing the
  // sentence is the whole point: a source scan cannot tell a label that renders
  // from a label that is computed and dropped.
  const _m = src.match(/const findScoreLine = \(co\) => \{[\s\S]*?\n\};/);
  const _mAff = src.match(/const AFFORD_LABEL = \{[\s\S]*?\n\};\nconst affordLabel = [^\n]+\n/);
  if (!_mAff) fails.push('AFFORD_LABEL/affordLabel are gone — the Find card is deriving its own affordability tier again, which is a second copy of a rule the server already owns');
  if (!_m) fails.push('findScoreLine is gone — the Find card is building its own sentence again, where nothing can run it');
  else {
    let line = null, affLabel = null;
    try {
      const _mk = new Function((_mAff ? _mAff[0] : 'const affordLabel = () => "";')
        + 'return { line: ' + _m[0].replace(/^const findScoreLine = /, '').replace(/;$/, '') + ', affordLabel };');
      const _got = _mk();
      line = _got.line; affLabel = _got.affordLabel;
    } catch (e) { line = null; }
    if (typeof line !== 'function') fails.push('findScoreLine could not be executed');
    else {
      const unread = line({ icpScore: 74, reachPredict: 31 });
      const read = line({
        icpScore: 74, reachPredict: 31, contactReadOk: true,
        contactOwner: 'Rick Miller', contactEmail: 'rick@x.com',
        contactEmailTier: 2, contactEmailSendable: true, contactPhone: '(502) 555-0100',
      });
      const demoted = line({ icpScore: 74, reachPredict: 31, outsideBand: true });
      const both = line({ icpScore: 61, reachPredict: 20, outsideBand: true, aboveSizeCeiling: true });
      if (!/owner findable 31\/40/.test(unread)) fails.push('an unread lead no longer says its owner-findable number is a guess');
      if (/findable/.test(read)) fails.push('a lead we actually READ still shows the name-based guess beside the owner, email and phone we measured');
      if (!/owner/.test(read) || !/email confirmed/.test(read) || !/phone/.test(read)) {
        fails.push('a read lead does not report what was measured: ' + read);
      }
      if (!/no email/.test(line({ icpScore: 50, contactReadOk: true }))) {
        fails.push('a read lead with nothing found reports nothing rather than saying so');
      }
      if (/sorted last/.test(unread)) fails.push('an undemoted lead claims it was sorted last');
      // The two demotions are DIFFERENT reasons and used to be described with
      // the same words - the RATING band called a review-count ceiling - so the
      // card and the new demotedWhy CSV column would have disagreed about one
      // lead. Assert the property rather than a literal: each must say
      // something, and the two must not say the same thing.
      if (!/sorted last:/.test(demoted)) {
        fails.push('a band-demoted lead says nothing about it, so its position on the screen has no explanation');
      }
      if (/review-mining ceiling/.test(demoted)) {
        fails.push('the RATING-band demotion is still described as a review-count ceiling, which is a different measurement');
      }
      const _bandSay = String(demoted.split('sorted last:')[1] || '').trim();
      const _bothSay = String(both.split('sorted last:')[1] || '').trim();
      if (!/ and /.test(_bothSay) || _bothSay === _bandSay) {
        fails.push('a lead demoted twice names only one reason');
      }
      if (_bothSay.split(' and ')[0] === _bothSay.split(' and ')[1]) {
        fails.push('the two demotions are described with the same words, so the row cannot say which one applies');
      }

      // ---- 4b. What they can afford, which is the question the list exists
      // to answer. The band is the SERVER's; the browser only labels it. A
      // second affordability rule here is how the card and the CSV end up
      // telling an operator two different things about one business.
      if (typeof affLabel === 'function') {
        if (affLabel({ affordBand: 'premium' }) !== 'Premium fit') fails.push('the premium band has no label on the card');
        if (affLabel({ affordBand: 'lower' }) !== 'Lower tier only') fails.push('the lower-tier band has no label on the card');
        if (affLabel({ affordBand: 'below_floor' }) !== 'Below our floor') fails.push('a lead below the floor is labelled as though it were sellable');
        // Unmeasured shows NOTHING rather than a tier. "We did not look" has
        // never meant "they cannot pay" anywhere else in this app.
        for (const _b of [null, undefined, '', 'nonsense', 0]) {
          if (affLabel({ affordBand: _b }) !== '') { fails.push('an unmeasured affordability band renders a label: ' + JSON.stringify(_b)); break; }
        }
      }
      const _prem = line({ icpScore: 74, affordBand: 'premium' });
      if (!/Premium fit/.test(_prem)) fails.push('the affordability tier is computed and never rendered on the card, which is the whole question the Find list exists to answer');
      if (/Premium fit/.test(line({ icpScore: 74 }))) fails.push('a lead with no measured band is being shown as a premium fit');
      // A low rating is a REASON now, not a demotion, and the card has to say
      // which - a number that moved with nothing accounting for it is what made
      // the old rating read as broken.
      const _low = line({ icpScore: 66, lowRating: true });
      if (!/low rating, kept/.test(_low)) fails.push('a lead kept BECAUSE of its low rating says nothing about it, so its score reads as unexplained again');
      if (/sorted last/.test(_low)) fails.push('a low-rated lead still claims it was sorted last, which is the behaviour that was removed');

      // ---- 4c. And the invented revenue band is gone. It printed
      // "Est. $1M-$5M+" off a review count alone, on the card an operator
      // reads before deciding what to audit.
      {
        const _needle = ['Est. $', '1M'].join('');
        const _bare = src.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
        if (_bare.includes(_needle)) fails.push('the card still renders a revenue estimate built from a review count - a figure presented as a measurement, which is the one thing this system is built not to do');
      }

      findStat = { unread, read, demoted, prem: _prem };
    }
  }
}
// ══ THE DO-NOT-SEND FLAG MUST SURVIVE THE PROMOTION ═══════════════════════
// leadFromCompany carries the contact read onto a pipeline lead, and it carried
// thirteen fields with contactEmailSendable not among them - so a lead promoted
// out of Find arrived WITH the address and WITHOUT the flag the card refuses to
// send on and the CSV prints "NO - do not send" for. Executed, because a source
// read cannot tell a missing key from one spelled differently.
{
  const _need = ['leadFromCompany'];
  const _got = {};
  walk(ast, (n) => {
    if (n.type === 'VariableDeclarator' && n.id && _need.includes(n.id.name) && n.init) {
      _got[n.id.name] = 'const ' + n.id.name + ' = ' + src.slice(n.init.start, n.init.end) + ';';
    }
  });
  if (!_got.leadFromCompany) {
    fails.push('leadFromCompany is no longer at module scope, so promoting a Find lead into the pipeline cannot be executed and the thirteen-field drop that lost the do-not-send flag can come straight back');
  } else {
    let _mk = null;
    try {
      _mk = new Function(
        'const uid = () => "id1"; const today = () => "2026-01-01";'
        + ' const daysFromNow = (n) => "2026-01-0" + n;\n'
        + _got.leadFromCompany + '\nreturn leadFromCompany;')();
    } catch (e) { fails.push('leadFromCompany does not compile standalone: ' + e.message); }
    if (_mk) {
      const _lead = _mk({
        name: 'A Co', website: 'https://a.com',
        contactReadOk: true, contactOwner: 'Dana Reed', contactOwnerTitle: 'Owner',
        contactOwnerCanBuy: true, contactOwnerSources: ['own_website_brain'],
        contactEmail: 'dana@a.com', contactEmailTier: 3, contactEmailSendable: false,
        contactEmailBlockReason: 'built from a name the authority gate held back',
        contactPhone: '555-0100', contactPhoneOnSite: false,
      });
      if (_lead.contactEmailSendable !== false) {
        fails.push('a promoted lead arrives with the address and WITHOUT the do-not-send flag - the one field the card and the CSV both refuse to send on, separated from the address it belongs to');
      }
      if (!_lead.contactEmailBlockReason) {
        fails.push('the reason the address cannot be sent to is dropped on promotion, so a block with no reason on it reads as a bug rather than a judgement');
      }
      if (!Array.isArray(_lead.contactOwnerSources) || !_lead.contactOwnerSources.length) {
        fails.push('where the owner came from is dropped on promotion, so a name read off a team page and one a model guessed are indistinguishable in the pipeline');
      }
      if (_lead.contactOwnerCanBuy !== true) {
        fails.push("the authority gate's verdict is dropped on promotion, so a held-back name and a confirmed buyer look the same downstream");
      }
      if (_lead.contactPhoneOnSite !== false) {
        fails.push('whether their own site prints the number is dropped on promotion');
      }
      // And the direction that must not drift: a company with NO contact read
      // must not arrive claiming one.
      const _bare = _mk({ name: 'B Co' });
      if (_bare.contactReadOk !== false || _bare.contactEmailSendable !== false) {
        fails.push('a lead that was never contact-read arrives claiming it was, which is the stamp-says-done failure this file already records');
      }
    }
  }
}

// ══ A STALE LOCAL QUEUE MUST NOT PERMANENTLY SHADOW THE CLOUD ═════════════
// The Find queue restore returned the moment localStorage held anything, so
// once a browser had ONE queued company the Supabase queue could never load in
// it again. Same class as the leads loader this file already guards.
{
  if (/const local = loadDiscovered\(\);\s*\r?\n\s*if \(local\.length > 0\) return;/.test(src)) {
    fails.push('the Find queue restore still returns early whenever localStorage holds anything, so a run banked on another machine is invisible in this browser forever');
  }
  if (!/const merged = Array\.from\(_byName\.values\(\)\)/.test(src)) {
    fails.push('the Find queue restore no longer MERGES the cloud with local work - replacing would delete a company queued in this tab and not yet pushed, which is the guard pointed the other way');
  }
}

Promise.all(PENDING).then(() => {
  if (fails.length) {
    console.log(`\n✗ index.html: ${fails.length} research-request defect(s)`);
    fails.forEach(f => console.log('  ' + f));
    process.exit(1);
  }

  console.log(`\n\u2713 index.html: all ${calls.length} research request(s) go through the one builder at line ${builderLine}, which sends ${builderKeys.length} fields including every measurement nothing downstream can recover. Two hand-written bodies disagreed about seventeen of them on 2026-08-19.`);
  if (roundTrip) console.log(`\u2713 index.html: the Supabase round trip was EXECUTED, not read \u2014 leadToRow and rowToLead run on five real lead shapes. A Find lead keeps every one of its ${roundTrip.fields} stored fields, a never-researched lead does NOT read as audited, the model's draft survives a reload instead of the research-time template, the call outcome survives, an empty lead still stores nothing, and no stored field is write-only. This pair is the only door between the app and its data, it has produced nine duplicate-key collisions, and nothing in this repo had ever run it.`);
  notes.forEach(n => console.log(n));
  if (findStat) console.log(`\u2713 index.html: the Find run's clock, queue cap and card were EXECUTED, not read \u2014 the browser's wall sits above the server's own sweep so a healthy run is never killed by the wrong file, the submit goes through the poller and exactly one call site still touches the synchronous door as the old-server fallback, the queue cap is one number rather than three, and a lead we have actually read stops showing the name-based guess beside the owner, email and phone we measured. A demoted lead now says why it was sorted last: "${findStat.demoted}". And the card answers what a business can afford instead of inventing a revenue band from its review count: "${findStat.prem}".`);
  if (contactTally) console.log(`\u2713 index.html: the contact run TALLY was executed \u2014 the first thing in this project that has ever counted whether the owner resolver and the email engine work. Rates are over leads actually READ, the email tier split is reported rather than one "found" number because a published address and a guess are not the same thing, a run under twelve reads says its numbers are counts and not rates, and a run made while the verifier was down says so. On the fixture queue: ${contactTally}`);
  if (contactStat) console.log(`\u2713 index.html: the Find tab's contact list was EXECUTED, not read \u2014 the CSV writes the ${contactStat.lean} columns a rep dials and sends from, with all ${contactStat.cols} one tick away and the Google Sheet reading the same choice. It neutralises a formula cell without mangling a real company name, sorts an UNSCORED lead below a measured zero, gives each email tier its own confidence sentence, and reports an unmeasured signal as "not checked" rather than as a definite no. Every call site is pinned too: the panel starts the run, the run posts to /api/find-contact, it saves after every lead so a Stop keeps what was paid for, the card strip renders only on a lead that was read, and the Research batch cannot reach any of it. The panel itself now reads as four bands - what this is, what the next press covers, what to press, what came back - with every spending and destroying control still wired, and the three counts that used to describe three different populations on one screen now read one.`);
  if (mergeStat) console.log(`\u2713 index.html: the research merge was EXECUTED, not read \u2014 all ${mergeStat.kept} fields the server's answer carries land on the lead. It used to be 200 lines inside one React function, so auditing fifty businesses at once meant writing it a second time, and its own comment names that as the disease: "the second copy is always the one that rots, because it only runs in the case nobody tests."`);
}).catch((e) => { console.log('\n\u2717 index.html: the checks could not finish \u2014 ' + (e && e.message)); process.exit(1); });
