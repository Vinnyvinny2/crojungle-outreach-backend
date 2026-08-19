// ══ FUZZ THE GATES THAT DECIDE WHAT REACHES AN INBOX ═════════════════════════
// fuzz.js exercises the composer over HTTP and tests the SHAPE of an email. It
// cannot reach the functions that decide whether a claim is true, which finding
// leads, or whether an address belongs to the person being greeted — and those
// are the ones that can cost a real prospect.
//
// This loads server.js in-process and calls them directly, so a run is hundreds
// of thousands of cases in seconds rather than thousands over HTTP.
//
//   node fuzzcore.js           50k cases per gate
//   node fuzzcore.js 500000    a deep run before a big send
//
// Every invariant below is a live failure, generalised. When a new one is found,
// add it here and that class cannot come back.
const N = Number(process.argv[2]) || 50000;
const fs = require('fs');

let src = fs.readFileSync(__dirname + '/server.js', 'utf8');
src += `\nmodule.exports.__probe = { HARM_LADDER, HARM_LADDER_LAYER, URGENCY_ADJUST,
  purchaseUrgency, resolveBusinessModel, rankHarms, buildFactualSpine,
  verifyBrainEmail, insightLine, patternLineSafe, resolveMeasurements,
  parseProspectVerdict, factCheckFlagReachesProspect, greetingName, toSecondPerson,
  INTERNAL_ONLY_RUNGS };\n`;
fs.writeFileSync(__dirname + '/.probe.js', src);
const P = require(__dirname + '/.probe.js').__probe;

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const int = (n) => Math.floor(Math.random() * n);
const fails = [];
const record = (gate, name, why, sample) => {
  if (fails.some(f => f.gate === gate && f.name === name)) { fails.find(f => f.gate === gate && f.name === name).count++; return; }
  fails.push({ gate, name, why, sample: String(sample).slice(0, 170), count: 1 });
};

// Inputs chosen to hit the shapes that have broken things: empty, unicode,
// enormous, punctuation-heavy, and the exact live values that failed.
const NASTY = ['', ' ', null, undefined, 0, -1, NaN, Infinity, '\n\n', '   ', 'null', 'undefined',
  'A'.repeat(2000), '<script>x</script>', '"; DROP TABLE--', '\u0000', '😀', 'Ünïcödé',
  '{{template}}', '${injection}', '\\', '../../etc/passwd'];
const NAMES = ['Tom Freund', 'Jeffrey D. Horn', 'Deirdre L Taylor', 'Bob Smith Jr', 'Dr. Amaka Nwubah',
  'William', '', 'Mary-Jane O\'Brien', 'About Us', 'Our Team', 'JEAN-LUC DE LA CRUZ III', 'X Y'];
const MAILBOXES = ['tfreund', 'pfreund', 'jeff.horn', 'deirdre', 'info', 'office', 'deckdaddysrdu',
  'jsmith', 'bsmith', 'j.horn', 'horn', 'admin', 'a', 'firstname.lastname', 'sales'];

console.log(`\n  Fuzzing ${N.toLocaleString()} cases per gate.\n`);

