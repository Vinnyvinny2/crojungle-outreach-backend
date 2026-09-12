#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// THE RESEARCH ROUTE, DRIVEN END TO END OVER A FAKE NETWORK.
//
// The client half of this system has batchcheck.js: fifty leads through the
// real runner with a fake network under it. The server half had 200+ boot
// checks — every one exercising a FUNCTION — and nothing that ever drove a
// whole request start to finish. Every "computed but not passed", every gate
// pointed at the wrong object, every response field dropped one line before
// use lived in the seams BETWEEN the functions, which is exactly where a
// boot check cannot look.
//
// This boots the real server.js as a child process, points fetchT's
// FAKE_UPSTREAM seam at a local fixture server (Firecrawl, Places, Apify,
// Anthropic, Hunter, and the business's own site), submits real leads through
// POST /api/research-async, polls GET /api/research-job/:id like the client
// does, and asserts on the payload the client would receive.
//
// THE FIXTURES ARE THE CONTRACT. Every shape here was read off server.js's
// own call sites (the 2026-08-22 contract map): Apify answers with a BARE
// ARRAY and must return >=60% of the profile's review count or the truncation
// guard refuses the whole mine; Places details is the authority for
// reviewCount; a review-mine evidence quote must survive a punctuation-
// stripped four-word-window match against the review corpus; an audit quote
// must appear verbatim on a page we read. A harness whose fixtures drift from
// production shapes is the recorded "test harness that lies", so when a
// fixture is load-bearing the assertion says which rule it exists to satisfy.
//
// Scenarios, each a different company so the audit cache's company isolation
// (PART 4 §19) is never crossed:
//   A  the golden lead — full audit, ladder alive, spine built, spend counted
//   B  preflight — a missing Anthropic key is refused with zero network calls
//   C  a dead Apify token — the account latch, the audit still completes
//   D  a brain husk — the BRAIN GATE 422 with partialData intact
//   E  Firecrawl out of credits — the latch, the bounded hold, the refusal
//   F  (second boot) the day ceiling — lead one finishes OVER budget
//      (never mid-lead), lead two is refused naming the setting
//   G  calling mode — the paid owner wave is not bought
//   H  the Find-tab contact read — a plainly readable site costs ZERO
//      Firecrawl credits, all three ICP signals are measured, the owner and
//      the address come off pages nobody paid for
//   H2 the same read on a site that refuses a plain fetch — and ONLY then
//      does a credit move
//   H3 no website at all — every site-derived signal is null, never false
//   H4 the contact route refuses before it spends
//   R0 (round 124) the Find press writes the server-owned queue
//   P  (round 143) what the press DOES to each business Google hands it -
//      the trade review floor, the closed listing, round 139's branch-URL
//      drop, the rating ceiling, the multi-metro count, the call lead and
//      the FIND YIELD report. Every one of those was merged and unexecuted
//      while the press's own Google answered nothing.
//   R1 a read run claims, reads, stamps and finishes with no browser
//      attached; the four hand actions are stamps, never deletes
//   R2 Cancel stops the draw and releases what was never reached
//   R3 a run that breaks ends failed with a reason, never stays running
//   R4 (third boot) a live run resumes after a restart, a stalled one is
//      failed and its unread leads go back to the queue
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const http = require('http');
const { spawn } = require('child_process');

const SRV_PORT = Number(process.env.SC_PORT || 4570);
const FAKE_PORT = SRV_PORT + 1;
let fails = [];
let passed = 0;
const ok = (cond, what) => { if (cond) { passed++; } else { fails.push(what); console.log('  ✗ ' + what); } };
const info = (s) => console.log('  · ' + s);
// Round 124: the build number a server-side read stamps on the row.
const CONTRACT = Number((require('fs').readFileSync('server.js', 'utf8').match(/const CONTRACT_VERSION = (\d+)/) || [])[1]);

// ── THE BUSINESS ────────────────────────────────────────────────────────────
const biz = (n) => ({
  company: `Scenario ${n} Roofing`,
  host: `scenario${n.toLowerCase()}roofing.example`,
  placeId: `ChIJ_scenario_${n}`,
});
// Round 124: a read run reads several businesses at once, so a registered
// host is served ITS OWN pages rather than state.biz's.
const BIZ_BY_HOST = {};
const bizReg = (n) => { const b = biz(n); BIZ_BY_HOST[b.host] = b; return b; };

const OWNER_LINE = () => (state.mode === 'nosettle' ? '' : ' Pete Barnes, Owner.');
const HOMEPAGE_MD = (b) => `# ${b.company}\n\nRoof repair and replacement for Dallas homeowners.${OWNER_LINE()}\n\nWe answer the phone ourselves and we stand behind our work.\n\nBook online any time from our booking page, or call us.\n\nOur crews photograph every stage of the job so you can see what we saw.\n\nContact: info@${b.host}\n`;
const HOMEPAGE_HTML = (b) => `<!doctype html><html><head><title>${b.company}</title><meta name="viewport" content="width=device-width"><meta name="description" content="Roofing in Dallas"></head><body><nav><a href="https://${b.host}/about">About</a> <a href="https://${b.host}/booking">Book online</a> <a href="https://${b.host}/contact">Contact</a></nav><h1>${b.company}</h1><p>Roof repair and replacement for Dallas homeowners.${OWNER_LINE()}</p><p>We answer the phone ourselves and we stand behind our work.</p><a href="https://${b.host}/booking" class="btn">Book online</a><form action="/contact"><input type="email" name="email"><input type="tel" name="phone"><textarea name="msg"></textarea></form><a href="tel:+12145550188">(214) 555-0188</a><a href="mailto:info@${b.host}">info@${b.host}</a><footer>&copy; 2026 ${b.company}</footer></body></html>`;

// Review texts the miner fixture quotes VERBATIM: the deep-mine verifier runs
// a punctuation-stripped four-word window over '[N stars] <text>' lines, so
// the evidence strings below are copied substrings of these, not paraphrases.
const REVIEWS = [
  { text: 'They never called me back after the estimate and I had to chase them for two weeks.', stars: 2, when: '2026-06-20' },
  { text: 'Great crew, roof looks fantastic, and they cleaned up everything.', stars: 5, when: '2026-07-01', reply: 'Thank you kindly - Pete' },
  { text: 'I asked for a quote and they never called me back after the first visit.', stars: 3, when: '2026-05-15' },
  { text: 'Fast, honest, and the price matched the estimate exactly.', stars: 5, when: '2026-07-20', reply: 'Appreciate it - Pete' },
];
const REVIEW_TOTAL = 4;   // small profile: under the 25-review floor, so the
                          // truncation guard never applies and 4 of 4 is a
                          // complete read by the contract's own arithmetic.

// ── THE FAKE UPSTREAM ───────────────────────────────────────────────────────
const state = {
  mode: 'golden',           // 'golden' | 'apify403' | 'husk' | 'fc402'
  requests: [],             // every hit: {host, path}
  contract: [],             // request-contract violations (e.g. a missing field mask)
  unknown: [],
  // Round 143: every Find-press search, with the city it resolved to and the
  // field mask it arrived with. The mask rides along because the press is
  // TOLD APART from the audit-path searches by what it asks for.
  gpFind: [],
};
const readBody = (req) => new Promise((resolve) => {
  let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => resolve(b));
});
const send = (res, code, obj, headers) => {
  const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
  res.writeHead(code, Object.assign({ 'Content-Type': typeof obj === 'string' ? 'text/html' : 'application/json' }, headers || {}));
  res.end(body);
};

const placesList = (b) => {
  // One universal searchText answer: twenty places in prominence order with
  // OUR business at index 3 (#4) — rank checks find it by place id, resolve
  // matches it by domain, and the three rivals above carry fewer reviews so
  // outranked_by_weaker has ground to stand on.
  const mk = (i) => ({
    id: i === 3 ? b.placeId : `ChIJ_rival_${i}`,
    displayName: { text: i === 3 ? b.company : `Rival Roofing ${i}` },
    formattedAddress: `${100 + i} Main St, Dallas, TX 75201, USA`,
    websiteUri: i === 3 ? `https://${b.host}` : `https://rival${i}.example`,
    // Our own row in the SEARCH result deliberately carries a count that
    // CONTRADICTS Place Details (REVIEW_TOTAL): the response's reviewCount
    // must come from the details call (the authority), and when both sources
    // said the same number the assertion could not detect the precedence
    // regressing — an assertion that cannot fail is not an assertion.
    rating: 4.5, userRatingCount: i === 3 ? 999 : (i < 3 ? 2 + i : 30 + i),
    businessStatus: 'OPERATIONAL',
    internationalPhoneNumber: '+1 214-555-01' + String(10 + i),
    location: { latitude: 32.78 + i * 0.001, longitude: -96.8 },
    regularOpeningHours: { weekdayDescriptions: ['Monday: 8 AM–6 PM', 'Tuesday: 8 AM–6 PM', 'Wednesday: 8 AM–6 PM', 'Thursday: 8 AM–6 PM', 'Friday: 8 AM–6 PM', 'Saturday: Closed', 'Sunday: Closed'] },
  });
  return { places: Array.from({ length: 20 }, (_, i) => mk(i)) };
};
const placeDetails = (b) => ({
  rating: 4.6, userRatingCount: REVIEW_TOTAL, businessStatus: 'OPERATIONAL',
  primaryTypeDisplayName: { text: 'Roofing contractor' },
  regularOpeningHours: { weekdayDescriptions: ['Monday: 8 AM–6 PM', 'Tuesday: 8 AM–6 PM', 'Wednesday: 8 AM–6 PM', 'Thursday: 8 AM–6 PM', 'Friday: 8 AM–6 PM', 'Saturday: Closed', 'Sunday: Closed'] },
  websiteUri: `https://${b.host}`, nationalPhoneNumber: '(214) 555-0188',
  photos: Array.from({ length: 12 }, (_, i) => ({ name: `photo${i}` })),
  location: { latitude: 32.783, longitude: -96.8 },
  formattedAddress: '103 Main St, Dallas, TX 75201, USA',
  googleMapsUri: 'https://maps.google.com/?cid=1',
  reviews: REVIEWS.map((r) => ({ rating: r.stars, publishTime: r.when + 'T12:00:00Z', text: { text: r.text }, originalText: { text: r.text } })),
});
const apifyItems = (b) => REVIEWS.map((r, i) => ({
  text: r.text, stars: r.stars, publishedAtDate: r.when + 'T12:00:00.000Z',
  name: 'Reviewer ' + i, reviewsCount: REVIEW_TOTAL, totalScore: 4.6,
  placeId: b.placeId, responseFromOwnerText: r.reply || null,
}));

// ── THE FIND PRESS'S GOOGLE (round 143) ─────────────────────────────────────
// placesList above answers every OTHER searchText: the per-lead rank check, the
// place-id recovery and the duplicate-listing search. THE PRESS had no fixture
// at all, and it did not look like one - scenario I pressed Find, the press
// answered 200, and it returned zero businesses, so every rule that fires
// between Google's answer and the queue row was unmeasured: the branch-URL
// drop, the trade review floor, the rating band, the multi-metro count, the
// call lead, the closed listing and the whole FIND YIELD report.
//
// WHY IT RETURNED NOTHING, and it is spelling on both sides. searchGooglePlaces
// narrows the grid by comparing filters.niches against GP_CATEGORIES' own LABEL
// ('Plumbing') and filters.cities against GP_CITIES' own string ('Dallas TX',
// no comma). Scenario I sent 'roofer' and 'Dallas, TX': neither matched, the
// category list and the city list both came out empty, and the press dealt a
// grid of nothing. It cost no Google calls and reported success, which is
// exactly the shape a fixture cannot see and a driven route can.
//
// WHICH searchText IS THE PRESS: only searchGooglePlaces appends nextPageToken
// to its field mask. Read off that call site rather than guessed from the query
// text, so the three audit-path searches keep the twenty prominence-ordered
// rivals placesList has always handed them and nothing above this line moves.
//
// The press sends textQuery `${cat.q} in ${city}`, one request per pair, so this
// answers per CITY: a business is served in the cities its own cast entry
// declares, and a pair this cast says nothing about answers with NO places
// rather than with somebody else's fixture.
//
// NO nextPageToken is ever returned, deliberately. A second page is bought only
// when a first page runs dry of new businesses, and paging would double the run
// to measure nothing new here - while the ABSENCE of a token is the case that
// has to terminate cleanly, which the press's own do/while then proves.
const GP_FIND_QUERY = 'plumbing company';                          // GP_CATEGORIES' 'Plumbing' query, verbatim
const GP_FIND_CITIES = ['Dallas TX', 'Austin TX', 'Houston TX'];   // GP_CITIES' spellings, verbatim
// Plumbing is one of the trades HIGH_VOLUME_LOW_TICKET raises to a 40-review
// floor (a service call earns a review, so volume is what tells a $600k
// drain-cleaning shop from a $4M repipe contractor). That floor is what the
// quiet-established case below exists to fail against.
const GP_FIND_PLACE = {
  'Dallas TX': { addr: '4114 Cedar Springs Rd, Dallas, TX 75219, USA', loc: { latitude: 32.81, longitude: -96.81 } },
  'Austin TX': { addr: '2601 S Lamar Blvd, Austin, TX 78704, USA', loc: { latitude: 30.25, longitude: -97.77 } },
  'Houston TX': { addr: '5100 Westheimer Rd, Houston, TX 77056, USA', loc: { latitude: 29.74, longitude: -95.46 } },
};
const GP_FIND_HOURS = { weekdayDescriptions: ['Monday: 7 AM–6 PM', 'Tuesday: 7 AM–6 PM', 'Wednesday: 7 AM–6 PM', 'Thursday: 7 AM–6 PM', 'Friday: 7 AM–6 PM', 'Saturday: 8 AM–2 PM', 'Sunday: Closed'] };

// ── THE CAST, ONE BUSINESS PER CASE ─────────────────────────────────────────
// `expect` is what TODAY'S code does with the business, and it is asserted in
// scenario P: 'kept' reaches the queue in the run's own queue, 'demoted'
// reaches it behind every in-band lead, 'dropped' never reaches it. `demote`
// names the flag the press must put on a demoted lead and `dropBy` the rule
// that deletes a dropped one, so the roll call, the ordering and the yield
// rows are all read off ONE declaration. `why` says which rule decides, so a
// round that changes a rule has one line to read and one line to change.
const GP_FIND_CAST = [
  // THE BUSINESS ROUND 143A EXISTED TO SAVE, AND IT IS SAVED. A quiet,
  // well-rated, established plumber with a real website and twelve reviews.
  // The floor used to delete him at the press, before a credit moved and
  // before anybody could look at him; it now ranks him last and says why.
  //
  // WHAT THE FLOOR IS NOW, because the number moved as well as the verdict:
  // reviewFloorFor caps every trade's floor at a tenth of that trade's own
  // 3-pack median, and never above the 15-review base - Plumbing's median is
  // 215, so its floor is min(215, 15, 22) = 15. The 40 this cast was built
  // against is gone for every trade: 15 is now the ceiling on any floor.
  { tag: 'quiet', name: 'Kessler Park Plumbing', cities: ['Dallas TX'], reviews: 12, rating: 4.6,
    site: 'https://kesslerparkplumbing.example', phone: '+1 214-555-0101',
    expect: 'demoted', demote: 'thinReviews',
    why: 'under Plumbing\'s 15-review floor: KEPT, marked with a note the rep can read, ranked last. Round 143A inverted this from the delete it used to be' },
  // The control beside it, and its job changed with the floor. At 28 reviews
  // it is now ABOVE Plumbing's floor of 15, so it is an ordinary in-band lead:
  // it proves the demotion does not spill onto a business that clears the
  // floor. It can no longer separate the trade floor from the base floor,
  // because for Plumbing they are the same number - and since the cap makes 15
  // the ceiling on every floor, no trade can separate them any more.
  // noYear: its own pages state no founding year, which is the ONLY case in
  // which the press asks a domain registry how old the business is. Every other
  // site in the cast dates itself, so without this the fallback is unreachable.
  { tag: 'floorsep', name: 'Turtle Creek Plumbing', cities: ['Dallas TX'], reviews: 28, rating: 4.5,
    site: 'https://turtlecreekplumbing.example', phone: '+1 214-555-0102', noYear: true,
    expect: 'kept', why: '28 reviews clears Plumbing\'s 15-review floor, so it is a plain in-band lead and carries no thin-review mark - the negative case for the demotion above' },
  // A FAKE-LISTING NETWORK: one phone number, two different trade names, two
  // metros. Round 143A reads the number and drops both halves.
  { tag: 'fakeA', name: 'Lone Star Drain Works', cities: ['Dallas TX'], reviews: 58, rating: 4.4,
    site: 'https://lonestardrainworks.example', phone: '+1 214-555-0777',
    expect: 'dropped', dropBy: 'phone',
    why: 'one number wearing two names across two metros is a call centre selling the lead on, not a business the rep can sell to' },
  { tag: 'fakeB', name: 'Bluebonnet Drain Pros', cities: ['Austin TX'], reviews: 61, rating: 4.3,
    site: 'https://bluebonnetdrainpros.example', phone: '+1 214-555-0777',
    expect: 'dropped', dropBy: 'phone',
    why: 'the twin of fakeA - same number, a different name, another metro, and both halves go' },
  // ROUND 143B: ONE TRACKING ACCOUNT, TWO NAMES, TWO METROS. This pair could
  // not exist before this round: the id is in the HOMEPAGE, and until the free
  // read moved to the press nothing had ever opened one. Their PHONES differ on
  // purpose, so the phone rule cannot fire and the run has to name this cause
  // rather than that one.
  { tag: 'trackA', name: 'Oak Cliff Sewer Experts', cities: ['Dallas TX'], reviews: 44, rating: 4.4,
    site: 'https://oakcliffsewerexperts.example', phone: '+1 214-555-0411', ga: 'G-NETWORK111',
    expect: 'dropped', dropBy: 'tracking',
    why: 'its homepage reports to the same analytics property as a differently-named business in another metro - one operator wearing local clothes, not two businesses' },
  { tag: 'trackB', name: 'Barton Springs Drain Co', cities: ['Austin TX'], reviews: 39, rating: 4.5,
    site: 'https://bartonspringsdrainco.example', phone: '+1 512-555-0412', ga: 'G-NETWORK111',
    expect: 'dropped', dropBy: 'tracking',
    why: 'the twin of trackA - the same tracking id, a different name, another metro, and both halves go' },
  // AND THE NEGATIVE CASE, WHICH MATTERS AS MUCH: one phone number, ONE name,
  // two metros. A legitimate two-branch plumber. A rule that drops the pair
  // above must not touch these two, and the check says so out loud.
  // Two hosts rather than one, on purpose: sharing a domain would merge them at
  // the press's own domain dedupe and there would be no pair left for a
  // phone rule to be wrong about.
  { tag: 'chainA', name: 'Ridgeview Plumbing Co', cities: ['Dallas TX'], reviews: 120, rating: 4.5,
    site: 'https://ridgeviewplumbing.example', phone: '+1 713-555-0311',
    expect: 'kept', why: 'a two-branch chain under one name is a good lead, not a fake listing' },
  { tag: 'chainB', name: 'Ridgeview Plumbing Co', cities: ['Houston TX'], reviews: 94, rating: 4.4,
    site: 'https://ridgeviewplumbinghouston.example', phone: '+1 713-555-0311',
    expect: 'kept', why: 'the second branch; it merges into chainA by name, so ONE row reaches the queue' },
  // Shut for good, and shut for now. Both drop on Google's own status, and
  // since Round 143A both are COUNTED as seen first: a listing dropped by a
  // gate has to be inside the denominator its loss row is read against.
  { tag: 'closedperm', name: 'Trinity Bend Plumbing', cities: ['Dallas TX'], reviews: 80, rating: 4.4,
    site: 'https://trinitybendplumbing.example', phone: '+1 214-555-0103', status: 'CLOSED_PERMANENTLY',
    expect: 'dropped', dropBy: 'risk',
    why: 'readListingRisk: Google says permanently closed, so nobody is there to take the call. Dead, not fake' },
  { tag: 'closedtemp', name: 'Cedar Hollow Plumbing', cities: ['Austin TX'], reviews: 75, rating: 4.5,
    site: 'https://cedarhollowplumbing.example', phone: '+1 512-555-0104', status: 'CLOSED_TEMPORARILY',
    expect: 'dropped', dropBy: 'risk',
    why: 'readListingRisk: temporarily closed goes out the same door, and so would any status word Google adds next year' },
  // No website at all: 210 reviews and nothing to audit. The finding IS the
  // absence, so it is kept and marked as a lead Mike dials.
  { tag: 'nosite', name: 'Walnut Hill Plumbing', cities: ['Dallas TX'], reviews: 210, rating: 4.3,
    site: '', phone: '+1 214-555-0105',
    expect: 'kept', why: 'a business with no site is a CALL lead, keyed on its place id instead of a domain' },
  // The same business in three metros. Google returns the same listing to three
  // city queries, so the repeat sighting must ADD a market rather than be
  // discarded: coverage across metros is the only size signal the press has.
  { tag: 'multi', name: 'Alamo Ridge Plumbing', cities: ['Dallas TX', 'Austin TX', 'Houston TX'], reviews: 150, rating: 4.5,
    site: 'https://alamoridgeplumbing.example', phone: '+1 214-555-0106',
    expect: 'kept', why: 'merged by domain across the three city queries into one lead with marketCount 3' },
  // Controls. 400 reviews is well under the 2000 ceiling, so volume alone must
  // not bench a business; 4.9 stars is above the 4.85 ceiling, so it is kept,
  // marked and returned behind every in-band lead.
  { tag: 'busy', name: 'Pecan Grove Plumbing', cities: ['Dallas TX'], reviews: 400, rating: 4.4,
    site: 'https://pecangroveplumbing.example', phone: '+1 214-555-0107',
    expect: 'kept', why: 'a control: 400 reviews is inside the 2000 review ceiling' },
  { tag: 'band49', name: 'Bishop Arts Plumbing', cities: ['Dallas TX'], reviews: 88, rating: 4.9,
    site: 'https://bishopartsplumbing.example', phone: '+1 214-555-0108',
    expect: 'demoted', demote: 'outsideBand',
    why: 'above the 4.85 rating ceiling: demoted behind every in-band lead, never deleted' },
  // And the OTHER ceiling, the only size ceiling the press can reach without
  // paying a size lookup: 2400 reviews is past GP_MAX_REVIEWS, so the business
  // is benched as an email lead (round 114 - a big company is an email lead,
  // never deleted) and served in the large-company slice at the very end.
  { tag: 'huge', name: 'Grapevine Plumbing Works', cities: ['Dallas TX'], reviews: 2400, rating: 4.4,
    site: 'https://grapevineplumbingworks.example', phone: '+1 214-555-0114',
    expect: 'demoted', demote: 'aboveSizeCeiling',
    why: 'above the 2000-review size ceiling: benched as an email lead, and sorted last of all' },
  // ROUND 139's BRANCH TELL, which nothing has ever executed. Their own Google
  // listing points at one location's page inside a bigger site.
  { tag: 'branch', name: 'Comal Creek Plumbing', cities: ['Austin TX'], reviews: 65, rating: 4.4,
    site: 'https://comalcreekplumbing.example/locations/austin', phone: '+1 512-555-0109',
    expect: 'dropped', dropBy: 'branch',
    why: 'readOutletTell: a /locations/<city> path is a branch address, dropped before a credit moves. The one deletion this run that the yield report has a row for' },
  // ── CARRIERS FOR THE FIELDS ROUND 143 IS ADDING TO THE FIELD MASK ────────
  // Nothing reads any of them today, so each is an ordinary lead and is
  // asserted as one - a round that acts on one of these fields inverts the
  // cast entry rather than discovering it has no fixture. The shapes are the
  // documented ones (see the note under this array), and the alert carriers
  // below are three DIFFERENT alerts on purpose, because the classifier that
  // reads them can only be proven by a case it must drop and a case it must
  // never touch.
  //
  // 1. A GENUINE REVIEW-ACTIVITY ALERT: the review wording is in the prose,
  //    which is where a classifier is entitled to read it.
  //    WHERE THIS ENTRY SITS IN THE CAST IS LOAD-BEARING, 2026-09-12. The
  //    discovery sort's demotion term reads FOUR reasons on one side and three
  //    on the other - `bb` in runDiscovery is missing `b.listingRisk` - so a
  //    listing Google has flagged is only recognised as demoted when it is the
  //    `a` operand. Run the comparator on three leads and it puts the flagged
  //    listing FIRST whenever it arrives before an in-band one. It arrives
  //    after them here, which is the only reason the ordering assertion in
  //    scenario P is green. Move this entry above the in-band entries and the
  //    defect manifests - which is how to prove the one-word fix on `bb`.
  { tag: 'alert', name: 'Lakewood Rooter Service', cities: ['Dallas TX'], reviews: 70, rating: 4.4,
    site: 'https://lakewoodrooter.example', phone: '+1 214-555-0110',
    consumerAlert: {
      overview: 'Recent reviews of this place show unusual activity and are being checked.',
      details: {
        title: 'Unusual review activity',
        description: 'We noticed a burst of reviews that may not describe genuine customer visits, so those reviews are being checked.',
        aboutLink: { title: 'About Google Maps content policies', uri: 'https://support.google.com/maps/answer/7400114?hl=en&topic=content-policies' },
      },
      languageCode: 'en',
    },
    expect: 'demoted', demote: 'listingRisk',
    why: 'readListingRisk classifies it on its PROSE, finds the review wording there, and DEMOTES - never drops. Google says the reviews on this listing cannot be trusted as measurements, so the lead is kept, ranked last and carries Google\'s own words for the rep to read' },
  // 2. THE TRAP, AND THE ONE BUSINESS THAT MUST SURVIVE EVERY ROUND. The
  //    prose says nothing about reviews, ratings, stars, policies or
  //    violations - the listing's hours are simply being confirmed - but the
  //    "learn more" link points, as every alert's link does, at Google's
  //    CONTENT POLICIES page. A classifier that collects every string leaf
  //    sweeps aboutLink in with the prose, finds "polic" in the URL and the
  //    link title, and reads an ordinary listing as a policy violation. If
  //    such a lead is then dropped, the press deletes a business for the
  //    wording of a Google help link. Nothing about this business is wrong.
  { tag: 'alertneutral', name: 'Cochran Chapel Plumbing', cities: ['Dallas TX'], reviews: 64, rating: 4.5,
    site: 'https://cochranchapelplumbing.example', phone: '+1 214-555-0115',
    consumerAlert: {
      overview: 'Some details about this place may be out of date and are being confirmed with the owner.',
      details: {
        title: 'Details may be out of date',
        description: 'We are confirming this business\'s opening hours and address with its owner. The listing stays open while that check runs.',
        // Modelled on Google's support-page pattern, not copied from a live
        // response: what matters is that "polic" appears in the link title
        // and the URL while appearing nowhere in the prose.
        aboutLink: { title: 'Learn more about Google Maps content policies', uri: 'https://support.google.com/maps/answer/7400114?hl=en&topic=content-policies' },
      },
      languageCode: 'en',
    },
    expect: 'demoted', demote: 'listingRisk',
    why: 'THE NEGATIVE CASE, AND IT MUST NEVER BE DROPPED: the only "policy" words are in the help link every alert carries, and listingAlertProse now reads the prose alone, so the unrecognised alert takes the default - KEPT and ranked last. A round that DROPS this business has classified a Google support URL as the business\'s own conduct' },
  // 3. A GENUINE POLICY ALERT: the violation is stated in the prose itself, so
  //    a classifier reading only the prose still catches it. That is what
  //    makes the trap above falsifiable - a rule cannot pass both by reading
  //    the link and by ignoring it.
  { tag: 'alertpolicy', name: 'Midway Hollow Plumbing', cities: ['Dallas TX'], reviews: 52, rating: 4.2,
    site: 'https://midwayhollowplumbing.example', phone: '+1 214-555-0116',
    consumerAlert: {
      overview: 'This place is restricted for violating Google Maps content policies.',
      details: {
        title: 'Policy violation',
        description: 'Content on this listing violates our policies, so some features have been turned off.',
        aboutLink: { title: 'About Google Maps content policies', uri: 'https://support.google.com/maps/answer/7400114?hl=en&topic=content-policies' },
      },
      languageCode: 'en',
    },
    expect: 'dropped', dropBy: 'risk',
    why: 'the violation is stated in its OWN prose, so the prose-only classifier catches it and drops the listing - while leaving alertneutral, whose prose says nothing of the kind, in the answer' },
  { tag: 'puresab', name: 'Sabine Flats Plumbing', cities: ['Houston TX'], reviews: 55, rating: 4.2,
    site: 'https://sabineflatsplumbing.example', phone: '+1 713-555-0111', noAddress: true,
    pureServiceAreaBusiness: true,
    expect: 'kept', why: 'a pure service-area business publishes no street address; nothing reads the flag yet' },
  // containingPlaces AS GOOGLE ACTUALLY RETURNS IT: a resource name and an id,
  // and no readable text anywhere. A rule that hopes to read "Northpark Mall"
  // out of this field has nothing to match on, ever, and the fixture has to
  // make that visible rather than hide it behind invented brand text.
  { tag: 'inside', name: 'Oak Cliff Plumbing', cities: ['Dallas TX'], reviews: 65, rating: 4.4,
    site: 'https://oakcliffplumbing.example', phone: '+1 214-555-0112',
    containingPlaces: [{ name: 'places/ChIJexample123', id: 'ChIJexample123' },
      { name: 'places/ChIJexample456', id: 'ChIJexample456' }],
    expect: 'kept', why: 'containingPlaces is not in the field mask yet, and when it is, these two entries carry no readable words for any test to match' },
  // HYPOTHETICAL, NOT OBSERVED FROM A LIVE RESPONSE. Kept separate and
  // labelled so nobody reads it as evidence that Google returns readable text
  // here: the entry above is the honest shape. This one exists only so a rule
  // that WANTS readable text has something to run against, and any assertion
  // resting on it must say it rests on an unobserved shape.
  { tag: 'insidetext', name: 'Trinity Groves Plumbing', cities: ['Dallas TX'], reviews: 58, rating: 4.3,
    site: 'https://trinitygrovesplumbing.example', phone: '+1 214-555-0117',
    containingPlaces: [{ name: 'places/ChIJexample789', id: 'ChIJexample789', displayName: { text: 'Trinity Groves Market Hall' } }],
    expect: 'kept', why: 'a hypothetical containingPlaces entry with readable text; nothing reads the field yet and no live response has been seen carrying displayName here' },
  { tag: 'moved', name: 'Preston Hollow Plumbing', cities: ['Dallas TX'], reviews: 48, rating: 4.3,
    site: 'https://prestonhollowplumbing.example', phone: '+1 214-555-0113',
    movedPlaceId: 'ChIJ_p_moved_target',
    expect: 'dropped', dropBy: 'risk',
    why: 'readListingRisk: Google says the listing has moved, so the address, the phone and the reviews on it belong to the premises they left' },
  // THE SIBLING. movedPlace is a resource name and it can arrive when
  // movedPlaceId does not, so a rule that reads only one of the two treats a
  // moved listing as a live one - or a live one as moved.
  { tag: 'movedonly', name: 'Casa Linda Plumbing', cities: ['Dallas TX'], reviews: 44, rating: 4.4,
    site: 'https://casalindaplumbing.example', phone: '+1 214-555-0118',
    movedPlace: 'places/ChIJ_p_moved_sibling',
    expect: 'dropped', dropBy: 'risk',
    why: 'movedPlace is set and movedPlaceId is absent, and the drop still fires - which is what proves BOTH spellings are read. A rule reading only movedPlaceId would keep this listing and hand the rep the old premises' },
];
// THE SHAPES ARE VERIFIED, AND ONE FIELD MUST NEVER REACH A CLASSIFIER.
// Every other shape in this file was copied from the code that consumes it.
// Nothing consumes these five yet, so they were declared here from Google's
// own documentation and then VERIFIED (2026-09-12) against the Place
// resource's JSON representation in the Places API REST reference and the
// IConsumerAlert / ConsumerAlert.IDetails / Details.ILink interfaces in the
// Node client-library reference:
//   consumerAlert             { overview?, details?: { title?, description?,
//                               aboutLink?: { title?, uri? } }, languageCode? }
//   movedPlaceId              a place id string
//   movedPlace                a RESOURCE name string, and it can be present
//                             when movedPlaceId is not
//   containingPlaces          [ { name: 'places/ChIJ...', id } ] - name is a
//                             resource name, NOT readable text
//   pureServiceAreaBusiness   boolean
//
// consumerAlert.details.aboutLink IS NOT THE BUSINESS'S CONDUCT. It is the
// "learn more" link Google puts on every alert, and it points at a content
// POLICIES support page - so a classifier that walks every string leaf of the
// alert finds "polic" in the link on an alert about nothing of the kind, and
// silently reads an ordinary listing as a policy violation. Read the prose
// (overview, details.title, details.description) and never the link. The cast
// carries both cases: alertneutral must survive it, alertpolicy must not.
const GP_FIND_NEW_FIELDS = ['consumerAlert', 'pureServiceAreaBusiness', 'containingPlaces', 'movedPlaceId', 'movedPlace'];
const gpFindPlace = (c, city, mask) => {
  const where = GP_FIND_PLACE[city] || GP_FIND_PLACE['Dallas TX'];
  const p = {
    id: c.id || ('ChIJ_p_' + c.tag),
    displayName: { text: c.name },
    rating: c.rating, userRatingCount: c.reviews,
    businessStatus: c.status || 'OPERATIONAL',
    internationalPhoneNumber: c.phone || '',
    location: where.loc,
    regularOpeningHours: GP_FIND_HOURS,
  };
  if (!c.noAddress) p.formattedAddress = where.addr;
  if (c.site) p.websiteUri = c.site;
  // Served ONLY when the mask asks, exactly as the real API answers: a fixture
  // that hands back a field nobody requested would let a rule pass here while
  // the mask that feeds it in production is still missing the field.
  for (const f of GP_FIND_NEW_FIELDS) {
    if (c[f] !== undefined && new RegExp('places\\.' + f + '(\\b|,|$)').test(mask)) p[f] = c[f];
  }
  return p;
};
const gpFindAnswer = (textQuery, mask, pageSize) => {
  const m = String(textQuery || '').match(/^(.+) in (.+)$/);
  const city = (m && m[1] === GP_FIND_QUERY && GP_FIND_CITIES.includes(m[2])) ? m[2] : '';
  const rows = city ? GP_FIND_CAST.filter(c => c.cities.includes(city)) : [];
  state.gpFind.push({ textQuery: String(textQuery || ''), city, served: rows.length, mask });
  // pageSize is honoured, and no nextPageToken is ever sent - see the note above.
  return { places: rows.slice(0, Math.max(1, Number(pageSize) || 20)).map(c => gpFindPlace(c, city, mask)) };
};

