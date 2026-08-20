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
  let fnSrc = null;
  walk(ast, (n) => {
    if (n.type === 'VariableDeclarator' && n.id && n.id.name === 'criticalClaimsOf' && n.init) {
      fnSrc = src.slice(n.init.start, n.init.end);
    }
  });
  if (!fnSrc) {
    fails.push('criticalClaimsOf is gone, so nothing separates a CRITICAL fabrication from an advisory note and Approve is enabled over both');
  } else {
    let fn;
    try { fn = new Function('return ' + fnSrc)(); } catch (e) { fn = null; }
    if (!fn) fails.push('criticalClaimsOf no longer compiles standalone, so it cannot be verified');
    else {
      if (fn({ _claimRisks: ['fact-check: CRITICAL: wrong city, wrong rank'] }).length !== 1) {
        fails.push('a CRITICAL fact-check claim is not recognised, so the fabricated audit that reached Donna Krummen approves cleanly again');
      }
      if (fn({ _claimRisks: ['marketing jargon banned in the email voice'] }).length !== 0) {
        fails.push('an advisory note is being treated as CRITICAL, which blocks approval on every routine flag and teaches the operator to want the gate gone');
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
  const NEED = ['auditRecordFor', 'auditExportHtml', 'buildAuditRows'];
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
      mod = new Function(found.buildAuditRows + '\n' + found.auditRecordFor + '\n' + found.auditExportHtml
        + '\nreturn { rec: auditRecordFor, html: auditExportHtml };')();
    } catch (e) {
      fails.push('the audit export no longer compiles standalone, so it cannot be verified: ' + e.message);
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

// 7. AND EVERY MERGE GOES THROUGH IT. A second call site that assembles the
// lead by hand is the same defect as a second research body, one stage later.
{
  let merges = 0;
  walk(ast, (n) => {
    if (n.type === 'CallExpression' && n.callee && n.callee.name === 'applyResearchResult') merges++;
  });
  if (!merges) fails.push('nothing calls applyResearchResult — the merge exists but the research path is applying results some other way');
}

if (fails.length) {
  console.log(`\n✗ index.html: ${fails.length} research-request defect(s)`);
  fails.forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log(`\n\u2713 index.html: all ${calls.length} research request(s) go through the one builder at line ${builderLine}, which sends ${builderKeys.length} fields including every measurement nothing downstream can recover. Two hand-written bodies disagreed about seventeen of them on 2026-08-19.`);
if (mergeStat) console.log(`\u2713 index.html: the research merge was EXECUTED, not read \u2014 all ${mergeStat.kept} fields the server's answer carries land on the lead. It used to be 200 lines inside one React function, so auditing fifty businesses at once meant writing it a second time, and its own comment names that as the disease: "the second copy is always the one that rots, because it only runs in the case nobody tests."`);
