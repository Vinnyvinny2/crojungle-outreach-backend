
const BBB_PROFILE_RE=/bbb\.org\//i;
const cityState=(s)=>String(s||"");
const companyDistinctiveTokens=()=>["winns"];
const sizeSecondQueryWorth=()=>false;
const firecrawlSearch=async()=>[{title:"Winn s Plumbing",url:"https://www.bbb.org/us/tn/winns-plumbing",description:"Winn s Plumbing profile"}];
const anthropicFetch=async()=>({json:async()=>({content:[{type:"text",text:JSON.stringify({employees:null,employeesRange:null,revenue:null,source:null,confidence:"low"})}]})});
const anthropicText=(d)=>d.content[0].text;
const parseLLMJSON=(t)=>{try{return JSON.parse(t)}catch{return null}};
// the REAL retired return, copied from fetchBbbProfile
const fetchBbbProfile=async()=>({ok:false,why:"retired - 403 on every attempt across two batches"});
const findSizeViaSearch = async (companyName, website, fcKey, apiKey, location = '', opts = {}) => {
  if (!companyName || !fcKey || !apiKey) return null;
  const secondWorth = sizeSecondQueryWorth((opts || {}).reviewCount);
  try {
    const domain = (website || '').replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '');
    const loc = cityState(location);
    // Target the revenue aggregators directly — Prospeo, RocketReach, Growjo,
    // ZoomInfo publish private-SMB revenue and it sits right in the search SNIPPET
    // (e.g. "Johns Roofing has revenue of $25,300,000"). So snippet-only = 1 credit,
    // no page scrape needed. Location-locked so we don't grab a same-named company.
    const q = `"${companyName}" ${loc ? loc + ' ' : ''}revenue (prospeo.io OR rocketreach.co OR growjo.com OR zoominfo.com OR dnb.com)`;
    // One extraction over whatever snippets are in hand; null when the
    // sources state neither a headcount nor a revenue.
    const _extractSize = async (results) => {
      const corpus = results.map(r => `--- ${r.title}\nURL: ${r.url}\n${r.description}`).join('\n\n').slice(0, 12000);
      const r2 = await anthropicFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{ role: 'user', content: `Web results about "${companyName}"${domain ? ' (' + domain + ')' : ''}${loc ? ' located in ' + loc : ''}.

Extract this company's EMPLOYEE COUNT and ANNUAL REVENUE if stated.

RULES:
- Only report figures the sources ACTUALLY state. Never estimate, never guess.
- Make sure the figure is about THIS company${loc ? ' in ' + loc : ''}, not a similarly-named one in a different city. If a result is clearly a different-location business, ignore it.
- Directory sites (Prospeo, RocketReach, Growjo, ZoomInfo, D&B), LinkedIn company pages and BBB profiles publish these for private companies — those are valid sources.
- A LinkedIn range like "11-50 employees" is a RANGE: report it in "employeesRange" exactly as written and leave "employees" null unless an exact count is stated.
- Copy revenue EXACTLY as written, including "<", "under" or a range like "$500K-$1M" — never round a bucket into a number.
- If a figure is not stated anywhere, return null for it. Null is correct.

Return ONLY valid JSON:
{"employees": number or null, "employeesRange": "e.g. 11-50" or null, "revenue": "e.g. $5M or <$5M or $1M-$5M, exactly as written" or null, "source": "which site said it", "confidence": "high|medium|low"}

RESULTS:
${corpus}` }]
        }),
      }, 25000, 'size-search');

      const d = await r2.json();
      let text = (anthropicText(d)).replace(/```json|```/g, '').trim();
      const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
      if (fb >= 0 && lb > fb) text = text.slice(fb, lb + 1);
      const parsed = parseLLMJSON(text) || {};
      // A stated range reads as its midpoint, and the row says it was a range.
      const _rg = String(parsed.employeesRange || '').match(/(\d+)\s*(?:-|\u2013|to)\s*(\d+)/);
      if (!(Number(parsed.employees) > 0) && _rg) { parsed.employees = Math.round((Number(_rg[1]) + Number(_rg[2])) / 2); parsed.employeesFromRange = parsed.employeesRange; }
      if (!(Number(parsed.employees) > 0) && !parsed.revenue) return null;
      return parsed;
    };
    let results = await firecrawlSearch(fcKey, q, 4, false, 'size_revenue'); // snippet-only
    let secondQuery = false;
    let parsed = results.length ? await _extractSize(results) : null;
    // Round 112 bought one more snippet-only query over LinkedIn company pages
    // and BBB profiles on a miss. Round 113: a miss is a NULL PARSE, never the
    // wording of the snippets. The old trigger looked for a dollar sign or the
    // word "employees" in the first results, so a snippet about somebody else
    // with a price in it stood the second query down - Emrick Services and
    // Affordable Foundation Repair (2026-09-03) bought one query, parsed
    // nothing, and stayed a guess. 2 credits and one more cheap model call,
    // only when the first parse found nothing.
    if (!parsed && !secondQuery && secondWorth) {
      const q2 = `"${companyName}" ${loc ? loc + ' ' : ''}employees (site:linkedin.com/company OR site:bbb.org)`;
      const r2s = await firecrawlSearch(fcKey, q2, 4, false, 'size_headcount');
      if (r2s.length) { results = results.concat(r2s); secondQuery = true; parsed = await _extractSize(results); }
    }
    // Round 116: the BBB profile, fetched FREE off a URL the results already
    // hold. Never a Firecrawl credit: a refusal is one line and nothing else.
    const _dt = companyDistinctiveTokens(companyName);
    const bbbUrl = results.map(r => String((r && r.url) || '')).find(u => BBB_PROFILE_RE.test(u) && (!_dt.length || _dt.some(tok => u.toLowerCase().includes(tok))));
    if (bbbUrl) {
      const bbb = await fetchBbbProfile(bbbUrl);
      if (!bbb.ok && !/^retired/.test(String(bbb.why))) console.log(`SIZE [${companyName}]: BBB profile refused a plain fetch (${bbb.why}) - not bought`);
      else {
        parsed = parsed || {};
        if (!(Number(parsed.employees) > 0) && Number(bbb.employees) > 0) { parsed.employees = Number(bbb.employees); parsed.employeesFromRange = ''; parsed.source = 'BBB profile'; }
        parsed.bbb = { url: bbbUrl, employees: bbb.employees, started: bbb.started, management: bbb.management };
      }
    }
    if (!parsed || (!(Number(parsed.employees) > 0) && !parsed.revenue && !(parsed.bbb && parsed.bbb.management.length))) return null;
    parsed.secondQuery = secondQuery;
    console.log(`SIZE [${companyName}]: emp=${parsed.employees || '?'}${parsed.employeesFromRange ? ' (from the range ' + parsed.employeesFromRange + ')' : ''} rev=${parsed.revenue || '?'} (${parsed.source || '?'}${secondQuery ? '; LinkedIn/BBB query bought' : ''})`);
    return parsed;
  } catch(e) {
    console.log('findSizeViaSearch failed:', e.message);
    return null;
  }
};

// ── THE BIG ONE: WHAT IS THE OWNER ACTUALLY LOSING SLEEP OVER? ─────────────
// This transforms the pitch. Instead of "your website has no lead capture" —
findSizeViaSearch("Winn s Plumbing","https://winnsplumbing.com","fckey","apikey","Nashville TN",{reviewCount:40})
  .then(r=>console.log("RETURNED:",JSON.stringify(r)));