// ── ROUND 143B: WHAT THE PRESS'S FREE READ FINDS ON A CAST SITE ────────────
// The press reads the homepage, the team page and the contact page of every
// business it keeps, over a plain fetch, before a credit moves. Until this
// round no cast business had a site of its own: every .example host fell
// through to the contact-read fixture, whose navigation points at a DIFFERENT
// host, so the press would have read one page, found no navigation and graded
// a site nobody could have graded.
//
// Deliberately DATED markup - font tags, layout tables, a 2015 jQuery and a
// 2016 copyright - because the verdict this round feeds into the score is what
// a VISITOR meets, and a modern fixture would let every assertion about it pass
// on a business the read could not have separated from any other.
const GP_SITE_BY_HOST = {};
for (const c of GP_FIND_CAST) {
  if (!c.site) continue;
  GP_SITE_BY_HOST[String(c.site).replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()] = c;
}
const GP_PRESS_BODY = (c) => `${c.name} repairs and replaces water heaters, drains and sewer lines right across the metro, and somebody here answers our own telephone every day of the week. `;
const GP_PRESS_PAGE = (c, path) => {
  const _p = String(path || '/').split('?')[0];
  const _body = GP_PRESS_BODY(c);
  if (_p && _p !== '/') {
    return `<html><head><title>${c.name}</title></head><body><h1>${c.name}</h1><p>${_body.repeat(8)}</p></body></html>`;
  }
  return `<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Home</title><meta name="keywords" content="plumbing">`
    + `<script src="//static.parastorage.com/services/wix-thunderbolt/dist/main.js"></script>`
    + `<script src="/js/jquery-1.11.3.min.js"></script>`
    + (c.ga ? `<script>gtag('config', '${c.ga}');</script>` : '')
    + `</head><body><font size="3">Welcome</font><center>${c.name}</center>`
    + `<table width="600" border="1"><tr><td>x</td></tr></table><table width="600" cellpadding="2"><tr><td>y</td></tr></table>`
    + `<a href="/our-team">Our team</a><a href="/contact">Contact</a><a href="/careers">Careers</a><a href="/about-us">About us</a>`
    + `<img src="a.jpg"><img src="b.jpg"><img src="c.jpg"><img src="d.jpg">`
    + `<p>${c.name}${c.noYear ? '' : ' has been serving this city since 2001'}. ${_body.repeat(8)}</p>`
    + `<p>&copy; 2016 ${c.name}</p></body></html>`;
};

// One Anthropic responder, keyed on marker strings the contract map read off
// each call site's own prompt. Unmatched calls answer benign empty JSON so a
// new model call fails soft here and loud in its own boot check.
const anthropicAnswer = (bodyText, b) => {
  const wrap = (obj) => ({
    id: 'msg_fake', type: 'message', role: 'assistant', model: 'claude-haiku-4-5-20251001',
    content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj) }],
    usage: { input_tokens: 1200, output_tokens: 180, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
  });
  const t = bodyText;
  // Round 141: the visual website read. Matched on its own field names, ahead of
  // every other branch, because it is the only call that asks for designEra.
  if (/designEra/.test(t)) {
    return wrap(Object.assign({ isRealHomepage: true, fullyRendered: true, designEra: 'old',
      templateUntouched: true, desktopOnlyLayout: false, photosLookCheap: false, looksCredible: false,
      whatAVisitorSees: 'a narrow page with a stock photograph of a roof and small grey type' }, state.eyes || {}));
  }
  if (state.mode === 'husk' && /pitchAngle/.test(t) && /FACT_DISCIPLINE|NEVER fabricate|evidence/i.test(t) && /IMAGE|homepage|HOMEPAGE/i.test(t)) {
    return wrap({ pitchAngle: null, realPain: null, embarrassingFinding: null, situationRead: null, recommendedProduct: null, originalFindings: [] });
  }
  if (/REVIEWS PAGE:/.test(t)) {
    return wrap({ signals: [
      { pain: 'quotes that never come back', count: 2, evidence: 'never called me back after' },
    ], summary: 'two reviewers describe chasing an estimate that never came back' });
  }
  if (/confidenceScore/.test(t)) return wrap({ confidenceScore: 9, flaggedClaims: [] });
  if (/askOnTheCall/.test(t)) {
    return wrap({ shape: 'owner-operated roofer', background: 'A Dallas roofing crew led by its owner.',
      headline: 'The owner answers his own phone and his own reviews',
      read: 'This is a healthy owner-run crew whose booking promise and phone-first habits point in different directions. The work itself earns five stars; the estimate follow-up is the part his own customers describe chasing.',
      rows: [{ label: 'follow-up', says: 'two reviewers describe chasing an estimate that never came back' }],
      whatHeCaresAbout: 'He replies to his reviews personally and signs them.',
      whatHeNeeds: 'A follow-up path for estimates that does not depend on him remembering.',
      askOnTheCall: 'When a quote goes out and nobody answers, who chases it?' });
  }
  if (/pitchAngle/.test(t)) {
    return wrap({
      pitchAngle: 'Their own customers describe chasing estimates that never come back.',
      realPain: 'Quotes go out and the follow-up depends on the owner remembering.',
      embarrassingFinding: 'The booking page promises online scheduling and the phone is the only route that answers.',
      situationRead: 'A healthy owner-run crew whose follow-up is the weak link.',
      whatHeNeeds: 'A follow-up path for estimates that does not depend on memory.',
      recommendedProduct: 'Revenue Growth / CRO Retainer', recommendedPrice: '$50k+',
      recommendedReason: 'The demand exists and the leak is after the estimate.',
      originalFindings: [
        { finding: 'The homepage promises that the crew photographs every stage of the job.', evidence: 'photograph every stage of the job' },
      ],
      confidence: 'high',
    });
  }
  if (/WEBSITE TEXT:|CONTENT:|SEARCH RESULTS:|RESULTS:|REPLIES:/.test(t)) {
    // 'nosettle' is the ONLY state in which the calling-mode branch is
    // reachable: a name with no TITLE scores authority 30, which clears
    // neither the corroboration floor (75) nor the own-site floor (90), and
    // 'Barnes' is nowhere in the company name or the domain so the eponymous
    // settle cannot fire either. Without this the callOnly lead would settle at
    // stage 1 like the golden one and the scenario would report a clean pass
    // while exercising nothing - the vacuous-check trap.
    if (state.mode === 'nosettle') {
      return wrap({ name: null, title: null, evidence: '', confidence: 'low' });
    }
    return wrap({ name: 'Pete Barnes', title: 'Owner', evidence: 'Pete Barnes, Owner appears on the homepage', confidence: 'high' });
  }
  if (/PAGES:/.test(t)) {
    return wrap({ prices: [], services: ['roof repair', 'roof replacement'], booking: 'online_booking', hasCapture: false, ownerStory: null });
  }
  if (/WHAT WE KNOW ABOUT THE TARGET COMPANY/.test(t)) {
    if (state.mode === 'findstranger') return wrap({ match: 'no', confidence: 'high', reason: 'an unrelated widget supplier', trade: '' });
    return wrap({ match: 'yes', confidence: 'high', reason: 'name and trade on page', trade: 'roofer' });
  }
  return wrap({});
};

// ── THE FIND-TAB CONTACT SITE ───────────────────────────────────────────────
// A site carrying all three free ICP signals, so the read can be asserted in
// the POSITIVE direction as well as the negative one. A fixture that only ever
// exercises the "nothing found" shape proves nothing about the finding half.
const FIND_HOME_HTML = (b) => `<!doctype html><html><head><title>${b.company}</title>`
  + `<script async src="https://www.googleadservices.com/pagead/conversion_async.js"></script>`
  + `<meta name="viewport" content="width=device-width"></head><body>`
  + `<nav><a href="https://${b.host}/our-team">Our Team</a> <a href="https://${b.host}/contact">Contact</a>`
  + ` <a href="https://${b.host}/careers">Careers</a> <a href="https://facebook.com/x">Facebook</a></nav>`
  + `<h1>${b.company}</h1><p>Roof repair and replacement for Dallas homeowners, since 1998.</p>`
  + `<p>${'We answer the phone ourselves and we stand behind our work. '.repeat(12)}</p>`
  // Round 141: their own pages selling franchises is the cheapest franchise
  // tell readChainEvidence owns, and it fires on the FIRST page read - which is
  // the whole reason the render sits behind the drop rather than before it.
  + (state.franchise ? `<p>Franchise opportunities are available in your territory. Ask about owning a franchise.</p>` : '')
  + `<footer>&copy; 2026 ${b.company}</footer></body></html>`;
const FIND_STRANGER_HTML = () => `<!doctype html><html><head><title>Zeta Widgets Supply</title></head><body><h1>Zeta Widgets Supply</h1>`
  + `<p>${'Industrial widgets, flanges and fittings for the trade, shipped same day from our Dallas warehouse. '.repeat(8)}</p>`
  + `<footer>&copy; 2026 Zeta Widgets Supply</footer></body></html>`;
// Round 129: the roster SIZE is a dial. Three names on their own team page is
// "settled small" - the page answers the question the four-credit directory
// search asks, so the search is not bought - and a scenario that needs the BUY
// path exercised turns it down to two, which is a page layout and not a
// measurement. The default is three, so every other scenario reads as before.
const FIND_TEAM_PEOPLE = [['Pete Barnes', 'Owner'], ['Dana Willis', 'Operations Manager'], ['Ray Alonzo', 'Lead Estimator']];
const FIND_TEAM_HTML = (b) => `<!doctype html><html><body><h1>Our Team</h1>`
  + FIND_TEAM_PEOPLE.slice(0, Number(state.teamSize) > 0 ? Number(state.teamSize) : 3).map(([n, t]) => `<div><h3>${n}</h3><p>${t}</p></div>`).join('')
  + `<p>${'The crew has worked together for years and it shows on every roof. '.repeat(10)}</p>`
  + `</body></html>`;
const FIND_CONTACT_HTML = (b) => `<!doctype html><html><body><h1>Contact</h1>`
  + `<p>Call (214) 555-0188 or email <a href="mailto:pete@${b.host}">pete@${b.host}</a>.</p>`
  + `<p>${'We answer every message the same day, and we mean it. '.repeat(12)}</p>`
  + `</body></html>`;
const FIND_CAREERS_HTML = (b) => `<!doctype html><html><body><h1>Careers</h1><p>We are hiring.</p>`
  + `<script type="application/ld+json">{"@context":"https://schema.org","@type":"JobPosting",`
  + `"title":"Marketing Manager","datePosted":"${new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10)}"}</script>`
  + `<p>${'Join a crew that turns up on time and finishes what it starts. '.repeat(12)}</p>`
  + `</body></html>`;