// ── GATE 1: the recipient guard ──────────────────────────────────────────────
// Live failures: pfreund@ sent to Tom Freund (wrong human, unrecoverable);
// jeff.horn@ refused to Jeffrey D. Horn (silent revenue loss).
{
  const addrOk = (email, name, coName) => {
    const parts = String(name || '').trim().split(/\s+/);
    const local = String(email || '').split('@')[0].toLowerCase().replace(/[^a-z]/g, '');
    const f = String(parts[0] || '').toLowerCase().replace(/[^a-z]/g, '');
    const l = parts.slice(1).map(w => String(w).replace(/[^A-Za-z]/g, ''))
      .filter(w => w.length > 1 && !/^(jr|sr|ii|iii|iv|md|dds|dmd|do|phd|esq|cpa|pa|pc)$/i.test(w))
      .join('').toLowerCase();
    const co = String(coName || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/)
      .filter(w => w.length >= 4 && !/^(the|and|llc|inc|corp|company|group|services|service)$/.test(w));
    const isCo = co.some(w => local.includes(w)) || (co.length >= 2 && local.includes(co.map(w => w[0]).join('')));
    const personal = local.length > 2 && !isCo && !/^(info|office|hello|contact|admin|team|sales|support|help|enquir|inquir|mail|service)/.test(local);
    if (!personal || !f || !l) return true;
    const at = local.indexOf(l);
    if (at > 0) return f.startsWith(local.slice(0, at));
    if (at === 0 && local === l) return true;
    return local.includes(f) || local === (f[0] + l) || local === (f + l[0]);
  };
  let checked = 0;
  for (let i = 0; i < N; i++) {
    const name = rand(NAMES.concat(rand(NASTY)));
    const mbox = rand(MAILBOXES.concat(String(rand(NASTY) || 'x')));
    const email = `${mbox}@example.com`;
    let ok;
    try { ok = addrOk(email, name, rand(['', 'Acme LLC', 'Deck Daddy\'s LLC'])); }
    catch (e) { record('recipient', 'threw', e.message, `${email} / ${name}`); continue; }
    checked++;
    if (typeof ok !== 'boolean') record('recipient', 'non-boolean verdict', 'a guard that returns a non-boolean is read as truthy and lets everything through', `${email} / ${name} -> ${ok}`);
    // THE INVARIANT THAT MATTERS: a mailbox built from a DIFFERENT first name at
    // the same surname must never pass. This is the pfreund/Tom Freund failure.
    const parts = String(name || '').trim().split(/\s+/);
    const sur = parts.slice(1).map(w => String(w).replace(/[^A-Za-z]/g, '')).filter(w => w.length > 1 && !/^(jr|sr|ii|iii|iv|md|dds|dmd|do|phd|esq|cpa|pa|pc)$/i.test(w)).join('').toLowerCase();
    const first = String(parts[0] || '').toLowerCase().replace(/[^a-z]/g, '');
    if (sur && first && mbox === 'p' + sur && first[0] !== 'p' && ok) {
      record('recipient', 'wrong human passed', 'a different first initial at the same surname is a relative or a colleague — the one delivery error that cannot be undone', `${email} / ${name}`);
    }
  }
  console.log(`  recipient guard      ${checked.toLocaleString()} cases`);
}

// ── GATE 2: verifyBrainEmail ─────────────────────────────────────────────────
// The last thing between a fluent sentence and a false one.
{
  const FABRICATIONS = [
    ['invented percentage', 'You are losing 40% of your leads before anyone answers.'],
    ['post-contact', 'Every form submission sits unanswered until Monday morning.'],
    ['customer outcome', 'Callers who reach voicemail never call back.'],
    ['competitor count', 'Two other contractors in your area already fixed this.'],
    ['operational assumption', 'And when you are buying more leads before that is fixed, it gets worse.'],
    ['loss figure', 'That is costing you roughly $40,000 a year.'],
    ['team coping', 'Your office manager cannot keep up with the volume coming in.'],
    ['outpacing', 'It usually means demand is outpacing your ability to keep up.'],
  ];
  let leaked = 0, checked = 0;
  for (let i = 0; i < Math.min(N, 40000); i++) {
    const [label, bad] = rand(FABRICATIONS);
    // Wrap the fabrication in realistic surrounding copy, at a random position,
    // because a guard that only matches at the start is not a guard.
    const filler = ['Tyler, 260 reviews at 5 stars and you answer nearly all of them.',
      'The only way to reach you is a phone call during office hours.',
      'People comparing three options go with whichever one lets them start.',
      'There are 2 more.', 'Who is handling the site for you at the moment?'];
    const parts = [...filler];
    parts.splice(int(parts.length + 1), 0, bad);
    const body = parts.join(' ');
    let v;
    try { v = P.verifyBrainEmail(body, { permittedFigures: [260, 5], company: 'Rose', founderName: 'Tyler' }); }
    catch (e) { record('verifyBrainEmail', 'threw', e.message, body.slice(0, 90)); continue; }
    checked++;
    const passed = v && (v.ok === true || v === true);
    if (passed) { leaked++; record('verifyBrainEmail', `LEAK: ${label}`, 'this reaches a prospect as a confident false statement about their business', body.slice(0, 150)); }
  }
  console.log(`  verifyBrainEmail     ${checked.toLocaleString()} cases, ${leaked} leak(s)`);
}

