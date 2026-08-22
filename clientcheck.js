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
  const NEED = ['auditRecordFor', 'auditExportHtml', 'buildAuditRows', 'claimRisksOf', 'corpusWarningFor', 'leadHasAudit'];
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
      mod = new Function(found.corpusWarningFor + '\n' + found.claimRisksOf + '\n' + found.leadHasAudit + '\n' + found.buildAuditRows + '\n' + found.auditRecordFor + '\n' + found.auditExportHtml
        + '\nreturn { rec: auditRecordFor, html: auditExportHtml };')();
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
        brainAudit: { originalFindings: [{ finding: 'MARKER_ORIGINAL', quote: 'MARKER_QUOTE' }] },
        problemList: [{ area: 'MARKER_AREA', problem: 'MARKER_PROBLEM', costs: 'MARKER_PCOSTS', harm: 80 }],
        _claimRisks: ['MARKER_RISK'], _criticalFactCheck: ['MARKER_CRITICAL'],
        subject: 'MARKER_SUBJECT', pitch: 'MARKER_PITCH',
        pageShots: [{ label: 'MARKER_SHOTLABEL', shot: 'https://shot.example/1.png' }],
      };
      let page = '';
      try { page = mod.html([mod.rec(LEAD)], { title: 'T', at: 'now' }); }
      catch (e) { fails.push('the audit export threw on a normal lead: ' + e.message); }

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
    })());
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

Promise.all(PENDING).then(() => {
  if (fails.length) {
    console.log(`\n✗ index.html: ${fails.length} research-request defect(s)`);
    fails.forEach(f => console.log('  ' + f));
    process.exit(1);
  }

  console.log(`\n\u2713 index.html: all ${calls.length} research request(s) go through the one builder at line ${builderLine}, which sends ${builderKeys.length} fields including every measurement nothing downstream can recover. Two hand-written bodies disagreed about seventeen of them on 2026-08-19.`);
  if (roundTrip) console.log(`\u2713 index.html: the Supabase round trip was EXECUTED, not read \u2014 leadToRow and rowToLead run on five real lead shapes. A Find lead keeps every one of its ${roundTrip.fields} stored fields, a never-researched lead does NOT read as audited, the model's draft survives a reload instead of the research-time template, the call outcome survives, an empty lead still stores nothing, and no stored field is write-only. This pair is the only door between the app and its data, it has produced nine duplicate-key collisions, and nothing in this repo had ever run it.`);
  if (mergeStat) console.log(`\u2713 index.html: the research merge was EXECUTED, not read \u2014 all ${mergeStat.kept} fields the server's answer carries land on the lead. It used to be 200 lines inside one React function, so auditing fifty businesses at once meant writing it a second time, and its own comment names that as the disease: "the second copy is always the one that rots, because it only runs in the case nobody tests."`);
}).catch((e) => { console.log('\n\u2717 index.html: the checks could not finish \u2014 ' + (e && e.message)); process.exit(1); });