// ── THE FAKE POSTGREST (round 124) ──────────────────────────────────────────
// The server owns the Find queue now, and a run that survives a closed tab is
// two tables. So the fixture network grows a Supabase: an in-memory table
// store behind the slice of PostgREST's grammar this repo's helpers send
// (eq / neq / is / in / gt / gte / lt / lte / like, order, limit, offset, the
// Range header, Prefer return=representation and resolution=ignore- or
// merge-duplicates, ->> projection with aliases). The two tables this round
// created carry the migration's column list and REFUSE an unknown column the
// way PostgREST does (PGRST204, the whole row), so a column the code writes
// and the SQL never added goes red here instead of on Render. Tables this
// round did not create accept anything. An unknown operator matches every
// row rather than none, so a helper this fake has not met reads the whole
// table and the assertion on the ROW says what went wrong.
const SB_COLUMNS = {
  discovered_queue: ['id', 'name', 'website', 'icp_score', 'source', 'signals', 'job_title', 'location', 'manual_role_count', 'stacked', 'reachability', 'size_verified', 'size_unverified', 'verified_employees', 'extra', 'batch_id', 'read_at', 'read_failed', 'fail_reason', 'moved_to_research_at', 'ruled_out_at', 'ruled_out_why', 'from_trigger_source', 'reach_predict', 'exported_at', 'exported_to', 'site_verdict'],
  read_runs: ['id', 'started_at', 'finished_at', 'progress_at', 'status', 'requested_count', 'read_count', 'failed_count', 'ruled_out_count', 'credits_estimated', 'credits_used', 'scope', 'error'],
  user_settings: ['id', 'data', 'updated_at'],
};
state.sb = {};        // table -> rows
state.sbFail = null;  // { table, method, code, times }: answer that status for the next N matching calls
state.sbLog = [];     // every hit: { method, table, query, prefer }
state.slowMs = 0;     // a pause on every page of a business's own site
const sbTable = (t) => (state.sb[t] = state.sb[t] || []);
const sbUnknownColumn = (table, keys) => { const cols = SB_COLUMNS[table]; return cols ? (keys.find(k => !cols.includes(k)) || '') : ''; };
const sbRefuse = (res, table, col) => send(res, 400, { code: 'PGRST204', message: `Could not find the '${col}' column of '${table}' in the schema cache` });
const sbText = (v) => (v === null || v === undefined) ? null : (typeof v === 'object' ? JSON.stringify(v) : String(v));
const sbInList = (val) => String(val).replace(/^\(|\)$/g, '').split(',').map(x => x.trim().replace(/^"|"$/g, ''));
const sbMatch = (row, col, op, val) => {
  if (op === 'not') { const m = String(val).match(/^([a-z]+)\.([\s\S]*)$/); return m ? !sbMatch(row, col, m[1], m[2]) : true; }
  const v = row[col];
  const s = sbText(v);
  const num = (x) => (x === null || x === '' || isNaN(Number(x))) ? null : Number(x);
  const cmp = (f) => s !== null && ((num(v) !== null && num(val) !== null) ? f(num(v), num(val)) : f(s, val));
  switch (op) {
    case 'eq': return s === val;
    case 'neq': return s !== val;
    case 'is': return val === 'null' ? s === null : val === 'true' ? v === true : val === 'false' ? v === false : true;
    case 'in': return sbInList(val).includes(s);
    case 'gt': return cmp((a, b) => a > b);
    case 'gte': return cmp((a, b) => a >= b);
    case 'lt': return cmp((a, b) => a < b);
    case 'lte': return cmp((a, b) => a <= b);
    case 'like': case 'ilike': {
      const re = new RegExp('^' + val.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[%*]/g, '.*') + '$', op === 'ilike' ? 'i' : '');
      return s !== null && re.test(s);
    }
    default: return true;
  }
};
// select=a,alias:b,c->>k  — a jsonb path on a jsonb STRING is null, as in Postgres.
const sbProject = (row, select) => {
  if (!select || select === '*') return row;
  const out = {};
  for (const item of select.split(',')) {
    const m = item.trim().match(/^(?:([A-Za-z0-9_]+):)?([A-Za-z0-9_*]+)((?:->>?[A-Za-z0-9_]+)*)$/);
    if (!m) continue;
    const [, alias, col, pathStr] = m;
    if (col === '*') { Object.assign(out, row); continue; }
    let v = row[col];
    let text = false;
    for (const p of (pathStr.match(/->>?[A-Za-z0-9_]+/g) || [])) {
      const key = p.replace(/^->>?/, ''); text = p.startsWith('->>');
      v = (v && typeof v === 'object') ? v[key] : undefined;
    }
    if (text) v = sbText(v); else if (v === undefined) v = null;
    const parts = pathStr.match(/[A-Za-z0-9_]+/g) || [];
    out[alias || (parts.length ? parts[parts.length - 1] : col)] = v;
  }
  return out;
};
const sbFake = async (req, res, table, qs) => {
  const body = await readBody(req);
  const q = new URLSearchParams(qs);
  const prefer = String(req.headers.prefer || '');
  const method = req.method;
  state.sbLog.push({ method, table, query: qs, prefer });
  const f = state.sbFail;
  if (f && f.times > 0 && f.table === table && f.method === method) { f.times -= 1; return send(res, f.code, { message: 'servercheck: forced failure on ' + table }); }
  const filters = [];
  for (const [k, v] of q.entries()) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(k)) continue;
    const m = String(v).match(/^([a-z]+)\.([\s\S]*)$/);
    if (!m) continue;
    if (SB_COLUMNS[table] && !SB_COLUMNS[table].includes(k)) return send(res, 400, { code: '42703', message: `column ${table}.${k} does not exist` });
    filters.push([k, m[1], m[2]]);
  }
  const rows = sbTable(table);
  const hits = rows.filter(r => filters.every(([c, o, v]) => sbMatch(r, c, o, v)));
  const rep = /return=representation/.test(prefer);
  if (method === 'GET') {
    const select = q.get('select') || '*';
    for (const item of select.split(',')) {
      const col = item.trim().replace(/^[A-Za-z0-9_]+:/, '').split('->')[0];
      if (col !== '*' && SB_COLUMNS[table] && !SB_COLUMNS[table].includes(col)) return send(res, 400, { code: '42703', message: `column ${table}.${col} does not exist` });
    }
    let out = hits.slice();
    const order = q.get('order');
    if (order) {
      const [col, dir] = order.split('.');
      out.sort((a, b) => { const x = a[col], y = b[col]; const c = x === y ? 0 : (x === null || x === undefined) ? 1 : (y === null || y === undefined) ? -1 : (x < y ? -1 : 1); return dir === 'desc' ? -c : c; });
    }
    const off = Number(q.get('offset') || 0); if (off) out = out.slice(off);
    const lim = q.get('limit'); if (lim !== null) out = out.slice(0, Number(lim));
    const rm = String(req.headers.range || '').match(/^(\d+)-(\d+)$/); if (rm) out = out.slice(Number(rm[1]), Number(rm[2]) + 1);
    return send(res, 200, out.map(r => sbProject(r, select)));
  }
  if (method === 'POST') {
    let inc; try { inc = JSON.parse(body); } catch (e) { return send(res, 400, { message: 'servercheck: the body is not JSON' }); }
    const list = Array.isArray(inc) ? inc : [inc];
    const key = q.get('on_conflict') || 'id';
    for (const r of list) { const bad = sbUnknownColumn(table, Object.keys(r || {})); if (bad) return sbRefuse(res, table, bad); }
    const ignore = /resolution=ignore-duplicates/.test(prefer), merge = /resolution=merge-duplicates/.test(prefer);
    const written = [];
    for (const r of list) {
      const ex = rows.find(x => x[key] !== undefined && r[key] !== undefined && String(x[key]) === String(r[key]));
      if (ex) {
        if (ignore) continue;
        if (merge) { Object.assign(ex, r); written.push(ex); continue; }
        return send(res, 409, { code: '23505', message: `duplicate key value violates unique constraint "${table}_pkey"` });
      }
      const row = Object.assign({}, r); rows.push(row); written.push(row);
    }
    if (rep) return send(res, 201, written);
    res.writeHead(201); return res.end();
  }
  if (method === 'PATCH') {
    let patch; try { patch = JSON.parse(body); } catch (e) { return send(res, 400, { message: 'servercheck: the body is not JSON' }); }
    const bad = sbUnknownColumn(table, Object.keys(patch || {})); if (bad) return sbRefuse(res, table, bad);
    for (const r of hits) Object.assign(r, patch);
    if (rep) return send(res, 200, hits);
    res.writeHead(204); return res.end();
  }
  if (method === 'DELETE') {
    state.sb[table] = rows.filter(r => !hits.includes(r));
    if (rep) return send(res, 200, hits);
    res.writeHead(204); return res.end();
  }
  return send(res, 405, { message: 'servercheck: ' + method + ' is not a PostgREST verb this fake answers' });
};

const fake = http.createServer(async (req, res) => {
  const seg = req.url.split('/').filter(Boolean);
  const host = seg[0] || '';
  const path = '/' + seg.slice(1).join('/');
  // Round 124: Supabase is a table, not a page. Kept OFF the request log so a
  // "zero network calls" assertion measures the lead and not the bookkeeping.
  if (host === 'supabase.example') {
    if (seg[1] !== 'rest' || seg[2] !== 'v1' || !seg[3]) return send(res, 404, { message: 'servercheck: not a PostgREST path: ' + req.url });
    return sbFake(req, res, seg[3].split('?')[0], req.url.split('?').slice(1).join('?'));
  }
  state.requests.push({ host, path: path.split('?')[0] });
  const body = await readBody(req);
  // Round 112: the search query rides the record, so a scenario can tell the
  // size lookup's searches from a page bought instead of read for free.
  // Round 141: and the FORMATS, because the contact read now asks Firecrawl for
  // exactly one thing it cannot get free - a picture of the homepage - and the
  // free-read invariant below has to tell that one render from a page BUY.
  try { const _j = JSON.parse(String(body || '')); state.requests[state.requests.length - 1].query = String((_j && _j.query) || ''); state.requests[state.requests.length - 1].url = String((_j && _j.url) || ''); state.requests[state.requests.length - 1].formats = Array.isArray(_j && _j.formats) ? _j.formats.slice() : []; } catch (e) { state.requests[state.requests.length - 1].query = ''; state.requests[state.requests.length - 1].url = ''; state.requests[state.requests.length - 1].formats = []; }
  const b = BIZ_BY_HOST[host] || state.biz || biz('A');

  if (host === 'api.anthropic.com') return send(res, 200, anthropicAnswer(body, b));

  if (host === 'places.googleapis.com') {
    // Light request-contract check: the fake ignores most headers, which makes
    // request drift invisible — but the field mask is the one header that
    // silently deletes measurements server-side when it goes missing, so its
    // absence is recorded and asserted after the golden lead.
    if (!req.headers['x-goog-fieldmask']) state.contract.push('places call without X-Goog-FieldMask: ' + path);
    if (/searchText/.test(path)) {
      const _mask = String(req.headers['x-goog-fieldmask'] || '');
      // Round 143: the Find press, told apart by the one thing only
      // searchGooglePlaces asks for - nextPageToken on the field mask. The
      // rank check, the place-id recovery and the duplicate-listing search
      // never ask for it, so they keep placesList exactly as before.
      if (/nextPageToken/.test(_mask)) {
        let _tq = '', _ps = 20;
        try { const _j = JSON.parse(String(body || '{}')); _tq = String(_j.textQuery || ''); _ps = Number(_j.pageSize) || 20; } catch (e) { void e; }
        return send(res, 200, gpFindAnswer(_tq, _mask, _ps));
      }
      return send(res, 200, placesList(b));
    }
    return send(res, 200, placeDetails(b));   // details by place id
  }

  if (host === 'api.firecrawl.dev') {
    if (state.mode === 'fc402') {
      return send(res, 402, { success: false, error: 'Payment Required: insufficient credits. Upgrade your plan.' });
    }
    const H = { 'x-ratelimit-limit': '1000' };
    if (/\/v1\/map/.test(path)) {
      return send(res, 200, { links: [`https://${b.host}/`, `https://${b.host}/about`, `https://${b.host}/booking`, `https://${b.host}/contact`] }, H);
    }
    if (/\/v1\/search/.test(path)) return send(res, 200, { data: [] }, H);
    if (/\/v1\/scrape/.test(path)) {
      let url = '', fmts = []; try { const _b = JSON.parse(body); url = _b.url || ''; fmts = Array.isArray(_b.formats) ? _b.formats : []; } catch (e) { void e; }
      // A render-only request: the real API answers with a SIGNED URL, not the
      // bytes, and the reader then fetches it over plain HTTP. state.noShot is
      // the other real case - the request runs and no picture comes back.
      if (fmts.length === 1 && fmts[0] === 'screenshot') {
        return send(res, 200, state.noShot ? { success: true, data: {} } : { success: true, data: { screenshot: 'https://shots.example/home.png' } }, H);
      }
      const isHome = url.replace(/\/+$/, '').endsWith(b.host);
      const md = isHome ? HOMEPAGE_MD(b)
        : `# ${b.company} - ${url.split('/').pop()}\n\nThis interior page of ${b.company} describes ${url.split('/').pop()} in honest detail, at enough length that the duplicate-page fingerprint can tell it apart from every other page on the site. The ${url.split('/').pop()} page carries its own words.\n`;
      return send(res, 200, { success: true, data: { markdown: md, rawHtml: HOMEPAGE_HTML(b) } }, H);
    }
    return send(res, 200, { success: true, data: {} }, H);
  }

  // Round 141: where a Firecrawl render is collected from. A real 1x1 PNG, so
  // the reader's own byte and decode guards run on something they can decode.
  if (host === 'shots.example') {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': String(png.length) });
    return res.end(png);
  }

  if (host === 'api.apify.com') {
    if (state.mode === 'apify403') return send(res, 403, { error: { type: 'user-not-authorized', message: 'Invalid token' } });
    return send(res, 200, apifyItems(b));
  }

  if (host === 'api.hunter.io') return send(res, 200, { data: { emails: [], pattern: null } });

  // ── THE FREE NAME-TO-DOMAIN SLATE (round 105) ─────────────────────────────
  // 'findtwin' hands back two different hosts under one name, which is the
  // ambiguity the resolver must refuse; every other mode names the fixture host.
  if (host === 'autocomplete.clearbit.com') {
    if (state.mode === 'findnoresolve') return send(res, 200, []);
    if (state.mode === 'findtwin') return send(res, 200, [{ name: b.company, domain: b.host }, { name: b.company, domain: b.host.replace('roofing.example', 'roofingco.example') }]);
    return send(res, 200, [{ name: b.company, domain: b.host }]);
  }
  if (host === 'api.thecompaniesapi.com') {
    if (/by-name/.test(path)) return send(res, 200, { companies: (state.mode === 'findtwin' || state.mode === 'findnoresolve') ? [] : [{ about: { name: b.company }, domain: { domain: b.host } }] });
    return send(res, 404, {});
  }

  // Round 143B: a cast business's OWN site, read free by the press. Tested
  // BEFORE the shared .example fallback and never reachable from a contact-read
  // scenario, which runs against the biz hosts rather than the cast's.
  if (GP_SITE_BY_HOST[host]) return send(res, 200, GP_PRESS_PAGE(GP_SITE_BY_HOST[host], path));

  // The public domain registry, in its own shape: an events list carrying a
  // registration date and a last-changed date, which is exactly the pair the
  // parser has to tell apart. FREE and keyless in real life; whether Render can
  // REACH it is the one thing this fixture cannot answer.
  if (host === 'rdap.org') {
    return send(res, 200, { objectClassName: 'domain', ldhName: path.replace('/domain/', ''), events: [
      { eventAction: 'last changed', eventDate: '2026-01-04T00:00:00Z' },
      { eventAction: 'registration', eventDate: '2004-06-01T00:00:00Z' },
    ] });
  }

  if (host === b.host || /\.example$/.test(host)) {
    if (state.slowMs) await sleep(state.slowMs);
    // findblocked: the site refuses a plain fetch outright, which is the ONLY
    // case in which the contact read is allowed to spend a Firecrawl credit.
    if (state.mode === 'findblocked') return send(res, 403, '<html><body>Access Denied. You have been blocked.</body></html>');
    // A resolved domain serving SOMEBODY ELSE'S site: never names the business.
    if (state.mode === 'findstranger') return send(res, 200, FIND_STRANGER_HTML());
    if (state.mode === 'findrich') {
      if (/our-team/.test(path)) return send(res, 200, FIND_TEAM_HTML(b));
      if (/contact/.test(path)) return send(res, 200, FIND_CONTACT_HTML(b));
      if (/careers/.test(path)) return send(res, 200, FIND_CAREERS_HTML(b));
      return send(res, 200, FIND_HOME_HTML(b));
    }
    return send(res, 200, HOMEPAGE_HTML(b));
  }

  state.unknown.push(host + path);
  return send(res, 404, { error: 'servercheck fake knows nothing about ' + host + path });
});

// ── DRIVING THE REAL SERVER ─────────────────────────────────────────────────
const bootServer = (extraEnv) => new Promise((resolve, reject) => {
  const child = spawn('node', ['--max-old-space-size=256', 'server.js'], {
    env: Object.assign({}, process.env, {
      PORT: String(SRV_PORT),
      FAKE_UPSTREAM: `http://127.0.0.1:${FAKE_PORT}`,
      GOOGLE_PLACES_KEY: 'gp_servercheck',
      // The one free name-to-domain source with a real match standard.
      COMPANIES_API_KEY: 'capi_servercheck',
      // Round 124: the fake PostgREST. sbRest reads SUPABASE_URL raw, so the
      // fixture host rides the path the same way FAKE_UPSTREAM's hosts do.
      SUPABASE_URL: `http://127.0.0.1:${FAKE_PORT}/supabase.example`,
      SUPABASE_KEY: 'sb_servercheck',
      // The pace is deliberately NOT overridden: the first attempt set
      // FC_GAP_UNKNOWN_MS=40 and FIRECRAWL PACING CHECK went red on it -
      // "1500 requests a minute against a free tier that allows 10" - which is
      // that guard refusing a process configured faster than the smallest plan
      // Firecrawl sells. The guard was right and the harness was wrong. So the
      // first lead pays the honest unknown-plan pace until the fake's
      // x-ratelimit-limit: 1000 header teaches the gate to relax, through the
      // same mechanism a real plan uses - which means this harness also proves
      // the relaxation works. Only the credit hold is shortened, and nothing
      // pins that setting.
      FC_CREDIT_WAIT_MS: '4000',
      RESEARCH_CONCURRENCY: '2',
      // Round 143: the Google budget for a press, so scenario I's grid is the
      // three category+city pairs it asks for and nothing else. A full grid is
      // ~100 searches across 39 trades and 23 metros, which is minutes of
      // fixture traffic to measure rules that fire on the first page. Nothing
      // in the server pins this number - the boot checks read the setting
      // rather than a default - and the press's own arithmetic is unchanged:
      // placesBudgetFor still hands the search the whole cap when the bench is
      // empty, which is what a real press with an empty bench does.
      GP_QUERY_CAP: '4',
      // And the per-category slot count, because the cast is bigger than the
      // default 14 and a trade's cap is per RUN: without this the last
      // business Google returns for Plumbing is dropped on a cap that is not
      // the rule under test, and it reads as a rule deleting a lead. Raised,
      // never removed - the cap still counts and its FIND YIELD row is still
      // asserted, it just does not bite on a cast this size. (Nothing in the
      // server pins the default; the press reads the setting.)
      GP_PER_CATEGORY_CAP: '40',
      // Round 127: the keys are Render's. A key in a request body no longer counts,
      // so every scenario that spends runs with these; the NOKEY boot clears them.
      ANTHROPIC_API_KEY: 'sk-servercheck',
      FIRECRAWL_KEY: 'fc-servercheck',
      APIFY_TOKEN: 'ap-servercheck',
      // Round 126: the access code and the origin list. Every helper below
      // sends the code; AUTH1 sends none, a wrong one, and reads the public paths.
      APP_TOKEN: SC_TOKEN,
      ALLOWED_ORIGINS: 'https://app.example',
    }, extraEnv || {}),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  child.on('exit', (code) => { child.dead = true; child.exitCode2 = code; });
  const t0 = Date.now();
  const wait = async () => {
    for (;;) {
      if (child.dead) return reject(new Error('server died during boot:\n' + log.split('\n').slice(-12).join('\n')));
      // Kill the child on the timeout path — an orphan wedges SRV_PORT for
      // every later run, which reads as EADDRINUSE on a harness that is fine.
      if (Date.now() - t0 > 120000) { try { child.kill(); } catch (e) { void e; } return reject(new Error('healthz never went green in 120s')); }
      try {
        const r = await httpGet(`http://127.0.0.1:${SRV_PORT}/healthz`);
        if (r.code === 200 && r.json && r.json.status === 'green') return resolve({ child, log: () => log });
        if (r.code === 503) { /* still checking - this IS the healthz gate working */ }
      } catch (e) { void e; }
      await sleep(1000);
    }
  };
  wait();
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SC_TOKEN = 'sc-token';
const httpGet = (url) => new Promise((resolve, reject) => {
  http.get(url, { headers: { Authorization: 'Bearer ' + SC_TOKEN } }, (res) => {
    let b = ''; res.on('data', (c) => { b += c; });
    res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) { void e; } resolve({ code: res.statusCode, json: j, text: b }); });
  }).on('error', reject);
});
const httpPost = (url, obj) => new Promise((resolve, reject) => {
  const body = JSON.stringify(obj);
  const u = new URL(url);
  const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), Authorization: 'Bearer ' + SC_TOKEN } }, (res) => {
    let b = ''; res.on('data', (c) => { b += c; });
    res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) { void e; } resolve({ code: res.statusCode, json: j }); });
  });
  req.on('error', reject); req.write(body); req.end();
});

// Round 126: a request with exactly the headers given (no code unless the
// caller adds one), any verb, the response headers kept for the CORS asserts.
const httpRaw = (method, path, headers, obj) => new Promise((resolve, reject) => {
  const body = obj === undefined ? '' : JSON.stringify(obj);
  const h = Object.assign({}, headers || {});
  if (body) { h['Content-Type'] = 'application/json'; h['Content-Length'] = Buffer.byteLength(body); }
  const req = http.request({ hostname: '127.0.0.1', port: SRV_PORT, path, method, headers: h }, (res) => {
    let b = ''; res.on('data', (c) => { b += c; });
    res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) { void e; } resolve({ code: res.statusCode, json: j, text: b, headers: res.headers }); });
  });
  req.on('error', reject); if (body) req.write(body); req.end();
});

const leadBody = (b, over) => Object.assign({
  company: b.company, name: b.company, website: `https://${b.host}`, placeId: b.placeId,
  location: 'Dallas, TX 75201', industry: 'roofer',
  apiKey: 'sk-servercheck', keys: { firecrawlKey: 'fc-servercheck', apifyToken: 'ap-servercheck' },
  reviewCount: REVIEW_TOTAL, rating: 4.6,
}, over || {});

const runLead = async (b, over, capMs) => {
  const sub = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/research-async`, leadBody(b, over));
  if (!sub.json || !sub.json.jobId) return { error: 'no jobId: ' + JSON.stringify(sub.json).slice(0, 200) };
  const t0 = Date.now();
  for (;;) {
    await sleep(700);
    const st = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/research-job/${sub.json.jobId}`);
    if (st.json && (st.json.status === 'done' || st.json.status === 'error') && st.json.phase !== 'queued' && st.json.phase !== 'running') {
      return st.json;
    }
    if (st.json && st.json.status === 'error' && st.json.error) return st.json;
    if (Date.now() - t0 > (capMs || 180000)) return { error: 'poll cap: still ' + JSON.stringify(st.json && { status: st.json.status, phase: st.json.phase }) };
  }
};