// ── GATE 3: insightLine — the email's first sentence ─────────────────────────
{
  const BAD = ['You are losing 40% of your leads', 'Callers who reach voicemail never call back',
    'Every form submission sits unanswered until Monday', 'Your two biggest competitors answer at night',
    'You are leaving $40,000 on the table', 'A parent deciding at 9pm has nowhere to go'];
  const GOOD = ['The reputation is genuinely earned and the phone is the only door',
    'The work is real. The proof is almost invisible',
    'The reputation is real. Almost none of it is reaching the next customer'];
  let checked = 0;
  for (let i = 0; i < Math.min(N, 30000); i++) {
    const good = Math.random() < 0.5;
    const h = good ? rand(GOOD) : rand(BAD);
    let out;
    try { out = P.insightLine({ headline: h }); } catch (e) { record('insightLine', 'threw', e.message, h); continue; }
    checked++;
    if (!good && out) record('insightLine', 'fabrication in the opening sentence', 'this is the first thing the owner reads, and it bypasses the email verifier whenever the composed version ships', h);
    if (good && !out) record('insightLine', 'over-blocked a real headline', 'removing the best sentence the brain writes', h);
    if (out && /[<>{}$]/.test(out)) record('insightLine', 'markup survived', 'unescaped characters reach the body', out);
  }
  // Random garbage must never throw or emit markup.
  for (let i = 0; i < 5000; i++) {
    try { const o = P.insightLine({ headline: rand(NASTY) }); if (o && /[<>{}$]/.test(o)) record('insightLine', 'markup from junk input', '', String(o)); }
    catch (e) { record('insightLine', 'threw on junk', e.message, ''); }
  }
  console.log(`  insightLine          ${checked.toLocaleString()} cases`);
}

// ── GATE 4: patternLineSafe ──────────────────────────────────────────────────
{
  // ══ NAMING THE BUSINESS IS NOW REPAIRED, NOT REJECTED ══════════════════
  // "Rose Garage Door usually sees this" used to be discarded. It is now
  // rewritten to "a business like this usually sees this" — the proper noun was
  // the only thing wrong with it, and losing the whole line dropped the email
  // back to a ladder rung, which is what made the findings read as weak.
  //
  // So it moves out of BAD, and the property asserted below changes: not "is it
  // rejected" but "does their name survive into the output". A fuzzer that
  // enforces stale behaviour blocks the fix it was written to protect.
  const BAD = ['your phone-only setup usually survives because it worked when you were smaller',
    'a crew that size usually runs 3 jobs a week',
    'this usually means your reviews are thin', 'phone-only intake survives'];
  const GOOD = ['phone-only intake nearly always survives because it worked when the business was smaller and nobody chose to change it',
    'when a site says one thing and the Google listing says another it is usually two people updating them a year apart'];
  let checked = 0;
  for (let i = 0; i < Math.min(N, 30000); i++) {
    const good = Math.random() < 0.5;
    const t = good ? rand(GOOD) : rand(BAD);
    let ok;
    // The company name is how it detects "Rose Garage Door usually sees this".
    // Calling without it was a fault in this harness, not in the validator —
    // worth keeping as a note, because a fuzzer that lies is worse than none.
    try { ok = P.patternLineSafe(t, { company: 'Rose Garage Door' }); }
    catch (e) { record('patternLineSafe', 'threw', e.message, t); continue; }
    checked++;
    const passed = ok === true || (ok && ok.ok === true);
    if (!good && passed) record('patternLineSafe', 'claim about THEM passed as a category truth', 'a guessed pattern asserted about their business is a false statement they can see is false', t);
    // The repair must never leave the company name in the line it keeps.
    const _rep = P.patternLineSafe('Rose Garage Door usually sees this', { company: 'Rose Garage Door' });
    if (_rep && _rep.ok && /rose|garage/i.test(String(_rep.line || ''))) {
      record('patternLineSafe', 'business name survived the repair',
        'the line still reads as a claim about them specifically, which is the thing the repair exists to remove', String(_rep.line));
    }
  }
  console.log(`  patternLineSafe      ${checked.toLocaleString()} cases`);
}

