const SITE_GAP_TERMS = [
  // `need` is the readable precondition, and it is split the way
  // readFindIcpSignals states the rule at its own head: A POSITIVE IS A
  // POSITIVE ON ANY PAGE; AN ABSENCE NEEDS READABLE TEXT. 'markup' is 500 raw
  // bytes and is enough to say a tag IS there; 'home' additionally needs
  // FIND_ABSENCE_TEXT_FLOOR of real text before we may say a tag is NOT.
  // Without the split, a JavaScript-painted shell - which has no readable text
  // by definition - suppressed the one fault that describes it.
  { id: 'noindex',     group: 'seo',      points: 5, need: 'markup',  family: 'search_absence', short: 'set to noindex', say: 'their own code tells search engines not to index the page' },
  { id: 'noSchema',    group: 'geo',      points: 5, need: 'home',    family: 'search_absence', short: 'no schema', say: 'no business schema in their code, so AI search has nothing structured to read' },
  { id: 'jsOnly',      group: 'geo',      points: 4, need: 'markup',  family: 'search_absence', short: 'JS-only', say: 'the page is painted by JavaScript, so a crawler that does not run it sees almost nothing' },
  { id: 'blocksAi',    group: 'geo',      points: 2, need: 'robots',  family: 'search_absence', short: 'blocks AI', say: 'their robots.txt tells the AI crawlers to stay out' },
  { id: 'datedBuild',  group: 'build',    points: 5, need: 'markup',  family: 'dated_site',     short: 'dated build', say: 'the build is years out of date' },
  { id: 'diyBuilder',  group: 'build',    points: 3, need: 'markup',  family: 'dated_site',     short: 'DIY build', say: 'it is a DIY website-builder template' },
  { id: 'noForm',      group: 'converts', points: 4, need: 'contact', family: 'conversion_leak', short: 'no form', say: 'there is no enquiry form anywhere we read' },
  { id: 'noClickToCall', group: 'converts', points: 3, need: 'contact', family: 'conversion_leak', short: 'no tap-to-call', say: 'the phone number is not tappable on a phone' },
  { id: 'weakTitle',   group: 'seo',      points: 2, need: 'home',    family: 'search_absence', short: 'weak title', say: 'the page title is a default, so search results show nothing about what they do' },
  { id: 'thinAlt',     group: 'seo',      points: 1, need: 'home',    family: 'search_absence', short: 'no alt text', say: 'most images carry no alt text' },
];
const SITE_GAP_MAX = 25;
const SITE_GAP_WORD = (n) => n >= 16 ? 'poor' : n >= 10 ? 'weak' : n >= 4 ? 'fair' : 'strong';
const SITE_LOOKS_FAULTS = [
  { id: 'oldDesign', points: 3, say: 'the design looks years out of date' },
  { id: 'agingDesign', points: 1, say: 'the design is starting to show its age' },
  { id: 'template', points: 2, say: 'it is an off-the-shelf template nobody has made their own' },
  // ══ ROUND 142: THE MOBILE QUESTION LEFT THIS LIST ══════════════════════
  // It asked the eyes whether the page is laid out for a desktop only - from
  // a DESKTOP screenshot. The image cannot answer it, and on the 2026-09-11
  // run it never once fired: two of the eleven points here were dead.
  //
  // It is not lost. readSiteAge already marks a missing viewport meta as a
  // VISIBLE age marker, read free from markup, and that feeds datedBuild in
  // the code half which now lands in this verdict. The question is answered
  // where it can be answered, and asked nowhere it cannot.
  { id: 'cheapPhotos', points: 1, say: 'the pictures are stock, stretched or blurry' },
  { id: 'notCredible', points: 2, say: 'a stranger landing here would not trust them with the job' },
];
// The verdict, PURE, over the answers the eyes returned. A boot check executes
// this on fixtures rather than reading it, and every consumer reads this one
// derivation — the rep's cell, the row, the toggle and the log line cannot
// disagree about a business the way two hand-kept copies always do.
// ══ ROUND 142: THE FREE READ ALREADY KNEW, AND THIS IGNORED IT ═══════════
// Round 141 shipped this reading the picture alone, and on the ten-lead run
// of 2026-09-11 it returned 'modern' on all nine leads it judged. The toggle
// it exists for collected nothing.
//
// Two faults, and the second is the one that matters. The band started at 2
// while 'the design is starting to show its age' is worth 1, so the three
// leads the eyes DID flag still read modern - Tranquility Place was described
// in its own verdict as a "clean but dated design" and graded modern.
//
// And the code read, which costs nothing and had already run, was saying so
// out loud on the same leads: Brick and Stone "the build is years out of
// date; it is a DIY website-builder template"; Tranquility Place "a DIY
// website-builder template; there is no enquiry form"; Journey Treatment
// "the build is years out of date". Every one of those is something a
// VISITOR meets, measured for free, and thrown away by a verdict that only
// looked at the picture. Vin, 2026-09-11: "are we reading the code of the
// website - the code tells us a lot as well and it shouldn't cost anything
// more".
//
// So the verdict is both halves. The free half is the build and converts
// groups of SITE_GAP_TERMS - read from the group, never a hand-kept list of
// ids, so a fault added to those groups arrives here by itself. The invisible
// half (schema, alt text, robots, titles) stays out: it is real, it feeds the
// audit, and no visitor can see it.
//
// DATED AT ONE POINT (Vin, 2026-09-11: "'Starting to show its age' counts as
// dated"). He asked for the fair AND bad websites; a site with one visible
// fault is not a modern one.
const SITE_LOOKS_DATED = 1;
const SITE_LOOKS_BAD = 6;
// WHICH CODE FAULTS A VISITOR CAN SEE, declared once. The build group (a
// build years out of date, an untouched DIY template) and the converts group
// (no enquiry form, a phone that will not dial) are things a person meets on
// the page. The geo and seo groups - schema, robots, titles, alt text - are
// real, feed the audit, and are invisible to everybody who is not a crawler.
const SITE_LOOKS_VISIBLE_GROUPS = ['build', 'converts'];
const readSiteLooks = (v, notLookedWhy, codeFaults) => {
  // FILTERED HERE, not by the caller. This round's own check caught it: handed
  // a schema fault the verdict counted it, because the function trusted
  // whoever called it to have filtered first. A rule that depends on a caller
  // remembering is the shape that breaks the day somebody adds a second call
  // site - so the one declaration lives with the function that reads it, and
  // the caller may now hand over every fault it has.
  const _code = (Array.isArray(codeFaults) ? codeFaults : [])
    .filter(f => f && SITE_LOOKS_VISIBLE_GROUPS.indexOf(f.group) >= 0);
  const _codeScore = _code.reduce((n, f) => n + (Number(f && f.points) || 0), 0);
  const _codeIds = _code.map(f => f && f.id).filter(Boolean);
  const _codeSay = _code.map(f => f && f.say).filter(Boolean);
  const _band = (n) => n >= SITE_LOOKS_BAD ? 'bad' : n >= SITE_LOOKS_DATED ? 'dated' : 'modern';
  // The eyes could not judge. That is no longer blindness: if the free read
  // found something a visitor meets, this lead is still judged, and the row
  // says the verdict rests on their markup alone. Only when BOTH halves have
  // nothing is it unknown - and a clean markup read with no picture IS
  // unknown, because a site can have perfect code and still look terrible.
  const _unknown = (why) => (_code.length
    ? { looks: _band(_codeScore), measured: true, score: _codeScore, faults: _codeIds,
        why: `${_codeSay.join('; ')} - all of it read free from their own markup. Nobody looked at the page itself: ${String(why || '').trim()}` }
    : { looks: 'unknown', measured: false, score: null, faults: [], why });
  // The SECOND argument is the reason nobody looked - a drop, a switched-off
  // setting, a dead site, the per-lead credit cap. It reaches the row instead of
  // one flat sentence, because "we chose not to buy a picture" and "we bought
  // one and it was a block page" are different facts about this business.
  if (!v || typeof v !== 'object') return _unknown(String(notLookedWhy || '').trim()
    || 'nobody looked at their homepage, so nothing about how it looks is claimed either way');
  if (v.isRealHomepage === false) return _unknown('the picture that came back was a block, error or parking page and not their homepage, so nothing about their design is claimed');
  if (v.fullyRendered === false) return _unknown('the picture caught their page still loading, so nothing missing from it may be called missing');
  const _era = String(v.designEra || '').toLowerCase();
  if (!['current', 'aging', 'old'].includes(_era)) return _unknown('the eyes came back with no verdict on the design, so how their site looks is unmeasured');
  const _hit = {
    oldDesign: _era === 'old',
    agingDesign: _era === 'aging',
    // An absent answer is NOT a fault. Only an explicit true (and, for
    // credibility, an explicit false) may score against a business.
    template: v.templateUntouched === true,
    cheapPhotos: v.photosLookCheap === true,
    notCredible: v.looksCredible === false,
  };
  const _faults = SITE_LOOKS_FAULTS.filter(f => _hit[f.id] === true);
  const _score = _faults.reduce((n, f) => n + f.points, 0) + _codeScore;
  const _seen = String(v.whatAVisitorSees || '').trim();
  return {
    looks: _band(_score),
    measured: true,
    score: _score,
    faults: _faults.map(f => f.id).concat(_codeIds),
    // Both halves in one sentence, the eyes first, so a rep reading the row
    // sees what a visitor meets before what a crawler meets.
    why: ((_faults.length || _codeSay.length)
      ? _faults.map(f => f.say).concat(_codeSay).join('; ')
      : 'a visitor lands on a current-looking page with nothing plainly wrong with it')
      + (_seen ? ` — ${_seen}` : ''),
  };
};
// Whether THIS lead earns the render, decided in one place and named when the
// answer is no. notIcp is tested FIRST and on purpose: a franchise, a branch
// outlet or a chain is refused before a credit can move, which is the rule the
// chain read already states where it sits — the site read is already spent and
const gap=(id)=>SITE_GAP_TERMS.find(t=>t.id===id);
const cases=[
 ["SLC Med Spa (eyes found nothing wrong)", {isRealHomepage:true,fullyRendered:true,designEra:"current",templateUntouched:false,photosLookCheap:false,looksCredible:true,whatAVisitorSees:"dark, modern layout, clear call-to-action button"}, ["diyBuilder","noClickToCall"]],
 ["Winns Plumbing (eyes: professional)", {isRealHomepage:true,fullyRendered:true,designEra:"current",templateUntouched:false,photosLookCheap:false,looksCredible:true,whatAVisitorSees:"professional, prominent call-to-action buttons"}, ["diyBuilder","noForm"]],
 ["Locust Pump (eyes: professional)", {isRealHomepage:true,fullyRendered:true,designEra:"current",templateUntouched:false,photosLookCheap:false,looksCredible:true,whatAVisitorSees:"professional, contact info prominent"}, ["diyBuilder","noForm"]],
 ["genuinely old page, clean markup", {isRealHomepage:true,fullyRendered:true,designEra:"old",templateUntouched:true,photosLookCheap:true,looksCredible:false,whatAVisitorSees:"1990s table layout"}, []],
 ["NO picture at all, faulty markup", null, ["diyBuilder","noClickToCall"]],
];
for(const [name,v,ids] of cases){
  const cf=ids.map(gap);
  const r=readSiteLooks(v,"the render timed out",cf);
  console.log(String(name).padEnd(42),"->",String(r.looks).padEnd(7),"score",String(r.score).padEnd(4),"measured",String(r.measured).padEnd(5),"| eyes faults:",SITE_LOOKS_FAULTS.filter(f=>r.faults.includes(f.id)).length,"| code:",(ids.join("+")||"none"),"=",cf.reduce((n,f)=>n+f.points,0));
}
console.log("");
console.log("bad at >=",SITE_LOOKS_BAD,"  dated at >=",SITE_LOOKS_DATED);
console.log("the eyes can score at most  ",SITE_LOOKS_FAULTS.reduce((n,f)=>n+f.points,0));
console.log("visible markup can score    ",SITE_GAP_TERMS.filter(t=>SITE_LOOKS_VISIBLE_GROUPS.includes(t.group)).reduce((n,t)=>n+t.points,0));
console.log("visible markup terms        ",SITE_GAP_TERMS.filter(t=>SITE_LOOKS_VISIBLE_GROUPS.includes(t.group)).map(t=>t.id+"("+t.points+")").join("  "));
