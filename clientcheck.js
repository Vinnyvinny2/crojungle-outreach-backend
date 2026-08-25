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
    if (CONTROL_ONLY.has(k)) continue;
    const marker = Object.prototype.hasOwnProperty.call(SHAPE, k)
      ? (typeof SHAPE[k] === 'number' ? String(SHAPE[k]) : 'MK_' + k)
      : 'MK_' + k;
    if (json.indexOf(marker) < 0) lost.push(k);
  }
  if (lost.length) {
    fails.push(`the research merge reads ${lost.length} field(s) off the server's answer and puts ${lost.length === 1 ? 'it' : 'them'} nowhere on the lead: ${lost.sort().join(', ')} — measured, paid for, returned, and dropped one line before use. That is the exact shape of the lsa row that read "Not checked" on every lead for a week`);
  }
  return { fields: reads.size, kept: reads.size - CONTROL_ONLY.size - lost.length };
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
  const NEED = ['auditRecordFor', 'auditExportHtml', 'buildAuditRows', 'claimRisksOf', 'corpusWarningFor', 'leadHasAudit', 'adsFactsLabel', 'PILLAR_LABEL', 'PILLAR_PRODUCT', 'dedupeOwnWords', 'trimRepeatedJobValue', 'RISK_REASONS', 'plainRisk', 'LAYER_PLAIN', 'layerPlain', 'groupAuditFindings', 'FUNNEL_STAGE_DEFS', 'PILLAR_TO_STAGE', 'normalizedLeakRows', 'groupByFunnelStage', 'funnelSvg', 'WALK_TO_STAGE', 'walkTextsByStage', 'scoreSentence', 'SIGNAL_RUNGS', 'signalRowsFor'];
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
      mod = new Function(found.groupAuditFindings + '\n' + found.FUNNEL_STAGE_DEFS + '\n' + found.PILLAR_TO_STAGE + '\n' + found.normalizedLeakRows + '\n' + found.groupByFunnelStage + '\n' + found.funnelSvg + '\n' + found.WALK_TO_STAGE + '\n' + found.walkTextsByStage + '\n' + found.scoreSentence + '\n' + found.SIGNAL_RUNGS + '\n' + found.signalRowsFor + '\n' + found.RISK_REASONS + '\n' + found.plainRisk + '\n' + found.LAYER_PLAIN + '\n' + found.layerPlain + '\n' + found.adsFactsLabel + '\n' + found.PILLAR_LABEL + '\n' + found.PILLAR_PRODUCT + '\n' + found.dedupeOwnWords + '\n' + found.trimRepeatedJobValue + '\n'
        + found.corpusWarningFor + '\n' + found.claimRisksOf + '\n' + found.leadHasAudit + '\n' + found.buildAuditRows + '\n' + found.auditRecordFor + '\n' + found.auditExportHtml
        + '\nreturn { rec: auditRecordFor, html: auditExportHtml, norm: normalizedLeakRows, adsLabel: adsFactsLabel, dedupe: dedupeOwnWords, trim: trimRepeatedJobValue, plain: plainRisk, layer: layerPlain, group: groupAuditFindings, groupStage: groupByFunnelStage, fsvg: funnelSvg, walkStage: walkTextsByStage, scoreLine: scoreSentence };')();
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
      // The three-openers section and the signals-at-their-stage grid (Vin,
      // 2026-08-25: "3 options for this section at all times based on the top
      // revenue leaks" and "matching [the signals] up with the funnel is ideal").
      if (page.indexOf('MARKER_OPENQ') < 0 || page.indexOf('Leak 1:') < 0) {
        fails.push('a numbered leak\'s conversation opener never reaches the sheet\'s Worth-asking section');
      }
      if (page.indexOf('Ad clicks land on') < 0 || page.indexOf('never links') < 0) {
        fails.push('the ad-landing signal row never reaches the sheet\'s funnel stage — the measurement Vin called very important information');
      }
      if (page.indexOf('Booking route') < 0 || page.indexOf('#4 of 20') < 0) {
        fails.push('the signal rows are not lined up at their funnel stages on the sheet (booking at the door, the map read at getting-found)');
      }
      if (page.indexOf('nothing on the pages counts it') < 0) {
        fails.push('a blind conversion read does not reach the door stage as a signal row');
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
        const mxSvg = mod.fsvg({ found: 'mixed', door: 'clean', after: 'no_read' }, null);
        if (mxSvg.indexOf('circle') < 0) fails.push('a mixed stage draws no leak drips — the leaks are real even where the stage works');
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
        if (!/well built|build is fine/i.test(mod.scoreLine({ checked: true, score: 8 }, true))) fails.push('a high score does not read as a healthy build');
        if (!/part of the problem/i.test(mod.scoreLine({ checked: true, score: 3 }, true))) fails.push('a low score does not say the build itself is a problem');
        if (mod.scoreLine(null, true) !== '' || mod.scoreLine({ checked: false, score: 8 }, true) !== '') fails.push('an unmeasured score produced a sentence');
        // The drawing: red only where broken, dashed only where unread.
        const svgB = mod.fsvg({ found: 'broken', door: 'clean', after: 'no_read' });
        if (!/#dc2626/.test(svgB)) fails.push('a broken stage does not draw red');
        if (!/stroke-dasharray="5 4"/.test(svgB)) fails.push('an unmeasured stage does not draw dashed');
        const svgC = mod.fsvg({ found: 'clean', door: 'clean', after: 'clean' });
        if (/#dc2626/.test(svgC)) fails.push('a clean funnel still draws red somewhere — colour marks a stop, nothing else');
        // The render: badge, stage row and money line reach the page.
        const stagedLead = { ...LEAD, problemList: [
          { problem: 'MARKER_STAGEROW', funnelStage: 'found', moneyRank: 3, harm: 90, leakRank: 1, pillar: 'INVISIBLE', moneyLine: 'MARKER_STAGEMONEY', rankNote: 'MARKER_RANKNOTE' }] };
        const sp = mod.html([mod.rec(stagedLead)], { title: 'T', at: 'now' });
        const dupLead = { ...LEAD, problemList: [
          { problem: 'dup A', funnelStage: 'door', harm: 80, leakRank: 2, callOpener: 'Is the front desk picking up after five?' },
          { problem: 'dup B', funnelStage: 'found', harm: 70, leakRank: 2, callOpener: 'Who shows up when you search your own trade?' }] };
        const dpp = mod.html([mod.rec(dupLead)], { title: 'T', at: 'now' });
        if ((dpp.match(/Leak 1:/g) || []).length !== 1 || (dpp.match(/Leak 2:/g) || []).length !== 1) {
          fails.push('two legacy rank-2 openers do not render as Leak 1 and Leak 2 once each — the Worth-asking list is reading raw stored ranks again');
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
        if (!/the leaks are in the path around it|build is fine/.test(wp)) fails.push('the one-sentence score verdict never reaches the sheet — the chips block was removed and nothing replaced it');
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
        if (mod.adsLabel({ ads: 'no', metaPixel: false }) !== 'Ads: none found') fails.push('a genuinely tag-free site no longer reads "none found"');
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
        // Layer codes translate; an unknown code passes through untouched.
        if (mod.layer('MARKET') !== 'how they position themselves (MARKET)') fails.push('MARKET does not translate — "The one thing \u2014 MARKET" confused the person who built this system');
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
  const NEED = ['LeadBriefing', 'buildAuditRows', 'claimRisksOf', 'corpusWarningFor', 'leadHasAudit', 'adsFactsLabel', 'PILLAR_LABEL', 'PILLAR_PRODUCT', 'dedupeOwnWords', 'trimRepeatedJobValue', 'RISK_REASONS', 'plainRisk', 'LAYER_PLAIN', 'layerPlain', 'groupAuditFindings', 'FUNNEL_STAGE_DEFS', 'PILLAR_TO_STAGE', 'normalizedLeakRows', 'groupByFunnelStage', 'funnelSvg', 'WALK_TO_STAGE', 'walkTextsByStage', 'scoreSentence', 'SIGNAL_RUNGS', 'signalRowsFor'];
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
      briefing = new Function('React', found.groupAuditFindings + '\n' + found.FUNNEL_STAGE_DEFS + '\n' + found.PILLAR_TO_STAGE + '\n' + found.normalizedLeakRows + '\n' + found.groupByFunnelStage + '\n' + found.funnelSvg + '\n' + found.WALK_TO_STAGE + '\n' + found.walkTextsByStage + '\n' + found.scoreSentence + '\n' + found.SIGNAL_RUNGS + '\n' + found.signalRowsFor + '\n' + found.RISK_REASONS + '\n' + found.plainRisk + '\n' + found.LAYER_PLAIN + '\n' + found.layerPlain + '\n' + found.adsFactsLabel + '\n' + found.PILLAR_LABEL + '\n' + found.PILLAR_PRODUCT + '\n' + found.dedupeOwnWords + '\n' + found.trimRepeatedJobValue + '\n' + found.corpusWarningFor + '\n' + found.claimRisksOf + '\n' + found.leadHasAudit + '\n' + found.buildAuditRows + '\n' + found.LeadBriefing + '\nreturn LeadBriefing;')(ReactStub);
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
          'The email led with', 'He will likely say', 'Worth asking', 'Do not say',
          'The sell']) {
          if (joined.indexOf(label) < 0) fails.push('the audit screen no longer renders "' + label + '" — a category of the approved funnel layout is dark');
        }
        for (const gone of ['The money', 'The one thing', 'The smaller leaks']) {
          if (joined.indexOf(gone) >= 0) fails.push('"' + gone + '" is back on the audit screen — its content lives at the funnel stages now, and a second copy is the exact repetition Vin flagged');
        }
        if (joined.indexOf('Jason Hicks') < 0) fails.push('the resolved contact name does not render under Who to talk to — the screen is back on the phantom lead.ownerName field, which exists nowhere and printed an em-dash beside shane.irwin@ on a live sheet');
        if (joined.indexOf('OWNER_EV_MARKER') < 0) fails.push('the code-checked owner-name evidence never reaches the screen');
        const askCount = texts.filter(t => t === 'ASKQ_MARKER').length;
        if (askCount !== 1) fails.push('askOnTheCall renders ' + askCount + ' time(s) on the audit screen, not once — it belongs in The conversation and nowhere else, or the two copies drift');
        if (joined.indexOf('OPENQ_MARKER') < 0) fails.push("a numbered leak's conversation opener never reaches the screen's Worth-asking section — the three starts Vin asked for are dark");
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

Promise.all(PENDING).then(() => {
  if (fails.length) {
    console.log(`\n✗ index.html: ${fails.length} research-request defect(s)`);
    fails.forEach(f => console.log('  ' + f));
    process.exit(1);
  }

  console.log(`\n\u2713 index.html: all ${calls.length} research request(s) go through the one builder at line ${builderLine}, which sends ${builderKeys.length} fields including every measurement nothing downstream can recover. Two hand-written bodies disagreed about seventeen of them on 2026-08-19.`);
  if (roundTrip) console.log(`\u2713 index.html: the Supabase round trip was EXECUTED, not read \u2014 leadToRow and rowToLead run on five real lead shapes. A Find lead keeps every one of its ${roundTrip.fields} stored fields, a never-researched lead does NOT read as audited, the model's draft survives a reload instead of the research-time template, the call outcome survives, an empty lead still stores nothing, and no stored field is write-only. This pair is the only door between the app and its data, it has produced nine duplicate-key collisions, and nothing in this repo had ever run it.`);
  notes.forEach(n => console.log(n));
  if (mergeStat) console.log(`\u2713 index.html: the research merge was EXECUTED, not read \u2014 all ${mergeStat.kept} fields the server's answer carries land on the lead. It used to be 200 lines inside one React function, so auditing fifty businesses at once meant writing it a second time, and its own comment names that as the disease: "the second copy is always the one that rots, because it only runs in the case nobody tests."`);
}).catch((e) => { console.log('\n\u2717 index.html: the checks could not finish \u2014 ' + (e && e.message)); process.exit(1); });