// ── GATE 5: resolveBusinessModel — can only ever SUBTRACT findings ───────────
{
  const corpus = 'We deliver turn-key renovations for REO funds and PE firms in 24 states.';
  let checked = 0;
  for (let i = 0; i < Math.min(N, 30000); i++) {
    const claim = {
      model: rand(['B2B_INSTITUTIONAL', 'LOCAL_CONSUMER', 'NATIONAL_REMOTE', 'REFERRAL_PROFESSIONAL', 'MADE_UP', rand(NASTY)]),
      evidence: rand(['turn-key renovations for REO funds and PE firms in 24 states',
        'We serve Fortune 500 clients nationwide exclusively', '', rand(NASTY)]),
      why: 'x',
    };
    let r;
    try { r = P.resolveBusinessModel(claim, rand([corpus, '', rand(NASTY)])); }
    catch (e) { record('businessModel', 'threw', e.message, JSON.stringify(claim).slice(0, 90)); continue; }
    checked++;
    if (!r || !r.model) { record('businessModel', 'no model returned', 'a missing model is read as unknown and silently changes which findings fire', JSON.stringify(r)); continue; }
    // THE SAFETY PROPERTY: anything that silences findings must be verified.
    if (r.model !== 'LOCAL_CONSUMER' && !r.verified) {
      record('businessModel', 'unverified model would silence findings', 'suppressing a true finding on evidence we cannot confirm is the one way this can do damage', JSON.stringify(r).slice(0, 150));
    }
    if (!['LOCAL_CONSUMER', 'B2B_INSTITUTIONAL', 'NATIONAL_REMOTE', 'REFERRAL_PROFESSIONAL'].includes(r.model)) {
      record('businessModel', 'unknown model escaped', 'an unrecognised model reaches the ladder', String(r.model));
    }
  }
  console.log(`  businessModel        ${checked.toLocaleString()} cases`);
}

// ── GATE 6: the ladder — every rung mapped, urgency never inverts ────────────
{
  const ids = P.HARM_LADDER.map(h => h.id);
  const unmapped = ids.filter(id => !P.HARM_LADDER_LAYER[id]);
  if (unmapped.length) record('ladder', 'rung with no Hormozi layer', 'it can never win the binding-layer tiebreak and nothing reports it', unmapped.join(', '));
  const phantom = Object.keys(P.HARM_LADDER_LAYER).filter(id => !ids.includes(id));
  if (phantom.length) record('ladder', 'phantom id in the layer map', 'a mapping that matches nothing already cost this system a working filter once', phantom.join(', '));
  for (const [urg, adj] of Object.entries(P.URGENCY_ADJUST)) {
    const bad = Object.keys(adj).filter(id => !ids.includes(id));
    if (bad.length) record('ladder', `phantom id in URGENCY_ADJUST.${urg}`, 'the adjustment silently does nothing', bad.join(', '));
  }
  // Direction: an emergency trade must never rank pricing above access, and a
  // considered one must never rank access above the offer.
  const sc = (h, urg) => Number(h.harm) + (Number(h.novel) / 100) * 7 + ((P.URGENCY_ADJUST[urg] || {})[h.id] || 0);
  const access = P.HARM_LADDER.find(h => h.id === 'no_after_hours');
  const price = P.HARM_LADDER.find(h => h.id === 'no_published_pricing');
  if (access && price) {
    if (sc(price, 'EMERGENCY') > sc(access, 'EMERGENCY')) record('ladder', 'emergency ranks pricing above access', 'nobody price-shops a flooded basement at 11pm', '');
    if (sc(access, 'CONSIDERED') > sc(price, 'CONSIDERED')) record('ladder', 'considered ranks access above the offer', 'nobody books elective surgery at 11pm — what they learn before calling is the decision', '');
  }
  console.log(`  ladder integrity     ${ids.length} rungs, ${Object.keys(P.URGENCY_ADJUST).length} urgency classes`);
}