// ── THE SCENARIOS ───────────────────────────────────────────────────────────
(async () => {
  await new Promise((r) => fake.listen(FAKE_PORT, '127.0.0.1', r));
  console.log('servercheck: fixture network on :' + FAKE_PORT);

  let srv = null;
  try {
    // healthz must gate: hit it before boot settles (bootServer loops on it,
    // and the loop itself observed 503-while-checking on the way to 200).
    // Round 124: the keys a background read takes from Settings, seeded before
    // the first boot so the schema probe finds user_settings.data.
    state.sb.user_settings = [{ id: 'singleton', data: { apiKey: 'k-test', firecrawlKey: 'fc-test', verifierKey: '' } }];
    srv = await bootServer({});
    console.log('servercheck: server green on :' + SRV_PORT + ' (healthz held 503 until the verdict settled, then answered 200)');
    passed += 1;

    // ── A: THE GOLDEN LEAD ──────────────────────────────────────────────
    console.log('\n── scenario A: the golden lead');
    state.mode = 'golden'; state.biz = biz('A');
    // The model-call count on a COMPLETE lead. Scenario D compares against this
    // rather than against a number written here, so the comparison stays true
    // as the pipeline grows or shrinks.
    const anthCalls = () => state.requests.filter(q => q.host === 'api.anthropic.com').length;
    const a0 = anthCalls();
    const A = await runLead(state.biz);
    const goldenModelCalls = anthCalls() - a0;
    ok(A.httpStatus === 200 && A.result, `the golden lead did not complete 200 — got ${JSON.stringify({ httpStatus: A.httpStatus, error: (A.error || '').slice(0, 160) })}`);
    const R = A.result || {};
    if (!(Array.isArray(R.problemList) && R.problemList.length > 0)) {
      info('ladder diagnostics: _ladderFailed=' + JSON.stringify((R.brainAudit && R.brainAudit._ladderFailed) || R._ladderFailed || null).slice(0, 300));
      srv.log().split('\n').filter((l) => /harm ladder|LADDER|COMPOSE TRACE|SPINE|_harmsForResponse/.test(l)).slice(-12)
        .forEach((l) => info('server: ' + l.slice(0, 220)));
    }
    // These ride the response NESTED under brainAudit — the explicit literal
    // whose own comment reads "NAMED HERE OR IT DOES NOT EXIST" — because that
    // is where the client merge reads them from. The first run of this harness
    // asserted them at top level, went red, and the server log showed the
    // ladder alive with three findings: an aim error in the HARNESS, found by
    // reading the trace it prints for exactly this case. Asserted at the level
    // the CLIENT actually consumes, which is the only level that matters.
    const BA = R.brainAudit || {};
    ok(Array.isArray(BA.problemList) && BA.problemList.length > 0, 'the ladder produced no problem list — the audit is model prose with nothing under it, the exact §40 failure');
    ok(BA.factualSpine && BA.factualSpine.claim, 'no factual spine was built, so Generate falls back to the highest-invention path');
    ok(Array.isArray(BA.harmsRanked) && BA.harmsRanked.length > 0, 'harmsRanked is empty — the call sheet loses the ranked findings');
    ok(BA.composedEmail && BA.composedEmail.variantA && BA.composedEmail.variantA.subject, 'no composed email arrived with the audit — the compose-with-research promise (§41) is dark');
    ok(R.reviewCount === REVIEW_TOTAL, `reviewCount is ${R.reviewCount}, not the Place Details count ${REVIEW_TOTAL} — the 150-of-8 class, the authority rule broken`);
    ok(BA.pitchAngle, 'the brain audit did not land on the payload');
    ok(R.situationRead != null, 'the situation read is missing');
    const sp = R.leadSpend || {};
    ok(sp.fcCredits > 0, 'leadSpend.fcCredits is zero on a lead that scraped pages — the per-request ledger is dark');
    ok(sp.places >= 2, `leadSpend.places is ${sp.places} — the Places calls are not being counted per lead`);
    ok(sp.anthropicUsd > 0, 'leadSpend.anthropicUsd is zero on a lead that ran the audit');
    ok(sp.apify === 1, `leadSpend.apify is ${sp.apify}, not 1`);
    const spend1 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/spend`);
    ok(spend1.json && spend1.json.spend && spend1.json.spend.fc > 0, '/api/spend does not reflect the day');
    ok(spend1.json && spend1.json.byKind && Object.keys(spend1.json.byKind).length > 0, '/api/spend has no per-kind split, so FC_SCREENSHOT_CREDITS can never be reconciled');
    // Exactly the fixture's length, not merely non-zero. reviewsRead is the
    // number of reviews the MODEL was shown, and the pull now fits its own
    // corpus before counting anything — so this is the live proof that the
    // corpus wire is intact end to end. `>= 1` would pass on a build where the
    // corpus arrived truncated and the count was taken over the whole scrape,
    // which is the exact defect the corpus builder replaces.
    ok(R.reviewsRead === REVIEWS.length, `reviewsRead is ${R.reviewsRead}, not the ${REVIEWS.length} reviews the fake returned — the number reported as read has come apart from the number the model was shown`);
    ok(!/FACT CHECK DID NOT RUN/.test(srv.log()), 'the fact-check — the last gate before a prospect — did not run on the golden lead, and the marker-keyed fake fails soft exactly there');
    ok(state.contract.length === 0, `request-contract violations: ${state.contract.join(' | ')}`);

    // ── C: DEAD APIFY TOKEN ─────────────────────────────────────────────
    console.log('── scenario C: Apify 403 — the mine is dark, the audit is not');
    state.mode = 'apify403'; state.biz = biz('C');
    const C = await runLead(state.biz);
    ok(C.httpStatus === 200 && C.result, `an Apify 403 killed the whole lead (${JSON.stringify({ httpStatus: C.httpStatus, error: (C.error || '').slice(0, 120) })}) — the mine going dark must thin the audit, not delete it`);
    ok(C.result && (C.result.reviewsRead == null || C.result.reviewsRead === 0), 'reviewsRead is populated on a lead whose review pull was refused — a dead token reported as a measurement');

    // ── D: THE BRAIN HUSK ───────────────────────────────────────────────
    console.log('── scenario D: the audit comes back empty — BRAIN GATE 422');
    state.mode = 'husk'; state.biz = biz('D');
    const d0 = anthCalls();
    const D = await runLead(state.biz);
    const huskModelCalls = anthCalls() - d0;
    ok(D.httpStatus === 422, `an empty audit did not 422 (got ${D.httpStatus}) — the husk ships as a real audit`);
    // AND IT MUST STOP SPENDING. The refusal is unchanged; what changed is that
    // a lead already destined for the 422 no longer buys the strategic read and
    // the fact-check first, whose answers are discarded with it. Compared
    // against the golden lead on this same boot, so the assertion cannot rot
    // into a hardcoded number.
    ok(/BRAIN GATE \(early\)/.test(srv.log()), 'the husk never hit the early gate — it is still paying for the strategic read and the fact-check before being refused ~2,000 lines later');
    ok(huskModelCalls < goldenModelCalls, `a husk lead made ${huskModelCalls} model call(s) against the golden lead's ${goldenModelCalls} — it is buying as much as a lead that ships`);
    ok(goldenModelCalls > 0, 'the golden lead made no model calls at all, so the husk comparison above proves nothing');

    // ── G: CALLING MODE ──────────────────────────────────
    // Driven end to end, in BOTH directions, on a lead that deliberately cannot
    // settle at stage 1 - a name with no title, on a business it is not named
    // after. That state is the only one in which the branch is reachable, and
    // without it this scenario would report a clean pass having exercised
    // nothing, which is the vacuous-check trap.
    //
    // The control runs FIRST so the comparison is against this build, not
    // against a remembered number.
    console.log('── scenario G: calling mode — the paid owner wave is not bought');
    const fcSearches = () => state.requests.filter(q => q.host === 'api.firecrawl.dev' && /\/v1\/search/.test(q.path)).length;
    state.mode = 'nosettle'; state.biz = biz('G');
    const g0 = fcSearches();
    const Gctl = await runLead(state.biz);
    const ctlSearches = fcSearches() - g0;
    ok(Gctl.httpStatus === 200, `the control lead for calling mode did not complete (got ${Gctl.httpStatus})`);
    ok(ctlSearches > 0, 'the control lead bought ZERO owner searches, so this fixture settles at stage 1 and the calling-mode comparison below proves nothing');

    state.biz = biz('G2');
    const g1 = fcSearches();
    const Gcall = await runLead(state.biz, { callOnly: true });
    const callSearches = fcSearches() - g1;
    ok(Gcall.httpStatus === 200, `a calling-mode lead did not complete (got ${Gcall.httpStatus}) — the flag must change what is BOUGHT, never whether the audit ships`);
    ok(callSearches === 0, `calling mode still bought ${callSearches} owner search(es) against the control's ${ctlSearches} — the flag is not reaching findDecisionMaker`);
    ok(/CALL MODE/.test(srv.log()), 'the calling-mode branch never printed its own name, so the run has no record of why the owner lookups were skipped');
    // The audit itself must be UNCHANGED: this cuts a name lookup, not evidence.
    // Compared against the control on the SAME fixture rather than asserted
    // absolutely - the no-owner fixture is deliberately thin, so an absolute
    // assertion here would be testing the fixture instead of the flag, and would
    // pass or fail for reasons that have nothing to do with calling mode.
    const _pl = (x) => (((x || {}).result || {}).brainAudit || {}).problemList;
    const ctlFindings = Array.isArray(_pl(Gctl)) ? _pl(Gctl).length : -1;
    const callFindings = Array.isArray(_pl(Gcall)) ? _pl(Gcall).length : -1;
    info(`calling mode: ${ctlSearches} owner search(es) on the control and ${callSearches} in calling mode; ${ctlFindings} finding(s) either side`);
    ok(callFindings === ctlFindings,
      `calling mode changed the AUDIT: ${callFindings} finding(s) against the control's ${ctlFindings}. It must change what is BOUGHT, never what is measured.`);
    // The finding count can legitimately be zero on this deliberately thin
    // fixture, so the evidence GATHERED is asserted separately: the same pages
    // must be read either way. This is the half that would catch a flag which
    // had quietly reached the page budget instead of the owner ladder.
    const _chars = (x) => (((x || {}).result || {}).corpusRead || {}).homepageChars;
    // Not equality: the two fixtures carry their own company name and host, and
    // those appear in the page, so the counts differ by exactly that much. What
    // must hold is that BOTH read the whole page.
    ok(_chars(Gcall) > 200 && Math.abs(_chars(Gcall) - _chars(Gctl)) < 20,
      `calling mode read ${_chars(Gcall)} characters of their homepage against the control's ${_chars(Gctl)} - it has reached the evidence, not just the owner lookups`);

    // ── H: THE FIND-TAB CONTACT READ, DRIVEN ────────────────────────────
    // The standing goal is fifty leads a day with an owner, an address, a
    // number and a score, and this route is where that is decided. Every
    // assertion below is about the SEAM, which is where every recorded
    // computed-but-not-passed has lived: the fixtures already prove the
    // predicates at boot, and a route that never delivers them would still
    // boot green.
    console.log('── scenario H: the Find contact read — free pages, three signals, a score');
    const fcCalls = () => state.requests.filter(q => q.host === 'api.firecrawl.dev').length;
    state.mode = 'findrich'; state.biz = biz('H');
    const hBiz = state.biz;
    const h0 = fcCalls();
    const hReq0 = state.requests.length;   // Round 112: an INDEX into the request log, not a count
    const hLog0 = srv.log().length;        // Round 129: and one into the log, for the not-bought line
    // Scoped to THIS lead's window. state.requests accumulates across every
    // scenario and the golden lead legitimately buys a review pull, so an
    // absolute count here measures somebody else's spend - a harness that
    // reports the wrong scenario's numbers is worse than no assertion.
    const apifyCalls = () => state.requests.filter(q => q.host === 'api.apify.com').length;
    const hAp0 = apifyCalls();
    const H1 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
      company: { name: hBiz.company, website: `https://${hBiz.host}`, phone: '(214) 555-0188',
                 location: 'Dallas, TX', industry: 'roofer', reviewCount: 180, rating: 4.6 },
      keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test', verifierKey: '' },
    });
    const hFc = fcCalls() - h0;
    // Round 112: the size lookup is a DECLARED spend (Vin: measure the size instead
    // of guessing it), bought only when nothing measured the size. The free-read
    // invariant is about PAGES: no map, no scrape, no owner search on a site that
    // answers a plain fetch. The size searches are counted apart and must be the
    // only Firecrawl calls on this lead.
    const _isSizeQ = (q) => /revenue \(prospeo\.io|employees \(site:linkedin/.test(String(q || ''));
    // Round 141: a RENDER is a request for one picture and nothing else. It is
    // the one thing on this route that cannot be had for free, it is bought
    // once a lead, and it is counted apart - so "the free read is still the
    // door" keeps meaning pages, which is what it was written to mean.
    const _isRender = (q) => Array.isArray(q.formats) && q.formats.length === 1 && q.formats[0] === 'screenshot';
    const hFcFree = state.requests.slice(hReq0).filter(q => q.host === 'api.firecrawl.dev' && !_isSizeQ(q.query) && !_isRender(q)).length;
    const hFcSize = state.requests.slice(hReq0).filter(q => q.host === 'api.firecrawl.dev' && _isSizeQ(q.query)).length;
    const hFcShot = state.requests.slice(hReq0).filter(q => q.host === 'api.firecrawl.dev' && _isRender(q)).length;
    const hApify = apifyCalls() - hAp0;
    const HJ = H1.json || {};
    ok(H1.code === 200, `the contact read answered ${H1.code}: ${String(HJ.error || '').slice(0, 160)}`);
    // THE HEADLINE. The whole cost case rests on this one number: a site that
    // answers a plain HTTP GET must cost NOTHING. If this ever goes above zero
    // the read has quietly gone back to buying pages it could have had free,
    // and the "under $100 a month" arithmetic goes with it.
    ok(hFcFree === 0, `the contact read made ${hFcFree} Firecrawl call(s) beyond the size lookup on a site that answers a plain fetch — the free read is not the door any more`);
    // Round 129: their own team page lists three people. That settles them as
    // small, and a directory has no record of a three-person roofer - 20 of the
    // 30 Firecrawl credits on the 2026-09-09 run went to exactly this search and
    // five of seven leads got back "no record of this business". So on THIS lead
    // the size lookup must buy nothing, and must say which reason stood it down.
    ok(hFcSize === 0, `the size lookup bought ${hFcSize} search(es) on a lead whose own team page lists three people - that page already answers the question the directory search asks`);
    // ── ROUND 141: THE SECOND VERDICT, DRIVEN THROUGH THE REAL ROUTE ──────
    // One render a lead, not one a page: the free plain-fetch door reads four
    // pages here and exactly one picture is bought.
    ok(hFcShot === 1, `the contact read took ${hFcShot} homepage render(s) on one lead - it is one picture of the first screen, once`);
    const HSite = HJ.site || {};
    ok(HSite.looks === 'bad' && HSite.looksMeasured === true, `the eyes called this homepage old, an untouched template and not credible, and the lead came back looks=${HSite.looks} measured=${HSite.looksMeasured}`);
    ok(/out of date/.test(String(HSite.looksWhy || '')), `the visual verdict arrived with no reason a person could check: ${JSON.stringify(HSite.looksWhy)}`);
    // THE BLAST RADIUS, on a live route rather than on a fixture: the picture
    // said "bad" and the technical grade the audit and the Find score read is
    // still the markup verdict, computed from the same four pages as before.
    ok(HSite.measured === true && HSite.word === 'weak' && HSite.gap === 14 && HSite.grade === 5,
      `the technical website grade MOVED when the visual one arrived: word=${HSite.word} gap=${HSite.gap} grade=${HSite.grade} on ${(HSite.faults || []).map(f => f.id).join(',') || 'no faults'} - every audit finding and the Find score read those three`);
    ok(HSite.looks !== HSite.word, 'the two website verdicts have collapsed into one word, so the toggle and the audit can no longer disagree - which is the whole reason there are two');
    ok((HJ.spend || {}).render === 1, `the lead reports ${JSON.stringify((HJ.spend || {}).render)} credit(s) on the homepage render - the footer figure is what settles the 1-versus-5 rate against the dashboard`);
    ok(/SITE LOOKS \[[^\]]*\]: bad to a visitor/.test(srv.log().slice(hLog0)), 'the visual verdict never reaches the log, so a batch cannot be read for it');
    ok(/of them the homepage render/.test(srv.log().slice(hLog0)), 'the FIND CONTACT footer does not carry what the render cost this lead');
    ok(HJ.sizeLookup && HJ.sizeLookup.bought === false && /team page lists 3 people/.test(String(HJ.sizeLookup.why || '')), `the size lookup on a three-person team page reads ${JSON.stringify(HJ.sizeLookup)} - it must be not bought, and name the reason`);
    ok(/SIZE LOOKUP \[[^\]]*\]: not bought - their own team page lists 3 people/.test(srv.log().slice(hLog0)), 'the size search was stood down and no line says why - a saving the operator cannot see reads as a broken feature');
    // The BUY path still has to be DRIVEN, or a source needle is all that is
    // left proving it. Two names on a team page is a layout, not a measurement:
    // this lead is neither measured nor settled, so it must buy.
    state.teamSize = 2;
    const hbBiz = bizReg('Hb');
    const hbReq0 = state.requests.length;
    const Hbuy = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
      company: { name: hbBiz.company, website: `https://${hbBiz.host}`, phone: '(214) 555-0188',
                 location: 'Dallas, TX', industry: 'roofer', reviewCount: 180, rating: 4.6 },
      keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test', verifierKey: '' },
    });
    state.teamSize = 3;
    const hbSize = state.requests.slice(hbReq0).filter(q => q.host === 'api.firecrawl.dev' && _isSizeQ(q.query)).length;
    const HbuyJ = Hbuy.json || {};
    ok(Hbuy.code === 200, `the second contact read answered ${Hbuy.code}: ${String(HbuyJ.error || '').slice(0, 160)}`);
    ok(hbSize >= 1 && hbSize <= 2, `the size lookup bought ${hbSize} search(es) on a lead that published no size and whose two-name team page settles nothing - it should buy one, and a second only on a miss`);
    ok(HbuyJ.sizeLookup && HbuyJ.sizeLookup.bought === true, 'the size lookup was not bought on a lead whose pages published no size and whose team page names two people, so the sheet guesses off the review count');
    ok((HJ.spend || {}).firecrawl === hFcSize * 2 + (HJ.spend || {}).render, `the contact read reports ${(HJ.spend || {}).firecrawl} Firecrawl credit(s) on a plainly readable site where the size lookup bought ${hFcSize} search(es) at 2 each and the homepage render cost ${(HJ.spend || {}).render} - a page was bought, or the ledger missed one of them`);

    // ══ ROUND 141a: A PICTURE THAT DID NOT COME BACK KEEPS THE LEAD ═══════
    // Vin's ruling: an unreadable site is KEPT and marked unknown. Driven, not
    // asserted from a fixture: the render request RUNS and Firecrawl answers
    // with no picture, which is the commonest live shape there is.
    {
      state.noShot = true;
      const nsBiz = bizReg('Hns'); state.biz = nsBiz;
      const nsReq0 = state.requests.length;
      const NS = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
        company: { name: nsBiz.company, website: `https://${nsBiz.host}`, phone: '(214) 555-0188',
                   location: 'Dallas, TX', industry: 'roofer', reviewCount: 180, rating: 4.6 },
        keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test', verifierKey: '' },
      });
      state.noShot = false;
      const NSJ = NS.json || {}; const NSS = NSJ.site || {};
      const nsShot = state.requests.slice(nsReq0).filter(q => q.host === 'api.firecrawl.dev' && _isRender(q)).length;
      ok(NS.code === 200 && NSJ.notIcp !== true, `a lead whose homepage render came back empty was dropped instead of kept: ${NS.code} ${JSON.stringify(NSJ.icpWhy || '').slice(0, 120)}`);
      ok(nsShot === 1, `the render was asked for ${nsShot} time(s) on a site that answered with no picture - once, and never retried`);
      // ── ROUND 142 RE-AIMED THIS ASSERTION, AND SAYS SO ───────────────
      // It read: no picture => looks 'unknown', measured false. That was right
      // while the picture was the ONLY thing that could see a website. Round
      // 142 gave the verdict a second pair of eyes that costs nothing - the
      // build and converts faults the free markup read already found - after
      // the toggle graded nine of nine live leads 'modern'. So a lead whose
      // picture never came back is now judged on its own markup, and only a
      // lead where BOTH reads came back empty is 'unknown'.
      //
      // The invariant that assertion existed to hold is unchanged and still
      // enforced: never-looked must never read as looks-fine. It is proven on
      // the dropped lead below, which comes back 'unknown' off this same live
      // route, and on BOTH halves of the boot's SITE LOOKS CHECK.
      ok(NSS.looksMeasured === true && NSS.looks !== 'modern' && NSS.looks !== 'unknown',
        `the picture never came back and their own markup was read fine, and the lead came back looks=${NSS.looks} measured=${NSS.looksMeasured} - the free code read is the second pair of eyes, so this is judged, not unknown`);
      ok(/markup/.test(String(NSS.looksWhy || '')) && /no picture/.test(String(NSS.looksWhy || '')),
        `the row is not told that nobody could see their homepage AND that the verdict came off their code instead: ${JSON.stringify(NSS.looksWhy)}`);
      // The one that cannot be allowed to drift: the markup verdict must agree
      // with the markup. It is read from out.site.faults, so a verdict that
      // named faults the technical read never found would be invented.
      ok((NSS.looksFaults || []).every(f => (NSS.faults || []).some(x => x.id === f)),
        `the visual verdict claims faults ${JSON.stringify(NSS.looksFaults)} that the markup read never found in ${JSON.stringify((NSS.faults || []).map(x => x.id))} - a verdict off nothing`);
      ok(NSS.measured === true && NSS.word === HSite.word && NSS.gap === HSite.gap, `the same build graded ${NSS.word}/${NSS.gap} with no picture and ${HSite.word}/${HSite.gap} with one - the markup read never needed a render`);
      ok((NSJ.spend || {}).render === 0, `a render that returned no picture was billed ${JSON.stringify((NSJ.spend || {}).render)} credit(s)`);
    }

    // ══ ROUND 141b: A FRANCHISE NEVER PAYS FOR A PICTURE ══════════════════
    // The rule the chain read states where it sits, pointed at the render: the
    // site read is already spent and cannot be refunded, everything after it
    // can. Their own homepage sells franchises, so the drop fires on the FIRST
    // page read and the render must never be asked for at all.
    {
      state.franchise = true;
      const frBiz = bizReg('Hfr'); state.biz = frBiz;
      const frReq0 = state.requests.length; const frLog0 = srv.log().length;
      const FR = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
        company: { name: frBiz.company, website: `https://${frBiz.host}`, phone: '(214) 555-0188',
                   location: 'Dallas, TX', industry: 'roofer', reviewCount: 180, rating: 4.6 },
        keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test', verifierKey: '' },
      });
      state.franchise = false;
      const FRJ = FR.json || {}; const FRS = FRJ.site || {};
      const frShot = state.requests.slice(frReq0).filter(q => q.host === 'api.firecrawl.dev' && _isRender(q)).length;
      ok(FR.code === 200 && FRJ.notIcp === true && FRJ.icpReason === 'chain', `a homepage selling franchises was not dropped: ${FR.code} notIcp=${FRJ.notIcp} reason=${FRJ.icpReason}`);
      ok(frShot === 0, `a lead dropped as a franchise still bought ${frShot} homepage render(s) - the drop exists to stop the spend after it`);
      ok((FRJ.spend || {}).render === 0, `a dropped lead reports ${JSON.stringify((FRJ.spend || {}).render)} credit(s) of render`);
      ok(FRS.looks === 'unknown' && FRS.looksMeasured === false, `a dropped lead carries a visual verdict (${FRS.looks}/${FRS.looksMeasured}) nobody bought a picture for`);
      ok(/0 of them on a homepage render/.test(srv.log().slice(frLog0)), 'the drop line does not print the render cost of a dropped lead, which is the line that shows it is zero');
      state.biz = hBiz;
    }
    ok(/plain fetch/.test(String(HJ.readVia || '')), `readVia says "${HJ.readVia}" rather than naming the free read`);
    // Their own navigation, not a paid sitemap: the team, contact and careers
    // pages must all have been found from the homepage's own links.
    const hPaths = (HJ.pagesRead || []).map(p => String(p.url).split('/').pop()).join(',');
    ok((HJ.pagesRead || []).length >= 3, `only ${(HJ.pagesRead || []).length} page(s) were read (${hPaths}) — the navigation harvest is not reaching the picker`);
    // THE THREE SIGNALS, in the positive direction.
    const HS = HJ.signals || {};
    ok(HS.adsCode === true, `the Google ad tag on their homepage did not read as ad spend (adsCode=${JSON.stringify(HS.adsCode)})`);
    ok(HS.teamCount === 3, `the three-person team page read as ${JSON.stringify(HS.teamCount)} — the headcount is the closest free thing to the revenue band the ICP is defined by`);
    ok(HS.hiringMarketing === true, `the dated Marketing Manager posting did not read as hiring for marketing (${JSON.stringify(HS.hiringTitles)})`);
    // THE SCORE, delivered and complete.
    ok(HJ.icp && typeof HJ.icp.score === 'number', `no ICP score arrived: ${JSON.stringify(HJ.icp)}`);
    // Round 119 changed what "every one" means. Two terms - hiring and invests
    // - now LEAVE the score when the answer is an absence, because Vin ruled
    // the quiet ones stop being punished and the ads term already pays for the
    // same silence. So the bar is: nearly every term measured, and any term
    // that sat out says WHY in its own words rather than printing "not
    // measured" about a page we actually read.
    {
      const _un = ((HJ.icp && HJ.icp.terms) || []).filter(t => !t.measured);
      ok(HJ.icp && HJ.icp.of >= 7 && HJ.icp.measured >= HJ.icp.of - 2,
        `the score was measured on ${HJ.icp && HJ.icp.measured} of ${HJ.icp && HJ.icp.of} signals on a lead carrying every one`);
      ok(_un.every(t => t.say && t.say !== 'not measured'),
        `a term sat out of the score and reported "not measured" about work we did do: ${_un.map(t => t.id).join(', ')}`);
      ok(_un.every(t => t.id === 'hiring' || t.id === 'invests'),
        `a term other than the two Round 119 lets sit out left the score: ${_un.map(t => t.id + ' (' + t.say + ')').join('; ')}`);
    }
    // THE TWO TERMS THAT ONLY EXIST AFTER THE LOOKUPS RUN. This is the whole of
    // section 98's score fix and no boot fixture can see it: findIcpScore used
    // to be called ~370 lines ABOVE the owner and address lookups, so a lead
    // where we found both scored identically to one where we found neither.
    ok(HJ.icp && (HJ.icp.terms || []).some(t => t.id === 'reach' && t.measured),
      'the reach term is not measured on a lead that produced a named owner and a published address, so the score is being computed before the lookups again');
    ok(HJ.icp && (HJ.icp.terms || []).some(t => t.id === 'afford' && t.measured),
      'the affordability band is not reaching the contact score, so the Find card, the CSV and contactRankFor are back to three verdicts about one business');
    // Round 118 moved this from 80 to 75 because the website was a TERM and a
    // mediocre site dragged the ratio. Round 119 took it back out of the ratio
    // - a broken site is a LIFT on top of the score now, for the arithmetic in
    // siteLift - so the bar is back at 80 and this fixture, whose site has no
    // schema, no form and a default title, clears it comfortably.
    ok(HJ.icp && HJ.icp.score >= 80, `a business with ad spend, a crew, a marketing hire, 180 reviews and 4.6 stars scored ${HJ.icp && HJ.icp.score}/100`);
    // THE WEBSITE READ, end to end over HTTP. No boot fixture can see this:
    // readSiteBuild runs inside the route, on pages the route fetched itself.
    ok(HJ.icp && typeof HJ.icp.lift === 'number' && HJ.icp.lift > 0,
      `the website gap did not lift a lead whose site we read and found faults on: lift ${HJ.icp && HJ.icp.lift}`);
    ok(HJ.icp && !(HJ.icp.terms || []).some(t => t.id === 'sitegap'),
      'the website gap is back inside the scoring table, where a good site costs a lead the ratio');
    ok(HJ.site && typeof HJ.site.grade === 'number' && HJ.site.grade >= 1 && HJ.site.grade <= 10,
      `the website grade out of 10 did not arrive on the contact response: ${JSON.stringify(HJ.site && HJ.site.grade)}`);
    ok(HJ.site && HJ.site.measured === true && typeof HJ.site.gap === 'number',
      `the website read did not arrive on the contact response: ${JSON.stringify(HJ.site && [HJ.site.measured, HJ.site.gap])}`);
    ok(HJ.site && /no business schema/.test(String(HJ.site.why || '')),
      `the website read did not notice this fixture has no schema markup: ${JSON.stringify(HJ.site && HJ.site.why)}`);
    ok(HJ.site && !/converts? badly|conversion rate/i.test(String(HJ.site.why || '')),
      'the website read claims something about how their site CONVERTS - that is their analytics, not our markup read');
    // THE OWNER, from the shared resolver, off pages nobody paid for.
    ok(HJ.owner && /Pete Barnes/.test(String(HJ.owner.name || '')), `the owner named on their own team page was not resolved: ${JSON.stringify(HJ.owner)}`);
    // THE ADDRESS, off the free contact page.
    ok(HJ.email && /pete@/.test(String(HJ.email.address || '')), `the address published on their contact page was not found: ${JSON.stringify(HJ.email)}`);
    ok(HJ.phone === '(214) 555-0188', `the phone from the listing did not survive: ${JSON.stringify(HJ.phone)}`);
    // HOW SURE WE ARE, which the card and the CSV both read. A row that cannot
    // tell a corroborated name from one the buying floor held back is the
    // defect this round exists to close, and no boot fixture sees the wire.
    ok(HJ.owner && HJ.owner.grade, `the owner arrived with no evidence grade: ${JSON.stringify(HJ.owner)}`);
    ok(HJ.owner && /Pete/.test(String(HJ.owner.askAs || '')),
      `the row carries no instruction for the rep about this name: ${JSON.stringify(HJ.owner && HJ.owner.askAs)}`);
    ok(HJ.email && HJ.email.grade === 'published_personal',
      `an address published on their own contact page graded "${HJ.email && HJ.email.grade}"`);
    // THE FREE OWNER SOURCE MUST NOT FIRE WHEN THE FREE READ ALREADY SETTLED.
    // H settles at stage 1 off their own team page, so the review pull is money
    // we must not spend - the owner's rule was "only when free fails".
    ok(hApify === 0,
      `a lead that settled its owner for free bought ${hApify} review pull(s), so the review-reply source is billing every lead rather than only the ones the free read could not settle`);
    // A site we READ must not be reported as unmeasured independence.
    ok(HJ.chain && HJ.chain.measured === true,
      `a lead whose pages we read reports its chain evidence as unmeasured: ${JSON.stringify(HJ.chain)}`);

    // ── H2: THE SITE REFUSES A PLAIN FETCH ──────────────────────────────
    // The ONLY case a credit may be spent, and the case in which every absence
    // must go silent rather than become a claim about their business.
    console.log('── scenario H2: a site that refuses a plain fetch falls back, and only then');
    state.mode = 'findblocked'; state.biz = biz('H2');
    const h2 = fcCalls();
    const H2 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
      company: { name: state.biz.company, website: `https://${state.biz.host}`, phone: '', reviewCount: 40, rating: 4.4 },
      keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test' },
    });
    const h2Fc = fcCalls() - h2;
    const H2J = H2.json || {};
    ok(H2.code === 200, `the blocked-site contact read answered ${H2.code}: ${String(H2J.error || '').slice(0, 140)}`);
    ok(h2Fc > 0, 'a site that refused a plain fetch did NOT fall back to Firecrawl, so the lead is lost rather than costing a credit');
    ok(/Firecrawl/.test(String(H2J.readVia || '')), `readVia says "${H2J.readVia}" on a lead that fell back`);
    // Two of the five terms still measure (reviews, rating), so the score is
    // out of what could be read and SAYS so - it is not a low score.
    ok(H2J.icp && H2J.icp.measured >= 2, `a lead read only through the fallback measured ${H2J.icp && H2J.icp.measured} signal(s)`);

    // ── H3: NOTHING READ IS NOT A BAD BUSINESS ──────────────────────────
    // No website at all. Every site-derived signal must be null, the score must
    // rest only on what Find already knew, and nothing may report a definite no.
    console.log('── scenario H3: no website — every site signal is null, never false');
    // 'findnoresolve': the free slate finds NOTHING for this name, so the lead
    // stays website-less. Round 105 made a name-only lead resolvable, and in
    // 'findrich' this fixture resolved, read the site and correctly reported
    // ads, a team and hiring - which is the feature working, not this scenario.
    state.mode = 'findnoresolve'; state.biz = biz('H3');
    const h3 = fcCalls();
    const H3 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
      company: { name: state.biz.company, website: '', phone: '(214) 555-0199', reviewCount: 90, rating: 4.5 },
      keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test' },
    });
    const H3J = H3.json || {};
    ok(H3.code === 200, `a lead with no website answered ${H3.code} instead of a phone-only row`);
    ok(fcCalls() - h3 === 0, 'a lead with no website still spent Firecrawl credits');
    const S3 = H3J.signals || {};
    ok(S3.adsCode === null && S3.teamCount === null && S3.hiringAny === null,
      `a business whose site we never opened reports definite answers: ${JSON.stringify({ ads: S3.adsCode, team: S3.teamCount, hiring: S3.hiringAny })} — that is the unmeasured-as-zero failure aimed at a claim about their money`);
    // The review count, the rating, and the fact that the lookups RAN and
    // found nothing. Nothing site-derived, and NOT the affordability band -
    // this fixture carries no industry, so the trade tier and the capacity
    // class have nothing to read and the band correctly declines to speak.
    // (It measures on scenario H, where an industry is present: measured===7.)
    ok(H3J.icp && H3J.icp.measured === 3, `the no-website lead scored on ${H3J.icp && H3J.icp.measured} signals; only the review count, the rating and the empty result of the lookups were measurable`);
    ok(H3J.icp && (H3J.icp.terms || []).some(t => t.id === 'reach' && t.measured),
      'the lookups ran on a lead with no website and the reach term still says unmeasured');
    ok(H3J.icp && !(H3J.icp.terms || []).some(t => (t.id === 'size' || t.id === 'ads' || t.id === 'hiring') && t.measured),
      'a business whose site we never opened is being scored on its site');
    ok(H3J.phone === '(214) 555-0199', 'the phone from the listing was lost on a lead with no website, which is the only field that lead has');

    // ── H4: THE ADMISSION GATES ─────────────────────────────────────────
    console.log('── scenario H4: the contact route refuses before it spends');
    const h4 = state.requests.length;
    const H4b = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
      company: { name: 'Bad URL Co', website: 'not a url at all' }, keys: { anthropicKey: 'k-test' },
    });
    ok(H4b.code === 422 && /usable website/.test(String((H4b.json || {}).error || '')),
      `a website that cannot be a URL was not refused before spending (got ${H4b.code}: ${String((H4b.json || {}).error || '').slice(0, 120)})`);
    ok(state.requests.length === h4, `the refusal still made ${state.requests.length - h4} network call(s) — "nothing was spent" is false`);

    // == I: THE FIND RUN OUTLIVES ITS REQUEST =============================
    // The whole point of the change, driven rather than read. A full-grid Find
    // is 102-120 seconds of work and something between the browser and Render
    // cuts a request at 60, so on 2026-08-28 three presses each completed and
    // each had its answer dropped with the connection. A boot fixture cannot
    // see any of this: what is new is a ROUTE and the store behind it.
    // ── J: A NATIONAL BRAND IS REFUSED BEFORE A BYTE MOVES ───────────────
    // Mike's brief, 2026-08-31: "we just need to focus on getting good quality
    // leads in our ICP." The live run before it read Truly Nolen, Window Nation
    // and Ram Jack at full price, and every franchise filter this file owns was
    // unreachable from this route - they were declared inside the discovery
    // handler. A fixture cannot see that; only driving the route can.
    console.log('── scenario J: the contact route refuses a national brand with zero network calls');
    {
      const _beforeJ = state.requests.length;
      const J1 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
        company: { name: 'Ram Jack, by American Leveling', website: 'https://example.com', placeId: 'p1' },
        keys: { anthropicKey: 'sk-test' },
      });
      ok(J1.code === 422 && J1.json && J1.json.notIcp === true,
        `a national franchise was not refused by the contact route (got ${J1.code}: ${String((J1.json && J1.json.error) || '').slice(0, 140)})`);
      ok(state.requests.length === _beforeJ,
        `the franchise refusal still made ${state.requests.length - _beforeJ} network call(s) - "nothing was read and nothing was spent" is false`);
      // 2026-09-02: a ministry bought a paid owner wave. Institutions are the
      // same door as franchises: refused by name, nothing read, nothing spent.
      const _beforeJm = state.requests.length;
      const Jm = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
        company: { name: 'Synergy Ministry', website: 'https://example.com', placeId: 'p1m' },
        keys: { anthropicKey: 'sk-test' },
      });
      ok(Jm.code === 422 && Jm.json && Jm.json.notIcp === true,
        `a ministry was not refused by the contact route (got ${Jm.code}) - it reads, scores and buys a paid owner wave for an owner that does not exist`);
      ok(state.requests.length === _beforeJm,
        `the ministry refusal still made ${state.requests.length - _beforeJm} network call(s)`);
      // And the guard must not have been tightened until it eats the ICP. An
      // owner-operated name has to reach the read, which is section 14's
      // guard-too-tight failure and the expensive one.
      const J2 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
        company: { name: 'Aqua Blue Pools', website: 'https://example.com', placeId: 'p2' },
        keys: { anthropicKey: 'sk-test' },
      });
      ok(!(J2.code === 422 && J2.json && J2.json.notIcp === true),
        `an owner-operated pool company was refused as out of ICP - the name gate has been widened until it deletes the leads this pipeline exists to find`);
    }

    console.log('── scenario K: a name-only lead resolves a website, or is refused before a slot is taken');
    {
      const kCalls = () => state.requests.length;
      // K1: no website, no listing, no distinctive word -> refused, zero calls, NOT retired.
      const k1c = kCalls();
      const K1 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, { company: { name: 'Premier Solutions' }, keys: { anthropicKey: 'k-test' } });
      ok(K1.code === 422 && K1.json && K1.json.unreadable === true && K1.json.notIcp !== true,
        `a name-only lead with no distinctive word was not refused as nothing-to-read (got ${K1.code}: ${String((K1.json && K1.json.error) || '').slice(0, 120)})`);
      ok(kCalls() === k1c, `the nothing-to-read refusal still made ${kCalls() - k1c} network call(s)`);
      // K2: the free slate resolves, both sources corroborate, the page confirms,
      // the read continues as a weak-confidence domain and the listing is recovered.
      state.mode = 'findrich'; state.biz = biz('K');
      const kb = state.biz;
      const k2c = kCalls();
      const K2 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, { company: { name: kb.company, location: 'Dallas, TX' }, keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test' } });
      const KJ = K2.json || {};
      ok(K2.code === 200, `the name-only read answered ${K2.code}: ${String(KJ.error || '').slice(0, 160)}`);
      ok(KJ.websiteResolved === true && KJ.website === 'https://' + kb.host, `the free slate did not resolve ${kb.host} (website=${JSON.stringify(KJ.website)}, proof=${JSON.stringify(KJ.websiteProof)})`);
      ok(KJ.websiteProof && KJ.websiteProof.confirmedByPages === true, `their own pages did not confirm the resolved domain: ${JSON.stringify(KJ.websiteProof)}`);
      ok(KJ.websiteProof && KJ.websiteProof.corroboration >= 2, `only ${KJ.websiteProof && KJ.websiteProof.corroboration} source(s) corroborated - the Companies API by-name source is not reaching the slate`);
      const kReq = state.requests.slice(k2c);
      ok(kReq.some(q => q.host === 'autocomplete.clearbit.com') && kReq.some(q => q.host === 'api.thecompaniesapi.com'), 'the free slate did not ask both free sources');
      ok((KJ.pagesRead || []).length >= 1, 'a resolved and confirmed domain was not read');
      ok(KJ.owner && KJ.owner.name === 'Pete Barnes', `the owner was not read off the resolved site (${JSON.stringify(KJ.owner && KJ.owner.name)})`);
      ok(/found by us/.test(String((KJ.owner && KJ.owner.gradeWhy) || '')), 'the owner how-sure cell does not say the domain was found by us');
      ok(KJ.listingRecovered === true && KJ.listingFromResolvedDomain === true, `the confirmed domain did not recover the listing (recovered=${KJ.listingRecovered}, fromResolved=${KJ.listingFromResolvedDomain})`);
      ok(KJ.websiteConfidence === 'weak', 'a resolved domain does not carry the weak confidence mark');
      // K3: the page never names the business -> un-stamped, nothing site-derived
      // survives, the listing is NOT recovered, and the lead is NOT retired.
      state.mode = 'findstranger'; state.biz = biz('L');
      const lb = state.biz;
      const k3c = kCalls();
      const K3 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, { company: { name: lb.company, location: 'Dallas, TX' }, keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test' } });
      const LJ = K3.json || {};
      ok(K3.code === 200, `the stranger read answered ${K3.code}: ${String(LJ.error || '').slice(0, 120)}`);
      ok(LJ.websiteResolved === true && LJ.websiteProof && LJ.websiteProof.confirmedByPages === false, `a page that never names the business was not un-stamped: ${JSON.stringify(LJ.websiteProof)}`);
      ok(LJ.website === '' && LJ.owner === null && LJ.email === null && (LJ.pagesRead || []).length === 0,
        `site-derived facts survived the un-stamp (website=${JSON.stringify(LJ.website)}, owner=${JSON.stringify(LJ.owner && LJ.owner.name)}, pages=${(LJ.pagesRead || []).length})`);
      ok(!state.requests.slice(k3c).some(q => q.host === 'places.googleapis.com'), "the listing recovery ran on a domain the page contradicted - a stranger's rating, hours and phone can reach the row");
      ok(LJ.notIcp !== true, 'an un-stamped lead was retired as not-ICP, which deletes a lead that only needs a URL');
      // K4: two accepted hosts with equal corroboration -> resolve nothing, read nothing.
      state.mode = 'findtwin'; state.biz = biz('M');
      const mb = state.biz;
      const k4c = kCalls();
      const K4 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, { company: { name: mb.company, location: 'Dallas, TX' }, keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test' } });
      const MJ = K4.json || {};
      ok(K4.code === 200 && MJ.websiteResolved === false && MJ.website === '', `two plausible domains were not refused as ambiguous (resolved=${MJ.websiteResolved}, website=${JSON.stringify(MJ.website)})`);
      ok(!state.requests.slice(k4c).some(q => q.host === mb.host || /roofingco\.example$/.test(q.host)), 'an ambiguous resolution still read one of the two candidate sites');
      state.mode = '';
    }

    let _findResult = null;
    let _findLog0 = 0;
    // Round 143B: where the press's own NETWORK window starts and ends. The
    // load-bearing claim of that round is that a press buys nothing, and a
    // count over the whole run would be measuring every other scenario.
    let _findReq0 = 0;
    let _findReq1 = 0;
    console.log('── scenario I: the Find run outlives the request that started it');
    {
      // Where the press's own log lines start, for scenario P below.
      _findLog0 = srv.log().length;
      _findReq0 = state.requests.length;
      const _t0 = Date.now();
      const I = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/discover-async`, {
        // Round 143: the spellings the server's OWN tables use - GP_CATEGORIES'
        // label and GP_CITIES' city string. This press sent 'roofer' and
        // 'Dallas, TX' for its whole life; searchGooglePlaces matches niches
        // against the label and cities against GP_CITIES verbatim, so both
        // lists came out empty, the grid was empty and the press returned no
        // businesses at all - which is why every assertion about what a press
        // DOES to a lead was unreachable until now.
        keywords: ['plumbing'], filters: { niches: ['Plumbing'], cities: GP_FIND_CITIES }, keys: {},
      });
      const _submitMs = Date.now() - _t0;
      ok(I.code === 200 && I.json && I.json.jobId,
        `the Find submit answered ${I.code} with ${JSON.stringify(I.json).slice(0, 160)} — the async door is not wired to runDiscovery`);
      // The number that matters. If the submit itself takes a minute we have
      // moved the wall rather than removed it.
      ok(_submitMs < 10000, `the Find submit took ${_submitMs}ms — it is still holding the run open, which is the whole defect`);

      if (I.json && I.json.jobId) {
        // A second press must NOT buy the grid again. Roughly a hundred Places
        // searches per press, and the 60-second cut produced exactly this.
        const I2 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/discover-async`, { keywords: ['roofing'], keys: {} });
        if (I2.json && I2.json.jobId === I.json.jobId) {
          ok(I2.json.deduped === true, 'a second Find press returned the running job without saying it was deduped');
        } else {
          // Only acceptable if the first run had already finished by then.
          const _st = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/discover-job/${I.json.jobId}`);
          ok(_st.json && _st.json.status !== 'running',
            'a second Find press started a SECOND full grid while the first was still running');
        }

        // And the answer is collected by polling, which is what a cut
        // connection can no longer destroy.
        let done = null;
        const _p0 = Date.now();
        for (;;) {
          const st = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/discover-job/${I.json.jobId}`);
          if (st.json && st.json.status !== 'running') { done = st.json; break; }
          if (Date.now() - _p0 > 120000) break;
          await sleep(1000);
        }
        _findReq1 = state.requests.length;
        ok(done && done.status === 'done',
          `the Find job never reported done: ${JSON.stringify(done && { s: done.status, e: done.error }).slice(0, 200)}`);
        ok(done && done.result && Array.isArray(done.result.companies),
          'the finished Find job carries no companies array, so the answer the run paid for is not being handed back');
        _findResult = done && done.result;
      }

      // An id this server has never heard of is a real ending, said plainly,
      // rather than a poll that never resolves.
      const IGone = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/discover-job/find_nope`);
      ok(IGone.code === 404 && IGone.json && IGone.json.status === 'gone',
        `polling an unknown Find id answered ${IGone.code} instead of a plain 'gone'`);

      // And a RESEARCH job must not be readable at the Find door: the Find tab
      // would try to read an audit as a lead list. Both kinds share one store.
      const IWrong = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/research-async`, leadBody(biz('I')));
      if (IWrong.json && IWrong.json.jobId) {
        const _x = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/discover-job/${IWrong.json.jobId}`);
        ok(_x.code === 404, 'a research job can be polled through the Find door, so one tab can be handed the other tab\'s payload');
      }
    }
    // ── R: THE FIND QUEUE ON THE SERVER, AND A READ RUN THAT OUTLIVES THE TAB
    // Round 124. The browser used to hold the queue in localStorage, write the
    // whole table on every action and run the contact reads itself, so a
    // closed tab was a dead batch. Now the Find press writes the queue, a run
    // is a row in read_runs, and the driver claims, reads, stamps and ends
    // with no browser open. No boot fixture can see any of that: every
    // assertion below is a seam between a route, the driver and a table.
    console.log('── scenario R0: the Find press wrote the queue');
    {
      const _q = sbTable('discovered_queue');
      const _n = (_findResult && Array.isArray(_findResult.companies)) ? _findResult.companies.length : 0;
      // Round 143: this was a note, not an assertion - "the Find press returned
      // no companies, so the queue write has nothing to be measured on here" -
      // and it printed on every run for as long as the press had no Google to
      // answer it. Every assertion below it was therefore dead. It is the
      // assertion now: a press that comes back empty is a rep staring at an
      // empty screen, and it must be red rather than noted.
      ok(_n > 0, 'the Find press returned no businesses at all, so the rep has nothing to work and no rule the press applies is being measured');
      if (_n) {
        ok(_findResult.queued === _n, `the Find payload says ${_findResult.queued} queued of ${_n} found - the queue write failed or is not reported`);
        ok(_q.length >= _n, `the Find press found ${_n} and discovered_queue holds ${_q.length} - the server-owned queue is not wired to runDiscovery`);
        ok(_q.every(r => r.extra && typeof r.extra === 'object'), 'a queue row the server wrote carries extra as something other than an object - the old page\'s JSON-string shape is back');
        ok(_q.every(r => typeof r.from_trigger_source === 'boolean' && typeof r.reach_predict === 'number'), 'a queue row the server wrote is missing from_trigger_source or reach_predict, so the summary and the draw order have nothing to read');
        ok(_q.some(r => r.source === 'google_places' && r.from_trigger_source === false), 'a Google listing row reads as a trigger-lane lead');
      }
    }

    // ── P: WHAT THE PRESS DID TO EACH BUSINESS GOOGLE HANDED IT ─────────
    // Round 143. Every rule between Google's answer and the queue row: the
    // trade review floor, the listing Google has condemned, the phone that
    // answers to two names, the branch-URL drop of round 139, the two
    // ceilings, the multi-metro count, the call lead and the FIND YIELD
    // report. All of them were merged and none of them had ever been
    // executed, because the press in scenario I answered 200 and returned
    // nothing. Each assertion names the business it is about, and the cast
    // entry for that business says which rule decides it.
    //
    // Round 143A then CHANGED five of these outcomes, and every line it
    // changed was a line that said so: the floor demotes instead of deleting,
    // the phone pair is dropped, a moved listing is dropped under either of
    // Google's two field names, a policy alert is dropped and a review alert
    // is demoted. The one line 143A must never change is the trap case
    // (alertneutral): its only "policy" words are in the help link Google puts
    // on every alert, and it is still in the answer.
    console.log('── scenario P: what the press did with each business Google returned');
    {
      const _ct = (tag) => GP_FIND_CAST.find(c => c.tag === tag) || {};
      const _cos = (_findResult && Array.isArray(_findResult.companies)) ? _findResult.companies : [];
      const _rows = (tag) => _cos.filter(c => String(c.name) === _ct(tag).name);
      const _one = (tag) => _rows(tag)[0] || null;
      const _log = srv.log().slice(_findLog0);
      // Listings served, per city, exactly as the fixture dealt them.
      const _served = GP_FIND_CAST.reduce((n, c) => n + c.cities.length, 0);
      // Every count below is read off the cast's own declarations - `expect`,
      // `demote` and `dropBy` - so there is one place that says what the press
      // is supposed to do with a business and nothing here restates it.
      const _listings = (f) => GP_FIND_CAST.reduce((n, c) => n + (f(c) ? c.cities.length : 0), 0);
      const _dropsBy = (rule) => _listings(c => c.expect === 'dropped' && c.dropBy === rule);
      // ── IS THIS LEAD DEMOTED? ONE FIELD, AND NOT A LIST OF FLAGS ───────
      // demotionPoints rides every Places lead and is computed by the app's own
      // demotionPenalty() from the declared CONTACT_RANK_TERMS table, so a
      // FIFTH demotion reason added to that table is counted here the day it
      // lands. This assertion file had the hand-kept list twice - it read two
      // reasons when the press had three, and three when the press had four -
      // and each time the ordering assertion below quietly measured the wrong
      // pool. A field the app derives cannot go stale that way.
      const _dem = (c) => Number((c || {}).demotionPoints) < 0;
      const _demFlags = ['outsideBand', 'aboveSizeCeiling', 'thinReviews', 'listingRisk', 'nameNotOnSite'];
      // EVERY CASE THIS SCENARIO ASSERTS ON STILL EXISTS. A business nobody
      // declared can never be found in the answer, so a deleted or renamed cast
      // entry would turn each "was it dropped?" assertion below into a green
      // line about nothing.
      const _tags = ['quiet', 'floorsep', 'fakeA', 'fakeB', 'chainA', 'chainB', 'closedperm', 'closedtemp',
        'nosite', 'multi', 'busy', 'band49', 'huge', 'branch', 'alert', 'alertneutral', 'alertpolicy',
        'puresab', 'inside', 'insidetext', 'moved', 'movedonly', 'trackA', 'trackB'];
      ok(_tags.every(t => GP_FIND_CAST.some(c => c.tag === t)),
        `the cast no longer carries ${JSON.stringify(_tags.filter(t => !GP_FIND_CAST.some(c => c.tag === t)))}, so the assertions about those businesses are passing on a business that was never served`);

      // THE GRID ACTUALLY RAN, and in all three metros. Scoped to the press's
      // own searches, so an audit-path search cannot be mistaken for one.
      const _pq = state.gpFind.filter(q => q.city);
      ok(new Set(_pq.map(q => q.city)).size === GP_FIND_CITIES.length,
        `the press searched ${JSON.stringify([...new Set(_pq.map(q => q.city))])} of the ${GP_FIND_CITIES.length} metros it was asked for - a grid that misses a metro cannot measure coverage, and every "absent from" claim is then made about a market nobody looked in`);
      // Which branch of scenario I's second-press check actually fired. A
      // search outside the cast can only have come from the SECOND press, so
      // its absence is the dedupe working rather than an assumption about it.
      info(`the press made ${_pq.length} search(es) across the declared grid`
        + (state.gpFind.length > _pq.length
          ? ` and ${state.gpFind.length - _pq.length} outside it, so the second press in scenario I bought its own grid rather than being deduped onto the first job`
          : ' and none outside it, so the second press in scenario I was deduped onto the running job and bought no Google calls of its own'));

      // ── THE ROLL CALL. Each cast entry declares what today's code does with
      //    it; this compares that against what came back, and the message
      //    points at the entry rather than at a line number.
      const _want = [...new Set(GP_FIND_CAST.filter(c => c.expect !== 'dropped').map(c => c.name))].sort();
      const _got = [...new Set(_cos.map(c => String(c.name)))].sort();
      const _lost = _want.filter(n => !_got.includes(n));
      const _kept = _got.filter(n => !_want.includes(n));
      ok(!_lost.length && !_kept.length,
        `the press returned the wrong businesses out of the ${_served} listings Google handed it: it deleted ${JSON.stringify(_lost)} and admitted ${JSON.stringify(_kept)}. Every name in the cast says what happens to it and which rule decides, so a difference here is a rule that now keeps or deletes a different business - read the cast entry, not this line`);

      // ── THE REVIEW FLOOR: INVERTED BY ROUND 143A, AS THESE LINES SAID ──
      // Until 143A a quiet, well-rated, established plumber with a real
      // website was DELETED at the press for having twelve reviews, and these
      // two lines asserted that deletion so the day it changed would be
      // visible. It changed. He is kept, ranked last, and carries a note the
      // rep can read - and arriving is not the assertion: a lead that came
      // back with no mark on it would be a lead nobody can tell apart from a
      // business with two hundred reviews.
      const _q = _one('quiet');
      ok(_q && _q.thinReviews === true && _dem(_q),
        `${_ct('quiet').name} has ${_ct('quiet').reviews} reviews, under Plumbing's floor, and came back as ${JSON.stringify(_q ? { there: true, thinReviews: _q.thinReviews, demotionPoints: _q.demotionPoints } : { there: false })} - it must be KEPT and MARKED: deleted, the rep never sees a business whose thin review count is the thing we sell them; unmarked, it sits on the screen looking like any other lead`);
      ok(_q && /review/i.test(String(_q.thinReviewNote || '')) && String(_q.thinReviewNote || '').includes(String(_ct('quiet').reviews)),
        `the note on ${_ct('quiet').name} reads ${JSON.stringify((_q && _q.thinReviewNote) || null)} - the mark has to travel with the sentence that says what was measured, or the rep is given a lead ranked last with no reason on it`);
      // The control, and its job changed when the floor did: at 28 it is ABOVE
      // Plumbing's 15, so the demotion must not touch it. Without this line a
      // rule that marked every business thin would read as working.
      const _fs = _one('floorsep');
      ok(_fs && !_fs.thinReviews && !_dem(_fs),
        `${_ct('floorsep').name} has ${_ct('floorsep').reviews} reviews, which clears Plumbing's floor, and came back as ${JSON.stringify(_fs ? { thinReviews: !!_fs.thinReviews, demotionPoints: _fs.demotionPoints } : { there: false })} - a business above the floor must carry no thin-review mark, or the demotion is being applied to the whole run`);

      // ── THE LISTINGS WITH NOBODY BEHIND THEM ───────────────────────────
      // Shut, moved, or flagged by Google for a policy violation: four
      // listings out one door, because the consequence is identical - there is
      // nobody there to sell to. The moved pair is carrying its own proof:
      // Google publishes the fact under two different field names and only one
      // of them is set on each, so a rule reading a single spelling keeps a
      // listing whose address, phone and reviews belong to premises the
      // business has left.
      ok(!_rows('closedperm').length && !_rows('closedtemp').length,
        `a listing Google marks ${_ct('closedperm').status} or ${_ct('closedtemp').status} reached the queue, so the rep dials a business that has shut and the read pays to look at it`);
      ok(!_rows('moved').length && !_rows('movedonly').length,
        `a listing Google says has moved reached the queue: movedPlaceId ${_rows('moved').length ? 'kept' : 'dropped'}, movedPlace ${_rows('movedonly').length ? 'kept' : 'dropped'} - BOTH spellings have to drop it, and the one still in the answer is the spelling nothing reads`);
      // Counted, not name-matched: the line names at most FOUR of the
      // businesses it dropped and which four depends on the order the grid
      // shuffles the cities into, so asserting on one name is a check that
      // passes or fails on a coin toss. The count is the measurement.
      const _riskLine = (_log.match(/LISTING RISK \[Places\]: (\d+) listing/) || []);
      ok(Number(_riskLine[1]) === _dropsBy('risk'),
        `the press deleted ${_dropsBy('risk')} listings Google had already condemned - closed, moved or flagged - and the LISTING RISK line reports ${_riskLine[1] === undefined ? 'nothing at all' : _riskLine[1]}: ${JSON.stringify((_log.match(/LISTING RISK[^\n]{0,160}/) || ['(no line at all)'])[0])}. A saving the operator cannot see reads as leads going missing`);

      // ── ROUND 139'S BRANCH DROP, EXECUTED FOR THE FIRST TIME ───────────
      ok(!_rows('branch').length,
        `${_ct('branch').name} reached the queue even though its own Google listing points at ${_ct('branch').site} - one location's page inside a bigger site rather than a home page of its own. The number on that listing reaches a branch whose marketing budget is set at head office, and the contact read that would have found that out costs about five Firecrawl credits`);
      const _branchLine = (_log.match(/BRANCH URL \[Places\]: (\d+) business/) || []);
      ok(Number(_branchLine[1]) === _dropsBy('branch') && _log.includes(_ct('branch').name),
        `the press dropped ${_dropsBy('branch')} branch listing(s) and the BRANCH URL line reports ${_branchLine[1] === undefined ? 'nothing at all' : _branchLine[1]} without naming the business and the tell, so the only saving the operator can see is a lead that silently went missing: ${JSON.stringify((_log.match(/BRANCH URL[^\n]{0,180}/) || [''])[0])}`);

      // ── A BUSINESS WITH NO WEBSITE IS A LEAD, NOT A REJECT ─────────────
      const _call = _one('nosite');
      ok(_call && _call.noWebsite === true && _call.leadChannel === 'call',
        `${_ct('nosite').name} has ${_ct('nosite').reviews} reviews and no website at all, and arrived as ${JSON.stringify(_call && { noWebsite: _call.noWebsite, leadChannel: _call.leadChannel })} - it must arrive marked as a lead Mike dials, because the finding IS the absence and there is nothing to audit`);
      ok(/CALL LEADS \[Places\]/.test(_log),
        'the press kept a business with no website and never said so, so the operator cannot tell a call lead from a lead whose website read failed');

      // ── THE SAME BUSINESS IN THREE METROS ──────────────────────────────
      const _mm = _one('multi');
      ok(_mm && _mm.marketCount === 3 && _ct('multi').cities.every(c => (_mm.marketsSeen || []).includes(c)),
        `${_ct('multi').name} came back in all three metros and arrived as ${JSON.stringify(_mm && { marketCount: _mm.marketCount, marketsSeen: _mm.marketsSeen })} - a repeat sighting has to ADD a market to the lead, because coverage across metros is the only size signal the press has before a penny is spent`);
      ok(/MULTI-MARKET \[Places\]/.test(_log) && _log.includes(_ct('multi').name),
        'the press found an operator working three metros and the log never named it, so the lead nobody should work first is indistinguishable from a one-truck shop');

      // ── ONE PHONE NUMBER, TWO SHAPES. The positive case and the negative
      //    one, and the negative one matters as much: a rule that reads the
      //    phone must drop the pair that trades under two names and must NOT
      //    touch the plumber who runs two branches under his own.
      // INVERTED BY ROUND 143A: the press reads the number now, and this pair
      // is the shape it drops - one line answered by two trade names in two
      // metros is a call centre selling the lead on.
      ok(!_rows('fakeA').length && !_rows('fakeB').length,
        `two listings sharing one phone number under DIFFERENT trade names in different metros arrived as ${_rows('fakeA').length} and ${_rows('fakeB').length} row(s) - both halves have to go, because the rep who dials that number reaches whoever bought the lead rather than the business on the card`);
      const _phoneLine = (_log.match(/PHONE COLLISION \[Places\]: (\d+) listing/) || []);
      ok(Number(_phoneLine[1]) === _dropsBy('phone'),
        `the press dropped ${_dropsBy('phone')} listings for sharing one number under different names and the PHONE COLLISION line reports ${_phoneLine[1] === undefined ? 'nothing at all' : _phoneLine[1]}: ${JSON.stringify((_log.match(/PHONE COLLISION[^\n]{0,160}/) || ['(no line at all)'])[0])}`);
      // AND THE NEGATIVE CASE, WHICH IS THE ONE THAT MATTERS. Same number,
      // same name, two metros: a plumber with two branches. Nothing about the
      // rule above may reach him. Unchanged by 143A and it must stay that way -
      // this is the expensive direction, because the rule that deletes him
      // deletes every multi-branch business in the ICP with it.
      ok(_rows('chainA').length === 1,
        `the two listings ${_ct('chainA').name} publishes for its two branches - one name, one phone number, two metros - arrived as ${_rows('chainA').length} row(s). One row is right (they merge by name); zero means the phone rule has eaten a two-branch plumber, which is the expensive direction and the reason that rule needs a name test at all`);

      // ── EVERY DEMOTION REASON, AGAINST THE CAST ────────────────────────
      // Before the ordering is asked about, the flags themselves: each cast
      // entry that declares a `demote` must carry that exact flag AND be
      // demoted by the app's own arithmetic, and every entry that declares
      // none must carry none of them. Without this the ordering assertion
      // below could pass because NOTHING was marked demoted.
      for (const _c of GP_FIND_CAST.filter(c => c.expect !== 'dropped')) {
        const _row = _cos.find(c => String(c.name) === _c.name);
        if (!_row) continue;   // the roll call above owns a missing business
        if (_c.demote) {
          ok(_row[_c.demote] && _dem(_row),
            `${_c.name} should be demoted for ${_c.demote} and came back as ${JSON.stringify({ [_c.demote]: _row[_c.demote] || null, demotionPoints: _row.demotionPoints })} - an unmarked demotion is a lead that climbs back over the businesses we have evidence for`);
        } else {
          ok(!_demFlags.some(f => _row[f]) && !_dem(_row),
            `${_c.name} is a plain in-band lead and came back marked ${JSON.stringify(_demFlags.filter(f => _row[f]))} (${_row.demotionPoints} points) - a demotion applied to a business that earned none pushes a good lead onto the bench`);
        }
      }

      // ── THE CEILINGS DEMOTE, NONE OF THEM DELETES ──────────────────────
      // An in-band lead is one the press demoted for NO reason at all, and
      // this is the third time that definition has had to be repaired: it read
      // one reason when the press had two, two when the press had three, and
      // three when 143A made it four. So it is not a list of flags any more.
      // demotionPoints is computed by the app from its own declared term
      // table, so the fifth reason counts here the day somebody adds it.
      const _bi = _cos.findIndex(c => String(c.name) === _ct('band49').name);
      const _lastIn = _cos.reduce((acc, c, i) => (_dem(c) ? acc : i), -1);
      // AND THE FIELD HAS TO BE REAL. If demotionPoints ever stopped riding
      // the payload, _dem would answer false for everything, _lastIn would be
      // the last lead in the list and the ordering assertion below could never
      // fail again - the vacuous-check trap, arriving through a field name.
      ok(_cos.length > 0 && _cos.every(c => typeof c.demotionPoints === 'number')
        && _cos.some(c => _dem(c)) && _cos.some(c => !_dem(c)),
        `demotionPoints is not on every lead, or no lead is demoted, or every lead is: ${JSON.stringify(_cos.map(c => [c.name, c.demotionPoints]))} - the ordering assertion below reads that field, and a field that answers the same for every lead makes it a green line about nothing`);
      ok(_bi >= 0 && _cos[_bi].outsideBand === true,
        `the ${_ct('band49').rating}-star business arrived as ${JSON.stringify(_bi >= 0 ? { outsideBand: _cos[_bi].outsideBand } : null)} - above the 4.85 ceiling it is kept and MARKED, never deleted: Google bills per call, so deleting it saves nothing and the next press pays to find it again`);
      // Scoped to the lead being THERE: its absence is the assertion above,
      // which names that cause properly. A message that blames the ordering for
      // a deleted lead sends the reader to the healthy half of the press.
      ok(_bi < 0 || _bi > _lastIn,
        `the ${_ct('band49').rating}-star business came back at position ${_bi + 1} of ${_cos.length}, ahead of the in-band lead at position ${_lastIn + 1} (${JSON.stringify((_cos[_lastIn] || {}).name)}) - a demoted lead must arrive behind every in-band one so it fills the bench instead of this run's queue`);
      // The same promise, for EVERY demoted lead rather than the one this
      // block is named after: the bench promise is that the leads we have
      // evidence for go out first on every run, and one demotion reason
      // slipping through the sort breaks it just as completely as four.
      const _misplaced = _cos.filter((c, i) => _dem(c) && i < _lastIn);
      ok(!_misplaced.length,
        `${_misplaced.length} demoted lead(s) came back AHEAD of an in-band one - ${JSON.stringify(_misplaced.map(c => [c.name, c.demotionWhy]))} sit above ${JSON.stringify((_cos[_lastIn] || {}).name)} at position ${_lastIn + 1}. Every one of them is on the rep's screen above a business we have evidence for, and the reason it is demoted is printed on its own card`);
      // The review ceiling, which is the press's other demote and a different
      // claim: too big to call, so an EMAIL lead, kept and served last.
      const _hi = _cos.findIndex(c => String(c.name) === _ct('huge').name);
      ok(_hi >= 0 && _cos[_hi].aboveSizeCeiling === true && _cos[_hi].outsideBand !== true,
        `the ${_ct('huge').reviews}-review business arrived as ${JSON.stringify(_hi >= 0 ? { aboveSizeCeiling: _cos[_hi].aboveSizeCeiling } : null)} - past the review ceiling it is an email lead kept behind the in-band ones, because review count measures whether a business ASKS for reviews and not how big it is, and 282 businesses we had already been billed for were deleted here on one live run`);
      ok(_hi < 0 || _hi === _cos.length - 1,
        `the ${_ct('huge').reviews}-review business came back at position ${_hi + 1} of ${_cos.length} - the large-company slice is appended behind every other lead, so a business too big to call cannot take a queue slot from one that is not`);
      ok(/SIZE DEMOTED \[Places\]/.test(_log),
        'a business past the review ceiling was benched and the log never said so, so an operator reading a thin run cannot tell a demote from a delete');

      // ── THE CONSUMER ALERT, AND THE LEAD A LINK MUST NOT DELETE ────────
      // The field is in the mask now and the press reads it, classifying on
      // the alert's PROSE alone. The three carriers separate the three
      // outcomes: a policy violation stated in its own words is dropped, a
      // review-activity alert is demoted and never dropped, and the alert that
      // says nothing of the kind is kept - even though the "learn more" link
      // Google puts on EVERY alert points at a content POLICIES page. A
      // classifier that walked the link would have deleted that last business
      // for the wording of a Google help page.
      ok(_rows('alertneutral').length === 1,
        `${_ct('alertneutral').name} is not in the answer, and its listing carries an alert whose only "policy" words are in the Google help link every alert has - its own prose says the opening hours are being confirmed. Deleting it means a Google support URL was read as the business's own conduct. THIS LINE IS NOT AN "INVERT ME LATER" LINE: it is the case a review-alert or policy-alert rule must never touch`);
      ok(!_rows('alertpolicy').length,
        `${_ct('alertpolicy').name} reached the queue, and its alert says in Google's own prose that the listing is restricted for violating content policies - there is nobody to sell to behind a restricted listing, and keeping it while ${_ct('alertneutral').name} is kept too means the classifier is reading neither`);
      const _al = _one('alert');
      ok(_al && _al.listingRisk && _dem(_al),
        `the review-activity alert carrier came back as ${JSON.stringify(_al ? { listingRisk: _al.listingRisk || null, demotionPoints: _al.demotionPoints } : { there: false })} - Google flagging the reviews on a listing is a demotion and never a drop: the business is real, and only its review count and rating are in doubt`);
      ok(_al && /review/i.test(String(_al.googleAlertText || '')),
        `the rep is given a demoted lead without Google's own words on it: googleAlertText reads ${JSON.stringify((_al && _al.googleAlertText) || null)}. The sentence Google published is the only evidence for ranking this business last, so it has to travel with it`);
      // And the trap case is demoted rather than dropped, carrying the same
      // machinery - which is what proves the classifier read it at all rather
      // than ignoring every alert it did not recognise.
      const _an = _one('alertneutral');
      ok(_an && _an.listingRisk && !/polic|violat/i.test(String(_an.googleAlertText || '')),
        `${_ct('alertneutral').name} came back as ${JSON.stringify(_an ? { listingRisk: _an.listingRisk || null, googleAlertText: String(_an.googleAlertText || '').slice(0, 80) } : { there: false })} - it must be marked from its alert like any other, and the words carried with it must be its own prose and not the policy wording of the help link`);


      // ── ROUND 143B: THE FREE READ AT THE PRESS, AND WHAT IT COST ───────
      // THE LOAD-BEARING CLAIM OF THE ROUND, and the one no boot fixture can
      // see: the press opens their homepage, their team page and their contact
      // page and buys NOTHING. A press that quietly bought one Firecrawl page
      // or one model call per business would cost money on every lead instead
      // of saving it on most, and only a run over a whole cast with the network
      // in view can say so.
      {
        const _win = state.requests.slice(_findReq0, _findReq1 || state.requests.length);
        const _fc = _win.filter(q => q.host === 'api.firecrawl.dev');
        const _an2 = _win.filter(q => q.host === 'api.anthropic.com');
        ok(_fc.length === 0,
          `the press made ${_fc.length} Firecrawl call(s) over ${_served} listings (${_fc.slice(0, 3).map(q => q.path).join(', ')}) - the free read exists BECAUSE a press over three hundred businesses cannot buy a page each, so one call here is the whole round inverted`);
        ok(_an2.length === 0,
          `the press made ${_an2.length} model call(s) over ${_served} listings - the same claim and the more expensive half of it`);
        // And it really did read, or the two zeros above are zero because
        // nothing happened at all - a fixture that measures nothing.
        const _readHosts = [...new Set(_win.filter(q => GP_SITE_BY_HOST[q.host]).map(q => q.host))];
        ok(_readHosts.length >= 5,
          `the press opened the pages of ${_readHosts.length} business(es) - the two zero-spend assertions above are worth nothing unless the free read actually ran, and this is the line that says it did`);
        // THREE PAGES A BUSINESS, MEASURED AT THE WIRE rather than in a
        // fixture that supplies its own links. The bound IS the round.
        const _perHost = {};
        for (const q of _win) if (GP_SITE_BY_HOST[q.host]) _perHost[q.host] = (_perHost[q.host] || 0) + 1;
        const _over = Object.entries(_perHost).filter(([, n]) => n > 3);
        ok(!_over.length,
          `the press fetched ${JSON.stringify(_over)} - more than three pages of one business. At three hundred businesses every extra page is three hundred more fetches, which is the number the twenty-page contact read cannot be used for`);
        const _freeLine = (_log.match(/FREE READ \[Places\]: (\d+) business/) || []);
        ok(Number(_freeLine[1] || 0) > 0,
          'the press printed no FREE READ line naming what it read, so a run cannot say what it looked at or what it cost');
        ok(/DOMAIN AGE \[Places\]/.test(_log),
          'the press printed no DOMAIN AGE line, so the one thing about the registry lookup that is unproven - whether this server can reach it at all - cannot be read off a live run');
      }

      // ── ONE TRACKING ACCOUNT, TWO NAMES, TWO METROS ────────────────────
      // The drop the homepage made possible. Their phones differ, so this can
      // only have fired on the tracking id, and the log line has to name that
      // cause rather than the phone rule's.
      ok(!_rows('trackA').length && !_rows('trackB').length,
        `${_ct('trackA').name} and/or ${_ct('trackB').name} reached the queue - two differently-named businesses in two metros reporting to ONE analytics property is one operator wearing local clothes, and the rep would work both halves of it as separate leads`);
      {
        const _tl = (_log.match(/TRACKING COLLISION \[Places\]: (\d+) listing/) || []);
        ok(Number(_tl[1] || 0) === _dropsBy('tracking'),
          `the tracking-collision line reports ${_tl[1] === undefined ? 'nothing at all' : _tl[1]} where the cast declares ${_dropsBy('tracking')} - a drop nobody prints is a drop nobody can audit, and a different number means another rule took them first and the run names the wrong cause`);
      }
      // AND THE NEGATIVE CASE: the two-branch business under ONE name shares
      // nothing and must survive, exactly as it does under the phone rule.
      ok(_rows('chainA').length + _rows('chainB').length > 0,
        `the one-name two-metro operator was deleted by the new rule - that is a real multi-branch business and the exact operator the coverage-gap finding is built on`);

      // ── THE VERDICT REACHES THE ROW, OR THE ROUND IS DARK ──────────────
      {
        const _qv = sbTable('discovered_queue').filter(r => r.website);
        ok(_qv.some(r => r.site_verdict && r.site_verdict.measured === true),
          'not one queue row carries a site_verdict the press measured, so everything the free read found dies with the run and the rep sees none of it');
        ok(_qv.every(r => r.extra && r.extra.pressSite),
          'a queue row with a website carries no press verdict in its extra blob - the column may not exist on a database yet, and the blob is what keeps the round working until the ALTER runs');
        const _qq = sbTable('discovered_queue').find(r => r.name === _ct('quiet').name);
        ok(_qq && _qq.site_verdict && _qq.site_verdict.ageBasis === 'their own pages' && _qq.site_verdict.ageYears > 0,
          `${_ct('quiet').name} publishes its founding year on its own homepage and the row says ${JSON.stringify(_qq && _qq.site_verdict && { basis: _qq.site_verdict.ageBasis, years: _qq.site_verdict.ageYears })} - their own page is the first source and a registry may never overrule it`);
        const _qf = sbTable('discovered_queue').find(r => r.name === _ct('floorsep').name);
        ok(_qf && _qf.site_verdict && _qf.site_verdict.ageBasis === 'domain registration' && _qf.site_verdict.domainYear === 2004,
          `${_ct('floorsep').name} states no founding year anywhere on its site and the row says ${JSON.stringify(_qf && _qf.site_verdict && { basis: _qf.site_verdict.ageBasis, year: _qf.site_verdict.domainYear })} - the registry is the fallback, and a business whose own pages say nothing is the only lead that reaches it`);
        ok(_qq && _qq.site_verdict && _qq.site_verdict.looksMeasured === true && _qq.site_verdict.looks !== 'unknown',
          `the free read graded ${_ct('quiet').name} as ${JSON.stringify(_qq && _qq.site_verdict && _qq.site_verdict.looks)} - a site built out of font tags, layout tables and a 2016 copyright has to come back as something a visitor would recognise, or the verdict the score now reads is empty on every lead`);
        const _qn = sbTable('discovered_queue').find(r => r.name === _ct('nosite').name);
        ok(_qn && _qn.site_verdict && _qn.site_verdict.noWebsite === true,
          `the business with no website at all is not marked as one on its row (${JSON.stringify(_qn && _qn.site_verdict)}), so it cannot be drawn as the separate call list Vin asked for`);
        // The DRAW ORDER over these rows is deliberately NOT asserted here: a
        // sort transcribed into this harness is a second hand-kept copy of a
        // rule, which is the disease the server file records most. Every term
        // of orderUnread is executed against the LIVE function, on rows of
        // exactly this shape, by FREE VERDICT WIRING CHECK at boot.
      }

      // ── WHAT THE PRESS MEASURED HAS TO SURVIVE THE QUEUE WRITE ─────────
      const _qm = sbTable('discovered_queue').find(r => r.name === _ct('multi').name);
      ok(_qm && _qm.extra && _qm.extra.marketCount === 3 && _qm.source === 'google_places',
        `the queue row for ${_ct('multi').name} reads ${JSON.stringify(_qm && { source: _qm.source, marketCount: _qm.extra && _qm.extra.marketCount })} - the coverage the press measured is lost between the run and the row the rep actually reads`);
      const _qc = sbTable('discovered_queue').find(r => r.name === _ct('nosite').name);
      ok(_qc && _qc.website === '' && _qc.extra && _qc.extra.phone,
        `the queue row for the business with no website reads ${JSON.stringify(_qc && { website: _qc.website, phone: _qc.extra && _qc.extra.phone })} - a call lead with no number on its row cannot be called`);

      // ── THE YIELD REPORT, WHICH NOTHING HAD EVER RUN ───────────────────
      // Round 141/142 built the report and its "largest single loss" sentence
      // on a press that was returning nothing, so every row was a zero.
      const _parseYield = (line) => {
        const m = line.match(/FIND YIELD: ([^.]+)\./);
        if (!m) return null;
        const rows = m[1].split(' → ').map(p => (p.match(/^(.+?) (-?\d+)$/) || []).slice(1)).filter(x => x.length === 2);
        const get = (k) => { const r = rows.find(x => x[0] === k); return r ? Number(r[1]) : null; };
        return { line, rows, get,
          seen: get('seen from Google'), bench: get('bench served'),
          underFloor: get('deleted under the trade review floor'),
          thinDemoted: get('demoted for a thin review count'),
          notIcp: get('not our ICP by name'), franchise: get('franchise or chain outlet'),
          owned: get('already in the pipeline'), catCap: get('per-category cap'),
          risk: get('dropped on a listing risk - closed, moved or flagged by Google'),
          tracking: get('dropped on a shared tracking account'),
          phone: get('dropped on a phone collision'),
          demoted: get('demoted to the bench'), returned: get('returned') };
      };
      const _yAll = (_log.match(/FIND YIELD: [^\n]+/g) || []).map(_parseYield).filter(y => y && y.seen > 0);
      const _y = _yAll.find(y => y.returned === _cos.length) || _yAll[0] || null;
      ok(_y, `the press printed no FIND YIELD line with anything in it, so the one report that adds up a thin run cannot be read: ${JSON.stringify((_log.match(/FIND YIELD[^\n]{0,200}/) || ['(no line at all)'])[0])}`);
      if (_y) {
        ok(_y.seen >= _y.returned,
          `the yield report says ${_y.seen} businesses seen from Google and ${_y.returned} returned - a run cannot return more businesses than it looked at, so one of the two counters is being written in the wrong place and every loss row between them is measured against the wrong total`);
        // SEEN IS EVERY LISTING GOOGLE HANDED US, including the ones a gate
        // then deleted. Round 143A moved the counter above the first drop and
        // that is the right place: it is the denominator every loss row is
        // read against, so a listing dropped by a gate has to be inside it or
        // the row reports a loss out of a total that never contained it. (This
        // line previously argued the opposite for closed listings, when a
        // closed listing was dropped by a bare status check that no row
        // counted. The moment those drops became a counted loss, the argument
        // stopped holding.)
        ok(_y.seen === _served,
          `the yield report counted ${_y.seen} businesses seen from Google against the ${_served} listings the fixture served across ${GP_FIND_CITIES.length} metros - every listing Google hands the press belongs in the denominator, including the ${_dropsBy('risk')} it deletes for being closed, moved or flagged`);
        ok(_y.returned === _cos.length,
          `the yield report says ${_y.returned} returned and the payload carries ${_cos.length} - the line the operator reads and the answer the rep works have come apart`);
        // THE FLOOR NO LONGER DELETES. Its delete row can only move when
        // GP_FLOOR_MODE=cut is set, and its demote row is the one that counts
        // the businesses 143A saved.
        ok(_y.underFloor === 0,
          `the yield report says the floor DELETED ${_y.underFloor} business(es). Round 143A made the floor a sort position: the delete only happens under GP_FLOOR_MODE=cut, and a number here means a quiet established business is being thrown away again`);
        ok(_y.thinDemoted === _listings(c => c.demote === 'thinReviews'),
          `the yield report says ${_y.thinDemoted} lead(s) were demoted for a thin review count and the cast declares ${_listings(c => c.demote === 'thinReviews')} (${_ct('quiet').name} at ${_ct('quiet').reviews} reviews, under Plumbing's floor of 15; ${_ct('floorsep').name} at ${_ct('floorsep').reviews} is above it) - the row that shows what the floor now does instead of deleting`);
        ok(_y.franchise === _dropsBy('branch'),
          `the yield report blames franchises and chain outlets for ${_y.franchise} businesses and the cast declares ${_dropsBy('branch')} - the branch dropped on its URL is counted there, so a 0 means round 139's drop either did not fire or is invisible to the report`);
        ok(_y.demoted === _listings(c => !!c.demote),
          `the yield report says ${_y.demoted} lead(s) were demoted to the bench and the cast declares ${_listings(c => !!c.demote)} (${GP_FIND_CAST.filter(c => c.demote).map(c => c.demote).join(', ')}) - a lower number means a ceiling is deleting again rather than benching`);
        // ── THE SENTENCE THAT NAMES THE RUN'S BIGGEST LOSS ─────────────
        // WHAT THIS LINE CAUGHT, kept because the shape will be back. The
        // report used to rank rows.slice(2, -1) - everything except the first
        // two rows and the LAST one - which is the set of losses only while
        // "returned" happens to be the last row. It is not: round 114 appends
        // a large-company row after it whenever one is served, and on the
        // first run where this fixture returned businesses the line announced
        // "The largest single loss is "returned" at 12" - the survivors,
        // reported as the loss. Round 143A replaced the positional window with
        // a `loss` flag declared on each row, so this assertion is now written
        // in the CORRECT direction rather than pinning the defect.
        //
        // A ROW THAT COUNTS KEPT LEADS CAN NEVER BE THE LARGEST LOSS. That is
        // the rule, and it is asserted against the row labels rather than
        // against the code's window, so it holds however the window is
        // computed - which is the only form that would have caught the
        // original defect and will catch the next one.
        const _keptRows = ['seen from Google', 'bench served', 'returned', 'demoted to the bench',
          'demoted for a thin review count', 'no website at all - the call lane',
          'on a free page builder - the rebuild lane', 'large companies served for the email lane',
          // Round 143B: five more rows that count leads we KEPT. A demotion is
          // not a loss and neither is a shape of the run, and naming one as the
          // run's largest loss sends somebody hunting for businesses that are
          // sitting on the bench waiting to be worked.
          'demoted - their own site never names them', 'graded free at the press',
          'site would not open for a free read', 'site reads bad to a visitor',
          'site reads dated to a visitor'];
        const _said = (_y.line.match(/The largest single loss[^.]*\./) || ['(the sentence never printed)'])[0];
        const _named = (_y.line.match(/The largest single loss is "([^"]+)" at (\d+)\./) || []).slice(1);
        ok(_named.length === 2,
          `the yield report never named this run's largest single loss: ${JSON.stringify(_said)}. Five businesses were deleted by four different rules and the line that says which rule cost the most is the one an operator reads when a run comes back thin`);
        ok(!_named.length || !_keptRows.includes(_named[0]),
          `the yield report calls "${_named[0]}" (${_named[1]}) this run's largest single LOSS, and that row counts leads we KEPT - it sends somebody hunting for businesses that are sitting on the bench waiting to be worked. This is the defect the harness caught on 2026-09-12, back again`);
        // And it names the biggest DELETION the cast declares, by the label
        // the report itself prints for it.
        // INVERTED 2026-09-12: the two counters were wired, so all three
        // deletion rows print and the sentence must name the biggest of them.
        // Read off the report's OWN rows rather than naming a winner here, so
        // the day a different gate costs the most this still asserts the rule
        // instead of a result.
        const _delRows = [
          ['franchise or chain outlet', _y.franchise],
          ['dropped on a listing risk - closed, moved or flagged by Google', _y.risk],
          ['dropped on a phone collision', _y.phone],
          ['dropped on a shared tracking account', _y.tracking],
        ].filter((r) => typeof r[1] === 'number');
        const _biggest = _delRows.slice().sort((a, b) => b[1] - a[1])[0];
        ok(!_named.length || (!!_biggest && _named[0] === _biggest[0] && Number(_named[1]) === _biggest[1]),
          `the yield report calls "${_named[0]}" at ${_named[1]} the largest single loss, and the biggest deletion row it printed is "${_biggest && _biggest[0]}" at ${_biggest && _biggest[1]} - an operator reading a thin run is sent to tune the wrong gate`);

        // ── DOES THE REPORT ADD UP? EVERY LISTING TO ONE OUTCOME ───────
        // seen − the deletions − the merges = returned. Run against the CAST
        // rather than against the report, because the report cannot close it:
        // two of its rows never print. The identity below closes exactly, and
        // the assertion after it names the gap between it and the line.
        const _mergedAway = GP_FIND_CAST.reduce((n, c) => n + (c.expect === 'dropped' ? 0 : c.cities.length - 1), 0)
          + (_listings(c => c.tag === 'chainB'));   // chainB merges into chainA by NAME, after the press
        const _deleted = _dropsBy('branch') + _dropsBy('risk') + _dropsBy('phone') + _dropsBy('tracking');
        ok(_y.seen - _deleted - _mergedAway === _y.returned,
          `the run does not add up: ${_y.seen} seen − ${_deleted} deleted − ${_mergedAway} merged (a business found in several metros is ONE lead, and two branches under one name are one company) = ${_y.seen - _deleted - _mergedAway}, and the report returned ${_y.returned}. Some listing Google handed the press has no outcome, which means a business vanished between the search and the queue with no rule to point at`);
        // AND THE GAP BETWEEN THAT AND THE LINE ITSELF, stated rather than
        // smoothed over. The report carries a row for the branch drop and for
        // nothing else this run deletes: searchGooglePlaces counts the listing
        // risks and the phone collisions, prints a line for each, and never
        // assigns either counter to the tally the report reads - so both rows
        // are filtered out as "no number" and seven deletions are invisible to
        // the one line that adds a run up. TODAY'S DIRECTION, on purpose:
        // when those two counters are wired, these two lines invert to
        // equality and the identity above can be asserted against the LINE.
        // INVERTED 2026-09-12, exactly as the line it replaces said it would:
        // skippedListingRisk and skippedListingPhone are assigned to the tally
        // now, so both rows print and the identity closes against the REPORT
        // rather than only against the cast. A run that adds up is the whole
        // point of the line - every listing Google handed the press reaches one
        // outcome and the outcome is named.
        ok(_y.risk === _dropsBy('risk') && _y.phone === _dropsBy('phone') && _y.tracking === _dropsBy('tracking'),
          `the report prints ${_y.risk} listing-risk, ${_y.phone} phone-collision and ${_y.tracking} tracking-collision deletions against the ${_dropsBy('risk')}, ${_dropsBy('phone')} and ${_dropsBy('tracking')} the cast declares - a counter is being incremented somewhere the report cannot see it again`);
        const _lineDeleted = (_y.franchise || 0) + (_y.risk || 0) + (_y.phone || 0) + (_y.tracking || 0);
        ok(_y.seen - _lineDeleted - _mergedAway === _y.returned,
          `the printed line does not add up: ${_y.seen} seen \u2212 ${_lineDeleted} deleted across its own rows \u2212 ${_mergedAway} merged = ${_y.seen - _lineDeleted - _mergedAway}, and it says it returned ${_y.returned}. A business went missing between the search and the queue with no row to point at`);
      }

      // ── THE FIXTURE ITSELF, ON THE MASK IT IS NOT GIVEN TODAY ──────────
      // When the round that reads these fields adds them to the mask, the cast
      // has to hand them over in the documented shape. A fixture that served
      // nothing, or served the wrong shape, would let that round's rule read a
      // field that is never populated and report it as absent - the "mechanism
      // no fixture can reach" trap, arriving from the fixture's side. Run on
      // gpFindPlace directly so it is proven before anybody needs it.
      {
        const _full = 'places.id,places.displayName,places.consumerAlert,places.pureServiceAreaBusiness,places.containingPlaces,places.movedPlaceId,places.movedPlace,nextPageToken';
        const _srv = (tag) => gpFindPlace(_ct(tag), 'Dallas TX', _full) || {};
        const _bare = (tag) => gpFindPlace(_ct(tag), 'Dallas TX', 'places.id,places.displayName,nextPageToken') || {};
        // THE TRAP, ASSERTED ON ITS OWN CONSTRUCTION: clean prose, a link that
        // says "policies". If a later edit softens either half, the case stops
        // proving anything and this line says so.
        const _a = _srv('alertneutral').consumerAlert || {};
        const _aProse = [_a.overview, _a.details && _a.details.title, _a.details && _a.details.description].join(' ');
        const _aLink = (_a.details && _a.details.aboutLink) || {};
        ok(/polic/i.test(String(_aLink.uri) + ' ' + String(_aLink.title)) && !/polic|violat|review|rating|star/i.test(_aProse),
          `the trap alert has lost the shape it exists for - prose ${JSON.stringify(_aProse)}, link ${JSON.stringify(_aLink)}. Its own words must say nothing about policies, violations or reviews, and "polic" must appear only in the help link, or a classifier that reads the link cannot be caught by it`);
        // And the two genuine alerts must state their reason in their own
        // prose, so a rule that reads the prose alone still catches them -
        // otherwise the trap could be "passed" by ignoring alerts entirely.
        ok(/review/i.test([_srv('alert').consumerAlert.overview, _srv('alert').consumerAlert.details.description].join(' ')),
          'the review-activity alert no longer says anything about reviews in its own prose, so a prose-only classifier has nothing to find and the trap case beside it proves nothing');
        ok(/polic|violat/i.test([_srv('alertpolicy').consumerAlert.overview, _srv('alertpolicy').consumerAlert.details.description].join(' ')),
          'the policy alert no longer states the violation in its own prose, so a prose-only classifier cannot tell it from the trap case');
        // containingPlaces as Google returns it: a resource name and an id and
        // no readable words. The hypothetical carrier is the only one with
        // text on it, and it is labelled as unobserved.
        const _cp = _srv('inside').containingPlaces || [];
        ok(_cp.length >= 1 && _cp.every(x => /^places\/[A-Za-z0-9_-]+$/.test(String(x.name)) && Object.keys(x).sort().join(',') === 'id,name'),
          `the honest containingPlaces carrier reads ${JSON.stringify(_cp)} - Google returns a resource name and an id with no readable text, and inventing words here would let a rule that reads brand names out of this field look like it works`);
        ok(((_srv('insidetext').containingPlaces || [])[0] || {}).displayName,
          'the hypothetical containingPlaces carrier has lost its readable text, so the entry labelled "not observed from a live response" no longer differs from the honest one');
        // The moved pair: one of each, so a rule reading a single field is caught.
        ok(_srv('moved').movedPlaceId && _srv('moved').movedPlace === undefined
          && _srv('movedonly').movedPlace && _srv('movedonly').movedPlaceId === undefined,
          `the moved carriers read ${JSON.stringify([_srv('moved').movedPlaceId, _srv('moved').movedPlace, _srv('movedonly').movedPlace, _srv('movedonly').movedPlaceId])} - one listing must carry movedPlaceId alone and the other movedPlace alone, or a rule that reads only one of the two is never caught`);
        // AND NOTHING IS SERVED THAT THE MASK DID NOT ASK FOR.
        ok(GP_FIND_NEW_FIELDS.every(f => _bare('alertneutral')[f] === undefined && _bare('movedonly')[f] === undefined && _bare('inside')[f] === undefined),
          'the fixture handed back a field the mask never asked for, so a rule could pass here on data the real API would not have sent - which is how a measurement that does not exist in production gets proven in a harness');
      }

      // The five fields round 143 is adding to the press's field mask. A
      // diagnostic and not an assertion: nothing reads them yet, so there is no
      // behaviour to fail on - this line says whether the mask has grown, and
      // the fixture serves each field the moment it does.
      const _mask = (state.gpFind[0] || {}).mask || '';
      const _asked = GP_FIND_NEW_FIELDS.filter(f => _mask.includes(f));
      info(`the press's field mask asks for ${_asked.length} of the ${GP_FIND_NEW_FIELDS.length} fields round 143 is adding`
        + (_asked.length ? ` (${_asked.join(', ')})` : '')
        + `; still unasked: ${GP_FIND_NEW_FIELDS.filter(f => !_asked.includes(f)).join(', ') || 'none'}. The cast carries one business for each and serves it only when the mask names it, so a rule built on one of these is dark until then`);
    }

    console.log('── scenario R1: a read run claims, reads, stamps and finishes - with no browser attached');
    const qRow = (b, over) => Object.assign({
      id: b.host.replace(/\W/g, '') + '_google_places', name: b.company, website: `https://${b.host}`, icp_score: 70, source: 'google_places', signals: {},
      job_title: '', location: 'Dallas, TX', manual_role_count: 0, stacked: false, reachability: 0, size_verified: false, size_unverified: false, verified_employees: null,
      extra: { name: b.company, website: `https://${b.host}`, phone: '(214) 555-0188', location: 'Dallas, TX', industry: 'roofer', reviewCount: 180, rating: 4.6, source: 'google_places', placeId: b.placeId, icpScore: 70 },
      from_trigger_source: false, reach_predict: 60, batch_id: null, read_at: null, read_failed: null, fail_reason: null, moved_to_research_at: null, ruled_out_at: null, ruled_out_why: null, exported_at: null, exported_to: null,
    }, over || {});
    const qRowOf = (id) => sbTable('discovered_queue').find(r => r.id === id);
    const waitRun = async (id, capMs) => {
      const t0 = Date.now();
      for (;;) {
        const r = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/read-runs?limit=5`);
        const run = Array.isArray(r.json) ? r.json.find(x => x.id === id) : null;
        if (run && run.status !== 'running') return run;
        if (Date.now() - t0 > (capMs || 150000)) return run || null;
        await sleep(700);
      }
    };
    state.mode = 'findrich';
    state.sb.discovered_queue = [];
    const R1a = bizReg('R1a'), R1b = bizReg('R1b'), R1c = bizReg('R1c'), R1d = bizReg('R1d');
    sbTable('discovered_queue').push(qRow(R1a), qRow(R1b), qRow(R1c),
      // Nothing to read on this one and the best numbers in the table: the draw
      // must still leave it, because a lead with a site sorts above any score.
      qRow(R1d, { website: '', reach_predict: 99, icp_score: 99, extra: Object.assign({}, qRow(R1d).extra, { website: '', placeId: '' }) }));
    const Q0 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/find/summary`);
    ok(Q0.code === 200 && Q0.json && Q0.json.unread === 4 && Q0.json.running === null, `the summary before the run reads ${JSON.stringify(Q0.json).slice(0, 160)} - expected 4 unread and nothing running`);
    ok(Q0.json && Q0.json.creditsPerReadEst >= 4, `the summary estimates ${Q0.json && Q0.json.creditsPerReadEst} credit(s) a read; the measured cost is 4 to 8`);
    const r1fc = fcCalls();
    const r1Req0 = state.requests.length;
    const r1Log0 = srv.log().length;
    const _r1t0 = Date.now();
    const R1 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/read-run`, { count: 3 });
    const _r1ms = Date.now() - _r1t0;
    ok(R1.code === 200 && R1.json && R1.json.runId, `starting a read run answered ${R1.code}: ${JSON.stringify(R1.json).slice(0, 160)}`);
    ok(_r1ms < 5000, `the start answered in ${_r1ms}ms - it is holding the request open for the reads, which is the closed-tab defect in a new coat`);
    const r1id = R1.json && R1.json.runId;
    const R1busy = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/read-run`, { count: 1 });
    ok(R1busy.code === 409 && R1busy.json && R1busy.json.busy === true, `a second start while one runs answered ${R1busy.code} instead of a plain busy`);
    const Q1 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/find/summary`);
    ok(Q1.json && Q1.json.running === r1id, `the summary does not name the running run (${JSON.stringify(Q1.json && Q1.json.running)})`);
    const R1done = await waitRun(r1id);
    ok(R1done && R1done.status === 'done', `the run ended ${JSON.stringify(R1done && { status: R1done.status, error: R1done.error, read: R1done.read_count, failed: R1done.failed_count })} - expected done`);
    ok(R1done && R1done.read_count === 3 && R1done.failed_count === 0 && R1done.ruled_out_count === 0, `the run counted ${JSON.stringify(R1done && [R1done.read_count, R1done.failed_count, R1done.ruled_out_count])} read/failed/ruled out on three readable leads`);
    ok(R1done && R1done.credits_estimated === 15, `the estimate on the run row is ${R1done && R1done.credits_estimated}, not 3 x 5`);
    // The free-read invariant, on a read nobody was watching: the size lookup
    // is the only Firecrawl spend on a site that answers a plain fetch (H's
    // rule), and the run's meter is that spend and nothing else.
    // Scoped to THESE businesses: scenario I leaves a research job running in
    // the background (the Find-door test submits one and never waits), and
    // its scrapes landed in this window on the first run of this scenario.
    const _r1Mine = (q) => /scenario ?r1[abcd]/i.test(String(q.query || '') + ' ' + String(q.url || ''));
    const _r1IsRender = (q) => Array.isArray(q.formats) && q.formats.length === 1 && q.formats[0] === 'screenshot';
    const r1Free = state.requests.slice(r1Req0).filter(q => q.host === 'api.firecrawl.dev' && _r1Mine(q) && !_isSizeQ(q.query) && !_r1IsRender(q));
    const r1Shots = state.requests.slice(r1Req0).filter(q => q.host === 'api.firecrawl.dev' && _r1Mine(q) && _r1IsRender(q)).length;
    const r1Size = state.requests.slice(r1Req0).filter(q => q.host === 'api.firecrawl.dev' && _r1Mine(q) && _isSizeQ(q.query)).length;
    ok(r1Free.length === 0, `the background read made ${r1Free.length} Firecrawl call(s) beyond the size lookup on sites that answer a plain fetch: ${[...new Set(r1Free.map(q => q.path + (q.query ? ' "' + q.query.slice(0, 60) + '"' : '')))].slice(0, 6).join(' | ')} - FC PAID lines: ${(srv.log().slice(r1Log0).match(/FC PAID[^\n]{0,120}/g) || []).slice(0, 6).join(' || ')}`);
    // Round 129: these three leads publish a three-person team page, so none of
    // them buys a size search at all and the run's Firecrawl meter is zero. The
    // meter must still EQUAL the ledger - that is the assertion - and the run
    // has to be able to say zero rather than insisting something was bought.
    ok(R1done && typeof R1done.credits_used === 'number' && R1done.credits_used === r1Size * 2 + r1Shots, `credits_used is ${R1done && R1done.credits_used} against ${r1Size} size search(es) at 2 each and ${r1Shots} homepage render(s) at 1 - the run's meter and the ledger disagree`);
    ok(r1Size === 0, `the run bought ${r1Size} size search(es) on leads whose own team page lists three people - the four-credit directory search has no record of a three-person roofer`);
    // Round 141: one picture per LEAD on a run nobody is watching, so a batch's
    // render bill is the number of leads and not the number of pages read.
    ok(r1Shots === 3, `the background run took ${r1Shots} homepage render(s) across three leads - one picture each, never one a page`);
    ok(/SIZE LOOKUP \[[^\]]*\]: not bought - their own team page lists 3 people/.test(srv.log().slice(r1Log0)), 'the read run stood the size search down on every lead and no line says why - a saving the operator cannot see reads as a broken feature');
    ok(R1done && R1done.withEmail === 3 && R1done.live === false && R1done.finished_at, `the run card reads ${JSON.stringify(R1done && [R1done.withEmail, R1done.live, !!R1done.finished_at])} for with-email/live/finished on three leads whose contact page publishes the owner's address`);
    const L1 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/read-runs/${r1id}/leads`);
    const L1r = (L1.json && L1.json.leads) || [];
    ok(L1.code === 200 && L1r.length === 3, `the batch answered ${L1.code} with ${L1r.length} lead(s)`);
    ok(L1r.length === 3 && L1r.every(l => l.readAt && !l.readFailed && l.batchId === r1id), `a lead in a finished batch is not stamped read: ${JSON.stringify(L1r.map(l => [l.name, l.readAt, l.readFailed]))}`);
    ok(L1r.length === 3 && L1r.every(l => /Pete Barnes/.test(String(l.contactOwner || ''))), `the owner off their own team page did not reach the queue row: ${JSON.stringify(L1r.map(l => l.contactOwner))}`);
    ok(L1r.length === 3 && L1r.every(l => /^pete@/.test(String(l.contactEmail || '')) && l.contactEmailGrade === 'published_personal'), `the published address did not reach the queue row with its grade: ${JSON.stringify(L1r.map(l => [l.contactEmail, l.contactEmailGrade]))}`);
    ok(L1r.length === 3 && L1r.every(l => l.contactReadBuild === CONTRACT), `a row read by the server carries build ${JSON.stringify(L1r.map(l => l.contactReadBuild))}, not the server's own ${CONTRACT}`);
    // THE WIPE GUARD: what the Find press knew survives the read.
    ok(L1r.length === 3 && L1r.every(l => l.reviewCount === 180 && l.source === 'google_places' && l.placeId), `the read replaced the company object instead of merging into it: ${JSON.stringify(L1r.map(l => [l.reviewCount, l.source, l.placeId]))}`);
    ok(L1r.length === 3 && L1r.every(l => typeof l.contactIcp === 'number' && l.contactIcp >= 80), `the score did not reach the row: ${JSON.stringify(L1r.map(l => l.contactIcp))}`);
    // THE DRAW: the unreadable lead with the best numbers stayed in the queue.
    const _d = qRowOf(qRow(R1d).id);
    ok(_d && _d.batch_id === null && !_d.read_at, `the lead with nothing to read was drawn ahead of three with a website: ${JSON.stringify(_d && [_d.batch_id, _d.read_at])}`);
    ok(sbTable('discovered_queue').filter(r => r.batch_id === r1id).every(r => r.extra && typeof r.extra === 'object'), 'a row the server wrote back holds extra as a string');
    const Q2 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/find/summary`);
    ok(Q2.json && Q2.json.unread === 1 && Q2.json.read === 3 && Q2.json.running === null, `the summary after the run reads ${JSON.stringify(Q2.json).slice(0, 160)} - expected 1 unread, 3 read, nothing running`);
    // THE HAND ACTIONS, each a stamp and never a delete.
    const M1 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/leads/move-to-research`, { ids: [qRow(R1a).id] });
    ok(M1.code === 200 && M1.json && M1.json.moved === 1 && M1.json.leads && /Pete Barnes/.test(String((M1.json.leads[0] || {}).contactOwner || '')), `move to Research answered ${M1.code}: ${JSON.stringify(M1.json).slice(0, 160)} - the browser builds the pipeline row from these and must get the read back`);
    const M1again = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/leads/move-to-research`, { ids: [qRow(R1a).id] });
    ok(M1again.json && M1again.json.moved === 0, 'moving a lead already in Research moved it again, so a double click makes a duplicate pipeline row');
    const X1 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/leads/exported`, { ids: [qRow(R1a).id, qRow(R1b).id], dest: 'csv' });
    ok(X1.code === 200 && qRowOf(qRow(R1b).id).exported_to === 'csv' && !!qRowOf(qRow(R1b).id).exported_at, 'the export stamp did not land on the row ("i have no clue which ones ive already exported")');
    const O1 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/leads/rule-out`, { ids: [qRow(R1b).id], why: 'a chain after all' });
    ok(O1.code === 200 && !!qRowOf(qRow(R1b).id).ruled_out_at && qRowOf(qRow(R1b).id).ruled_out_why === 'a chain after all', 'ruling a lead out by hand did not stamp the row');
    const Q3 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/find/summary`);
    ok(Q3.json && Q3.json.ruledOut === 1 && Q3.json.moved === 1 && Q3.json.read === 1, `after one move and one rule-out the summary reads ${JSON.stringify(Q3.json).slice(0, 160)}`);
    const AR1 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/find/archive`);
    ok(AR1.code === 200 && AR1.json && (AR1.json.leads || []).some(l => l.id === qRow(R1b).id && /chain/.test(String(l.ruledOutWhy || ''))), `the archive does not list the lead just ruled out with its reason: ${AR1.code} ${JSON.stringify(AR1.json).slice(0, 160)}`);
    const B1 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/leads/restore`, { ids: [qRow(R1b).id] });
    const AR2 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/find/archive`);
    ok(AR2.json && !(AR2.json.leads || []).some(l => l.id === qRow(R1b).id), 'a restored lead is still in the archive');
    const _b = qRowOf(qRow(R1b).id);
    ok(B1.code === 200 && _b && !_b.ruled_out_at && _b.batch_id === r1id && !!_b.read_at && _b.extra.contactNotFit === false, `restoring a ruled-out lead left the row as ${JSON.stringify(_b && [_b.ruled_out_at, _b.batch_id, !!_b.read_at])} - it should be back in its batch with its read`);
    const RL = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/read-runs?limit=5`);
    const _card = (Array.isArray(RL.json) && RL.json.find(r => r.id === r1id)) || {};
    ok(_card.inResearch === 1 && _card.ruledOut === 0 && _card.withEmail === 3, `the batch card reads ${JSON.stringify([_card.inResearch, _card.ruledOut, _card.withEmail])} for in-Research/ruled-out/with-email after one move and a restore`);
    // MOVE UNREAD: no read, no spend. The lead the draw left is the only one.
    const _mu0 = fcCalls();
    const MU = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/leads/move-unread-to-research`, { count: 5 });
    const _dd = qRowOf(qRow(R1d).id);
    ok(MU.code === 200 && MU.json && MU.json.moved === 1 && !!_dd.moved_to_research_at && !_dd.read_at && fcCalls() === _mu0, `moving unread leads straight to Research: ${JSON.stringify(MU.json && MU.json.moved)} moved, read_at ${JSON.stringify(_dd.read_at)}, ${fcCalls() - _mu0} Firecrawl call(s) - it must stamp the move only`);
    const NR = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/read-run`, { count: 0 });
    ok(NR.code === 422, `count 0 was accepted (${NR.code})`);
    const NG = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/read-run/nope/cancel`, {});
    ok(NG.code === 404, `cancelling a run this server is not driving answered ${NG.code}`);

    console.log('── scenario R2: Cancel stops the draw, and what was never reached goes back to the queue');
    state.sb.discovered_queue = [];
    sbTable('discovered_queue').push(...'abcdefghijkl'.split('').map(x => qRow(bizReg('R2' + x))));
    state.slowMs = 1500;
    const R2 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/read-run`, { count: 12 });
    ok(R2.code === 200 && R2.json && R2.json.runId, `the second run did not start (${R2.code}: ${JSON.stringify(R2.json).slice(0, 120)}) - the first run's end did not release the server`);
    const r2id = R2.json && R2.json.runId;
    await sleep(2500);
    const C2 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/read-run/${r2id}/cancel`, {});
    ok(C2.code === 200 && C2.json && C2.json.cancelling === true, `Cancel answered ${C2.code}`);
    const R2done = await waitRun(r2id);
    state.slowMs = 0;
    const _r2 = sbTable('discovered_queue');
    const _answered = _r2.filter(r => r.read_at || r.read_failed || r.ruled_out_at).length;
    const _released = _r2.filter(r => r.batch_id === null && !r.read_at).length;
    const _stuck = _r2.filter(r => r.batch_id === r2id && !r.read_at && !r.read_failed && !r.ruled_out_at).length;
    ok(R2done && R2done.status === 'partial', `a cancelled run ended ${JSON.stringify(R2done && [R2done.status, R2done.error])} - expected partial`);
    ok(_answered >= 1 && _answered < 12, `${_answered} of 12 answered after a Cancel sent two seconds in - a Cancel that stops nothing, or a run that read nothing`);
    ok(_stuck === 0 && _released === 12 - _answered, `${_stuck} lead(s) are still claimed by a run that ended and ${_released} went back to the queue - a lead the run never reached is unread, not read`);
    ok(R2done && R2done.read_count + R2done.failed_count + R2done.ruled_out_count === _answered, `the run row counts ${JSON.stringify(R2done && [R2done.read_count, R2done.failed_count, R2done.ruled_out_count])} against ${_answered} answered rows`);
    const Q4 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/find/summary`);
    ok(Q4.json && Q4.json.unread === _released && Q4.json.running === null, `after the cancel the summary reads ${JSON.stringify(Q4.json).slice(0, 120)} - expected ${_released} unread and nothing running`);

    console.log('── scenario R3: a run that breaks ends failed with a reason, and never stays running');
    state.sb.discovered_queue = [qRow(bizReg('R3a'))];
    state.sbFail = { table: 'read_runs', method: 'PATCH', code: 500, times: 1 };
    const R3 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/read-run`, { count: 1 });
    const r3id = R3.json && R3.json.runId;
    ok(R3.code === 200 && !!r3id, `the run after a cancel did not start (${R3.code})`);
    const R3done = await waitRun(r3id);
    ok(state.sbFail.times === 0, 'the forced 500 on read_runs was never consumed, so this scenario proved nothing');
    state.sbFail = null;
    ok(R3done && R3done.status === 'failed' && String(R3done.error || '').length > 0, `a run whose own row could not be updated ended ${JSON.stringify(R3done && [R3done.status, R3done.error])} - expected failed with the reason`);
    const Q5 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/find/summary`);
    ok(Q5.json && Q5.json.running === null, 'a failed run is still reported as running, so the next start is refused for ever');
    // A row whose stored company object is not JSON: one failure, the run still ends.
    const _bad = qRow(bizReg('R3b'), { extra: '{not json' });
    state.sb.discovered_queue = [_bad, qRow(bizReg('R3c'))];
    const R3b = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/read-run`, { count: 2 });
    ok(R3b.code === 200 && R3b.json && R3b.json.runId, `a run after a failed one was refused (${R3b.code}: ${JSON.stringify(R3b.json).slice(0, 120)}) - the failure left the server busy`);
    const R3bdone = await waitRun(R3b.json && R3b.json.runId);
    ok(R3bdone && R3bdone.status === 'partial' && R3bdone.read_count === 1 && R3bdone.failed_count === 1, `a batch with one unreadable row ended ${JSON.stringify(R3bdone && [R3bdone.status, R3bdone.read_count, R3bdone.failed_count])} - expected partial, 1 read, 1 failed`);
    const _badRow = qRowOf(_bad.id);
    ok(_badRow && _badRow.read_failed === true && /JSON/.test(String(_badRow.fail_reason || '')) && _badRow.batch_id === (R3b.json && R3b.json.runId), `the unreadable row reads ${JSON.stringify(_badRow && [_badRow.read_failed, _badRow.fail_reason, _badRow.batch_id])} - it must stay in its batch, failed, with the reason`);
    ok(sbTable('read_runs').every(r => r.status !== 'running'), 'a run row is still "running" after every run on this boot ended');
    ok(!state.sbLog.some(h => h.table === 'user_settings' && h.method !== 'GET'), 'the server WROTE the Settings row - a background run may read keys, never store them');

    // ── AUTH1: THE ACCESS CODE ──────────────────────────────────────────
    console.log('── scenario AUTH1: the access code');
    {
      const noCode = await httpRaw('GET', '/api/find/summary', { Origin: 'https://app.example' });
      ok(noCode.code === 401 && /access code/.test(String((noCode.json || {}).error || '')) && (noCode.json || {}).needsToken === true, `a call with no code got ${noCode.code}: ${JSON.stringify(noCode.json).slice(0, 120)} - expected 401 with the sentence that says what to paste`);
      ok(noCode.headers['access-control-allow-origin'] === 'https://app.example', 'the 401 carries no CORS header for the listed origin, so the page reads it as a network error');
      const wrong = await httpRaw('POST', '/api/read-run', { Authorization: 'Bearer sc-tokeN' }, { count: 1 });
      ok(wrong.code === 401, `a wrong code got ${wrong.code} - expected 401`);
      const bare = await httpRaw('GET', '/api/spend', { Authorization: SC_TOKEN });
      ok(bare.code === 401, `a code sent without the Bearer scheme got ${bare.code} - expected 401`);
      const hz = await httpRaw('GET', '/healthz', {});
      ok(hz.code === 200 && (hz.json || {}).auth === 'on', `/healthz with no code got ${hz.code} auth=${(hz.json || {}).auth} - the health of the build must be readable without the code, and must say the gate is on`);
      const root = await httpRaw('GET', '/', {});
      ok(root.code === 200, `the root banner with no code got ${root.code}`);
      const ask = await httpRaw('GET', '/p/nothing', {});
      ok(ask.code === 404, `an ask page a prospect opens got ${ask.code} without the code - expected 404 (the route ran, the token is unknown), never 401`);
      const cron = await httpRaw('GET', '/api/cron/discover', {});
      ok(cron.code === 403, `the cron got ${cron.code} without the code - expected 403 from its own secret, never 401 from the access gate`);
      const right = await httpRaw('GET', '/api/spend', { Authorization: 'Bearer ' + SC_TOKEN });
      ok(right.code === 200, `the right code got ${right.code} on /api/spend`);
    }
    // ── CORS1: ONLY THE LISTED ORIGIN ───────────────────────────────────
    console.log('── scenario CORS1: only the listed origin');
    {
      const evil = await httpRaw('OPTIONS', '/api/read-run', { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' });
      ok(evil.code === 403 && !evil.headers['access-control-allow-origin'], `a preflight from an origin not on the list got ${evil.code} with ACAO=${evil.headers['access-control-allow-origin'] || 'none'} - expected 403 and no header`);
      const good = await httpRaw('OPTIONS', '/api/read-run', { Origin: 'https://app.example', 'Access-Control-Request-Method': 'POST' });
      ok(good.code === 204 && good.headers['access-control-allow-origin'] === 'https://app.example', `a preflight from the listed origin got ${good.code} with ACAO=${good.headers['access-control-allow-origin'] || 'none'} - expected 204 echoing the origin`);
      ok(/PUT/.test(String(good.headers['access-control-allow-methods'] || '')), 'the preflight does not allow PUT, so the settings save the page will send is refused by the browser');
      const hz = await httpRaw('GET', '/healthz', { Origin: 'https://app.example' });
      ok(hz.headers['access-control-allow-origin'] === 'https://app.example', '/healthz does not echo the listed origin');
    }
    // ── STORE1: THE PAGE'S STORE, THROUGH THIS SERVER ───────────────────
    console.log('── scenario STORE1: leads and settings through the store routes');
    {
      state.sb.leads = [];
      const up = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/store/leads/upsert`, { rows: [{ id: 'l1', name: 'A' }, { id: 'l2', name: 'B' }, { name: 'no id' }] });
      ok(up.code === 200 && (up.json || {}).saved === 2 && sbTable('leads').length === 2, `the upsert answered ${up.code} ${JSON.stringify(up.json)} and the table holds ${sbTable('leads').length} row(s) - expected 2 saved, the row with no id dropped`);
      const up2 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/store/leads/upsert`, { rows: [{ id: 'l1', name: 'A2' }] });
      ok(up2.code === 200 && sbTable('leads').length === 2 && sbTable('leads').find(r => r.id === 'l1').name === 'A2', 'a second save of the same lead did not merge into its row');
      const p1 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/store/leads?limit=1`);
      ok(p1.code === 200 && Array.isArray((p1.json || {}).rows) && p1.json.rows.length === 1 && p1.json.last === 'l1' && p1.json.done === false, `the first page reads ${JSON.stringify(p1.json).slice(0, 120)} - expected one row, last l1, not done`);
      const p2 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/store/leads?limit=1&after=l1`);
      ok(p2.code === 200 && p2.json.rows.length === 1 && p2.json.rows[0].id === 'l2', 'the page after l1 is not l2');
      const p3 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/store/leads?limit=5&after=l2`);
      ok(p3.code === 200 && p3.json.rows.length === 0 && p3.json.done === true, 'the page after the last row is not the end');
      const del = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/store/leads/delete`, { id: 'l1' });
      ok(del.code === 200 && sbTable('leads').length === 1 && !sbTable('leads').find(r => r.id === 'l1'), 'the delete did not remove the row');
      const _keepS = sbTable('user_settings')[0].data;
      const put = await new Promise((resolve, reject) => {
        const body = JSON.stringify({ data: { apiKey: 'leak-me', hunterKey: 'leak-me', tone: 'plain', findPaidOwner: false } });
        const req = http.request({ hostname: '127.0.0.1', port: SRV_PORT, path: '/api/store/settings', method: 'PUT', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), Authorization: 'Bearer ' + SC_TOKEN } }, (res) => {
          let b = ''; res.on('data', (c) => { b += c; });
          res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) { void e; } resolve({ code: res.statusCode, json: j }); });
        });
        req.on('error', reject); req.write(body); req.end();
      });
      const rowNow = sbTable('user_settings')[0].data || {};
      ok(put.code === 200 && !('apiKey' in rowNow) && !('hunterKey' in rowNow) && rowNow.tone === 'plain' && rowNow.findPaidOwner === false, `the settings PUT answered ${put.code} and the row now holds ${JSON.stringify(rowNow)} - expected the two keys stripped and the two preferences kept`);
      const gs = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/store/settings`);
      ok(gs.code === 200 && gs.json && gs.json.data && !('apiKey' in gs.json.data) && gs.json.data.tone === 'plain' && gs.json.serverKeys && gs.json.serverKeys.anthropicKey === true && gs.json.serverKeys.hunterKey === false && gs.json.envNames && gs.json.envNames.anthropicKey === 'ANTHROPIC_API_KEY', `the settings GET answered ${JSON.stringify(gs.json).slice(0, 200)} - expected no key, the preference, and the server-key booleans naming the Render variable`);
      sbTable('user_settings')[0].data = _keepS;
    }

    // ── E: FIRECRAWL OUT OF CREDITS ─────────────────────
    // LAST on this boot: the 402 latch is process state by design, so every
    // scenario that needs to SPEND has to run above this line.
    console.log('── scenario E: Firecrawl 402 — the latch and the bounded hold');
    state.mode = 'fc402'; state.biz = biz('E');
    const _logBeforeE = srv.log().length;
    const E = await runLead(state.biz, {}, 90000);
    // What the latch PROMISES: after the first 402 not one further Firecrawl
    // credit moves, and the response records that the site was never read —
    // corpusRead.homepageChars 0 is what the client's blind banner fires on.
    ok(E.httpStatus === 200 || E.httpStatus === 422, `a 402 day produced ${JSON.stringify({ httpStatus: E.httpStatus, error: (E.error || '').slice(0, 120) })}`);
    if (E.result) {
      ok((E.result.leadSpend || {}).fcCredits === 0, `Firecrawl spend on a 402 day is ${(E.result.leadSpend || {}).fcCredits}, not 0 — the latch is not stopping the doors`);
      ok(E.result.corpusRead && E.result.corpusRead.homepageChars === 0, `corpusRead says ${JSON.stringify(E.result.corpusRead)} on a lead whose every page read was refused — the blind banner has nothing to fire on`);
    }
    ok(/FIRECRAWL OUT OF CREDITS/.test(srv.log()), 'the 402 never printed its own name in the log — the operator reads a blind audit with no cause attached');
    // A search that comes back 402 is not a paid call. On 2026-09-02 the
    // search door noted its spend at dispatch, so every doomed probe printed
    // FC PAID, counted a credit and re-opened every other door.
    ok(!/FC PAID \[search/.test(srv.log().slice(_logBeforeE)),
      'a search refused with 402 was logged as FC PAID - the meter counts a credit that was never spent and the latch is cleared by a call that failed');

    srv.child.kill(); await sleep(400);

    // ── F: THE DAY CEILING, ON A FRESH BOOT ─────────────────────────────
    console.log('── scenario F: FC_DAILY_BUDGET=5 — lead one finishes over it, lead two is refused');
    state.mode = 'golden'; state.biz = biz('F');
    srv = await bootServer({ FC_DAILY_BUDGET: '5' });
    const F1 = await runLead(state.biz);
    ok(F1.httpStatus === 200, `the lead that CROSSED the ceiling mid-run was killed (${F1.httpStatus}: ${(F1.error || '').slice(0, 100)}) — a half-lead is pure waste and the rule is admission-only`);
    const F2 = await runLead(biz('G'), {}, 30000);
    ok(/FC_DAILY_BUDGET/.test(String(F2.error || '')), `the lead AFTER the ceiling was not refused naming the setting — got: ${String(F2.error || '(none)').slice(0, 140)}`);

    srv.child.kill(); await sleep(400);

    // ── R4: A RESTART MID-RUN (a merge, a spin-down), ON A THIRD BOOT ────
    // A run is a row, so the process that replaced this one must pick it up:
    // resumed when its last progress is recent, failed as stalled when not,
    // and in both cases nothing is left claimed by a run that is not driving.
    console.log('── scenario R4: a third boot picks up a live run and fails a stalled one');
    state.mode = 'findrich'; state.biz = biz('R4');
    const _uuid = () => require('crypto').randomUUID();
    const _ago = (ms) => new Date(Date.now() - ms).toISOString();
    const stalledId = _uuid(), liveId = _uuid();
    const R4s1 = bizReg('R4a'), R4s2 = bizReg('R4b'), R4l1 = bizReg('R4c'), R4l2 = bizReg('R4d');
    state.sb.discovered_queue = [
      qRow(R4s1, { batch_id: stalledId, read_at: _ago(3 * 3600e3) }),
      qRow(R4s2, { batch_id: stalledId }),
      qRow(R4l1, { batch_id: liveId, read_at: _ago(90e3) }),
      qRow(R4l2, { batch_id: liveId }),
    ];
    const _runRow = (id, agoMs) => ({ id, started_at: _ago(agoMs + 60e3), progress_at: _ago(agoMs), finished_at: null, status: 'running', requested_count: 2, read_count: 1, failed_count: 0, ruled_out_count: 0, credits_estimated: 10, credits_used: 4, scope: {}, error: null });
    state.sb.read_runs = [_runRow(stalledId, 3 * 3600e3), _runRow(liveId, 90e3)];
    // Round 126: this boot has NO code set and NO key in the Settings row; the
    // keys come from the environment, and the boot must say the gate is off.
    sbTable('user_settings')[0].data = { findPaidOwner: true };
    srv = await bootServer({ APP_TOKEN: '', ANTHROPIC_API_KEY: 'k-env', FIRECRAWL_KEY: 'fc-env' });
    ok(/AUTH GATE OFF/.test(srv.log()), 'a boot with no APP_TOKEN did not say on its own log that every route answers without the code');
    {
      const hz = await httpRaw('GET', '/healthz', {});
      ok(hz.code === 200 && (hz.json || {}).auth === 'off', `/healthz says auth=${(hz.json || {}).auth} on a boot with no code - expected off`);
    }
    {
      const t0 = Date.now();
      while (Date.now() - t0 < 120000 && state.sb.read_runs.some(r => r.status === 'running')) await sleep(1000);
    }
    const _st = state.sb.read_runs.find(r => r.id === stalledId), _lv = state.sb.read_runs.find(r => r.id === liveId);
    ok(_st.status === 'failed' && _st.error === 'stalled', `a run with no progress for three hours was left ${JSON.stringify([_st.status, _st.error])} after a restart - the next start is refused for ever`);
    ok(qRowOf(qRow(R4s2).id).batch_id === null && qRowOf(qRow(R4s1).id).batch_id === stalledId, 'the stalled run\'s unread lead was not returned to the queue, or its read one was');
    ok(_lv.status === 'done' && _lv.read_count === 2, `a run interrupted with one lead left ended ${JSON.stringify([_lv.status, _lv.read_count, _lv.error])} after the restart - expected done with both read`);
    ok(!!qRowOf(qRow(R4l2).id).read_at && /Pete Barnes/.test(String((qRowOf(qRow(R4l2).id).extra || {}).contactOwner || '')), 'the lead left unread by the restart was not read on resume');
    ok(/resumed after a restart/.test(srv.log()), 'the resume never printed its own line, so an operator reading the log after a merge cannot tell a resumed run from a new one');
    srv.child.kill(); await sleep(400);

    // ── NOKEY: NO KEY ON RENDER, ON A FOURTH BOOT ─────────────────────────
    // Round 127: the request body and the Settings row carry keys here on
    // purpose, and neither may count. Every paid door refuses by name, names
    // the Render variable, and spends nothing.
    console.log('── scenario NOKEY: no key on Render — every paid door refuses by name and nothing is spent');
    state.mode = 'golden'; state.biz = biz('B');
    sbTable('user_settings')[0].data = { apiKey: 'k-in-the-row', firecrawlKey: 'fc-in-the-row', findPaidOwner: true };
    srv = await bootServer({ ANTHROPIC_API_KEY: '', FIRECRAWL_KEY: '', APIFY_TOKEN: '' });
    // ── B: PREFLIGHT, ZERO NETWORK ──────────────────────────────────────
    console.log('── scenario B: preflight refusal, zero spend');
    const before = state.requests.length;
    const B = await runLead(biz('B'), { apiKey: 'sk-in-the-body' }, 30000);
    ok(/Anthropic/.test(String(B.error || '')), `a lead with no key on Render (and one in its body) was not refused by name — got: ${String(B.error || '(none)').slice(0, 120)}`);
    ok(state.requests.length === before, `the preflight refusal still made ${state.requests.length - before} network call(s) — "nothing was spent" is false`);
    // The SYNCHRONOUS route — the client's fallback when -async 404s — must
    // clear the same gates. Until 2026-08-22 it was a door around them: a
    // lead posted here started spending with no preflight and no ceiling.
    const beforeSync = state.requests.length;
    const Bsync = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/research`, leadBody(biz('B2'), { apiKey: 'sk-in-the-body' }));
    ok(Bsync.code === 422 && /Anthropic/.test(String((Bsync.json && Bsync.json.error) || '')),
      `the synchronous /api/research route admitted a lead the queue refuses (got ${Bsync.code}: ${String((Bsync.json && Bsync.json.error) || '').slice(0, 120)}) — a door around the admission gates`);
    ok(state.requests.length === beforeSync, `the sync-route refusal still made ${state.requests.length - beforeSync} network call(s)`);

    const h4n = state.requests.length;
    const H4a = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
      company: { name: 'No Key Co', website: 'https://x.example' }, keys: { anthropicKey: 'k-in-the-body' },
    });
    ok(H4a.code === 422 && /Anthropic/.test(String((H4a.json || {}).error || '')),
      `a contact read with no key on Render (and one in its body) was not refused by name (got ${H4a.code})`);
    ok(state.requests.length === h4n, `the refusal still made ${state.requests.length - h4n} network call(s) — "nothing was spent" is false`);
    const NK = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/read-run`, { count: 1 });
    ok(NK.code === 422 && /ANTHROPIC_API_KEY/.test(String((NK.json || {}).error || '')), `a read run with no key on Render (and one in the Settings row) was not refused naming ANTHROPIC_API_KEY (${NK.code}: ${JSON.stringify(NK.json).slice(0, 120)})`);
    const NC = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/firecrawl-credits?key=fc-in-the-url`);
    ok(NC.code === 503 && /FIRECRAWL_KEY/.test(String((NC.json || {}).error || '')), `the credit tester with a key in the URL answered ${NC.code} - expected 503 naming FIRECRAWL_KEY, the URL key ignored`);

    if (state.unknown.length) info('endpoints the fake did not know (tolerated by the routes): ' + [...new Set(state.unknown)].slice(0, 6).join(', '));
  } catch (e) {
    fails.push('COULD NOT RUN — ' + (e && e.message));
    console.log('  ✗ COULD NOT RUN — ' + (e && e.message));
  } finally {
    try { if (srv) srv.child.kill(); } catch (e) { void e; }
    fake.close();
  }

  console.log('');
  if (fails.length) {
    console.log(`✗ servercheck: ${fails.length} failure(s) across the research route`);
    process.exit(1);
  }
  console.log(`✓ server.js: the research route was DRIVEN, not read — ${passed} assertions over a fake network. A real lead completes with a live ladder, a spine, the authoritative review count and its own spend figure; a missing key is refused before one network call; a dead Apify token thins the audit instead of deleting it; an empty audit 422s; a 402 day is named; and the day ceiling refuses the NEXT lead while letting the one that crossed it finish. The seams between the functions - where every computed-but-not-passed has ever lived - finally have a check that walks them.`);
  process.exit(0);
})();
