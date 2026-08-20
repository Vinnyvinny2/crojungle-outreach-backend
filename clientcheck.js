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