// ── GATE 7: the prospect-sim parser — a partial verdict puts words in his mouth
{
  let checked = 0;
  for (let i = 0; i < Math.min(N, 20000); i++) {
    const junk = rand(['{"verdict":"delete","reaction":"no"}', '{"verdict":"maybe"}', 'not json',
      '```json\n{"verdict":"reply","reaction":"ok","wouldReply":"x"}\n```', '[1,2]', '{}', rand(NASTY)]);
    let v;
    try { v = P.parseProspectVerdict(junk); } catch (e) { record('prospectSim', 'threw', e.message, String(junk).slice(0, 80)); continue; }
    checked++;
    if (v && (!v.verdict || !v.reaction)) record('prospectSim', 'partial verdict returned', 'a panel reading "Read as Kelly — undefined" puts words in his mouth that nothing said', JSON.stringify(v));
    if (v && !['reply', 'ignore', 'delete'].includes(v.verdict)) record('prospectSim', 'invalid verdict escaped', '', String(v.verdict));
    if (v && /[<>]/.test(v.reaction + v.wouldReply)) record('prospectSim', 'markup survived', '', JSON.stringify(v).slice(0, 90));
  }
  console.log(`  prospect sim parser  ${checked.toLocaleString()} cases`);
}

// ── GATE 8: withdrawal precision ─────────────────────────────────────────────
{
  const email = 'Brandon, a business with fewer reviews than yours is ranking above you. No price appears anywhere on the pages we read. Who is handling the site?';
  let checked = 0;
  for (let i = 0; i < Math.min(N, 20000); i++) {
    const reaching = Math.random() < 0.5;
    const flag = reaching
      ? rand([`CRITICAL: the copy states "no price appears anywhere on the pages we read" but we measured prices.`,
              `MISMATCH: "a business with fewer reviews than yours is ranking above you" contradicts the rank.`,
              `CRITICAL: the claim is backwards and the prospect can disprove it.`, ''])
      : rand([`The prospect-facing pitch does not make this claim, so it does not appear in the email, but the internal reasoning is flagged.`,
              `no flag on the pitch itself, but the internal note should have mirrored that qualifier.`,
              `CRITICAL: the audit claims "thirty years across four states" which contradicts the measurement.`]);
    let r;
    try { r = P.factCheckFlagReachesProspect(flag, email); }
    catch (e) { record('withdrawal', 'threw', e.message, flag.slice(0, 80)); continue; }
    checked++;
    if (reaching && !r) record('withdrawal', 'FALSE CLEAR', 'a flag about text IN the email was cleared — a false claim reaching an owner cannot be taken back', flag.slice(0, 150));
    if (!reaching && r) record('withdrawal', 'false withdraw', 'a sendable lead destroyed by a contradiction the owner cannot see', flag.slice(0, 150));
  }
  console.log(`  withdrawal gate      ${checked.toLocaleString()} cases`);
}

// ── GATE 9: THE COMPOSER, JUDGED BY OUR OWN VERIFIERS ────────────────────────
// The system owns better judges than any hand-written rule in this file:
// verifyBrainEmail, and insightLine's fabrication battery. They have never been
// pointed at our OWN output.
//
// That is exactly how "has nowhere to go" survived — the ladder generated it,
// CLAIM VERIFY rejected it, and on every affected lead the two never met. A
// system that writes what it refuses to accept is the sharpest bug class there
// is, because both halves look correct in isolation.
{
  const rungs = P.HARM_LADDER;
  let checked = 0;
  for (const h of rungs) {
    // ══ A RUNG THAT CANNOT REACH AN EMAIL CANNOT BE JUDGED BY THE EMAIL ══
    // From 2026-08-18 the seven review-metric rungs are INTERNAL_ONLY_RUNGS:
    // measured, ranked, written into the audit and the call sheet, and never
    // sent. verifyBrainEmail now refuses a body that names his reviews unless
    // the code put the word there, which is the point of that guard — and it
    // means low_rating's "people filter by rating before they read a single
    // word" is correctly refused by a gate it can never be put in front of.
    // Judging it here would report a bug that cannot happen, and this harness
    // has already produced two false failures by wrapping rung text in
    // conditions production never creates.
    if (P.INTERNAL_ONLY_RUNGS && P.INTERNAL_ONLY_RUNGS[h.id]) continue;
    for (const field of ['costs', 'reframe']) {
      const t = h[field];
      if (typeof t !== 'string' || !t) continue;
      checked++;
      // ══ THE WRAPPER MUST BE A REALISTIC EMAIL ═══════════════════════════
      // The first version wrapped each sentence in a 23-word stub and got seven
      // rejections reading "too short to carry the finding and the ask" — a
      // verdict on MY wrapper, not on the rung. A fuzzer that lies is worse
      // than no fuzzer, because it sends you hunting a bug that is not there.
      //
      // So the sentence is placed inside an email of the length the composer
      // actually produces, and only the rung's own words vary.
      // ══ THE WRAPPER MUST BE FORMATTED LIKE A REAL EMAIL TOO ═════════════
      // Seven sentences joined with spaces is a single block, and the verifier
      // now refuses those — 67% of B2B email is read on a phone and a wall of
      // text is abandoned. That verdict was about MY wrapper, not about the
      // rung, and it flagged seventeen innocent sentences.
      //
      // Second time this harness has lied in the same way. The lesson holds: a
      // fuzzer that builds unrealistic input measures itself.
      const body = [
        `${String(h.finding || 'We measured something on their site')}.`,
        '',
        `${t}. A garage door replacement runs $1k-$4k.`,
        '',
        `Who is handling the site for you at the moment?`,
      ].join('\n');
      let v;
      // The option is `figures`, as STRINGS — "permittedFigures" was my
      // invention and every number in the wrapper came back unpermitted. Call
      // it exactly as production does or the harness measures itself.
      try {
        v = P.verifyBrainEmail(body, {
          spine: String(h.finding || ''),
          figures: ['260', '5', '2', '1', '4'],
          money: 'a garage door replacement runs $1k-$4k',
          earned: '260 reviews at 5 stars, and you have answered nearly every one we read',
          count: 2,
        });
      }
      catch (e) { record('self-judgement', 'verifier threw on our own copy', e.message, t.slice(0, 90)); continue; }
      const rejected = v && v.ok === false;
      if (rejected) {
        record('self-judgement', `our own ${field} is rejected by our own verifier`,
          `rung "${h.id}" writes a sentence the email verifier refuses. On every lead carrying it, the review panel fills with a warning about our own template — and a guard that fires on itself teaches the operator to ignore real ones`,
          `${t.slice(0, 110)}  [${(v.reasons || v.why || []).toString().slice(0, 60)}]`);
      }
    }
  }
  console.log(`  composer self-judged ${checked} rung sentence(s) through verifyBrainEmail`);
}

// ── GATE 10: DETERMINISM ─────────────────────────────────────────────────────
// The logs assert it outright: "this ordering IS reproducible — the same lead
// scores the same every run." If that is false, every fix validated on a single
// run is unproven, and a lead that looked right yesterday can be wrong today
// with nothing changed.
{
  let checked = 0, drift = 0;
  for (let i = 0; i < Math.min(N, 3000); i++) {
    const ids = [...P.HARM_LADDER].sort(() => Math.random() - 0.5).slice(0, 2 + int(6)).map(h => h.id);
    const m = {
      purchaseUrgency: rand(['EMERGENCY', 'CONSIDERED', 'UNKNOWN']),
      bindingLayer: rand(['OFFER', 'LEADS', 'CONVERSION', 'THROUGHPUT', null]),
      reviewCount: int(900), rating: 4 + Math.random(), reviewsRead: int(40),
      ownerReplies: int(40), tradeWord: rand(['plumber', 'lasik surgery', '']),
    };
    let a, b;
    try { a = P.rankHarms(m); b = P.rankHarms(m); }
    catch (e) { record('determinism', 'rankHarms threw', e.message, JSON.stringify(m).slice(0, 90)); continue; }
    checked++;
    const key = (r) => (r && r.byHarm ? r.byHarm.map(h => `${h.id}:${h.opener}`).join('|') : String(r));
    if (key(a) !== key(b)) {
      drift++;
      record('determinism', 'same input, different ranking',
        'the same lead scores differently run to run, so no fix validated on one run is proven and a correct email can become a wrong one with nothing changed',
        `${key(a).slice(0, 80)}  vs  ${key(b).slice(0, 80)}`);
    }
  }
  console.log(`  determinism          ${checked.toLocaleString()} double-runs, ${drift} drift(s)`);
}

// ── GATE 11: METAMORPHIC RELATIONS ───────────────────────────────────────────
// The hard part of testing this system is that "is this output right?" needs a
// real business to answer. "If I change ONE input, does the output move the
// right way?" needs nothing — so it can run millions of times.
//
// The LASIK misordering was a broken RELATION, not a broken value: after-hours
// outranked the offer on a business nobody contacts at night. A relation test
// catches that without knowing anything about Dr Horn.
{
  const rank = (m) => { try { return P.rankHarms(m) || {}; } catch { return {}; } };
  const openerOf = (r, id) => { const h = (r.byHarm || []).find(x => x.id === id); return h ? Number(h.opener) : null; };
  const base = () => ({ reviewCount: 200, rating: 4.8, reviewsRead: 40, ownerReplies: 30,
    tradeWord: 'plumber', purchaseUrgency: 'UNKNOWN', bindingLayer: null,
    noAfterHours: true, noPublishedPricing: true, noLeadMagnet: true, phoneMismatch: true });
  let checked = 0;

  const RELATIONS = [
    ['emergency never lowers after-hours', () => {
      const a = openerOf(rank({ ...base(), purchaseUrgency: 'UNKNOWN' }), 'no_after_hours');
      const b = openerOf(rank({ ...base(), purchaseUrgency: 'EMERGENCY' }), 'no_after_hours');
      return (a === null || b === null) ? true : b >= a;
    }, 'a flooded basement at 11pm makes being shut MORE costly, never less'],

    ['considered never raises after-hours', () => {
      const a = openerOf(rank({ ...base(), purchaseUrgency: 'UNKNOWN' }), 'no_after_hours');
      const b = openerOf(rank({ ...base(), purchaseUrgency: 'CONSIDERED' }), 'no_after_hours');
      return (a === null || b === null) ? true : b <= a;
    }, 'nobody books elective surgery at 11pm — this is the LASIK failure'],

    ['considered never lowers the offer', () => {
      const a = openerOf(rank({ ...base(), purchaseUrgency: 'UNKNOWN' }), 'no_published_pricing');
      const b = openerOf(rank({ ...base(), purchaseUrgency: 'CONSIDERED' }), 'no_published_pricing');
      return (a === null || b === null) ? true : b >= a;
    }, 'what a buyer learns before calling IS the considered decision'],

    ['the binding layer never demotes its own findings', () => {
      const a = openerOf(rank({ ...base(), bindingLayer: null }), 'no_published_pricing');
      const b = openerOf(rank({ ...base(), bindingLayer: 'OFFER' }), 'no_published_pricing');
      return (a === null || b === null) ? true : b >= a;
    }, 'a finding inside the diagnosed constraint must never rank lower for being there'],

    ['the company name never changes the ranking', () => {
      const a = rank({ ...base(), company: 'Rose Garage Door' });
      const b = rank({ ...base(), company: 'Zzz Industries LLC' });
      const ka = (a.byHarm || []).map(h => h.id).join('|');
      const kb = (b.byHarm || []).map(h => h.id).join('|');
      return ka === kb;
    }, 'which finding leads must depend on measurements, never on the name'],
  ];

  for (let i = 0; i < Math.min(N, 2000); i++) {
    for (const [name, fn, why] of RELATIONS) {
      checked++;
      let held;
      try { held = fn(); } catch (e) { record('metamorphic', `${name} threw`, e.message, ''); continue; }
      if (!held) record('metamorphic', name, why, '');
    }
  }
  console.log(`  metamorphic          ${checked.toLocaleString()} relation checks`);
}

// ── REPORT ───────────────────────────────────────────────────────────────────
console.log('');
if (!fails.length) {
  console.log('  ✓ every gate held on every case');
} else {
  console.log(`  ${fails.length} FAILURE(S):`);
  for (const f of fails.sort((a, b) => b.count - a.count)) {
    console.log('');
    console.log(`  ⛔ [${f.gate}] ${f.name} — ${f.count} time(s)`);
    if (f.why) console.log(`     ${f.why}`);
    if (f.sample) console.log(`     "${f.sample}"`);
  }
}
try { fs.unlinkSync(__dirname + '/.probe.js'); } catch {}
process.exit(fails.length ? 1 : 0);
