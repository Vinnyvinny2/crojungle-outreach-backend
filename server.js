require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// ═══ BULLETPROOF CORS ═══════════════════════════════════════════════════════
// Set the headers manually on EVERY response and answer OPTIONS preflight
// immediately, before any other middleware or route can interfere or crash.
// A dropped/crashed request loses its CORS headers and shows up in the browser
// as a "No Access-Control-Allow-Origin" error even when origin:'*' is set.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '10mb' }));

const safeJson = async (r) => { try { return await r.json(); } catch { return {}; } };
const safeText = async (r) => { try { return await r.text(); } catch { return ''; } };

// Free proxy for domains blocked by Render
const CF_WORKER = 'https://silent-credit-94eb.vindesil2.workers.dev/?url=';
const fetchViaProxy = async (url, ms=10000) => {
  const r = await fetchT(CF_WORKER + encodeURIComponent(url), {}, ms);
  return r.text ? await r.text() : '';
};
const fetchT = (url, opts={}, ms=10000) => Promise.race([
  fetch(url, { ...opts, headers: { 'User-Agent': 'Mozilla/5.0 CROJungle/1.0', ...(opts.headers||{}) } }),
  new Promise((_,rej) => setTimeout(() => rej(new Error('timeout')), ms))
]);

app.get('/', (req, res) => res.json({ status: 'CROJungle Backend v9 — full-stack: stacking + combos + accuracy guards + reachability playbook', sources: ['adzuna_ai','sec_edgar','google_news','bizbuysell','facebook_ads(token)'], ok: true }));

// ── TEST ADZUNA — hit in browser to verify keys work ──────
// Usage: https://crojungle-outreach-backend.onrender.com/api/test-adzuna?app_id=XXX&app_key=XXX
app.get('/api/test-adzuna', async (req, res) => {
  const { app_id, app_key } = req.query;
  if (!app_id || !app_key) return res.status(400).json({ error: 'Pass ?app_id=YOUR_ID&app_key=YOUR_KEY' });
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${app_id}&app_key=${app_key}&results_per_page=5&what=marketing+manager&sort_by=date`;
    const r = await fetchT(url, { headers: { 'Accept': 'application/json' } }, 10000);
    const d = await safeJson(r);
    res.json({
      httpStatus: r.status,
      totalJobsInDB: d.count || 0,
      resultsReturned: (d.results||[]).length,
      firstCompany: d.results?.[0]?.company?.display_name || 'none',
      adzunaError: d.exception || d.error || null,
      working: r.ok && (d.results||[]).length > 0,
    });
  } catch(e) { res.json({ error: e.message, working: false }); }
});

// ── CLAUDE ────────────────────────────────────────────────
app.post('/api/claude', async (req, res) => {
  try {
    const { system, user, apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API key required' });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 6000, system, messages: [{ role: 'user', content: user }] }),
    });
    const d = await safeJson(r);
    if (!r.ok) return res.status(r.status).json({ error: d.error?.message || 'Anthropic error' });
    res.json({ text: d.content[0].text });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── FIRECRAWL ─────────────────────────────────────────────
app.post('/api/scrape', async (req, res) => {
  try {
    const { url, firecrawlKey } = req.body;
    if (!url || !firecrawlKey) return res.status(400).json({ error: 'URL and key required' });
    const r = await fetchT('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
    }, 15000);
    const d = await safeJson(r);
    res.json({ markdown: (d.data?.markdown || '').slice(0, 5000) });
  } catch(e) { res.json({ markdown: '' }); }
});

// ── HUNTER ────────────────────────────────────────────────
app.get('/api/email', async (req, res) => {
  try {
    const { domain, hunterKey } = req.query;
    if (!domain || !hunterKey) return res.status(400).json({ error: 'Domain and key required' });
    const clean = domain.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','');
    const r = await fetchT(`https://api.hunter.io/v2/domain-search?domain=${clean}&type=personal&limit=5&api_key=${hunterKey}`);
    const d = await safeJson(r);
    const emails = d.data?.emails || [];
    const priority = ['ceo','founder','co-founder','owner','president','cmo'];
    const sorted = emails.sort((a,b) => {
      const aS = priority.findIndex(p=>(a.position||'').toLowerCase().includes(p));
      const bS = priority.findIndex(p=>(b.position||'').toLowerCase().includes(p));
      return (aS===-1?99:aS)-(bS===-1?99:bS);
    });
    const best = sorted[0];
    res.json({ email: best?.value||'', founderName: `${best?.first_name||''} ${best?.last_name||''}`.trim(), title: best?.position||'' });
  } catch(e) { res.json({ email:'', founderName:'', title:'' }); }
});

// ── FIND WEBSITE ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
// COMPANY INTEL — Google search for website + headcount
// Uses DuckDuckGo HTML (free, no key) to get the same
// results you'd see if you Googled the company yourself.
// ═══════════════════════════════════════════════════════════

// Size lookup using Wikipedia API — free, no key, works from any IP
// Logic: if company has a Wikipedia page with employee data, extract it.
// If NO Wikipedia page → almost certainly a small SMB → passes through.
// This is perfect ICP logic: famous enough for Wikipedia = probably too big.
// ── THE COMPANIES API — primary firmographic source ────────────────────────
// 500 free credits + free simplified mode. Takes a domain, returns exact
// employee count, industry, founded year, CEO/social data. Works from Render.
// simplified=true is FREE (no credits). Full enrich = 1 credit, 0 if not found.
const enrichViaCompaniesAPI = async (domain, apiKey, useCredit = false) => {
  if (!domain || !apiKey) return null;
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    // simplified=true is FREE but omits exact headcount. useCredit=true spends
    // 1 credit for the full profile with totalEmployeesExact.
    const simplifiedParam = useCredit ? '' : '?simplified=true';
    const url = `https://api.thecompaniesapi.com/v2/companies/${encodeURIComponent(cleanDomain)}${simplifiedParam}`;
    const r = await fetchT(url, {
      headers: { 'Authorization': `Basic ${apiKey}`, 'Accept': 'application/json' }
    }, 8000);
    const d = await safeJson(r);
    if (!d || !d.about) {
      if (d?.message || d?.error) console.log(`CompaniesAPI [${cleanDomain}]: API said "${d.message || d.error}"`);
      return null;
    }

    const employees = d.about.totalEmployeesExact || null;
    const empBand = d.about.totalEmployees || null;
    const industry = d.about.industry || null;
    const founded = d.about.yearFounded || null;
    const name = d.about.name || null;

    let estEmployees = employees;
    if (!estEmployees && empBand) {
      const bandMap = {
        '1-10': 5, '11-50': 30, '51-200': 125, '201-500': 350,
        '501-1k': 750, '1k-5k': 3000, '5k-10k': 7500, 'over-10k': 15000
      };
      estEmployees = bandMap[empBand] || null;
    }

    if (estEmployees) {
      console.log(`CompaniesAPI [${cleanDomain}]: emp=${estEmployees} band=${empBand||'?'} industry=${industry||'?'}`);
    }
    return { employees: estEmployees, empBand, industry, founded, name, website: 'https://' + cleanDomain };
  } catch(e) {
    console.log('CompaniesAPI failed:', e.message);
    return null;
  }
};

// Name-based lookup — resolves domain (free), then does a full 1-credit enrich
// for REAL headcount. Strict name matching to avoid wrong-company domains.
const searchCompaniesAPIByName = async (companyName, apiKey) => {
  if (!companyName || !apiKey) return null;
  try {
    const cleanName = companyName.replace(/\s*\(cik\s*\d+\)\s*/gi,'').replace(/,?\s*(Inc|LLC|Corp|Ltd|LLP|Co)\.?$/gi,'').trim();
    // Free name search with trueName=true — requires the name words to actually match
    const url = `https://api.thecompaniesapi.com/v2/companies/by-name?name=${encodeURIComponent(cleanName)}&simplified=true&trueName=true&size=3`;
    const r = await fetchT(url, {
      headers: { 'Authorization': `Basic ${apiKey}`, 'Accept': 'application/json' }
    }, 8000);
    const d = await safeJson(r);
    const candidates = d?.companies || [];
    if (candidates.length === 0) {
      if (d?.message || d?.error) console.log(`CompaniesAPI name [${cleanName}]: "${d.message || d.error}"`);
      return null;
    }

    // STRICT MATCH — prevents "United Airlines" → unitedairway.xyz scam sites
    const queryWords = cleanName.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(w => w.length > 3);
    const best = candidates.find(c => {
      const rawName = (c.about?.name || '');
      const capiName = rawName.toLowerCase().replace(/[^a-z0-9\s]/g,'');
      const fullDomain = (c.domain?.domain || '').toLowerCase();
      const capiDomain = fullDomain.split('.')[0];
      const tld = fullDomain.split('.').slice(1).join('.');

      // REJECT scam/junk signals outright
      // 1. Suspicious TLDs used by scam/spam sites
      if (/^(xyz|info|online|site|top|click|link|live|fun|shop)$/i.test(tld)) return false;
      // 2. Name contains phone numbers or scam phrases (fake "customer service" sites)
      if (/\d{3}[\s-]?\d{3}[\s-]?\d{4}|reservations|phone number|customer service number|helpline|toll.?free|1-8\d\d/i.test(rawName)) return false;
      // 3. Domain has extra words bolted onto the company name (unitedairway vs united)
      //    Real match: domain base closely matches a query word. Reject if domain
      //    is much longer than the name words (indicates a different entity).

      // Name match — WORD-LEVEL, not substring, plus a superstring guard.
      // Substring wrongly accepted BILL->Billboard and Kean->Keanes; ignoring extra
      // words wrongly accepted Digitas->Digitas Liquorice. Those are different entities.
      const CAPI_SUFFIX = new Set(['inc','llc','ltd','corp','corporation','company','group','holdings','holding','co','plc','llp','lp','the','and','of']);
      const capiWords = capiName.split(/\s+/).filter(Boolean);
      const capiSig = capiWords.filter(w => w.length > 3 && !CAPI_SUFFIX.has(w));
      const wordHit = w => capiWords.some(cw => cw === w || (cw.startsWith(w) && cw.length - w.length <= 1) || (w.startsWith(cw) && w.length - cw.length <= 1));
      const nameMatchCount = queryWords.filter(wordHit).length;
      const allQueryWordsPresent = queryWords.length > 0 && nameMatchCount === queryWords.length;
      const extraDistinct = capiSig.filter(cw => !queryWords.some(w => cw === w || cw.startsWith(w) || w.startsWith(cw)));
      const nameMatch = allQueryWordsPresent && extraDistinct.length === 0;

      // Domain match: the domain base must START WITH the first query word AND
      // be a tight length match (prevents "unitedairway" matching "united")
      const firstWord = queryWords[0] || '';
      const domainStartsWithWord = firstWord.length > 3 && capiDomain.startsWith(firstWord.slice(0, Math.min(firstWord.length, 8)));
      const compact = cleanName.replace(/[^a-z0-9]/gi,'').toLowerCase();
      const domainTight = capiDomain.length <= compact.length + 4; // not much longer than the name
      const domainMatch = domainStartsWithWord && domainTight;

      // Accept only if name fully matches OR domain tightly matches
      return nameMatch || domainMatch;
    });
    if (!best) {
      console.log(`CompaniesAPI name [${cleanName}]: no confident match`);
      return null;
    }

    const domain = best.domain?.domain || null;
    const empBand = best.about?.totalEmployees || null;
    let estEmployees = best.about?.totalEmployeesExact || null;
    if (!estEmployees && empBand) {
      const bandMap = { '1-10':5,'11-50':30,'51-200':125,'201-500':350,'501-1k':750,'1k-5k':3000,'5k-10k':7500,'over-10k':15000 };
      estEmployees = bandMap[empBand] || null;
    }

    console.log(`CompaniesAPI name [${cleanName}]: matched="${best.about?.name}" domain=${domain||'?'} emp=${estEmployees||'?'} band=${empBand||'?'}`);
    return {
      employees: estEmployees, empBand,
      industry: best.about?.industry || null,
      website: domain ? 'https://' + domain : null,
      name: best.about?.name || null,
      source: 'companiesapi'
    };
  } catch(e) {
    console.log('CompaniesAPI name search failed:', e.message);
    return null;
  }
};

// SEC EDGAR headcount — the ONLY fully trustworthy source (legally filed 10-Ks).
// Public companies must report exact employee count. This catches the big public
// companies (SSM is private, but Uline/EchoStar/public giants get caught here).
// Free, no key, works from Render.
// PEOPLE DATA LABS — company size by name. 70M+ profiles incl. many SMBs the
// Companies API lacks. Free tier 1,000 matches/mo, 10/min. Returns real
// employee_count. Strict min_likelihood so we never accept a fuzzy wrong match.
// Fails safe to null (404 = no match). Never fabricates.
const getPDLSize = async (companyName, pdlKey, location) => {
  if (!companyName || !pdlKey) return null;
  try {
    const clean = companyName.replace(/\s*\(cik\s*\d+\)\s*/gi,'').replace(/,?\s*(Inc|LLC|Corp|Ltd|LLP|Co)\.?$/gi,'').trim();
    const params = new URLSearchParams({ name: clean, min_likelihood: '6' });
    if (location) params.set('location', location);
    const url = `https://api.peopledatalabs.com/v5/company/enrich?${params.toString()}`;
    const r = await fetchT(url, { headers: { 'X-Api-Key': pdlKey, 'Accept': 'application/json' } }, 9000);
    const d = await safeJson(r);
    if (!d || d.status !== 200) return null; // 404 = no confident match → honest unknown
    const emp = (typeof d.employee_count === 'number' && d.employee_count > 0) ? d.employee_count : null;
    let est = emp;
    if (!est && d.size) {
      const bandMap = { '1-10':5,'11-50':30,'51-200':125,'201-500':350,'501-1000':750,'1001-5000':3000,'5001-10000':7500,'10001+':15000 };
      est = bandMap[d.size] || null;
    }
    if (!est) return null;
    console.log(`PDL [${clean}]: emp=${est} size=${d.size||'?'} likelihood=${d.likelihood||'?'}`);
    return { employees: est, band: d.size || null, industry: d.industry || null, likelihood: d.likelihood };
  } catch(e) {
    console.log('PDL lookup failed:', e.message);
    return null;
  }
};

const getEdgarHeadcount = async (companyName) => {
  try {
    const clean = companyName.replace(/\s*\(cik\s*\d+\)\s*/gi,'').replace(/,?\s*(Inc|LLC|Corp|Ltd|LLP|Co)\.?$/gi,'').trim();
    // Search EDGAR company database by name
    const searchUrl = `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(clean)}&CIK=&type=10-K&dateb=&owner=include&count=1&action=getcompany&output=atom`;
    const r = await fetchT(searchUrl, { headers: { 'User-Agent': 'CROJungle research@crojungleteam.com' } }, 7000);
    const xml = await safeText(r);
    // If the company files 10-Ks, it's public — public companies are almost always
    // over our ICP size. We treat "files 10-Ks" as a strong enterprise signal.
    const isPublic = /<title>.*10-K.*<\/title>/i.test(xml) || /company-info/i.test(xml);
    const hasFilings = /<entry>/i.test(xml) && !/No matching/i.test(xml);
    if (hasFilings && isPublic) {
      console.log(`EDGAR [${clean}]: files 10-Ks → public company → enterprise`);
      return { isPublic: true, employees: 501 }; // 501 = "over ICP" marker
    }
    return null;
  } catch(e) {
    return null;
  }
};

const getSizeOnly = async (companyName) => {
  try {
    // Clean company name — remove legal suffixes and punctuation that break Wikipedia search
    const cleanName = companyName
      .replace(/,?\s*(Inc\.?|LLC\.?|Corp\.?|Ltd\.?|L\.P\.?|LLP\.?|Co\.?|dba\s+|The\s+)$/gi, '')
      .replace(/[,\.]+/g, ' ')
      .trim();
    
    // Step 1: Search Wikipedia for the company
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanName + ' company')}&srlimit=3&format=json&origin=*`;
    const searchRes = await fetchT(searchUrl, { headers: { 'User-Agent': 'CROJungle/1.0 (outreach tool)' } }, 8000);
    const searchData = await safeJson(searchRes);
    const pages = searchData?.query?.search || [];
    if (pages.length === 0) {
      console.log(`Wikipedia [${companyName}]: no page found — likely SMB, passes through`);
      return null;
    }

    // Validate the match — Wikipedia title should contain words from the company name
    // Keep distinctive short words (SSM, UF, etc.) — only drop tiny filler words
    const stopWords = new Set(['the','and','for','inc','llc','corp','company','co','of','a']);
    const nameWords = cleanName.toLowerCase().split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
    const matchedPage = pages.find(p => {
      const title = p.title.toLowerCase();
      // Require the FIRST significant word (usually the distinctive brand) to match
      return nameWords.length > 0 && (title.includes(nameWords[0]) || nameWords.some(w => w.length > 4 && title.includes(w)));
    });

    if (!matchedPage) {
      console.log(`Wikipedia [${companyName}]: no confident match (top result: "${pages[0].title}") — passes through`);
      return null;
    }

    // Step 2: Get the page summary which includes key facts
    const pageTitle = encodeURIComponent(matchedPage.title);
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${pageTitle}`;
    const summaryRes = await fetchT(summaryUrl, { headers: { 'User-Agent': 'CROJungle/1.0' } }, 8000);
    const summary = await safeJson(summaryRes);
    const extract = (summary?.extract || '') + ' ' + (summary?.description || '');

    // Step 3: Extract employee count from the extract text
    let employees = null;
    const empPatterns = [
      /([0-9,]+)\s*(?:to|[-–])\s*([0-9,]+)\s*employees/i,
      /([0-9,]+)\+?\s*employees/i,
      /employs?\s+([0-9,]+)/i,
      /workforce\s+of\s+([0-9,]+)/i,
      /([0-9]+(?:\.[0-9]+)?)\s*(?:thousand|million)\s*employees/i,
    ];
    for (const pat of empPatterns) {
      const m = extract.match(pat);
      if (m) {
        if (m[2]) {
          employees = Math.round((parseInt(m[1].replace(/,/g,'')) + parseInt(m[2].replace(/,/g,''))) / 2);
        } else if (/thousand/i.test(m[0])) {
          employees = parseFloat(m[1]) * 1000;
        } else if (/million/i.test(m[0])) {
          employees = parseFloat(m[1]) * 1000000;
        } else {
          employees = parseInt(m[1].replace(/,/g,''));
        }
        if (employees > 0 && employees < 10000000) break;
        employees = null;
      }
    }

    // Step 4: Get website from Clearbit (already works)
    const cbRes = await fetchT(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(companyName)}`,
      { headers: { 'Accept': 'application/json' } }, 5000
    );
    const cbData = await safeJson(cbRes);
    const website = Array.isArray(cbData) && cbData[0]?.domain ? 'https://' + cbData[0].domain : null;

    console.log(`Wikipedia [${companyName}]: emp=${employees||'not in extract'} wiki="${matchedPage.title}" site=${website||'?'}`);
    return { employees, website };
  } catch(e) {
    console.log(`Size lookup failed [${companyName}]:`, e.message);
    return null;
  }
};

// ── COMPANY SIZE LOOKUP ───────────────────────────────────────────────────────
// Google "[company name] number of employees" — same thing you'd search manually.
// Returns { employees, employeeRange, website, icpPass, icpReason }
// ICP: 10–200 employees = PASS. 200–500 = SOFT (flag it). 500+ = BLOCK.
// Extract company website from search results
// Extract headcount from search results — same as Googling "[company] number of employees"
// ICP size gate — under 500 employees = passes, over 1000 = blocked, 500-1000 = borderline
app.get('/api/find-website', async (req, res) => {
  const { company } = req.query;
  if (!company) return res.status(400).json({ error: 'Company name required' });

  // BizBuySell category pages have no real website — don't even try
  if (/^(health care|pet services|service businesses|business opportunities|how to (buy|sell)|building|automotive|education|non-classifiable|restaurants|retail|manufacturing|food|beauty|technology|financial|transportation|construction|agriculture|wholesale|distribution)/i.test(company.trim())) {
    return res.json({ website: '', source: 'category_page', confident: false });
  }

  // Clean the company name — strip legal suffixes
  const cleanName = company
    .replace(/,?\s*(Inc\.?|LLC\.?|Corp\.?|Ltd\.?|L\.P\.?|LLP\.?|Co\.?|Group|Holdings|Company)$/gi, '')
    .replace(/,.*$/, '') // drop everything after first comma
    .trim();

  // Method 1: Clearbit autocomplete — return top 3 candidates
  try {
    const r = await fetchT(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(cleanName)}`,
      { headers: { 'Accept': 'application/json' } },
      5000
    );
    const d = await safeJson(r);
    if (Array.isArray(d) && d.length > 0 && d[0].domain) {
      const resultName = (d[0].name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const searchName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      // Confident if names overlap meaningfully
      const confident = resultName.includes(searchName.slice(0, 5)) || searchName.includes(resultName.slice(0, 5));
      const website = `https://${d[0].domain}`;
      console.log(`Clearbit: ${website} (confident=${confident})`);
      // Return even if not confident — let user verify in modal. Include alternates.
      const alternates = d.slice(0, 3).filter(x => x.domain).map(x => ({ name: x.name, domain: x.domain }));
      return res.json({ website, source: 'clearbit', confident, alternates });
    }
  } catch(e) { console.log('Clearbit failed:', e.message); }

  // Method 2: Domain guess — try multiple common patterns
  try {
    const guessBase = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const guessHyphen = cleanName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
    const candidates = [];
    if (guessBase.length >= 3 && guessBase.length <= 30) {
      candidates.push(`https://${guessBase}.com`);
      candidates.push(`https://www.${guessBase}.com`);
      candidates.push(`https://${guessBase}.io`);
    }
    if (guessHyphen !== guessBase && guessHyphen.length <= 35) {
      candidates.push(`https://${guessHyphen}.com`);
    }
    for (const guessUrl of candidates) {
      const check = await fetchT(guessUrl, { method: 'HEAD' }, 4000).catch(() => null);
      if (check && check.ok) {
        console.log(`Domain guess worked: ${guessUrl}`);
        return res.json({ website: guessUrl, source: 'domain_guess', confident: false });
      }
    }
  } catch(e) { console.log('Domain guess failed:', e.message); }

  // Method 3: WEB SEARCH — the reliable one. Clearbit misses constantly (which is
  // why the "confirm website" modal kept appearing) and domain-guessing only works
  // when the company name happens to equal the domain. A real web search just
  // finds it. Requires the Firecrawl key to be passed.
  const fcKey = req.query.fcKey;
  if (fcKey) {
    try {
      const found = await findWebsiteViaSearch(cleanName, fcKey, req.query.location);
      if (found) {
        return res.json({ website: found, source: 'web_search', confident: true });
      }
    } catch(e) { console.log('Website web-search failed:', e.message); }
  }

  console.log(`No website found for "${company}"`);
  res.json({ website: '', source: 'not_found', confident: false });
});



// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 1: ADZUNA — runs searches IN PARALLEL
// Key fix: parallel not sequential = 3s not 90s
// ═══════════════════════════════════════════════════════════
// ═══ GOOGLE ENRICHMENT — employee count + real website from Google search ════
// Runs after initial ICP filter, before scoring. One search per company.
// Returns { employees: number|null, website: string|null, revenue: string|null }
const searchAdzuna = async (appId, appKey, location) => {
  if (!appId || !appKey) { console.log('Adzuna: no keys'); return []; }
  try {
    // RE-AIMED at AI-REPLACEMENT signals — CROJungle's biggest tickets ($25k-$75k builds).
    // We hunt companies hiring repetitive/manual roles. A company posting MULTIPLE of
    // these is bleeding money on labor that AI/software can replace. The *count* of
    // manual roles is the signal — one CS rep is nothing, three is a bleeding funnel.
    // `cat` groups synonyms so "Customer Service Rep" + "Call Center Rep" = one function.
    // ═══════════════════════════════════════════════════════════════════════
    // ROLE × INDUSTRY — the single biggest quality upgrade available to Find
    // ═══════════════════════════════════════════════════════════════════════
    // THE BUG: we were searching by ROLE alone. Search "Dispatcher" and you get
    // dispatchers at hospitals, staffing agencies, universities, and 911 call
    // centers. That is why UF Health, Kaiser, and Cross Country Nurses kept
    // appearing — we were generating our own noise and then paying the ICP filter
    // to throw it away.
    //
    // THE FIX: Adzuna supports a `category` filter. Search "Dispatcher" WITHIN
    // logistics-warehouse and you get TRUCKING COMPANIES hiring dispatchers —
    // which is literally J&M Tank Lines. Search "Estimator" within
    // trade-construction and you get AA Asphalting.
    //
    // Every result also carries its category tag, so we know the lead's industry.
    // That feeds industry-matched proof points in the pitch, and the peer engine.
    //
    // TIER 1: perfect role×industry fits — these ARE the ICP, not a proxy for it.
    // TIER 2: broad role sweeps to catch everything else, with anti-ICP categories
    //         stripped out of the RESULTS (so we never waste the ICP filter on them).
    // ═══════════════════════════════════════════════════════════════════════
    // THE SEARCH MATRIX — built from the CEO's four ICPs, not from industry guesses
    // ═══════════════════════════════════════════════════════════════════════
    // THE MISTAKE I MADE: I narrowed this to trucking and contractors. But NONE of
    // the CEO's four ICPs mention an industry. Every one is a BUSINESS CONDITION:
    //
    //   ICP #1  $5M-$500M · pre-2021 website · no AI · poor digital presence
    //   ICP #2  <$100M · grew fast then stagnated · HIGH HEADCOUNT-TO-REVENUE
    //   ICP #3  >$50M · adding marketing staff or attacking a new market
    //   ICP #4  $1.5M-$50M · HIRING A MARKETING PERSON · poor digital · stagnant
    //
    // Two of those four are about MARKETING HIRES — and we were not searching for
    // marketing roles AT ALL. We were blind to the retainer ICP, which is
    // CROJungle's core product. That is the single biggest miss in this system.
    //
    // THE TWO BUYING WINDOWS WE INTERCEPT:
    //
    //  A) OPS ROLE POSTED  → "we will pay a human $55k/yr to do repetitive work"
    //                        → they have budget, a problem, and no software.  (ICP #2 → build)
    //  B) MARKETING ROLE POSTED → "we will pay a human $70k/yr to do marketing"
    //                        → they have DECIDED to spend on marketing, but not HOW.
    //                        → CROJ offers an entire senior team for the same money. (ICP #3/#4 → retainer)
    //
    // Research (McKinsey/HBR) names the digital laggards: healthcare, hospitality,
    // construction, agriculture, and legal ("all 100 top law firms are digital
    // laggards; only 3% show any website personalization").
    //
    // AND THE ERROR I HAVE TO UNDO: I blocked healthcare entirely because HOSPITALS
    // kept appearing. That killed dental practices, vet clinics, med spas, chiro,
    // physical therapy, home health — all owner-operated, 10-50 people, drowning in
    // scheduling and billing. PERFECT ICP. The SIZE GATE blocks hospitals. Block by
    // SIZE, not by industry.
    const searches = [
      // ══════════════════════════════════════════════════════════════════════
      // LANE A — THE SOFTWARE ICP (ICP #2): ops roles × labor-intensive industries
      // A company paying humans to do repetitive work has a $25k-$75k build problem.
      // ══════════════════════════════════════════════════════════════════════

      // Trucking / freight / distribution — coordination chaos (J&M Tank Lines)
      { title: 'Dispatcher',                      cat: 'dispatch',         industry: 'logistics-warehouse-jobs', lane: 'software' },
      { title: 'Logistics Coordinator',           cat: 'ops_coordination', industry: 'logistics-warehouse-jobs', lane: 'software' },
      { title: 'Data Entry Clerk',                cat: 'data_entry',       industry: 'logistics-warehouse-jobs', lane: 'software' },

      // Contractors / trades / home services — the owner quotes jobs at 9pm (AA Asphalting)
      { title: 'Estimator',                       cat: 'quoting',          industry: 'trade-construction-jobs',  lane: 'software' },
      { title: 'Office Manager',                  cat: 'admin',            industry: 'trade-construction-jobs',  lane: 'software' },
      { title: 'Scheduling Coordinator',          cat: 'scheduling',       industry: 'trade-construction-jobs',  lane: 'software' },

      // HVAC / plumbing / electrical / facilities — scheduling IS the business.
      // This is the ServiceTitan segment: high ticket, heavy ad spend, owner-run.
      { title: 'Dispatcher',                      cat: 'dispatch',         industry: 'maintenance-jobs',         lane: 'software' },
      { title: 'Scheduler',                       cat: 'scheduling',       industry: 'maintenance-jobs',         lane: 'software' },

      // ── HEALTHCARE PRACTICES — the segment I wrongly blocked ──────────────
      // Dental, veterinary, med spa, chiro, PT, home health. Owner = the doctor.
      // 10-50 people. Buried in scheduling, intake, insurance, billing. Huge LTV
      // per patient, so marketing ROI is enormous. The size gate blocks hospitals.
      { title: 'Scheduler',                       cat: 'scheduling',       industry: 'healthcare-nursing-jobs',  lane: 'software' },
      { title: 'Medical Billing Specialist',      cat: 'bookkeeping',      industry: 'healthcare-nursing-jobs',  lane: 'software' },
      { title: 'Patient Coordinator',             cat: 'scheduling',       industry: 'healthcare-nursing-jobs',  lane: 'software' },

      // Small manufacturers — order entry and inside sales are pure manual work
      { title: 'Order Entry Clerk',               cat: 'data_entry',       industry: 'manufacturing-jobs',       lane: 'software' },
      { title: 'Inside Sales Representative',     cat: 'inside_sales',     industry: 'manufacturing-jobs',       lane: 'software' },

      // Hospitality — confirmed digital laggard: only 7% have integrated systems,
      // 80% have no digital budget. Restaurant groups, hotels, event venues.
      { title: 'Reservations Coordinator',        cat: 'scheduling',       industry: 'hospitality-catering-jobs', lane: 'software' },
      { title: 'Booking Coordinator',             cat: 'scheduling',       industry: 'hospitality-catering-jobs', lane: 'software' },

      // Property management / real estate — manual everything
      { title: 'Leasing Coordinator',             cat: 'scheduling',       industry: 'property-jobs',            lane: 'software' },
      { title: 'Property Administrator',          cat: 'admin',            industry: 'property-jobs',            lane: 'software' },

      // Insurance agencies / accounting firms — manual quoting and data entry,
      // recurring revenue, owner-operated
      { title: 'Insurance Account Manager',       cat: 'data_entry',       industry: 'accounting-finance-jobs',  lane: 'software' },
      { title: 'Bookkeeper',                      cat: 'bookkeeping',      industry: 'accounting-finance-jobs',  lane: 'software' },

      // Law firms — confirmed digital laggards. Intake is 100% automatable, and
      // PI firms spend enormously on ads (which makes them a retainer lead too).
      { title: 'Legal Assistant',                 cat: 'admin',            industry: 'legal-jobs',               lane: 'software' },
      { title: 'Intake Coordinator',              cat: 'scheduling',       industry: 'legal-jobs',               lane: 'software' },

      // ══════════════════════════════════════════════════════════════════════
      // LANE B — THE RETAINER ICP (ICP #3 & #4): THE MARKETING HIRE
      // ══════════════════════════════════════════════════════════════════════
      // We were completely blind to this, and it is CROJungle's CORE PRODUCT.
      //
      // A company posting a "Marketing Coordinator" job has ALREADY DECIDED to
      // spend ~$70k/year on marketing. They have the budget. They have the intent.
      // They just have not decided HOW to spend it. CROJ offers an entire senior
      // team — strategy, ads, creative, tech — for the price of that one junior hire.
      //
      // CRITICAL: we want companies BUILDING a marketing function from scratch —
      // not ones that already have one. A "Marketing Coordinator" posting means no
      // marketing leader exists yet. A "CMO" posting means they just installed the
      // exact layer we exist to bypass (and we penalize that elsewhere).
      { title: 'Marketing Coordinator',           cat: 'marketing_hire',   industry: 'pr-advertising-marketing-jobs', lane: 'retainer' },
      { title: 'Marketing Manager',               cat: 'marketing_hire',   industry: 'pr-advertising-marketing-jobs', lane: 'retainer' },
      { title: 'Digital Marketing Specialist',    cat: 'marketing_hire',   industry: 'pr-advertising-marketing-jobs', lane: 'retainer' },
      { title: 'Marketing Specialist',            cat: 'marketing_hire',   industry: 'pr-advertising-marketing-jobs', lane: 'retainer' },
      { title: 'Social Media Manager',            cat: 'marketing_hire',   industry: 'pr-advertising-marketing-jobs', lane: 'retainer' },

      // ══════════════════════════════════════════════════════════════════════
      // LANE D — THE SIGNALS I WAS COMPLETELY MISSING
      // ══════════════════════════════════════════════════════════════════════

      // ── "GROW REVENUE WITH HEADCOUNT" — the retainer pitch, from the other side
      // A company hiring 3 BDRs is trying to buy revenue with humans. That's ~$180k/yr
      // for three people cold-calling. CROJ generates the same pipeline with marketing,
      // for less, and it compounds instead of quitting.
      { title: 'Business Development Representative', cat: 'revenue_hire', lane: 'retainer' },
      { title: 'Sales Development Representative',    cat: 'revenue_hire', lane: 'retainer' },
      { title: 'Appointment Setter',                  cat: 'revenue_hire', lane: 'retainer' },

      // ── THE OWNER IS DROWNING — Mike's core insight, as a job posting ──────
      // "Executive Assistant to the Owner/CEO" at a small company means ONE thing:
      // the owner is personally buried and is trying to buy his way out with a human.
      // That IS the firefighting cycle, posted publicly, with a salary attached.
      { title: 'Executive Assistant to CEO',      cat: 'owner_drowning',   lane: 'software' },
      { title: 'Executive Assistant',             cat: 'owner_drowning',   lane: 'software' },
      { title: 'Chief of Staff',                  cat: 'owner_drowning',   lane: 'software' },

      // ── THEY KNOW OPS IS BROKEN ───────────────────────────────────────────
      // Hiring an Operations Manager means they've DIAGNOSED the problem themselves.
      // They just think the answer is a person. It's a system.
      { title: 'Operations Manager',              cat: 'ops_broken',       lane: 'software' },
      { title: 'Director of Operations',          cat: 'ops_broken',       lane: 'software' },
      { title: 'Process Improvement Manager',     cat: 'ops_broken',       lane: 'software' },

      // ── ABOUT TO REBUILD THEIR SITE (ICP #1) ──────────────────────────────
      // Hiring a web person = they KNOW the site is broken and are about to spend
      // money on it. We can do it better, faster, and tie it to revenue.
      { title: 'Web Developer',                   cat: 'website_rebuild',  lane: 'retainer' },
      { title: 'Webmaster',                       cat: 'website_rebuild',  lane: 'retainer' },
      { title: 'Ecommerce Manager',               cat: 'website_rebuild',  lane: 'retainer' },

      // ══════════════════════════════════════════════════════════════════════
      // LANE C — BROAD SWEEPS (catch everything else; anti-ICP stripped from results)
      // ══════════════════════════════════════════════════════════════════════
      { title: 'Customer Service Representative', cat: 'customer_service', lane: 'software' },
      { title: 'Call Center Representative',      cat: 'customer_service', lane: 'software' },
      { title: 'Appointment Setter',              cat: 'scheduling',       lane: 'software' },
      { title: 'Accounts Payable Clerk',          cat: 'bookkeeping',      lane: 'software' },
      { title: 'Operations Coordinator',          cat: 'ops_coordination', lane: 'software' },
      { title: 'Administrative Assistant',        cat: 'admin',            lane: 'software' },
    ];

    // Categories that are STRUCTURALLY not our ICP — no owner reads their own email.
    //
    // NOTE what is NO LONGER blocked: healthcare (dental/vet/med-spa practices are
    // perfect ICP — the SIZE GATE blocks the hospitals), legal (law firms are the
    // most confirmed digital laggards in the research), hospitality, retail,
    // property, accounting. Blocking a whole industry to avoid its enterprises was
    // throwing out an enormous amount of our actual ICP.
    const ANTI_ICP_CATEGORIES = new Set([
      'teaching-jobs',             // schools = government budgets, procurement
      'social-work-jobs',          // nonprofits
      'charity-voluntary-jobs',    // nonprofits
      'graduate-jobs',             // noise, not a company signal
      'it-jobs',                   // tech companies build in-house; they are not buyers
      'scientific-qa-jobs',        // labs and pharma = enterprise procurement
    ]);

    // Stagger calls slightly to avoid 429 rate limits
    const raw = [];
    for (const { title, cat, industry, lane } of searches) {
      await new Promise(r => setTimeout(r, 150)); // 150ms between calls
      raw.push(await (async () => {
        // GEOGRAPHY: a services business closes far better where it has network,
        // references, and can physically show up. Optional — blank = nationwide.
        const whereParam = location ? `&where=${encodeURIComponent(location)}&distance=50` : '';
        // INDUSTRY FILTER — this is what turns "dispatchers anywhere" into
        // "TRUCKING COMPANIES hiring dispatchers". Biggest quality lever in Find.
        const catParam = industry ? `&category=${encodeURIComponent(industry)}` : '';
        // 50 is Adzuna's max per page — 43% more volume for the same call count.
        const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=50&what=${encodeURIComponent(title)}${catParam}${whereParam}&sort_by=date&max_days_old=30`;
        const r = await fetchT(url, { headers: { 'Accept': 'application/json' } }, 8000);
        if (!r.ok) { console.log(`Adzuna "${title}" ${r.status}`); return []; }
        const d = await safeJson(r);
        if (d.exception) { console.log(`Adzuna "${title}" exception:`, d.exception); return []; }
        const jobs = d.results || [];
        console.log(`Adzuna "${title}": ${jobs.length}`);
        return jobs.map(job => {
          if (!job.company?.display_name) return null;
          // ═══ ANTI-ICP CATEGORY REJECTION — at the SOURCE ═══════════════
          // A hospital, school, government office, or tech company is not an
          // owner-operated business. Drop them here rather than pulling them
          // into the pipeline and paying the ICP filter to remove them later.
          const jobCat = job.category?.tag || '';
          if (ANTI_ICP_CATEGORIES.has(jobCat)) return null;
          // ═══ THE POSTING DATE IS THE MOST IMPORTANT FIELD HERE ═══════════
          // Research (Gartner, 2026 signal benchmarks): 99% of B2B purchases are
          // triggered by an organizational change, and every signal DECAYS.
          // "Intent data from three weeks ago is nearly worthless."
          //
          // A job posted TODAY = they have identified the problem, allocated the
          // budget ($50-60k salary), started a process — and have NOT YET HIRED.
          // That is a LIVE buying window we can intercept.
          // A job posted 30 days ago = they probably already hired. Window closed.
          //
          // We were capturing none of this. Every posting was scored identically.
          const created = job.created ? new Date(job.created) : null;
          const ageDays = created && !isNaN(created)
            ? Math.floor((Date.now() - created.getTime()) / 86400000)
            : null;
          return {
            company: job.company.display_name,
            cat,
            roleTitle: title,
            location: job.location?.display_name || '',
            salaryNum: job.salary_min || 0,
            jobUrl: job.redirect_url || '',
            description: (job.description || '').slice(0, 700),
            postedAt: job.created || null,
            ageDays,
            // The industry — feeds industry-matched proof points in the pitch,
            // and tells us whether this was a TIER-1 perfect fit or a broad sweep.
            industryTag: jobCat,
            industryLabel: job.category?.label || '',
            perfectFit: !!industry,   // came from a targeted role×industry search
            // WHICH BUYING WINDOW is this? They are completely different pitches:
            //   software = "you're about to pay a human $55k to do repetitive work"
            //   retainer = "you're about to pay one junior $70k; we give you a senior team"
            lane: lane || 'software',
          };
        }).filter(Boolean);
      })());
    }
      
    // AGGREGATE by company — role count IS the signal
    const postings = raw.flatMap(r => Array.isArray(r) ? r : []); 
    const byCompany = new Map();
    for (const p of postings) {
      const key = p.company.toLowerCase().trim();
      if (!key) continue;
      if (!byCompany.has(key)) {
        byCompany.set(key, {
          name: p.company.trim(), location: p.location, cats: new Set(), roles: [],
          count: 0, maxSalary: 0, jobUrl: p.jobUrl, descriptions: [],
          freshestAgeDays: null,   // how recently did they post? THE key urgency signal
          postedDates: [],
          industryTag: p.industryTag || '',
          industryLabel: p.industryLabel || '',
          perfectFit: false,       // did they come from a targeted role×industry search?
          lanes: new Set(),        // 'software' | 'retainer' — a company can be BOTH
        });
      }
      const c = byCompany.get(key);
      if (!c.jobUrl && p.jobUrl) c.jobUrl = p.jobUrl;
      if (p.description) c.descriptions.push(p.description);
      c.cats.add(p.cat);
      if (!c.roles.includes(p.roleTitle)) c.roles.push(p.roleTitle);
      c.count += 1;
      if (p.salaryNum > c.maxSalary) c.maxSalary = p.salaryNum;
      if (!c.location && p.location) c.location = p.location;
      // A company found via a TIER-1 role×industry search is a perfect ICP fit —
      // a trucking company hiring dispatchers, a contractor hiring estimators.
      if (p.perfectFit) c.perfectFit = true;
      if (p.lane) c.lanes.add(p.lane);
      if (!c.industryTag && p.industryTag) { c.industryTag = p.industryTag; c.industryLabel = p.industryLabel; }
      // Track the FRESHEST posting — that's the one whose window is still open
      if (p.ageDays != null) {
        c.postedDates.push(p.ageDays);
        if (c.freshestAgeDays === null || p.ageDays < c.freshestAgeDays) {
          c.freshestAgeDays = p.ageDays;
        }
      }
    }

    const results = [...byCompany.values()].map(c => {
      const catN = c.cats.size;
      const multi = catN >= 2 || c.count >= 3;   // 2+ functions OR 3+ postings
      const heavy = catN >= 3 || c.count >= 5;   // 3+ functions OR 5+ postings
      const roleList = c.roles.slice(0, 4).join(', ');
      // ═══ FOUNDER-LED LANGUAGE MINING — the job DESCRIPTION is free intent data ═══
      // A posting that says "family-owned", "report to the owner", or "wear many hats"
      // is written by (or for) a hands-on owner. That is a direct founder-reachability
      // signal we already fetched and were throwing away. High-precision phrases only.
      const descBlob = (c.descriptions || []).join(' \u2014 ').toLowerCase();
      const founderPhrases = [
        /family[- ](owned|run|business)/, /\bowner[- ]operated\b/, /\bowned and operated\b/,
        /report(ing)? (directly )?to the (owner|founder|president|ceo)/,
        /work(ing)? (directly|closely) with the (owner|founder|president)/,
        /\bwear (many|multiple) hats\b/, /\bsmall (but growing|family|close-knit|tight-knit) (team|business|company)\b/,
        /\b(the|our) (owner|founder) (is|will|personally)/, /\bfounder[- ]led\b/, /\bentrepreneurial environment\b/,
      ];
      const founderHits = founderPhrases.filter(re => re.test(descBlob));
      const founderLedPosting = founderHits.length > 0;
      return {
        name: c.name,
        website: '',
        location: c.location,
        founderLedPosting,
        founderLedEvidence: founderLedPosting ? (descBlob.match(founderPhrases.find(re => re.test(descBlob)))||[])[0] : '',
        jobTitle: (() => {
          const isRetainer = c.lanes.has('retainer');
          const isBoth = isRetainer && c.lanes.has('software');
          if (isBoth) {
            return `Hiring ${roleList} — manual ops roles AND a marketing hire. They need the build AND the retainer.`;
          }
          if (isRetainer) {
            // ICP #3/#4: they've decided to spend on marketing, not decided how.
            return `Hiring ${roleList} — building a marketing function from scratch. Budget allocated, direction not chosen.`;
          }
          return heavy
            ? `Hiring ${c.count} manual roles across ${catN} functions (${roleList}) — heavy AI-replaceable labor spend`
            : multi
            ? `Hiring ${c.count} manual roles (${roleList}) — AI-replaceable labor`
            : `Hiring ${roleList} — manual role, AI-replaceable`;
        })(),
        source: 'adzuna_ai',
        icpProfile: 'ai_ops',
        manualRoleCount: c.count,
        manualCategories: catN,
        jobUrl: c.jobUrl || '',
        // ═══ THE BUYING WINDOW ═══════════════════════════════════════════
        // This is the single most actionable field in the entire system.
        industry: c.industryLabel || '',
        industryTag: c.industryTag || '',
        perfectFit: c.perfectFit,
        // WHICH PRODUCT does this lead need? Drives the whole pitch.
        lanes: [...c.lanes],
        buyingLane:
          c.lanes.has('retainer') && c.lanes.has('software') ? 'both' :
          c.lanes.has('retainer') ? 'retainer' : 'software',
        signalAgeDays: c.freshestAgeDays,
        signalFreshness:
          c.freshestAgeDays == null ? 'unknown' :
          c.freshestAgeDays <= 3  ? 'burning'  :  // posted days ago — they have NOT hired yet
          c.freshestAgeDays <= 7  ? 'hot'      :  // still actively interviewing
          c.freshestAgeDays <= 14 ? 'warm'     :  // may have candidates
          c.freshestAgeDays <= 21 ? 'cooling'  :  // probably close to an offer
                                    'stale',      // almost certainly hired — window closed
        signals: {
          ai_replacement_signal: true,
          ai_replacement_multi: multi,
          ai_replacement_heavy: heavy,
          salary_high: c.maxSalary >= 90000,
          salary_mid: c.maxSalary >= 60000 && c.maxSalary < 90000,
          // A posting under a week old means the role is UNFILLED — we can still
          // intercept the decision. This is the whole point of signal-based selling.
          window_open: c.freshestAgeDays != null && c.freshestAgeDays <= 7,

          // ═══ THE OWNER IS DROWNING — Mike's insight, posted publicly ══════
          // "Executive Assistant to the Owner" at a small company means the owner
          // is personally buried and is trying to buy his way out with a human.
          owner_drowning: c.cats.has('owner_drowning'),

          // ═══ THEY'VE DIAGNOSED IT THEMSELVES ═════════════════════════════
          // Hiring an Operations Manager = they KNOW ops is broken. They just
          // think the answer is a person. It's a system.
          ops_broken: c.cats.has('ops_broken'),

          // ═══ BUYING REVENUE WITH HEADCOUNT ═══════════════════════════════
          // Hiring BDRs/SDRs = trying to buy pipeline with humans. Marketing does
          // it cheaper and it compounds instead of quitting.
          buying_revenue_with_humans: c.cats.has('revenue_hire'),

          // ═══ ABOUT TO REBUILD THEIR SITE (ICP #1) ════════════════════════
          website_rebuild_intent: c.cats.has('website_rebuild'),
          // Found via a targeted role×industry search — this is a TRUCKING company
          // hiring dispatchers, not a hospital hiring one. Exact ICP, not a proxy.
          perfect_icp_fit: c.perfectFit,

          // ═══ THE RETAINER BUYING WINDOW (ICP #3 & #4) ═════════════════════
          // They are hiring a marketing person. They have ALREADY decided to spend
          // ~$70k/yr on marketing — they just have not decided HOW. CROJ offers a
          // full senior team for the price of that one junior hire. This is the
          // core product, and we were completely blind to it until now.
          hiring_marketing: c.lanes.has('retainer'),

          // ═══ THE PERFECT STORM ═══════════════════════════════════════════
          // Hiring manual ops roles AND a marketing person at the same time.
          // They need the build AND the retainer. They are bleeding money on two
          // fronts simultaneously and have budget allocated for both.
          needs_both_products: c.lanes.has('retainer') && c.lanes.has('software'),
        },
      };
    });

    const multiN    = results.filter(r => r.signals.ai_replacement_multi).length;
    const openN     = results.filter(r => r.signals.window_open).length;
    const perfectN  = results.filter(r => r.perfectFit).length;
    const retainerN = results.filter(r => r.signals.hiring_marketing).length;
    const bothN     = results.filter(r => r.signals.needs_both_products).length;
    const byIndustry = {};
    for (const r of results) if (r.industry) byIndustry[r.industry] = (byIndustry[r.industry] || 0) + 1;

    console.log(`Adzuna: ${results.length} companies`);
    console.log(`  SOFTWARE lane: ${multiN} hiring multiple manual roles`);
    console.log(`  RETAINER lane: ${retainerN} hiring a marketing person (budget allocated, direction not chosen)`);
    console.log(`  ⚡ PERFECT STORM: ${bothN} hiring BOTH ops roles AND marketing — need the build AND the retainer`);
    console.log(`  ${perfectN} exact ICP fit (role×industry) | ${openN} with an OPEN buying window (<7d)`);
    if (Object.keys(byIndustry).length) console.log('  Industries:', JSON.stringify(byIndustry));
    return results;
  } catch(e) { console.error('Adzuna error:', e.message); return []; }
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 2: SEC EDGAR — real-time funding, no key needed
// ═══════════════════════════════════════════════════════════
// EMAIL INFRASTRUCTURE CHECK — SPF/DMARC via Google DNS API. Free, factual.
// No DMARC = they've never set up serious email marketing/deliverability.
// CONTENT FRESHNESS — sitemap.xml lastmod dates. "Last update 14 months ago" is provable.
// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE: THEIRSTACK — the size problem solved AT THE QUERY.
// Unlike Adzuna, TheirStack filters by company size BEFORE returning results.
// We ask for ONLY 10-200 employee companies hiring our target roles, so whales
// (US Foods, Goodyear, Morgan Stanley) are never returned — no downstream
// filtering, no whack-a-mole. COST: 1 API credit per job returned, so we cap
// tight. Free tier = 200 credits/mo; keep TS_LIMIT small until on a paid plan.
// Fails safe to [] if no key or the call errors. Never fabricates.
// ═══════════════════════════════════════════════════════════
const TS_LIMIT = 25; // credits per run = TS_LIMIT (1 credit/job). Raise on paid plan.
// Track last TheirStack run in memory (persists across requests, resets on deploy).
// 24h gate: costs 25 credits/run, free tier = 200/mo. Once/day = ~200/mo, stays free.
let _tsLastRun = 0;
const TS_GATE_MS = 23 * 60 * 60 * 1000; // 23h so it doesn't drift

const searchTheirStack = async (theirstackKey) => {
  if (!theirstackKey) return [];
  const now = Date.now();
  if (_tsLastRun && (now - _tsLastRun) < TS_GATE_MS) {
    const hoursLeft = ((TS_GATE_MS - (now - _tsLastRun)) / 3.6e6).toFixed(1);
    console.log(`TheirStack: skipped (credit gate — ${hoursLeft}h until next run)`);
    return [];
  }
  _tsLastRun = now;
  try {
    const body = {
      page: 0,
      limit: TS_LIMIT,
      posted_at_max_age_days: 14,                 // required-ish: fresh postings only
      job_country_code_or: ['US'],
      min_employee_count: 10,                      // THE FIX — size filtered at source
      max_employee_count: 200,
      order_by: [{ field: 'date_posted', desc: true }],
      // Target the same AI-replaceable / marketing roles the rest of Find hunts
      job_title_or: [
        'Dispatcher', 'Scheduler', 'Scheduling Coordinator', 'Data Entry',
        'Office Manager', 'Operations Coordinator', 'Administrative Assistant',
        'Customer Service Representative', 'Appointment Setter', 'Bookkeeper',
        'Marketing Coordinator', 'Marketing Manager', 'Social Media Manager',
      ],
    };
    const r = await fetchT('https://api.theirstack.com/v1/jobs/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${theirstackKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    }, 15000);

    const d = await safeJson(r);
    if (!r.ok) {
      console.log(`TheirStack: HTTP ${r.status} — ${JSON.stringify(d).slice(0,160)}`);
      return [];
    }
    const jobs = Array.isArray(d?.data) ? d.data : [];
    if (jobs.length === 0) { console.log('TheirStack: 0 jobs returned'); return []; }

    // Group jobs by company so multiple roles at one company become one lead
    // with a role count (the volume signal our scorer rewards).
    const byCompany = new Map();
    for (const j of jobs) {
      const name = (j.company || '').trim();
      if (!name || name.length < 2) continue;
      const emp = j.company_object?.num_employees || j.num_employees || null;
      if (!byCompany.has(name)) {
        byCompany.set(name, {
          name,
          website: j.company_object?.url || j.final_url || '',
          location: j.short_location || j.location || '',
          verifiedEmployees: (typeof emp === 'number' && emp > 0) ? emp : null,
          roles: new Set(),
          industry: j.company_object?.industry || '',
        });
      }
      const c = byCompany.get(name);
      if (j.job_title) c.roles.add(j.job_title);
    }

    const out = [...byCompany.values()].map(c => {
      const roleCount = c.roles.size;
      return {
        name: c.name,
        website: c.website,
        location: c.location,
        // TheirStack gives us verified size for FREE in the same call — huge.
        verifiedEmployees: c.verifiedEmployees,
        industry: c.industry,
        manualRoleCount: roleCount,
        manualCategories: Math.min(roleCount, 3),
        source: 'theirstack',
        perfectFit: true,                          // size-verified in range by construction
        signalFreshness: 'hot',
        signalAgeDays: 7,
        signals: {
          ai_replacement_signal: true,
          ai_replacement_multi: roleCount >= 2,
          ai_replacement_heavy: roleCount >= 3,
        },
        jobTitle: `Hiring ${roleCount} manual role${roleCount === 1 ? '' : 's'} at a ${c.verifiedEmployees ? '~' + c.verifiedEmployees + '-person' : 'verified small'} company (size-filtered at source)`,
      };
    });
    console.log(`TheirStack: ${out.length} size-verified SMBs from ${jobs.length} jobs (${TS_LIMIT} credits)`);
    return out;
  } catch (e) {
    console.log('TheirStack failed:', e.message);
    return [];
  }
};

// ═══ GOOGLE PLACES (New) — LOCAL OWNER-OPERATED BUSINESSES ═══════════════════
// The reachability goldmine: local trades/services where the OWNER runs the shop,
// answers their own phone, and reads their own email. Places gives NO employee
// count, so these are size-unverified — Research confirms the owner & email.
// FREE-TIER SAFE: Text Search (New) = 5,000 free calls/month. We shuffle the
// category×city grid and cap per run (GP_QUERY_CAP, default 40) so a run costs
// ~40 calls — ~100+ runs/month stay free. Request format verified against
// Google's official Text Search (New) docs.
const GP_CATEGORIES = [
  // ── HIGH-TICKET CREW TRADES — a single job is $5k-$15k+, so any ESTABLISHED
  //    one is already crewed and past the ~$800k affordability bar. Best fit. ──
  { q: 'HVAC contractor', label: 'HVAC' }, { q: 'roofing company', label: 'Roofing' },
  { q: 'water damage restoration company', label: 'Restoration' },
  { q: 'foundation repair company', label: 'Foundation' },
  { q: 'solar installation company', label: 'Solar' },
  { q: 'kitchen remodeling company', label: 'Kitchen Remodel' },
  { q: 'bathroom remodeling company', label: 'Bath Remodel' },
  { q: 'window and door replacement company', label: 'Windows & Doors' },
  { q: 'paving contractor', label: 'Paving' }, { q: 'concrete contractor', label: 'Concrete' },
  { q: 'pool construction company', label: 'Pool Construction' },
  { q: 'custom home builder', label: 'Home Builder' },
  { q: 'general contractor', label: 'Construction' },
  { q: 'fire protection sprinkler company', label: 'Fire Protection' },
  { q: 'excavation and grading contractor', label: 'Excavation' },
  { q: 'masonry contractor', label: 'Masonry' },
  { q: 'hardscaping and landscape design company', label: 'Hardscaping' },
  { q: 'commercial landscaping company', label: 'Landscaping' },
  { q: 'tree service company', label: 'Tree Service' },
  { q: 'insulation and spray foam company', label: 'Insulation' },
  { q: 'electrical contractor', label: 'Electrical' },
  { q: 'plumbing company', label: 'Plumbing' },
  { q: 'flooring company', label: 'Flooring' },
  { q: 'garage door company', label: 'Garage Doors' },
  { q: 'deck and patio builder', label: 'Decks' },
  { q: 'sign and signage company', label: 'Signage' },
  { q: 'well drilling and septic company', label: 'Well & Septic' },
  // ── RECURRING-REVENUE SERVICES — predictable cash flow, marketing-driven ──
  { q: 'pest control company', label: 'Pest Control' },
  { q: 'lawn care and treatment company', label: 'Lawn Care' },
  // ── HIGH-REVENUE PRACTICES — marketing-hungry, owner-operated. NOTE: dental /
  //    dermatology / vet are being PE/DSO-consolidated, so Research must confirm
  //    the owner is still the buyer (not a group). Kept because the winners here
  //    are exactly our ICP. ──
  { q: 'med spa', label: 'Med Spa' },
  { q: 'plastic surgery practice', label: 'Plastic Surgery' },
  { q: 'dermatology practice', label: 'Dermatology', ownerRisk: true },
  { q: 'orthodontist office', label: 'Orthodontics', ownerRisk: true },
  { q: 'oral surgery practice', label: 'Oral Surgery', ownerRisk: true },
  { q: 'cosmetic dentistry practice', label: 'Cosmetic Dentistry', ownerRisk: true },
  { q: 'fertility clinic', label: 'Fertility', ownerRisk: true },
  { q: 'LASIK eye center', label: 'LASIK', ownerRisk: true },
  { q: 'chiropractic clinic', label: 'Chiropractic' },
  { q: 'physical therapy clinic', label: 'Physical Therapy' },
  { q: 'veterinary hospital', label: 'Veterinary', ownerRisk: true },
  { q: 'dental practice', label: 'Dental', ownerRisk: true },
  // ── PROFESSIONAL SERVICES — high revenue, owner-operated, spend heavily on
  //    marketing, low consolidation. Excellent fit and net-new coverage. ──
  { q: 'personal injury law firm', label: 'PI Law' },
  { q: 'estate planning law firm', label: 'Estate Law' },
  { q: 'accounting and CPA firm', label: 'Accounting' },
  { q: 'independent insurance agency', label: 'Insurance' },
  { q: 'assisted living facility', label: 'Senior Care' },
  // Dropped vs. prior list: fencing, painting, commercial cleaning, moving,
  // auto repair — low ticket, most stay solo/sub-$800k. The review-count revenue
  // proxy would bury them anyway; not worth spending queries on them.
];
const GP_CITIES = [
  'Phoenix AZ','Dallas TX','Charlotte NC','Tampa FL','Denver CO','Nashville TN','Columbus OH','Austin TX',
  'Kansas City MO','Indianapolis IN','Jacksonville FL','San Antonio TX','Raleigh NC','Salt Lake City UT',
  'Oklahoma City OK','Louisville KY','Cincinnati OH','Richmond VA','Boise ID','Greenville SC',
];
// National franchises / DSOs / chains — the local operator does NOT own the marketing,
// so they are not our ICP no matter how reachable the branch is.
const GP_FRANCHISE = /\b(roto-?rooter|mr\.? rooter|benjamin franklin|one hour|aire ?serv|mister sparky|mr\.? electric|mr\.? handyman|molly maid|merry maids|servpro|servicemaster|the grounds guys|lawn doctor|trugreen|terminix|orkin|aptive|precision (garage|door)|gerber collision|christian brothers|meineke|midas|jiffy lube|valvoline|aspen dental|western dental|heartland dental|pacific dental|great clips|ace hardware|true value|budget blinds|two men and a truck|1-?800-?got-?junk|junk king|college hunks|anytime fitness|planet fitness|jan-?pro|stanley steemer|coit|paul davis|belfor|rainbow|chemdry|chem-?dry)\b/i;
const searchGooglePlaces = async (placesKey) => {
  if (!placesKey) { console.log('Google Places: no key (set GOOGLE_PLACES_KEY)'); return []; }
  const FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.internationalPhoneNumber';
  const MIN_REVIEWS = parseInt(process.env.GP_MIN_REVIEWS || '15', 10); // established-business proxy (~$500k+)
  const RUN_CAP = parseInt(process.env.GP_QUERY_CAP || '100', 10);
  const grid = [];
  for (const cat of GP_CATEGORIES) for (const city of GP_CITIES) grid.push({ cat, city });
  grid.sort(() => Math.random() - 0.5);                          // rotate coverage each run
  const out = [], seen = new Set();
  let calls = 0, skippedFranchise = 0;
  for (const { cat, city } of grid.slice(0, RUN_CAP)) {
    try {
      const r = await fetchT('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': placesKey, 'X-Goog-FieldMask': FIELD_MASK },
        body: JSON.stringify({ textQuery: `${cat.q} in ${city}`, includePureServiceAreaBusinesses: true }),
      }, 12000);
      calls++;
      const d = await r.json();
      if (d.error) { console.log(`Google Places: "${d.error.message || d.error.status || 'error'}"`); if (/API key|denied|disabled|billing|PERMISSION/i.test(JSON.stringify(d.error))) break; continue; }
      for (const p of (d.places || [])) {
        const name = (p.displayName?.text || '').trim();
        const website = p.websiteUri || '';
        const reviews = p.userRatingCount || 0;
        const rating = p.rating || null;
        if (!name || !website) continue;                          // must have a site to Research
        if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') continue;
        if (reviews < MIN_REVIEWS) continue;                      // established business only
        if (GP_FRANCHISE.test(name)) { skippedFranchise++; continue; } // franchise ≠ owner-reachable
        const domainKey = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
        if (seen.has(domainKey)) continue; seen.add(domainKey);
        // A LOW review count at an established local business = they are NOT actively
        // managing their online presence = a marketing gap we can open the pitch on.
        const marketingGap = reviews >= MIN_REVIEWS && reviews < 60;
        out.push({
          name, website, location: p.formattedAddress || '',
          source: 'google_places', icpProfile: 'local_owner_operated',
          placeId: p.id || null,
          industry: cat.label, reviewCount: reviews, rating,
          phone: p.internationalPhoneNumber || '',
          jobTitle: `Local ${cat.label} business \u2014 ${reviews} Google reviews${rating ? `, ${rating}\u2605` : ''}. ${cat.ownerRisk ? 'Practice \\u2014 confirm a reachable owner (field is being PE/DSO-consolidated).' : 'Owner-operated, high reachability.'}${marketingGap ? ' Thin review presence \u2014 likely under-marketed.' : ''}`,
          signals: { local_owner_operated: true, ...(cat.ownerRisk ? { consolidation_risk: true } : {}), ...(marketingGap ? { under_marketed: true } : {}) },
        });
      }
    } catch(e) { /* fail-safe per query */ }
  }
  console.log(`Google Places: ${out.length} local owner-operated businesses from ${calls} queries (${skippedFranchise} franchises skipped)`);
  return out;
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE: SBA LOANS — the debt-funding equivalent of Form D, but for
// MAIN STREET. A remodeler/trucker/contractor does not raise a seed round; they
// get an SBA 7(a) or 504 loan. That is capital allocated + a 60-90 day growth
// window at EXACTLY our ICP (owner-operated trades/service SMBs). Banks announce
// these loans publicly as marketing, so we read the announcements and extract
// the BORROWER (not the bank). Real, verifiable data — fails safe to [] if the
// feed is empty. Never fabricates.
// ═══════════════════════════════════════════════════════════
const searchSBALoans = async () => {
  const results = [];
  const seen = new Set();
  // Queries tuned to surface loan ANNOUNCEMENTS naming a borrower business.
  const queries = [
    '"SBA 7(a) loan" OR "SBA 504 loan" provides OR closes OR funds business 2026',
    '"SBA loan" "to finance" OR "to acquire" OR "to expand" small business 2026',
    'bank "provides" OR "closes" "SBA" loan manufacturing OR logistics OR contractor 2026',
    '"receives" OR "secures" "SBA loan" family business OR "family-owned" 2026',
  ];
  // The bank/lender is the ANNOUNCER, not the lead — never return these as leads.
  const LENDER_HINT = /\b(bank|bancorp|credit union|capital|lending|lender|financial|finance|fund|federal|first national|live oak|newtek|readycap|byline|celtic|huntington|wells fargo|chase|us bank)\b/i;

  for (const q of queries) {
    try {
      const r = await fetchT(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`, {}, 8000);
      const xml = await safeText(r);
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      items.slice(0, 12).forEach(item => {
        const title = (item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/) || item.match(/<title>([^<]+)<\/title>/))?.[1] || '';
        if (!title || !/sba/i.test(title)) return;

        // Extract the BORROWER, not the lender. Two common headline shapes:
        //  (A) "<Lender> provides/closes $X SBA loan to <Borrower>"    → after "to/for"
        //  (B) "<Borrower> secures/receives/lands $X SBA loan"          → subject
        let name = '';
        const mTo = title.match(/\bSBA[^.]*?\b(?:loan|financing)\b[^.]*?\b(?:to|for)\s+([A-Z][A-Za-z0-9&'\.\- ]{2,45}?)(?:\s+(?:to|for|in|of|,|\u2014|-)|$)/);
        if (mTo) name = mTo[1].trim();
        if (!name) {
          const mSubj = title.match(/^([A-Z][A-Za-z0-9&'\.\- ]{2,45}?)\s+(?:secures|receives|lands|obtains|closes on|gets|announces)\b[^.]*?\bSBA\b/i);
          if (mSubj) name = mSubj[1].trim();
        }
        if (!name) return;

        // Clean trailing amount/junk and normalize
        name = name.replace(/\$[\d,\.]+[MKB]?/gi, '').replace(/\s{2,}/g, ' ').replace(/[,\-\u2014]+$/, '').trim();
        if (name.length < 3 || name.length > 45) return;
        // Never return the lender itself
        if (LENDER_HINT.test(name)) return;
        // Dedup
        const key = name.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);

        // Try to pull the loan amount for context (optional)
        const amtMatch = title.match(/\$[\d,\.]+\s*(?:million|[MKB])?/i);
        results.push({
          name,
          source: 'sba_loan',
          signals: { sba_funded: true, needs_revenue_growth: true },
          jobTitle: `Just secured an SBA loan${amtMatch ? ` (${amtMatch[0]})` : ''} \u2014 growth capital allocated, 60-90 day window`,
          signalFreshness: 'hot',
          signalAgeDays: 14,
        });
      });
    } catch (e) { console.log('SBA query failed:', e.message); }
  }
  console.log(`SBA loans: ${results.length} borrower businesses found`);
  return results.slice(0, 25);
};

const searchSECEdgar = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now()-30*24*60*60*1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    // EFTS full-text search API — correct endpoint as of 2025
    const url = `https://efts.sec.gov/LATEST/search-index?q=%22Series+A%22+OR+%22Series+B%22+OR+%22Series+C%22&dateRange=custom&startdt=${thirtyDaysAgo}&enddt=${today}&forms=D&hits.hits.total.relation=eq&hits.hits._source.period_of_report=true`;
    const text = await fetchViaProxy(url, 12000);
    if (!text || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      // Try the newer EDGAR search API endpoint
      const url2 = `https://efts.sec.gov/LATEST/search-index?q=%22Form+D%22&forms=D&dateRange=custom&startdt=${thirtyDaysAgo}&enddt=${today}`;
      const text2 = await fetchViaProxy(url2, 12000);
      if (!text2 || text2.trim().startsWith('<')) { console.log('SEC EDGAR: blocked'); return []; }
      const d2 = JSON.parse(text2);
      const hits2 = d2?.hits?.hits || [];
      console.log(`SEC EDGAR (fallback): ${hits2.length} hits`);
      const FUND_PAT = [
        /\b(fund|funds|capital|ventures?|partners?|investors?|investments?|holdings?|advisors?|advisers?|management)\b\s*,?\s*(lp|l\.p\.|llc|l\.l\.c\.|ltd|plc)?\.?\s*$/i,
        /\bseries\s+([a-z]|[ivxlcdm]+)\b/i,
        /\bco[-\s]?investment\b/i,
        /\baffiliates\b/i,
        /\b(feeder|offshore|onshore|blocker|aggregator|parallel)\b/i,
        /\b(spv|special\s+purpose|special\s+opportunit(?:y|ies)|opportunit(?:y|ies)\s+fund)\b/i,
        /\bprivate\s+(investors?|equity|credit|capital)\b/i,
        /\b(qp|qualified\s+purchaser)\b/i,
        /\b(partners|capital|ventures|holdings|fund|investors)\s+([ivxlcdm]{1,5}|\d{1,3})\b/i,
        /\blp\.?\s*$/i,
      ];
      return hits2.slice(0, 45).map(hit => {
        const src = hit._source || {};
        const name = (src.entity_name || src.company_name || src.display_names?.[0] || '').replace(/\s*\(CIK\s*\d+\)\s*/gi,'').trim();
        if (!name || name.length < 2) return null;
        if (FUND_PAT.some(p => p.test(name))) return null;
        return { name: name.trim(), source: 'sec_edgar', signals: { raised_funding: true }, jobTitle: 'Form D filing — recently raised' };
      }).filter(Boolean);
    }
    const d = JSON.parse(text);
    const hits = d?.hits?.hits || [];
    const results = hits.slice(0,45).map(hit => {
      const src = hit._source || hit.fields || {};
      let name = src.entity_name || src.company_name || src.entityName || src.display_names?.[0] || '';
      // Strip CIK numbers and ticker symbols that EDGAR appends
      name = name.replace(/\s*\(CIK\s*\d+\)\s*/gi, '').replace(/\s*\([A-Z]{2,5}\)\s*/g, '').trim();
      const amount = src.total_offering_amount || src.offeringAmount || '';
      if (!name || name.length < 2) return null;

      // ══ FILTER OUT INVESTMENT FUNDS ══════════════════════════════════════
      // Form D is filed by BOTH operating companies raising capital AND by
      // private equity/VC funds raising a new fund. We want the former — an
      // operating business with budget pressure. The latter (funds) have names
      // like "Glade Brook Private Investors XLVIII LP", "Hummingbird Series B LLC",
      // "Feynman Point Special Opportunities Fund LP" — they are not our ICP.
      // These patterns catch ~95% of fund names reliably:
      const FUND_PATTERNS = [
        /\b(fund|funds|capital|ventures?|partners?|investors?|investments?|holdings?|advisors?|advisers?|management)\b\s*,?\s*(lp|l\.p\.|llc|l\.l\.c\.|ltd|plc)?\.?\s*$/i,
        /\bseries\s+([a-z]|[ivxlcdm]+)\b/i,
        /\bco[-\s]?investment\b/i,
        /\baffiliates\b/i,
        /\b(feeder|offshore|onshore|blocker|aggregator|parallel)\b/i,
        /\b(spv|special\s+purpose|special\s+opportunit(?:y|ies)|opportunit(?:y|ies)\s+fund)\b/i,
        /\bprivate\s+(investors?|equity|credit|capital)\b/i,
        /\b(qp|qualified\s+purchaser)\b/i,
        /\b(partners|capital|ventures|holdings|fund|investors)\s+([ivxlcdm]{1,5}|\d{1,3})\b/i,
        /\blp\.?\s*$/i,
      ];
      if (FUND_PATTERNS.some(p => p.test(name))) {
        return null; // investment fund, not an operating business
      }

      return {
        name: name.trim(),
        source: 'sec_edgar',
        signals: { raised_funding: true },
        jobTitle: `Form D filing${amount ? ` — $${Number(amount).toLocaleString()} raise` : ' — recently raised'}`,
      };
    }).filter(Boolean);
    console.log(`SEC EDGAR: ${results.length} from ${hits.length} hits (investment funds filtered out)`);
    return results;
  } catch(e) { console.error('SEC EDGAR error:', e.message); return []; }
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 3: CLUTCH RSS — agency frustration
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 4: GOOGLE NEWS RSS — CMO hires + funding
// ═══════════════════════════════════════════════════════════
const scrapeGoogleNews = async () => {
  const results = [];
  // 10 targeted searches — each maps to a specific pain signal
  // ═══ RE-AIMED AT THE ACTUAL ICP ════════════════════════════════════════
  // The old queries hunted "company hires CMO" and "startup raises Series A" —
  // which surface ENTERPRISES and funded tech startups. That is the OPPOSITE of
  // our ICP, and it is exactly why Ford, Hertz, Maximus and Floor & Decor kept
  // appearing. Those queries were actively fighting the size gate.
  //
  // Worse: a company that JUST HIRED A CMO is the single worst lead we can get.
  // They now have the exact layer we exist to bypass. We were spending API calls
  // hunting our own anti-ICP.
  //
  // These queries hunt OWNER-OPERATED businesses in growth pain — the people who
  // actually reply (2.4% reply, 18% positive at sub-50 employees).
  const queries = [
    // Owner-operators saying they're drowning — the purest signal there is
    { q: '"family-owned" OR "family business" expanding OR "adding staff" OR "growing"', type: 'expansion' },
    { q: '"second location" OR "third location" opening family business', type: 'expansion' },
    { q: 'owner "started the business" OR "founded the company" expanding 2026', type: 'expansion' },

    // Growth outpacing systems — the exact moment they need us
    { q: '"struggling to keep up" OR "growing pains" OR "outgrown our systems" business owner', type: 'growth_pain' },
    { q: 'small business "hiring" "can\'t keep up with demand" OR "backlog"', type: 'growth_pain' },

    // Owner-operator industries where the founder still runs it
    { q: 'trucking OR logistics OR contractor OR HVAC OR plumbing company expanding hiring', type: 'expansion' },
    { q: '"regional" OR "local" company "record year" OR "best year" growth', type: 'expansion' },

    // Exit-prep — motivated, has money, improvements multiply the exit value
    { q: 'business owner "preparing to sell" OR "exit strategy" OR "succession plan"', type: 'exit_prep' },

    // Agency frustration — they've already tried the cheap option and it failed
    { q: '"fired our agency" OR "left our marketing agency" OR "agency wasn\'t delivering"', type: 'agency_pain' },

    // Just-funded but SMALL (the size gate filters the big ones out anyway)
    { q: '"seed round" OR "raised" small business OR "family business" 2026', type: 'funding' },

    // ═══ THE NEW SALES LEADER — I had this exactly backwards ═══════════════
    // We correctly PENALIZE a new CMO hire: they just installed the marketing
    // layer we exist to bypass.
    //
    // But a new VP OF SALES is the OPPOSITE. He has a quota, no pipeline, 90 days
    // to prove himself — and NO marketing team to feed him leads. He is under more
    // pressure than anyone in the building and he will buy lead generation
    // immediately. Same for a new CRO or a new COO (who wants to fix operations).
    { q: '"VP of Sales" OR "Head of Sales" OR "Chief Revenue Officer" appointed OR hired OR joins 2026', type: 'new_sales_leader' },
    { q: 'company names new "Chief Operating Officer" OR "VP of Operations" 2026', type: 'new_ops_leader' },

    // New OWNER — someone just bought the business and wants to grow it fast
    { q: '"acquired" OR "new owner" small business OR "family business" 2026 growth', type: 'new_owner' },
  ];

  const signalMap = {
    hire: { hiring_marketing: true },
    funding: { raised_funding: true },
    rebrand: { rebranding: true, needs_marketing: true },
    expansion: { expanding: true },
    acquisition: { recently_acquired: true, needs_marketing: true },
    agency_pain: { agency_review: true, social_pain_signal: true },
    launch: { recently_launched: true, needs_marketing: true },
  };

  for (const { q, type } of queries) {
    try {
      const r = await fetchT(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`, {}, 8000);
      const xml = await safeText(r);
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      items.slice(0, 10).forEach(item => {
        const title = (item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/) || item.match(/<title>([^<]+)<\/title>/))?.[1] || '';
        if (!title) return;

        // Multiple extraction strategies
        let name = '';

        // Strategy 1: "CompanyName Raises/Hires/Appoints/etc"
        const m1 = title.match(/^([A-Z][A-Za-z0-9\s&\.,]+?)\s+(?:Raises|Hires|Appoints|Closes|Names|Secures|Opens|Launches|Acquires|Rebrands|Expands|Announces|Promotes|Welcomes|Taps|Selects)\b/i);
        if (m1) name = m1[1].trim();

        // Strategy 2: "X joins CompanyName as CMO" or "CompanyName names X as CMO"
        if (!name) {
          const m2 = title.match(/(?:joins|named at|to lead at|as CMO of|as VP of Marketing at)\s+([A-Z][A-Za-z0-9\s&\.]+?)(?:\s+as|\s+to|\s*$|,)/i);
          if (m2) name = m2[1].trim();
        }

        // Strategy 3: "CompanyName Funded" or "CompanyName Secures"
        if (!name) {
          const m3 = title.match(/^([A-Z][A-Za-z0-9\s&]+?)\s+(?:Funded|Backed|Valued|Acquired)/i);
          if (m3) name = m3[1].trim();
        }

        if (!name || name.length < 3 || name.length > 60) return;
        // Filter out news outlets and generic words
        if (/^(the|a |an |in |on |at |by |for |with |from |this |new |top |best |how |why |what |when |where |who |after|amid|as |why|inside|meet |these |report|study|report)/i.test(name)) return;
        if (/news|times|post|herald|report|journal|magazine|media group|press$/i.test(name)) return;
        // Reject headline fragments, not company names: a real company name is 1-5
        // capitalized words, no sentence punctuation mid-string, no lowercase
        // connective verbs. "After record year, Israeli tech brain drain" fails all.
        const words = name.trim().split(/\s+/);
        if (words.length > 5) return;                                   // company names are short
        if (/[,;:]/.test(name)) return;                                 // clause/sentence punctuation
        if (/\b(is|are|was|were|has|have|will|would|says|amid|after|record|year|drain|surge|rise|fall|report|study|according|billion|million)\b/i.test(name)) return; // headline verbs/nouns
        const capWords = words.filter(w => /^[A-Z0-9]/.test(w)).length;
        if (capWords < Math.ceil(words.length * 0.6)) return;           // real names are mostly Capitalized

        results.push({
          name,
          source: 'news_' + type,
          jobTitle: title.slice(0, 80),
          signals: signalMap[type] || {},
        });
      });
    } catch(e) { /* silent */ }
  }
  console.log(`Google News: ${results.length} from 10 targeted searches`);
  return results;
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE: BIZBUYSELL RSS — owners preparing for exit
// These founders want to maximize value BEFORE selling
// Perfect CROJungle pitch: "we'll grow your revenue before you sell"
// Free RSS, no bot protection
// ═══════════════════════════════════════════════════════════
// Shared Firecrawl scrape — renders JS and beats bot protection (1 credit/call)
// ── FIRECRAWL /map — get the site's REAL URLs instead of guessing paths ────
// This is why every website lookup was returning "nothing found": we were
// guessing that the about page lived at /about. On most real sites it doesn't —
// it's at /our-company, /who-we-are, /history, /meet-the-team, etc.
// Map asks the site for its actual structure (sitemap + SERP + index cache).
// Short-lived map cache. /map costs a credit, and within a single research run we
// now want the site structure TWICE (once to find leadership pages, once to find
// pricing/services/booking pages). Caching by domain for a few minutes makes the
// second and third lookups free, so full-site auditing costs nothing extra to map.
const _MAP_CACHE = new Map(); // domain -> { urls, at }
const _MAP_TTL_MS = 10 * 60 * 1000;
const firecrawlMap = async (fcKey, url, search = '', limit = 60) => {
  if (!fcKey || !url) return [];
  let _mk = '';
  try { _mk = new URL(url).hostname.replace('www.', '').toLowerCase(); } catch { _mk = url; }
  const _hit = _MAP_CACHE.get(_mk);
  if (_hit && Date.now() - _hit.at < _MAP_TTL_MS) return _hit.urls;
  try {
    const r = await fetchT('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${fcKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, ...(search ? { search } : {}), limit }),
    }, 20000);
    const d = await r.json();
    if (isCreditError(d, r.status)) {
      FIRECRAWL_OUT_OF_CREDITS = true;
      console.log('🔴 FIRECRAWL OUT OF CREDITS (map)');
      return [];
    }
    const links = d.links || d.data?.links || [];
    const out = links.map(l => (typeof l === 'string' ? l : l.url)).filter(Boolean);
    if (out.length) _MAP_CACHE.set(_mk, { urls: out, at: Date.now() });
    return out;
  } catch(e) {
    console.log('firecrawlMap error:', e.message);
    return [];
  }
};

// ── FIRECRAWL /search — REAL WEB SEARCH, and it works from Render ──────────
// This is the capability we spent hours concluding was impossible. DuckDuckGo and
// Google block Render's IPs at the network edge — but Firecrawl runs its own
// scraping infrastructure and is NOT blocked. It searches the web AND returns
// full page content, not just snippets.
const firecrawlSearch = async (fcKey, query, limit = 5, scrapeContent = true) => {
  if (!fcKey || !query) return [];
  try {
    const r = await fetchT('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${fcKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        limit,
        ...(scrapeContent ? { scrapeOptions: { formats: ['markdown'], onlyMainContent: true } } : {}),
      }),
    }, 30000);
    const d = await r.json();
    if (isCreditError(d, r.status)) {
      FIRECRAWL_OUT_OF_CREDITS = true;
      console.log('🔴 FIRECRAWL OUT OF CREDITS (search)');
      return [];
    }
    const results = d.data || d.results || [];
    return results.map(x => ({
      url: x.url || '',
      title: x.title || '',
      description: x.description || '',
      content: (x.markdown || x.content || '').slice(0, 6000),
    })).filter(x => x.url);
  } catch(e) {
    console.log('firecrawlSearch error:', e.message);
    return [];
  }
};

// Global flag — set the moment Firecrawl reports it's out of credits, so the
// whole run can report it honestly instead of silently producing empty results.
let FIRECRAWL_OUT_OF_CREDITS = false;

const isCreditError = (d, status) =>
  status === 402 ||
  /insufficient credits|payment required|out of credits|credit limit|upgrade your plan/i.test(
    String(d?.error || d?.message || '')
  );

// maxAge tells Firecrawl it may serve a recently-cached copy instead of re-rendering
// the page. Cached hits come back in milliseconds rather than seconds (~5x faster) and
// do not burn a credit. A company's homepage, team page, pricing page and careers page
// do not change hour to hour, so a 2-day window is safe and makes re-research nearly
// instant. Pass a shorter window for anything genuinely time-sensitive.
const FC_CACHE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
const firecrawlScrape = async (fcKey, url, timeout = 25000, maxAge = FC_CACHE_MS) => {
  if (!fcKey) return '';
  try {
    const r = await fetchT('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${fcKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: false, waitFor: 1500, maxAge, blockAds: true, removeBase64Images: true }),
    }, timeout);
    const d = await r.json();
    if (isCreditError(d, r.status)) {
      FIRECRAWL_OUT_OF_CREDITS = true;
      console.log('🔴 FIRECRAWL OUT OF CREDITS — scrapes, searches, and maps will all fail until topped up.');
      return '';
    }
    return d.data?.markdown || d.markdown || '';
  } catch(e) { console.log('firecrawlScrape error:', e.message); return ''; }
};

// ── ABOUT-PAGE ENRICHMENT via Firecrawl ────────────────────────────────────
// Firecrawl works from Render (DuckDuckGo/Google don't). Scrape the company's
// OWN about/team/leadership page to pull founder/CEO name + team size signal.
// This is the CEO-name source that actually works from our infrastructure.
// ── COMPANY-SPECIFIC NEWS TRIGGERS via Google News RSS ─────────────────────
// Free, works from Render (RSS, not a scrape). Queries by exact company name.
// CRITICAL: every article is verified to actually be about THIS company before
// use. A mismatched article would poison the pitch — reject anything ambiguous.
const getCompanyNews = async (companyName, website, location = '') => {
  const empty = { triggers: [], hasNews: false };
  if (!companyName || companyName.length < 3) return empty;

  const cleanName = companyName
    .replace(/,?\s*(Inc\.?|LLC\.?|Corp\.?|Ltd\.?|L\.P\.?|LLP\.?|Co\.?|Company|Group|Holdings)$/gi, '')
    .replace(/[^\w\s&]/g, '')
    .trim();
  if (cleanName.length < 3) return empty;

  const nameWords = cleanName.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !/^(the|and|for|inc|llc|corp|group|new|usa)$/.test(w));
  if (nameWords.length === 0) return empty;

  let domainRoot = '';
  if (website) {
    try { domainRoot = new URL(website).hostname.replace('www.','').split('.')[0].toLowerCase(); } catch {}
  }

  // LOCATION ANCHOR — the thing that was missing. Without it, a single-word company
  // name ("Sagewood") matched a condo complex in Palm Springs, a street in Katy TX,
  // a town in Alberta and a school in South Africa, and all four were logged as
  // "verified triggers". A real article about THIS company almost always names its
  // city or state, or links to its domain.
  const locParts = String(location || '').split(',').map(x => x.trim()).filter(Boolean);
  const stateZip = locParts.find(x => /\b[A-Z]{2}\b\s*\d{5}/.test(x));
  const stAbbr = stateZip ? (stateZip.match(/\b([A-Z]{2})\b/) || [])[1] : '';
  const cityName = stateZip && locParts.indexOf(stateZip) > 0 ? locParts[locParts.indexOf(stateZip) - 1] : '';
  const STATE_NAMES = { AL:'alabama',AK:'alaska',AZ:'arizona',AR:'arkansas',CA:'california',CO:'colorado',CT:'connecticut',DE:'delaware',FL:'florida',GA:'georgia',HI:'hawaii',ID:'idaho',IL:'illinois',IN:'indiana',IA:'iowa',KS:'kansas',KY:'kentucky',LA:'louisiana',ME:'maine',MD:'maryland',MA:'massachusetts',MI:'michigan',MN:'minnesota',MS:'mississippi',MO:'missouri',MT:'montana',NE:'nebraska',NV:'nevada',NH:'new hampshire',NJ:'new jersey',NM:'new mexico',NY:'new york',NC:'north carolina',ND:'north dakota',OH:'ohio',OK:'oklahoma',OR:'oregon',PA:'pennsylvania',RI:'rhode island',SC:'south carolina',SD:'south dakota',TN:'tennessee',TX:'texas',UT:'utah',VT:'vermont',VA:'virginia',WA:'washington',WV:'west virginia',WI:'wisconsin',WY:'wyoming' };
  const locTokens = [cityName.toLowerCase(), (STATE_NAMES[stAbbr] || ''), stAbbr ? stAbbr.toLowerCase() : ''].filter(t => t && t.length > 1);
  const haveLocation = locTokens.length > 0;

  // Headlines that are structurally NOT company news, no matter what they mention.
  const JUNK_ARTICLE = /(realtor\.com|zillow|redfin|trulia|for sale|mls\s*#|\b\d{3,6}\s+[a-z]+\s+(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|ct|court|way|pl|place)\b|obituary|obituaries|funeral|historic district|city council|weather|road closure|flood mitigation)/i;

  try {
    const q = `"${cleanName}"`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
    const r = await fetchT(url, {}, 8000);
    const xml = await safeText(r);
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    const triggers = [];
    for (const item of items.slice(0, 12)) {
      const title = (item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/) || item.match(/<title>([^<]+)<\/title>/))?.[1] || '';
      const desc = (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || item.match(/<description>([\s\S]*?)<\/description>/))?.[1] || '';
      const pubDate = (item.match(/<pubDate>([^<]+)<\/pubDate>/) || [])[1] || '';
      const cleanTitle = title.replace(/<[^>]+>/g, '').trim();
      const cleanDesc = desc.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim();
      const haystack = (cleanTitle + ' ' + cleanDesc).toLowerCase();

      // ── VERIFICATION — must clearly be about THIS company ──────────────────
      // The old single-word test was circular: it required the haystack to contain
      // the company name, which is guaranteed because we SEARCHED for that name.
      // Every same-named business on earth passed. Now identity needs real evidence.
      if (JUNK_ARTICLE.test(haystack)) continue;                     // structurally not company news

      const allNameWordsPresent = nameWords.every(w => haystack.includes(w));
      if (!allNameWordsPresent) continue;                            // name must appear, always

      const domainMatch = domainRoot.length > 3 && haystack.includes(domainRoot);
      const locationMatch = haveLocation && locTokens.some(t => haystack.includes(t));

      // A DISTINCTIVE multi-word name ("Cool Change Heating and Air") is itself strong
      // evidence. A short/common name ("Sagewood", "Simplex") is not — it needs the
      // location or the domain to prove identity.
      const distinctiveName = nameWords.length >= 3 || (nameWords.length === 2 && cleanName.length >= 14);
      const isVerified = domainMatch || locationMatch || distinctiveName;
      if (!isVerified) continue;

      // Record HOW we know, so a weak match can never masquerade as confirmed.
      const idBasis = domainMatch ? 'domain' : locationMatch ? 'location' : 'distinctive name';

      let ageDays = 999;
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d)) ageDays = Math.round((Date.now() - d.getTime()) / 86400000);
      }
      if (ageDays > 120) continue;

      let triggerType = 'news';
      if (/raises?|raised|funding|series [abc]|million|secures?\s+\$|investment/i.test(haystack)) triggerType = 'funding';
      else if (/acquires?|acquired|acquisition|merger|buys?/i.test(haystack)) triggerType = 'acquisition';
      else if (/opens?|opening|new location|expands?|expansion|expanding/i.test(haystack)) triggerType = 'expansion';
      else if (/hires?|appoints?|names?|joins|new ceo|new cmo|chief|promotes?/i.test(haystack)) triggerType = 'leadership';
      else if (/launch|launches|new product|new service|unveils?/i.test(haystack)) triggerType = 'launch';
      else if (/rebrand|new brand|new identity|new logo/i.test(haystack)) triggerType = 'rebrand';
      else if (/award|wins?|recognized|ranked|named best/i.test(haystack)) triggerType = 'award';

      triggers.push({ headline: cleanTitle.slice(0, 160), type: triggerType, ageDays, idBasis });
      if (triggers.length >= 4) break;
    }

    if (triggers.length > 0) {
      console.log(`News [${companyName}]: ${triggers.length} verified triggers (${triggers.map(t=>t.type + ' via ' + t.idBasis).join(', ')})`);
    }
    return { triggers, hasNews: triggers.length > 0 };
  } catch(e) {
    console.log(`Company news failed [${companyName}]:`, e.message);
    return empty;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FIREPROOF EMAIL ENGINE
// ═══════════════════════════════════════════════════════════════════════════
// Getting the right email is the single most important job in this system —
// everything upstream is worthless without it. So this is built to be better
// than a single-source lookup, and to NEVER hand back a guess dressed up as a fact.
//
// THE CORE PROBLEM: 30-40% of B2B domains are "catch-all" — they accept mail at
// EVERY address, real or fake. SMTP verification returns "250 OK" for the CEO's
// real inbox AND for xyzrandom99@domain. Every verifier hits this wall, and 23%
// of unverified catch-all addresses hard-bounce, which torches sender reputation.
//
// THE ARCHITECTURE — five confidence tiers, highest wins:
//   T1 CONFIRMED_SCRAPED  — we found it published on their own website. Strongest
//                           possible evidence: they put it there on purpose.
//   T2 SMTP_VERIFIED      — pattern generated, then SMTP-confirmed on a domain we
//                           PROVED is not catch-all. Equivalent to what Hunter does.
//   T3 PATTERN_LEARNED    — catch-all domain (SMTP useless), but we already learned
//                           this company's naming convention from a confirmed address
//                           at the same domain. This is our edge: a corpus we build.
//   T4 PATTERN_INFERRED   — catch-all, no learned pattern. Statistical best guess.
//                           RISKY — flagged, and blocked from sending by default.
//   T5 NONE               — no defensible address. Block. Never send a guess.
//
// Nothing below T3 is allowed to send without explicit human override.
// ═══════════════════════════════════════════════════════════════════════════

// Learned naming conventions, keyed by domain. Built from every confirmed address
// we ever see. This is the corpus that makes catch-all domains solvable.
const domainPatternMemory = new Map();

const EMAIL_TIERS = {
  CONFIRMED_SCRAPED: { tier: 1, score: 100, label: 'Published on their site', sendable: true },
  SMTP_VERIFIED:     { tier: 2, score: 95,  label: 'SMTP-verified (mailbox exists)', sendable: true },
  PATTERN_LEARNED:   { tier: 3, score: 75,  label: 'Matches this company\'s known email pattern', sendable: true },
  PATTERN_INFERRED:  { tier: 4, score: 40,  label: 'Inferred pattern — unverified, may bounce', sendable: false },
  NONE:              { tier: 5, score: 0,   label: 'No defensible address found', sendable: false },
};

// Every standard corporate naming convention, ordered by real-world frequency.
const buildCandidates = (fullName, domain) => {
  const parts = String(fullName || '').trim().toLowerCase()
    .replace(/[^a-z\s'-]/g, '').replace(/[''-]/g, '')
    .split(/\s+/).filter(Boolean)
    // Drop middle initials and middle names — "Jeffrey R Jewett" must yield
    // jeffrey.jewett@, never jeffrey.r@. Keep only first and last.
    .filter((p, i, arr) => i === 0 || i === arr.length - 1 || p.length > 1);
  if (parts.length < 2 || !domain) return [];
  const first = parts[0];
  const last = parts[parts.length - 1];
  const fi = first[0];
  const li = last[0];
  // Ordered by how common each pattern actually is across B2B companies
  return [
    { pattern: 'first.last',  email: `${first}.${last}@${domain}` },
    { pattern: 'first',       email: `${first}@${domain}` },
    { pattern: 'firstlast',   email: `${first}${last}@${domain}` },
    { pattern: 'f.last',      email: `${fi}.${last}@${domain}` },
    { pattern: 'flast',       email: `${fi}${last}@${domain}` },
    { pattern: 'first_last',  email: `${first}_${last}@${domain}` },
    { pattern: 'first.l',     email: `${first}.${li}@${domain}` },
    { pattern: 'last.first',  email: `${last}.${first}@${domain}` },
  ];
};

// Given a known-good email + the person's name, reverse-engineer the convention.
// This is how we learn a company's pattern from one confirmed address.
const inferPattern = (email, fullName) => {
  const local = String(email).split('@')[0].toLowerCase();
  const parts = String(fullName || '').trim().toLowerCase()
    .replace(/[^a-z\s'-]/g, '').replace(/[''-]/g, '')
    .split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  // Only first + last matter for pattern inference; middle names are noise
  const first = parts[0], last = parts[parts.length - 1];
  const fi = first[0], li = last[0];
  const map = {
    [`${first}.${last}`]: 'first.last',
    [`${first}`]: 'first',
    [`${first}${last}`]: 'firstlast',
    [`${fi}.${last}`]: 'f.last',
    [`${fi}${last}`]: 'flast',
    [`${first}_${last}`]: 'first_last',
    [`${first}.${li}`]: 'first.l',
    [`${last}.${first}`]: 'last.first',
  };
  return map[local] || null;
};

const applyPattern = (pattern, fullName, domain) => {
  const c = buildCandidates(fullName, domain).find(x => x.pattern === pattern);
  return c ? c.email : '';
};

// ── SMTP VERIFICATION (via free API) ───────────────────────────────────────
// Render blocks outbound port 25, so we can't do raw SMTP ourselves. We use a
// free verification API. MyEmailVerifier: 100 free/day, no credit card, credits
// never expire — 60x Hunter's monthly ceiling.
// Returns: { valid, catchAll, unknown }
const verifyEmailSMTP = async (email, verifierKey) => {
  if (!email || !verifierKey) return { valid: null, catchAll: null, unknown: true };
  try {
    const url = `https://client.myemailverifier.com/verifier/validate_single/${encodeURIComponent(email)}/${encodeURIComponent(verifierKey)}`;
    const r = await fetchT(url, {}, 12000);
    const d = await safeJson(r);
    const status = String(d?.Status || d?.status || '').toLowerCase();
    const catchAll = /true|yes/i.test(String(d?.Catch_All_Status ?? d?.catch_all ?? ''));
    return {
      valid: status === 'valid',
      invalid: status === 'invalid',
      catchAll,
      unknown: !status || status === 'unknown',
      raw: status,
    };
  } catch(e) {
    console.log('SMTP verify failed:', e.message);
    return { valid: null, catchAll: null, unknown: true };
  }
};

// ── CATCH-ALL DETECTION — the check that makes verification meaningful ──────
// Probe the domain with an address that mathematically cannot exist. If the
// server accepts it, the domain accepts EVERYTHING, and any "valid" result on
// that domain is meaningless. This single check is the difference between
// trustworthy verification and false confidence.
const catchAllCache = new Map();
const isCatchAllDomain = async (domain, verifierKey) => {
  if (!verifierKey || !domain) return null;
  if (catchAllCache.has(domain)) return catchAllCache.get(domain);
  const nonsense = `zz9x${Math.random().toString(36).slice(2, 10)}qq@${domain}`;
  const res = await verifyEmailSMTP(nonsense, verifierKey);
  // If a mailbox that cannot possibly exist comes back "valid", it's catch-all.
  const isCatchAll = res.valid === true || res.catchAll === true;
  catchAllCache.set(domain, isCatchAll);
  console.log(`Catch-all probe [${domain}]: ${isCatchAll ? 'CATCH-ALL (SMTP unreliable here)' : 'normal domain (SMTP trustworthy)'}`);
  return isCatchAll;
};

// ── WEBSITE EMAIL SCRAPER — Tier 1 evidence ────────────────────────────────
// An address published on their own site is the strongest evidence there is.
// Also harvests EVERY address found, which feeds the pattern-learning corpus.
const scrapeEmailsFromSite = async (website, fcKey, homepageContent, siteConfirmed = false) => {
  const out = { emails: [], source: '' };
  if (!website) return out;
  const domain = website.replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '').toLowerCase();
  if (!domain) return out;

  const JUNK_DOMAIN = /@(sentry|wixpress|example|domain|email|yourcompany|squarespace|godaddy|shopify|wordpress|gravatar|schema|w3|cloudflare|placeholder)\./i;
  const JUNK_LOCAL  = /^(noreply|no-reply|donotreply|postmaster|abuse|webmaster|privacy|legal|dmca|unsubscribe|mailer-daemon|bounce|test|user|name|email|your)@/i;
  const ROLE_LOCAL_S = /^(info|sales|contact|office|admin|hello|team|support|help|enquir|inquir|marketing|general|mail|reception|account|billing|service|customer|hr|jobs|careers|press|media)@/i;
  const FREE_PROVIDER = /@(gmail|yahoo|outlook|hotmail|aol|icloud|proton|live|msn)\./i;
  const domainRoot = domain.split('.')[0];
  // Does a different email domain plausibly belong to the SAME company? (shortened /
  // abbreviated domains share a real chunk with the full name — vklnTRANS ⊂ landTRANSportation)
  const relatedDomain = (edom) => {
    const er = (edom || '').split('.')[0];
    if (!er) return false;
    if (er === domainRoot) return true;
    for (let len = Math.min(er.length, domainRoot.length); len >= 4; len--) {
      for (let i = 0; i + len <= er.length; i++) {
        if (domainRoot.includes(er.substr(i, len))) return true;
      }
    }
    return false;
  };

  const extract = (text, allowOffDomain) => {
    if (!text) return [];
    const found = new Set();
    (text.match(/mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi) || [])
      .forEach(m => found.add(m.replace(/mailto:/i, '').toLowerCase()));
    (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [])
      .forEach(e => found.add(e.toLowerCase()));
    const clean = [...found].filter(e => !JUNK_DOMAIN.test(e) && !JUNK_LOCAL.test(e) && e.length < 60);
    const same = clean.filter(e => e.endsWith('@' + domain));
    if (same.length) return same;
    if (!allowOffDomain) return [];
    // No same-domain address — but a PERSONAL email sitting on their own homepage
    // (jill@vklntrans.com) is clearly a reachable human, even on a shortened domain.
    // Accept it only if the local is a real name (not a role inbox) AND the domain is
    // plausibly theirs (shares a chunk with the company domain) or a free provider.
    const off = clean.filter(e => {
      const [local, edom] = e.split('@');
      const personal = /^[a-z]+([._][a-z]+)?$/.test(local) && !ROLE_LOCAL_S.test(e);
      // If we CONFIRMED this homepage belongs to the target company, any personal
      // address published on it is theirs — no domain-shape guessing needed. That
      // confirmation is stronger evidence than any string heuristic.
      if (siteConfirmed) return personal;
      return personal && (relatedDomain(edom) || FREE_PROVIDER.test(e));
    });
    if (off.length) console.log(`EMAIL scrape [${domain}]: no same-domain address; using personal off-domain email ${off[0]} from homepage`);
    return off;
  };

  // Pass 1: homepage content we already have — costs nothing extra. Homepage header
  // emails are theirs, so off-domain personal addresses are allowed here.
  let emails = extract(homepageContent, true);
  if (emails.length > 0) return { emails, source: 'homepage' };

  // Pass 2: the pages most likely to publish a real address (same-domain only — a
  // contact page might list a vendor's/webdev's address, so stay strict there)
  if (!fcKey) return out;
  const base = website.replace(/\/$/, '');
  for (const path of ['/contact', '/contact-us', '/about', '/about-us', '/team', '/our-team']) {
    try {
      const md = await firecrawlScrape(fcKey, base + path, 10000);
      if (!md || md.length < 100) continue;
      emails = extract(md, false);
      if (emails.length > 0) return { emails, source: 'contact_page' };
    } catch(e) { /* next path */ }
  }
  return out;
};

const GENERIC_LOCAL = /^(info|contact|hello|hi|team|office|admin|sales|support|inquiries|enquiries|mail|general)@/i;

// ═══ THE ORCHESTRATOR — runs the full waterfall, returns a scored result ════
// ═══ DECISION-MAKER AUTHORITY RANKING ══════════════════════════════════════
// Getting AN email is worthless if it's the wrong person. For a founder-led
// 10-200 person company, the owner is the only one who can say yes. A marketing
// coordinator's inbox wastes the audit entirely.
//
// This ranks any contact we find by actual buying authority, so when we have
// several candidates we always pursue the highest one — and if that person's
// address can't be verified, we fall DOWN the ladder rather than sideways.
//
// Deliberately NOT a CC list: a cold email CC'ing three people reads as a blast
// and destroys the "I looked closely at your business" effect the whole pitch
// depends on. One email, to the best available person.
const TITLE_AUTHORITY = [
  { rank: 100, re: /\b(founder|co-?founder|owner|proprietor)\b/i },
  { rank: 95,  re: /\b(ceo|chief executive)\b/i },
  { rank: 90,  re: /\b(president)\b/i },
  { rank: 85,  re: /\b(managing (partner|director)|principal|partner)\b/i },
  { rank: 75,  re: /\b(coo|chief operating|gm|general manager)\b/i },
  { rank: 70,  re: /\b(cfo|chief financial)\b/i },
  { rank: 65,  re: /\b(cmo|chief marketing)\b/i },
  { rank: 60,  re: /\b(cto|chief technology)\b/i },
  { rank: 50,  re: /\b(vp|vice president|head of)\b/i },
  { rank: 35,  re: /\b(director)\b/i },
  { rank: 20,  re: /\b(manager|lead)\b/i },
  { rank: 10,  re: /\b(coordinator|specialist|associate|assistant|intern)\b/i },
];

const authorityScore = (title) => {
  if (!title) return 30; // unknown title — assume mid, don't punish a bare name
  for (const t of TITLE_AUTHORITY) if (t.re.test(title)) return t.rank;
  return 30;
};

// Generic inboxes: at a 15-person company info@ often IS the owner's desk, so
// it beats reaching a junior employee. At a 200-person company it's a black hole.
// ═══════════════════════════════════════════════════════════════════════════
// DECISION-MAKER ENGINE — finding the OWNER, not just a contact
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS: Hunter, Apollo, and ZoomInfo all build their databases by
// indexing LinkedIn. The owner of a 15-person trucking company HAS NO LINKEDIN.
// He is structurally invisible to every one of those tools — that is not a bug
// we can fix by paying more, it is how they are built. Our ICP is precisely the
// segment they miss (they miss 60-80% of owner-operated businesses).
//
// But he is NOT invisible. He is all over the public record:
//   · His own About/Team page — owner-operators are PROUD and put themselves front and center
//   · Google News — "John Smith, owner of J&M Tank Lines, said..."
//   · State business registries — every LLC's members/officers are public record
//
// NO SINGLE SOURCE hits 90%. CORROBORATION does. When the About page says
// "John Smith, Founder," Google News says "John Smith, owner of J&M," and the
// registry lists "SMITH, JOHN — Managing Member" — that is three independent
// public records agreeing. That is not a guess.
//
// THE OTHER BIG FIX: we stop using regex to read their website. Claude reads it.
// Regex produced garbage like "on core (principal)". An LLM reading a team page
// and answering "who owns this company" is dramatically more reliable.
// ═══════════════════════════════════════════════════════════════════════════

const DM_SOURCE_WEIGHT = {
  own_website_brain: 45,   // they published it themselves — strongest single source there is
  web_search:        40,   // the whole web, read by an LLM. Catches BBB/Manta/local press.
  registry:          30,   // legal public record — but often lists a filing agent, not the owner
  news:              30,   // press quotes them as owner — strong independent corroboration
  hunter:            20,   // real, but LinkedIn-biased: it surfaces VPs and HR, not owners
};

const normalizePersonName = (n) => String(n || '')
  .replace(/\b(mr|mrs|ms|dr|jr|sr|ii|iii|phd|mba|cpa)\b\.?/gi, '')
  .replace(/[^A-Za-z\s'-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const sameName = (a, b) => {
  const A = normalizePersonName(a).toLowerCase().split(' ').filter(Boolean);
  const B = normalizePersonName(b).toLowerCase().split(' ').filter(Boolean);
  if (A.length < 2 || B.length < 2) return false;
  // Same first AND last name = same person. Middle names/initials ignored.
  return A[0] === B[0] && A[A.length-1] === B[B.length-1];
};

// Nickname equivalences so "Mike Bacevich" + michael@ is correctly the SAME person
// (was false-flagging real owners as "different person" and blocking good leads).
const NICKNAMES = {
  mike:['michael','mick','mikey'], michael:['mike','mick','mikey'],
  bob:['robert','rob','bobby'], robert:['bob','rob','bobby','robbie'], rob:['robert','bob','robbie'],
  bill:['william','will','billy'], william:['bill','will','billy','liam'], will:['william','bill'],
  jim:['james','jimmy'], james:['jim','jimmy','jamie'], jimmy:['james','jim'],
  dave:['david','davey'], david:['dave','davey'],
  tom:['thomas','tommy'], thomas:['tom','tommy'],
  rick:['richard','rich','ricky','dick'], richard:['rick','rich','ricky','dick'], dick:['richard','rick'], rich:['richard'],
  chris:['christopher','christina','christine'], christopher:['chris'],
  matt:['matthew'], matthew:['matt'],
  dan:['daniel','danny'], daniel:['dan','danny'],
  joe:['joseph','joey'], joseph:['joe','joey'],
  steve:['steven','stephen'], steven:['steve','stephen'], stephen:['steve','steven'],
  ed:['edward','eddie','ted','ned'], edward:['ed','eddie','ted','ned'], ted:['edward','theodore'],
  jack:['john','johnny'], john:['jack','johnny','jon'], jon:['jonathan','john'], jonathan:['jon','john'],
  tony:['anthony'], anthony:['tony'],
  nick:['nicholas'], nicholas:['nick'],
  sam:['samuel','sammy','samantha'], samuel:['sam','sammy'],
  ben:['benjamin','benny'], benjamin:['ben','benny'],
  andy:['andrew','drew'], andrew:['andy','drew'], drew:['andrew'],
  alex:['alexander','alexandra','alec'], alexander:['alex','alec'], alexandra:['alex'],
  greg:['gregory'], gregory:['greg'],
  jeff:['jeffrey','jeffery'], jeffrey:['jeff'], jeffery:['jeff'],
  ken:['kenneth','kenny'], kenneth:['ken','kenny'],
  larry:['lawrence','laurence'], lawrence:['larry'],
  ron:['ronald','ronnie'], ronald:['ron','ronnie'],
  don:['donald','donnie'], donald:['don','donnie'],
  charlie:['charles','chuck'], charles:['charlie','chuck','chas'], chuck:['charles'],
  pat:['patrick','patricia'], patrick:['pat'], patricia:['pat','patty','trish'],
  pete:['peter'], peter:['pete'],
  frank:['francis','franklin'], francis:['frank'], franklin:['frank'],
  gabe:['gabriel'], gabriel:['gabe'],
  kate:['katherine','kathryn','katie'], katherine:['kate','katie','kathy'], katie:['katherine','kate'], kathryn:['kate','katie'],
  liz:['elizabeth','beth','betty'], elizabeth:['liz','beth','betty','eliza','lisa'], beth:['elizabeth'],
  sue:['susan','susie'], susan:['sue','susie'],
  meg:['margaret','peggy','maggie'], margaret:['peggy','meg','maggie'], maggie:['margaret'], peggy:['margaret'],
  cathy:['catherine'], catherine:['cathy','cath','kate'],
  jen:['jennifer','jenny'], jennifer:['jen','jenny'], jenny:['jennifer'],
  becky:['rebecca'], rebecca:['becky'],
  tina:['christina','christine'], christina:['tina','chris'], christine:['tina','chris'],
  deb:['deborah','debbie'], deborah:['deb','debbie'],
  vin:['vincent','vinny'], vincent:['vin','vinny'],
};
// True if the email local-part contains an owner name token OR a nickname form of it.
const localMatchesName = (local, tokens) => {
  if (!local || !tokens || !tokens.length) return false;
  for (const t of tokens) {
    if (t.length >= 3 && local.includes(t)) return true;
    for (const f of (NICKNAMES[t] || [])) { if (f.length >= 3 && local.includes(f)) return true; }
  }
  return false;
};

const looksLikeRealName = (n) => {
  const clean = normalizePersonName(n);
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length < 2 || parts.length > 4) return false;
  // First and last must be capitalized word-like tokens (allow initials like "J.")
  const wordOk = (w) => /^[A-Z][a-zA-Z'-]{1,}$/.test(w);
  if (!wordOk(parts[0]) || !wordOk(parts[parts.length - 1])) return false;
  // Reject only if the WHOLE thing is a job title / generic phrase — not if a
  // legitimate name merely contains a substring. (The old version killed real
  // names and was why every website lookup silently returned nothing.)
  const junkWhole = /^(the |our )?(team|leadership|management|company|owner|founder|president|ceo|about|contact|staff|group|services?|home|welcome|meet the team|our story)$/i;
  if (junkWhole.test(clean)) return false;
  // Reject if EITHER name token is itself a job word
  const jobWord = /^(team|leadership|management|company|owner|founder|president|ceo|coo|cfo|director|manager|staff|group|service|services|about|contact|home|core|welcome|our|us)$/i;
  if (parts.some(p => jobWord.test(p))) return false;
  return true;
};

// ── SOURCE 1: THEIR WEBSITE — but find the REAL pages, don't guess ─────────
// THE BUG THAT BROKE EVERYTHING: we were guessing that the leadership page lived
// at /about or /team. On most real sites it doesn't — it's /our-company,
// /who-we-are, /history, /meet-the-team, /leadership-team. Every guess 404'd,
// so the Brain got nothing but the homepage and correctly found nobody.
//
// THE FIX: Firecrawl /map asks the site for its ACTUAL structure. We then pick
// the pages most likely to name a human, and read those.
const LEADERSHIP_URL_HINTS = /(about|team|leadership|management|our-?story|who-?we-?are|meet|staff|people|founder|owner|history|company|executives?|bios?|principals?)/i;

const findOwnerViaBrain = async (website, fcKey, apiKey, homepageContent, companyName) => {
  if (!website || !apiKey || !fcKey) return null;
  try {
    const pages = [];
    if (homepageContent && homepageContent.length > 200) {
      pages.push('--- HOMEPAGE ---\n' + homepageContent.slice(0, 6000));
    }

    // Ask the site for its real URLs, filtered toward leadership pages
    const urls = await firecrawlMap(fcKey, website, 'about team leadership founder owner');
    const candidates = urls
      .filter(u => LEADERSHIP_URL_HINTS.test(u))
      .filter(u => !/\.(pdf|jpg|png|gif|zip|mp4)$/i.test(u))
      .slice(0, 4);

    console.log(`DM/brain [${companyName}]: mapped ${urls.length} URLs, ${candidates.length} leadership candidates${candidates.length ? ': ' + candidates.slice(0,3).join(', ') : ''}`);

    // Read the real pages IN PARALLEL (was sequential — that alone cost ~20s)
    const top = candidates.slice(0, 2); // read the top 2 leadership pages — owner-finding is the essential step, and the owner-gate saves credits elsewhere to pay for this depth
    const scrapes = await Promise.all(
      top.map(u => firecrawlScrape(fcKey, u, 9000).then(md => ({ u, md })).catch(() => ({ u, md: '' })))
    );
    for (const { u, md } of scrapes) {
      if (md && md.length > 200) pages.push(`\n\n--- PAGE: ${u} ---\n` + md.slice(0, 6000));
    }

    const corpus = pages.join('\n').slice(0, 22000);
    if (corpus.trim().length < 300) {
      console.log(`DM/brain [${companyName}]: no readable content (homepage empty AND no leadership pages mapped)`);
      return null;
    }

    const r = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: `Content scraped from ${companyName}'s own website (homepage + their about/team/leadership pages).

TASK: Identify the OWNER / FOUNDER / CEO / PRESIDENT — the person with authority to BUY. For an owner-operated business this is whoever started or owns it. It is NOT an HR director, a VP of Maintenance, an office manager, or a marketing coordinator — those people cannot authorize a purchase.

STRICT RULES:
- Report ONLY a name that literally appears in the content below. Never infer, never guess, never invent.
- If several people are listed, choose by BUYING AUTHORITY: Owner/Founder > CEO > President > Managing Partner/Principal > COO/GM. Ignore anyone below that.
- Owner-operated companies often say things like "Founded by X in 1998", "X started the company", "a message from our president, X", or a family name matching the company name.
- If NOBODY with real buying authority is named anywhere, return null for name. Returning null is CORRECT — do not settle for a junior employee just to fill the field.

Return ONLY valid JSON, no markdown:
{"name":"Full Name or null","title":"their exact title as written, or null","evidence":"the exact sentence naming them, verbatim from the content","confidence":"high|medium|low"}

confidence: high = name explicitly tied to an ownership title. medium = clearly the principal but title is looser. low = a name appears but their authority is ambiguous.

CONTENT:
${corpus}` }]
      }),
    }, 30000);

    const d = await r.json();
    let text = d.content?.[0]?.text || '';
    text = text.replace(/```json|```/g, '').trim();
    const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
    if (fb >= 0 && lb > fb) text = text.slice(fb, lb + 1);
    const parsed = JSON.parse(text);

    if (!parsed.name || parsed.name === 'null' || !looksLikeRealName(parsed.name)) {
      console.log(`DM/brain [${companyName}]: no owner-level person named on their site`);
      return null;
    }
    // Anti-hallucination: their name must literally be in what we scraped.
    const flat = corpus.toLowerCase().replace(/\s+/g, ' ');
    const np = String(parsed.name).toLowerCase().split(/\s+/).filter(Boolean);
    if (!(np.length >= 2 && flat.includes(np[0]) && flat.includes(np[np.length - 1]))) {
      console.log(`DM/brain [${companyName}]: "${parsed.name}" not present in source — REJECTED as hallucinated`);
      return null;
    }
    console.log(`DM/brain [${companyName}]: ✓ ${parsed.name} (${parsed.title || '?'}) [${parsed.confidence}]`);
    return {
      name: parsed.name.trim(),
      title: parsed.title || null,
      confidence: parsed.confidence || 'medium',
      evidence: parsed.evidence || '',
      source: 'own_website_brain',
    };
  } catch(e) {
    console.log('DM/brain failed:', e.message);
    return null;
  }
};

// ── SOURCE 2: WEB SEARCH — the capability we thought we didn't have ────────
// Firecrawl's /search endpoint does real web search from Render (it uses its own
// infrastructure, so it is NOT IP-blocked the way DuckDuckGo and Google are).
// This searches the ENTIRE web for who owns this company, then has the Brain read
// the actual result pages. This is how a human would do it.
const findOwnerViaWebSearch = async (companyName, website, fcKey, apiKey, location = '') => {
  if (!companyName || !fcKey || !apiKey) return null;
  try {
    const clean = companyName.replace(/,?\s*(Inc|LLC|Corp|Ltd)\.?$/gi, '').trim();
    const domain = (website || '').replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '');
    // Pull a short "City ST" from the full address. Without this, a common local
    // name ("A1 Restoration") matches dozens of unrelated companies nationwide and
    // we find nothing confident — the #1 cause of a reachable owner scoring as
    // unreachable. Location is the disambiguator.
    const locParts = String(location || '').split(',').map(s => s.trim()).filter(Boolean);
    const stateZip = locParts.find(p => /\b[A-Z]{2}\b\s*\d{5}/.test(p));
    const st = stateZip ? (stateZip.match(/\b([A-Z]{2})\b/) || [])[1] : '';
    const city = stateZip && locParts.indexOf(stateZip) > 0 ? locParts[locParts.indexOf(stateZip) - 1] : '';
    const loc = [city, st].filter(Boolean).join(' ');

    // Two angles: who owns it, and their profile on business directories that
    // actually index SMB owners (BBB lists a "Principal Contact", Manta and
    // Buzzfile list officers — these are goldmines that LinkedIn-based tools miss)
    const queries = [
      `"${clean}" ${loc ? loc + ' ' : ''}owner OR founder OR "chief executive" OR president name`,
      `"${clean}" ${domain ? domain + ' ' : ''}${loc ? loc + ' ' : ''}(bbb.org OR manta.com OR buzzfile.com OR dnb.com) owner principal`,
    ];

    // Run both searches in parallel — sequential cost us ~15s for no reason
    const batches = await Promise.all(
      queries.map(q => firecrawlSearch(fcKey, q, 2, false).catch(() => [])) // snippet-only: owner names live in BBB/Manta snippets
    );
    const hits = batches.flat().slice(0, 4);
    if (hits.length === 0) return null;

    const corpus = hits.map(h =>
      `--- ${h.title}\nURL: ${h.url}\n${h.description}\n${h.content}`
    ).join('\n\n').slice(0, 20000);

    const r = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: `These are real web search results about the company "${companyName}"${domain ? ' (' + domain + ')' : ''}${loc ? ' located in ' + loc : ''}.

TASK: Identify the OWNER / FOUNDER / CEO / PRESIDENT of THIS SPECIFIC COMPANY — the person with authority to buy.

CRITICAL WARNINGS:
- Search results often mix up DIFFERENT companies with similar names.${loc ? ' THIS company is located in ' + loc + ' — if a result is about a same-named business in a different city or state, IGNORE it completely.' : ''} Only report a person if the source clearly ties them to THIS company${domain ? ' (' + domain + ')' : ''}. If the source is about a different business, ignore it.
- Do NOT report a journalist, an author of an article, a customer leaving a review, or an employee of a directory site.
- Do NOT report someone below owner level (HR director, VP of maintenance, office manager cannot buy).
- If you cannot confidently name the owner of THIS company, return null. Null is the correct answer when the evidence isn't there.

Return ONLY valid JSON, no markdown:
{"name":"Full Name or null","title":"their title","evidence":"exact quote from the results naming them as owner of this company","sourceUrl":"which URL said it","confidence":"high|medium|low"}

SEARCH RESULTS:
${corpus}` }]
      }),
    }, 30000);

    const d = await r.json();
    let text = d.content?.[0]?.text || '';
    text = text.replace(/```json|```/g, '').trim();
    const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
    if (fb >= 0 && lb > fb) text = text.slice(fb, lb + 1);
    const parsed = JSON.parse(text);

    if (!parsed.name || parsed.name === 'null' || !looksLikeRealName(parsed.name)) {
      console.log(`DM/websearch [${companyName}]: no owner found in web results`);
      return null;
    }
    // Anti-hallucination: the name must appear in the actual search results
    const flat = corpus.toLowerCase().replace(/\s+/g, ' ');
    const np = String(parsed.name).toLowerCase().split(/\s+/).filter(Boolean);
    if (!(np.length >= 2 && flat.includes(np[0]) && flat.includes(np[np.length - 1]))) {
      console.log(`DM/websearch [${companyName}]: "${parsed.name}" not in results — REJECTED`);
      return null;
    }
    console.log(`DM/websearch [${companyName}]: ✓ ${parsed.name} (${parsed.title || '?'}) via ${parsed.sourceUrl || '?'}`);
    return {
      name: parsed.name.trim(),
      title: parsed.title || null,
      confidence: parsed.confidence || 'medium',
      evidence: parsed.evidence || '',
      sourceUrl: parsed.sourceUrl || '',
      source: 'web_search',
    };
  } catch(e) {
    console.log('DM/websearch failed:', e.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DEEP BUSINESS INTELLIGENCE — everything Firecrawl /search now unlocks
// ═══════════════════════════════════════════════════════════════════════════
// Until now the "audit" was ONLY what sits on their homepage. That is shallow —
// it tells us their site is broken, but not what the OWNER is actually losing
// sleep over. Mike's whole insight is "name the fire he is stuck putting out."
// You cannot name that fire from a homepage.
//
// Now we can read what the world says about this business: customer reviews and
// complaints, BBB filings, Glassdoor (employees describe operational chaos in
// detail), local press, industry forums. THAT is where the real pain lives.
//
// CREDIT DISCIPLINE: Firecrawl free tier is 500 credits/month and a search with
// content costs ~1 credit per result. Saturating every source on every company
// would burn the month in ~30 leads. So this ESCALATES — it only runs when the
// cheap sources have already failed, and it stops the moment it has enough.
// ═══════════════════════════════════════════════════════════════════════════

// ── FIND THEIR REAL WEBSITE (replaces Clearbit + domain guessing) ──────────
// This was a genuine weak point: Clearbit misses constantly, which is why the
// "confirm the website" modal kept appearing. A web search finds it reliably.
// ═══════════════════════════════════════════════════════════════════════════
// VISION AUDIT — look at the actual rendered page, don't grep the source
// ═══════════════════════════════════════════════════════════════════════════
// Regex on HTML misses JS-rendered content and can't judge what a visitor
// actually SEES. This sends the screenshot to Claude vision and asks specific,
// binary questions about the rendered above-fold experience. These answers are
// MECHANICAL (a human looking at the same screenshot would agree), unlike a
// positioning "score" which is judgment. Each answer carries what was observed,
// so the finding is defensible — we can say exactly what we saw.
const visionAuditPage = async (screenshotBase64, companyName, apiKey) => {
  if (!screenshotBase64 || !apiKey) return null;
  try {
    const r = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 } },
          { type: 'text', text: `This is the above-the-fold screenshot of ${companyName}'s homepage — exactly what a visitor sees on arrival before scrolling.

Answer each question about what is ACTUALLY VISIBLE in this image. You are the eyes of the audit — a human looking at this same screenshot must agree with every answer. Describe what you SEE, do not infer from what you'd expect.

Return ONLY JSON:
{
  "hasVisibleCTA": true/false,        // Is there a clear, clickable call-to-action button visible (Get a quote, Contact us, Book now, Shop, Sign up)? A nav menu link does NOT count — it must be a prominent action.
  "ctaObserved": "what the CTA button says, or 'none visible'",
  "hasHeadline": true/false,          // Is there a real value-proposition headline (not just a logo or nav)?
  "headlineObserved": "the headline text you see, or 'none visible'",
  "heroIsBlank": true/false,          // Is the main hero area empty, a blank carousel, still loading, or broken-looking?
  "hasVisibleSocialProof": true/false,// Are testimonials, review stars, client logos, or trust badges visible above the fold?
  "looksDated": true/false,           // Does the visual design look pre-2020 (old fonts, cluttered layout, dated styling)?
  "designObservation": "one factual sentence describing what the page looks like",
  "overallConversionReadiness": "strong|moderate|weak",  // Based only on what's visible: can this page convert a paid-ad visitor?
  "visibleEmail": "the FULL email address visible anywhere in this image, or null",
  "visibleEmailRaw": "exactly how it was written on the page (e.g. 'jill [at] vklntrans dot com'), or null",
  "visiblePhone": "the phone number visible in this image, or null"
}

ABOUT THE EMAIL — this matters a lot:
- Many small businesses put their email in the HEADER as an IMAGE, or write it obfuscated ("jill [at] company dot com", "jill(at)company.com") to dodge scrapers. You can SEE those; a text scraper cannot. Read it carefully off the image.
- Report it in "visibleEmail" NORMALIZED to a real address (jill [at] vklntrans dot com → jill@vklntrans.com), and put the original written form in "visibleEmailRaw".
- Copy it EXACTLY as shown — character for character. Never guess a spelling, never complete a partial address, never invent a plausible one. If it is blurry, cut off, or you are not certain, return null. Null is the correct answer when unsure.` }
        ] }]
      }),
    }, 30000);

    const d = await r.json();
    let text = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
    if (fb >= 0 && lb > fb) text = text.slice(fb, lb + 1);
    const parsed = JSON.parse(text);
    // Sanity-check the vision-read email — if it isn't a well-formed address, drop it
    // rather than let a misread string reach the email engine.
    if (parsed.visibleEmail && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(parsed.visibleEmail).trim())) {
      console.log(`VISION [${companyName}]: discarded malformed email read "${parsed.visibleEmail}"`);
      parsed.visibleEmail = null;
    }
    if (parsed.visibleEmail) parsed.visibleEmail = String(parsed.visibleEmail).trim().toLowerCase();
    console.log(`VISION [${companyName}]: CTA=${parsed.hasVisibleCTA} headline=${parsed.hasHeadline} blankHero=${parsed.heroIsBlank} readiness=${parsed.overallConversionReadiness}${parsed.visibleEmail ? ` | SAW EMAIL: ${parsed.visibleEmail}${parsed.visibleEmailRaw && parsed.visibleEmailRaw !== parsed.visibleEmail ? ' (written as "' + parsed.visibleEmailRaw + '")' : ''}` : ''}`);
    return parsed;
  } catch(e) {
    console.log('visionAuditPage failed (non-fatal):', e.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN CONFIRMATION — is this site REALLY the company we think it is?
// ═══════════════════════════════════════════════════════════════════════════
// The most dangerous audit error is not "listing page vs business page" — it's
// "right name, WRONG company." There are dozens of "Clark Transfer"s in the US.
// Resolving a domain by name-overlap can easily land on a different company that
// happens to share the name. Every finding would then be accurate — about the
// WRONG business.
//
// This reads the homepage we're about to audit and asks Claude, with the
// identifying facts we already know (location, industry, what they do), whether
// this site actually belongs to the target company. If confidence is low, we do
// NOT audit — a blank audit is infinitely better than a confident wrong one.
const confirmDomainMatch = async (companyName, homepageContent, knownFacts, apiKey) => {
  if (!companyName || !homepageContent || homepageContent.length < 100 || !apiKey) {
    return { match: 'unknown', confidence: 'low', reason: 'not enough content to confirm' };
  }
  try {
    const facts = [];
    if (knownFacts.location) facts.push(`Location: ${knownFacts.location}`);
    if (knownFacts.industry) facts.push(`Industry: ${knownFacts.industry}`);
    if (knownFacts.signal) facts.push(`Why we're looking at them: ${knownFacts.signal}`);
    if (knownFacts.employees) facts.push(`Approx size: ${knownFacts.employees} employees`);

    const r = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: `We are about to build a marketing audit for a company called "${companyName}". Before we do, confirm this website actually belongs to THAT company — not a different business with a similar name.

WHAT WE KNOW ABOUT THE TARGET COMPANY:
${facts.length ? facts.join('\\n') : '(only the name)'}

HOMEPAGE CONTENT OF THE SITE WE RESOLVED:
${homepageContent.slice(0, 3000)}

TASK: Does this website belong to the target company?
- "yes" — the name, and ideally the location/industry, clearly match.
- "no" — this is a DIFFERENT company (wrong location, wrong industry, or clearly a different business that shares the name).
- "unclear" — can't tell (generic content, name matches but nothing else confirms it).

Be strict. If the industry or location contradicts what we know, that's a "no" even if the name matches. When in doubt, "unclear" — never guess "yes".

Return ONLY JSON:
{"match":"yes|no|unclear","confidence":"high|medium|low","reason":"one short sentence"}` }]
      }),
    }, 20000);

    const d = await r.json();
    let text = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
    if (fb >= 0 && lb > fb) text = text.slice(fb, lb + 1);
    const parsed = JSON.parse(text);
    return { match: parsed.match || 'unclear', confidence: parsed.confidence || 'low', reason: parsed.reason || '' };
  } catch(e) {
    console.log('confirmDomainMatch failed (non-fatal):', e.message);
    return { match: 'unknown', confidence: 'low', reason: 'confirmation check errored' };
  }
};

const findWebsiteViaSearch = async (companyName, fcKey, location) => {
  if (!companyName || !fcKey) return null;
  try {
    const q = `"${companyName}"${location ? ' ' + location : ''} official website`;
    const results = await firecrawlSearch(fcKey, q, 4, false); // no content = cheaper
    if (results.length === 0) return null;

    const BAD_HOST = /(linkedin|facebook|twitter|instagram|yelp|bbb\.org|manta|buzzfile|dnb\.com|indeed|glassdoor|crunchbase|bloomberg|zoominfo|wikipedia|youtube|mapquest|yellowpages)/i;
    const nameWords = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);

    for (const r of results) {
      let host = '';
      try { host = new URL(r.url).hostname.replace('www.', '').toLowerCase(); } catch { continue; }
      if (BAD_HOST.test(host)) continue; // a directory listing is not their website
      // The domain should plausibly relate to the company name
      const base = host.split('.')[0];
      const relates = nameWords.some(w => base.includes(w.slice(0, Math.min(w.length, 6))))
                   || nameWords.some(w => (r.title || '').toLowerCase().includes(w));
      if (relates) {
        const site = 'https://' + host;
        console.log(`WEBSITE [${companyName}]: found via search → ${site}`);
        return site;
      }
    }
    return null;
  } catch(e) {
    console.log('findWebsiteViaSearch failed:', e.message);
    return null;
  }
};

// ── FIND REVENUE + HEADCOUNT (closes the size-gate gap) ────────────────────
// The Companies API returns emp=? on a big share of private SMBs. But ZoomInfo's
// PUBLIC pages, D&B, Buzzfile and Manta all publish revenue estimates and
// headcount for private companies, free to read. Search reaches them.
const findSizeViaSearch = async (companyName, website, fcKey, apiKey, location = '') => {
  if (!companyName || !fcKey || !apiKey) return null;
  try {
    const domain = (website || '').replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '');
    const locParts = String(location || '').split(',').map(s => s.trim()).filter(Boolean);
    const stateZip = locParts.find(p => /\b[A-Z]{2}\b\s*\d{5}/.test(p));
    const st = stateZip ? (stateZip.match(/\b([A-Z]{2})\b/) || [])[1] : '';
    const city = stateZip && locParts.indexOf(stateZip) > 0 ? locParts[locParts.indexOf(stateZip) - 1] : '';
    const loc = [city, st].filter(Boolean).join(' ');
    // Target the revenue aggregators directly — Prospeo, RocketReach, Growjo,
    // ZoomInfo publish private-SMB revenue and it sits right in the search SNIPPET
    // (e.g. "Johns Roofing has revenue of $25,300,000"). So snippet-only = 1 credit,
    // no page scrape needed. Location-locked so we don't grab a same-named company.
    const q = `"${companyName}" ${loc ? loc + ' ' : ''}revenue (prospeo.io OR rocketreach.co OR growjo.com OR zoominfo.com OR dnb.com)`;
    const results = await firecrawlSearch(fcKey, q, 4, false); // snippet-only
    if (results.length === 0) return null;

    const corpus = results.map(r => `--- ${r.title}\nURL: ${r.url}\n${r.description}`).join('\n\n').slice(0, 12000);

    const r2 = await fetchT('https://api.anthropic.com/v1/messages', {
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
- Directory sites (Prospeo, RocketReach, Growjo, ZoomInfo, D&B) publish these for private companies — those are valid sources.
- If a figure is not stated anywhere, return null for it. Null is correct.

Return ONLY valid JSON:
{"employees": number or null, "revenue": "e.g. $5M" or null, "source": "which site said it", "confidence": "high|medium|low"}

RESULTS:
${corpus}` }]
      }),
    }, 25000);

    const d = await r2.json();
    let text = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
    if (fb >= 0 && lb > fb) text = text.slice(fb, lb + 1);
    const parsed = JSON.parse(text);
    if (!parsed.employees && !parsed.revenue) return null;
    console.log(`SIZE [${companyName}]: emp=${parsed.employees || '?'} rev=${parsed.revenue || '?'} (${parsed.source || '?'})`);
    return parsed;
  } catch(e) {
    console.log('findSizeViaSearch failed:', e.message);
    return null;
  }
};

// ── THE BIG ONE: WHAT IS THE OWNER ACTUALLY LOSING SLEEP OVER? ─────────────
// This transforms the pitch. Instead of "your website has no lead capture" —
// which is a website observation — we get "your reviews say quotes take three
// weeks, you're hiring four schedulers, and your ads point at a page with no
// form." That is the fire he is stuck putting out, backed by evidence.
//
// Sources that actually carry this: Google/Yelp reviews, BBB complaints (public),
// Glassdoor (employees describe the operational chaos in brutal detail),
// industry forums, local press.
// GOOGLE-REVIEWS PAIN — the most reliable, most specific pain source for a Places
// lead: their OWN 1-3 star reviews. No disambiguation risk (it's their exact Place),
// maximally specific, and the single most reply-worthy input the pitch can get.
const fetchGoogleReviews = async (placeId, placesKey) => {
  if (!placeId || !placesKey) return [];
  try {
    const r = await fetchT(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { 'X-Goog-Api-Key': placesKey, 'X-Goog-FieldMask': 'reviews' },
    }, 12000);
    const d = await r.json();
    return (d.reviews || [])
      .map(rv => ({ rating: rv.rating || 0, text: (rv.text?.text || rv.originalText?.text || '').trim().slice(0, 600) }))
      .filter(rv => rv.text);
  } catch(e) { console.log('Google reviews fetch failed:', e.message); return []; }
};

// DEEP REVIEW PATTERN MINE — the send-path escalation. Scrapes the full public
// reviews page (more than the API's 5) and finds pains that REPEAT across many
// reviews, WITH counts. "Eleven of your reviews mention the same callback delay" is
// the deepest "how do they know THIS" hit there is. ~2 credits — only on leads we
// will actually send to (owner found + Places), so the spend lands where it pays off.
const deepReviewMine = async (companyName, placeId, fcKey, apiKey) => {
  if (!placeId || !fcKey || !apiKey) return null;
  try {
    const url = `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}`;
    const md = await firecrawlScrape(fcKey, url, 18000, 12 * 60 * 60 * 1000); // reviews move faster than a homepage — 12h window
    if (!md || md.length < 400) return null;
    const res = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: `This is the scraped Google reviews page for "${companyName}". It contains multiple customer reviews.\n\nTASK: Find the OPERATIONAL pains that REPEAT across MULTIPLE reviews — the recurring fires an owner would recognize and could fix (slow callbacks, scheduling chaos, missed appointments, no follow-up, quote delays, communication gaps, understaffing). A pattern in many reviews is a theme the owner KNOWS about and hasn't fixed — that is what we want.\n\nRULES:\n- Only report a pain that appears in 2+ reviews. Count how many reviews mention it.\n- Estimate the total number of reviews you can see.\n- Never invent. Keep one short exact quote per pattern.\n- Ignore isolated price gripes and one-off complaints.\n\nReturn ONLY valid JSON:\n{"totalReviews": number, "signals":[{"pain":"short operational pain","count": number,"evidence":"exact quote under 20 words"}],"summary":"one-sentence owner-facing summary"}\n\nREVIEWS PAGE:\n${md.slice(0, 22000)}` }]
      }),
    }, 25000);
    const d = await res.json();
    let text = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
    if (fb >= 0 && lb > fb) text = text.slice(fb, lb + 1);
    const parsed = JSON.parse(text);
    const total = parsed.totalReviews || 0;
    // ANTI-FABRICATION: every evidence quote must ACTUALLY appear in the scraped
    // reviews. This copy feeds a real sales email — a hallucinated "customer quote"
    // would be catastrophic. Verify a distinctive 4-word span; drop anything unproven.
    const corpusFlat = md.toLowerCase().replace(/\s+/g, ' ');
    const quoteExists = (q) => {
      const c = String(q || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      if (c.length < 8) return false;
      const w = c.split(' ');
      if (w.length < 4) return corpusFlat.includes(c);
      for (let i = 0; i + 4 <= w.length; i++) if (corpusFlat.includes(w.slice(i, i + 4).join(' '))) return true;
      return false;
    };
    const dropped = [];
    const signals = (parsed.signals || [])
      .filter(sg => (sg.count || 0) >= 2)
      .filter(sg => { const ok = quoteExists(sg.evidence); if (!ok) dropped.push(sg.pain); return ok; })
      .map(sg => ({
        pain: total ? `${sg.pain} — ${sg.count} of ~${total} reviews mention this` : `${sg.pain} — ${sg.count} reviews mention this`,
        evidence: sg.evidence, count: sg.count, source: 'their Google reviews (pattern across multiple)',
      }));
    if (dropped.length) console.log(`DEEP PAIN [${companyName}]: dropped ${dropped.length} unverifiable quote(s) — anti-fabrication guard held`);
    if (signals.length) console.log(`DEEP PAIN [${companyName}]: ${signals.length} verified repeating patterns across ~${total} reviews — the "how do they know THIS" hit`);
    return signals.length ? { signals, summary: parsed.summary || '' } : null;
  } catch(e) { console.log('deepReviewMine failed:', e.message); return null; }
};

// Best-effort: scrape MORE than the API's 5 reviews from Google's own reviews page
// for this exact place_id (no disambiguation — it's their Place). If Google blocks
// it, we simply fall back to the 5 API reviews. Never fabricates: returns only text
// Firecrawl actually rendered.
const scrapeMoreGoogleReviews = async (placeId, fcKey) => {
  if (!placeId || !fcKey) return [];
  try {
    const url = `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}&hl=en&sortby=newest`;
    const md = await firecrawlScrape(fcKey, url, 15000, 12 * 60 * 60 * 1000);
    if (!md || md.length < 200) return [];
    // Split into review-sized chunks; keep ones that read like real review prose.
    const chunks = md.split(/\n{2,}/).map(s => s.replace(/\s+/g, ' ').trim())
      .filter(s => s.length > 40 && s.length < 800 && /[a-z]/.test(s) && !/^https?:|^\[|cookie|sign in|google llc/i.test(s));
    return chunks.slice(0, 40).map(text => ({ rating: null, text }));
  } catch(e) { console.log('scrapeMoreGoogleReviews failed:', e.message); return []; }
};

// DEEP REVIEW-MINE — the "how do they know THIS?" engine. Reads ALL available
// reviews of their exact Place, finds the pain patterns that REPEAT, counts how
// many reviews mention each, and keeps exact quotes. Every quote is verified to
// actually exist in the source before it's allowed through — zero fabrication.
const painFromGoogleReviews = async (companyName, placeId, placesKey, apiKey, fcKey = null, deep = false) => {
  const apiReviews = await fetchGoogleReviews(placeId, placesKey);
  let all = apiReviews.slice();
  if (deep && fcKey) {
    const more = await scrapeMoreGoogleReviews(placeId, fcKey);
    // Dedupe against API reviews by first ~30 chars
    const seen = new Set(apiReviews.map(r => r.text.slice(0, 30).toLowerCase()));
    for (const m of more) { const k = m.text.slice(0, 30).toLowerCase(); if (!seen.has(k)) { seen.add(k); all.push(m); } }
  }
  // Prefer negative/critical reviews for pain, but keep the total count for context.
  const totalCount = all.length;
  const pool = all.filter(r => r.rating === null || r.rating <= 3);
  if (pool.length === 0) return { signals: [], summary: '' };
  const corpus = pool.map((r, i) => `Review ${i + 1}${r.rating ? ` (${r.rating} stars)` : ''}: ${r.text}`).join('\n\n');
  const corpusFlat = corpus.toLowerCase().replace(/\s+/g, ' ');

  try {
    const res = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: `Below are ${pool.length} real critical Google reviews of "${companyName}" (out of ${totalCount} pulled).

TASK: Find the OPERATIONAL pain patterns that REPEAT across multiple reviews — the fires an OWNER cares about and could fix: slow response/callbacks, scheduling chaos, missed/late appointments, communication gaps, quote/estimate delays, follow-up failures, understaffing, unfinished work, billing disputes.

STRICT RULES — this feeds a real sales email, so accuracy is everything:
- Report ONLY patterns that literally appear in the reviews below. NEVER infer, exaggerate, or invent.
- Prefer patterns that appear in 2+ reviews. A single review only counts if it's specific and severe.
- For each pattern, COUNT how many of these reviews mention it, and copy ONE exact short quote (verbatim, <18 words) as proof.
- If there is no clear repeated operational pattern, return an empty signals array. Empty is the correct, honest answer.

Return ONLY valid JSON:
{"signals":[{"pain":"short operational pain","count":<number of reviews mentioning it>,"evidence":"exact verbatim quote"}],"summary":"one honest sentence an owner would recognize"}

REVIEWS:
${corpus}` }]
      }),
    }, 25000);
    const d = await res.json();
    let text = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
    if (fb >= 0 && lb > fb) text = text.slice(fb, lb + 1);
    const parsed = JSON.parse(text);

    // ANTI-FABRICATION: every evidence quote MUST actually appear in the reviews.
    // Verify a distinctive 4-word span of each quote is present; drop anything that
    // isn't. A quote the model invented can never reach the pitch.
    const verified = (parsed.signals || []).filter(sg => {
      const q = String(sg.evidence || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      if (q.length < 8) return false;
      const words = q.split(' ');
      if (words.length < 4) return corpusFlat.includes(q);
      // check a few 4-word windows — at least one must be in the corpus verbatim
      for (let i = 0; i + 4 <= words.length; i++) {
        if (corpusFlat.includes(words.slice(i, i + 4).join(' '))) return true;
      }
      return false;
    }).map(sg => ({
      pain: sg.pain,
      evidence: sg.evidence,
      count: sg.count || 1,
      source: (sg.count && sg.count >= 2)
        ? `their Google reviews — ${sg.count} reviewers said this`
        : 'their Google reviews',
    }));

    if (verified.length) console.log(`PAIN [${companyName}]: ${verified.length} verified pattern(s) from ${totalCount} of their OWN Google reviews (deep mine=${deep})`);
    else console.log(`PAIN [${companyName}]: no verifiable repeated pattern in reviews (honest empty)`);
    return { signals: verified, summary: parsed.summary || '' };
  } catch(e) { console.log('painFromGoogleReviews failed:', e.message); return { signals: [], summary: '' }; }
};

// ── SITE-WIDE AUDIT — read the pages the audit is actually ABOUT ────────────
// The audit used to be built almost entirely from the homepage, which caused two
// real problems:
//   1) FALSE CLAIMS. Telling an owner "you have no booking tool" when it lives on
//      /schedule is the kind of wrong statement that ends the conversation. The
//      homepage is a brochure; the machinery lives deeper.
//   2) NO NUMBERS OF HIS OWN. His pricing page is where his published figures are,
//      and those are the only dollar figures we are allowed to use in a pitch.
// The site map is already paid for (cached above), so reading a few real pages is
// cheap. We pick by intent, not by guessing paths.
const PAGE_INTENT = [
  { key: 'pricing',  re: /(pricing|prices|rates|plans|packages|cost|fees|tuition|membership)/i },
  { key: 'services', re: /(services|what-we-do|solutions|offerings|specialt|practice-areas|treatments)/i },
  { key: 'booking',  re: /(book|schedule|appointment|consult|estimate|quote|request|get-started|contact)/i },
];

const auditSitePages = async (website, fcKey, apiKey, companyName) => {
  if (!website || !fcKey || !apiKey) return null;
  try {
    const urls = await firecrawlMap(fcKey, website, 'pricing services book schedule quote'); // cached — usually free
    if (!urls.length) return null;
    const clean = urls.filter(u => !/\.(pdf|jpg|jpeg|png|gif|svg|zip|mp4|webp)$/i.test(u));
    const picked = [];
    for (const intent of PAGE_INTENT) {
      const hit = clean.find(u => intent.re.test(u) && !picked.some(p => p.url === u));
      if (hit) picked.push({ key: intent.key, url: hit });
    }
    if (!picked.length) return null;
    const top = picked.slice(0, 2); // pricing + booking are the two that change the pitch; services is nice-to-have and not worth the seconds
    console.log(`SITE AUDIT [${companyName}]: reading ${top.length} page(s) beyond the homepage \u2014 ${top.map(p => p.key).join(', ')}`);

    const scraped = await Promise.all(top.map(p =>
      firecrawlScrape(fcKey, p.url, 7000).then(md => ({ ...p, md: md || '' })).catch(() => ({ ...p, md: '' }))
    ));
    const usable = scraped.filter(p => p.md && p.md.length > 200);
    if (!usable.length) return null;

    const corpus = usable.map(p => `--- ${p.key.toUpperCase()} PAGE (${p.url}) ---\n${p.md.slice(0, 7000)}`).join('\n\n');
    const res = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: `These are real interior pages from ${companyName}'s website.

Extract ONLY what is literally on these pages. Never infer, never estimate, never fill a gap.

1. PUBLISHED PRICES — any price, rate, fee, or package cost they print publicly. Copy the figure and what it buys, verbatim. These are the company's OWN numbers and will be used in a sales conversation, so a wrong figure is worse than no figure. If nothing is printed, return an empty array.
2. WHAT THEY ACTUALLY SELL — their real service lines, in their words.
3. BOOKING MECHANISM — how a customer actually starts. One of: "online_booking" (real self-serve scheduler), "form" (submit and wait for a callback), "phone_only", "none_found".
4. CAPTURE — is there any way to leave contact details other than a phone number? true/false.

Return ONLY JSON:
{"prices":[{"amount":"exact printed figure","what":"what it covers"}],"services":["service line"],"booking":"online_booking|form|phone_only|none_found","hasCapture":true|false}

PAGES:
${corpus}` }]
      }),
    }, 22000);
    const d = await res.json();
    let t = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) t = t.slice(a, b + 1);
    const parsed = JSON.parse(t);

    // ANTI-FABRICATION: every price must literally appear in what we scraped.
    const flat = corpus.toLowerCase().replace(/[\s,]/g, '');
    const prices = (parsed.prices || []).filter(p => {
      const digits = String(p.amount || '').toLowerCase().replace(/[^0-9.]/g, '');
      return digits.length >= 2 && flat.includes(digits);
    });
    if ((parsed.prices || []).length !== prices.length) {
      console.log(`SITE AUDIT [${companyName}]: dropped ${(parsed.prices||[]).length - prices.length} price(s) not found verbatim on the page`);
    }
    const out = {
      pagesRead: usable.map(p => p.key),
      prices,
      services: parsed.services || [],
      booking: parsed.booking || 'none_found',
      hasCapture: parsed.hasCapture === true,
    };
    console.log(`SITE AUDIT [${companyName}]: booking=${out.booking} capture=${out.hasCapture}${prices.length ? ` | ${prices.length} published price(s): ${prices.map(p=>p.amount).join(', ')}` : ' | no published pricing'}`);
    return out;
  } catch(e) { console.log('auditSitePages failed:', e.message); return null; }
};

// ── CAREERS PAGE — the operations sensor, and the best source of HIS numbers ──
// Adzuna gave us hiring signals; it is gone. But almost every business publishes the
// same information on their own site for free. What they are hiring tells us whether
// their constraint is LABOR (dispatchers, schedulers, CSRs, admins \u2192 software build)
// or DEMAND (marketing hires \u2192 retainer). Posted salaries are also the strongest
// dollar figure we can use in a pitch, because HE published them.
const scrapeCareersPage = async (website, fcKey, apiKey, companyName) => {
  if (!website || !fcKey || !apiKey) return null;
  const base = website.replace(/\/$/, '');
  const paths = ['/careers', '/jobs', '/employment']; // the three that actually exist on SMB sites; more paths = more dead round-trips
  let md = '';
  for (const p of paths) {
    try {
      const r = await firecrawlScrape(fcKey, base + p, 7000);
      // A real careers page names roles; a 404 or redirect to home will not.
      if (r && r.length > 400 && /(hiring|apply|position|job|opening|career|full[- ]time|part[- ]time)/i.test(r)) { md = r; break; }
    } catch { /* try next */ }
  }
  if (!md) return null;
  try {
    const res = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: `This is the careers/jobs page for "${companyName}".

Extract ONLY roles they are ACTUALLY hiring for right now. Ignore boilerplate, benefits copy, EEO statements, and generic "join our team" text with no named role.

Classify each role:
- "ops" = repetitive/manual back-office work software can absorb: dispatcher, scheduler, coordinator, customer service rep, receptionist, data entry, bookkeeper, billing clerk, admin assistant, intake, appointment setter
- "marketing" = marketing/demand roles: marketing manager/coordinator, social media, content, SEO, ads
- "sales" = sales roles
- "skilled" = licensed/skilled trade or professional: technician, electrician, nurse, CPA, engineer, driver
- "leadership" = manager/director/executive

RULES: never invent a role or a salary. Only report a salary if it is literally printed on the page.

Return ONLY JSON:
{"roles":[{"title":"exact title","type":"ops|marketing|sales|skilled|leadership","salary":"exact posted salary or null"}],"totalOpenings":number}

PAGE:
${md.slice(0, 14000)}` }]
      }),
    }, 20000);
    const d = await res.json();
    let t = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) t = t.slice(a, b + 1);
    const parsed = JSON.parse(t);
    const roles = Array.isArray(parsed.roles) ? parsed.roles : [];
    if (!roles.length) return null;
    const opsRoles = roles.filter(r => r.type === 'ops');
    const mktgRoles = roles.filter(r => r.type === 'marketing');
    const salaries = roles.filter(r => r.salary).map(r => `${r.title}: ${r.salary}`);
    console.log(`CAREERS [${companyName}]: ${roles.length} open role(s) \u2014 ${opsRoles.length} ops, ${mktgRoles.length} marketing${salaries.length ? ` | posted salaries: ${salaries.join('; ')}` : ''}`);
    return { roles, opsRoles, mktgRoles, salaries, totalOpenings: parsed.totalOpenings || roles.length };
  } catch(e) { console.log('scrapeCareersPage failed:', e.message); return null; }
};

const findBusinessPain = async (companyName, website, fcKey, apiKey, industry, location = '') => {
  if (!companyName || !fcKey || !apiKey) return { signals: [], summary: '' };
  // (deepReviewMine is defined below and used on the send-path only)
  try {
    const domain = (website || '').replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '');
    // Same disambiguation the DM search needs: without a city, a common name pulls
    // reviews/complaints for the WRONG same-named business — which would then feed a
    // fabricated "how do they know this" hook. Location keeps the pain on the right co.
    const locParts = String(location || '').split(',').map(s => s.trim()).filter(Boolean);
    const stateZip = locParts.find(p => /\b[A-Z]{2}\b\s*\d{5}/.test(p));
    const st = stateZip ? (stateZip.match(/\b([A-Z]{2})\b/) || [])[1] : '';
    const city = stateZip && locParts.indexOf(stateZip) > 0 ? locParts[locParts.indexOf(stateZip) - 1] : '';
    const loc = [city, st].filter(Boolean).join(' ');

    // Two angles: what customers complain about, and what employees say about
    // how the place actually runs. Employees are the most honest source there is.
    const queries = [
      `"${companyName}" ${loc ? loc + ' ' : ''}reviews complaints problems slow response`,
      `"${companyName}" ${loc ? loc + ' ' : ''}glassdoor OR indeed employee review management`,
    ];

    const batches = await Promise.all(
      queries.map(q => firecrawlSearch(fcKey, q, 3, false).catch(() => [])) // snippet-only: complaints live in the snippet
    );
    // For a PRODUCT company, a "reviews/complaints" search surfaces rivals'
    // "{company} alternatives" and "{X} vs {Y}" SEO pages — a competitor trashing
    // the product, not the owner's operational fire (and nothing we can fix).
    // This is exactly how the getjones.com "TrustLayer alternatives" page became
    // TrustLayer's "fire". Drop competitor/comparison sources before the LLM.
    const COMPETITOR_URL = /(alternativ|-vs-|\/vs\/|\bvs\b|compare|comparison|competitor|top-?\d+|best-?\d+|switch-from|-review-)/i;
    const hits = batches.flat().filter(h => {
      const u = String(h.url || '').toLowerCase();
      const t = String(h.title || '').toLowerCase();
      if (COMPETITOR_URL.test(u) || /alternativ|\bvs\.?\b|comparison|competitor/i.test(t)) {
        console.log(`PAIN [${companyName}]: dropped competitor/comparison source — ${u.slice(0, 70)}`);
        return false;
      }
      return true;
    }).slice(0, 6);
    if (hits.length === 0) return { signals: [], summary: '' };

    const corpus = hits.map(h => `--- ${h.title}\nURL: ${h.url}\n${h.description}\n${h.content}`).join('\n\n').slice(0, 18000);

    const r = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 900,
        messages: [{ role: 'user', content: `Real web content about "${companyName}"${industry ? ' (' + industry + ')' : ''} — reviews, complaints, employee feedback, press.

TASK: Identify the OPERATIONAL PAIN this business is actually living with. Not website problems — the real friction in how the business RUNS. The kind of thing that has the owner personally putting out fires.

WHAT WE ARE LOOKING FOR (only if actually evidenced):
- Slow response / quote turnaround / scheduling chaos
- Manual processes that clearly do not scale
- Understaffing, turnover, "we're always short-handed"
- Communication breakdowns between office and field
- Billing, invoicing, or dispatch problems
- Growth that has outpaced their systems

CRITICAL RULES:
- ONLY report pain that is DIRECTLY EVIDENCED in the content. Quote it.
- Verify the content is about THIS company, not a similarly-named one. If unsure, discard it.
- Do NOT invent pain. Do NOT generalize from the industry. An empty result is CORRECT and expected when the evidence isn't there — a fabricated pain point would destroy the pitch's credibility instantly.
- Ignore generic one-star rants with no operational detail ("bad service", "rude"). We want SPECIFIC, operational, fixable problems.
- REJECT a COMPETITOR'S framing. A rival's "alternatives", "vs", or comparison page is marketing designed to make this company look bad — it is NOT the owner's reality. Discard it entirely.
- REJECT criticism of the company's own PRODUCT quality (e.g. "their software/tool/OCR/algorithm is inaccurate", "the platform is buggy"). We fix how a business is MARKETED and RUN — not their product. A product complaint is not an operational fire we can address, so it is worthless to us here.

Return ONLY valid JSON:
{
  "signals": [
    {"pain":"one specific operational problem","evidence":"the exact quote proving it","source":"where it came from","severity":"high|medium|low"}
  ],
  "summary": "one sentence: the single biggest operational fire this owner is fighting, or empty string if nothing is evidenced"
}

CONTENT:
${corpus}` }]
      }),
    }, 35000);

    const d = await r.json();
    let text = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
    if (fb >= 0 && lb > fb) text = text.slice(fb, lb + 1);
    const parsed = JSON.parse(text);

    // Anti-fabrication: every quoted piece of evidence must actually exist in
    // the scraped content. This is the same guard as the Brain audit — a pitch
    // built on an invented complaint is worse than no pitch at all.
    const flat = corpus.toLowerCase().replace(/\s+/g, ' ');
    const verified = (parsed.signals || []).filter(s => {
      if (!s.evidence) return false;
      const ev = String(s.evidence).toLowerCase().replace(/\s+/g, ' ').slice(0, 30);
      const ok = flat.includes(ev);
      if (!ok) console.log(`PAIN [${companyName}]: rejected unverifiable — "${String(s.pain).slice(0,50)}"`);
      return ok;
    });

    if (verified.length > 0) {
      console.log(`PAIN [${companyName}]: ${verified.length} verified signals — ${verified.map(s => s.pain).join(' | ').slice(0, 120)}`);
    } else {
      console.log(`PAIN [${companyName}]: no verifiable operational pain found`);
    }
    return { signals: verified, summary: verified.length ? (parsed.summary || '') : '' };
  } catch(e) {
    console.log('findBusinessPain failed:', e.message);
    return { signals: [], summary: '' };
  }
};

// ── SOURCE 3: NEWS — press naming them as the owner ────────────────────────

// ── SOURCE: PUBLIC BUSINESS REGISTRY ───────────────────────────────────────
// Every US LLC/corp files its members and officers with the state — public record.
// This is the most authoritative source for who LEGALLY owns a small business.
//
// IMPORTANT CAVEAT: registries very often list the REGISTERED AGENT (a lawyer or
// a filing service like LegalZoom), not the actual owner. So we hard-reject
// agent-like entries, and this is treated as CORROBORATION, never a sole source.
const findOwnerViaRegistry = async (companyName, fcKey) => {
  if (!companyName || !fcKey) return null;
  try {
    const clean = companyName.replace(/,?\s*(Inc|LLC|Corp|Ltd|Co)\.?$/gi, '').trim();

    // Web search reaches registry aggregators far more reliably than guessing
    // OpenCorporates' URL structure (which is what the old version did, and why
    // it always returned nothing).
    const results = await firecrawlSearch(
      fcKey,
      `"${clean}" (opencorporates OR bizapedia OR "secretary of state") officers OR members`,
      2,
      true
    );
    if (results.length === 0) return null;

    const OWNER_ROLE = /(managing member|sole member|member|president|ceo|chief executive|owner|founder|principal|managing director|incorporator|officer|director|manager)/i;
    const AGENT_ROLE = /(registered agent|agent for service|resident agent|statutory agent|corporation service|ct corporation|registered office|incorp services|legalzoom|northwest registered|national registered)/i;

    for (const r of results) {
      const lines = (r.content || '').split('\n');
      for (const line of lines) {
        if (AGENT_ROLE.test(line)) continue;      // a filing agent is not the owner
        if (!OWNER_ROLE.test(line)) continue;
        const m = line.match(/([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,2})/);
        if (m && looksLikeRealName(m[1])) {
          const roleM = line.match(OWNER_ROLE);
          console.log(`DM/registry [${companyName}]: ✓ ${m[1]} (${roleM ? roleM[0] : 'officer'})`);
          return { name: m[1].trim(), title: roleM ? roleM[0] : 'Officer', confidence: 'medium', source: 'registry' };
        }
      }
    }
    return null;
  } catch(e) {
    console.log('DM/registry failed:', e.message);
    return null;
  }
};

const findOwnerViaNews = async (companyName) => {
  if (!companyName) return null;
  try {
    const clean = companyName.replace(/,?\s*(Inc|LLC|Corp|Ltd)\.?$/gi, '').trim();
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${clean}" (owner OR founder OR CEO OR president)`)}&hl=en-US&gl=US&ceid=US:en`;
    const r = await fetchT(url, {}, 8000);
    const xml = await safeText(r);
    const text = xml.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
    const esc = clean.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const patterns = [
      new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-zA-Z'-]+){1,2}),?\\s+(?:the\\s+)?(owner|founder|co-founder|CEO|president|chief executive)\\s+(?:and\\s+\\w+\\s+)?of\\s+${esc}`, 'i'),
      new RegExp(`${esc}[^.]{0,25}?(owner|founder|co-founder|CEO|president)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-zA-Z'-]+){1,2})`, 'i'),
    ];
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) {
        const cand = looksLikeRealName(m[1]) ? m[1] : (looksLikeRealName(m[2]) ? m[2] : null);
        const title = /owner|founder|ceo|president|chief/i.test(m[1] || '') ? m[1] : m[2];
        if (cand) {
          console.log(`DM/news [${companyName}]: ✓ ${cand} (${title})`);
          return { name: cand.trim(), title, confidence: 'medium', source: 'news' };
        }
      }
    }
    return null;
  } catch(e) { return null; }
};

// ═══ THE ORCHESTRATOR — corroborate across sources, score the confidence ════
// Runs every free source in parallel, then scores each candidate by how many
// INDEPENDENT sources name them. Agreement across sources is what gets us to 90%,
// because no single source can.
const findDecisionMaker = async ({ companyName, website, fcKey, apiKey, homepageContent, hunterName, hunterTitle, location }) => {
  // Run every source in parallel. Web search is the new heavy hitter — it reaches
  // BBB, Manta, local press, and chamber directories where SMB owners actually live.
  // Registry search costs ~2 credits and has a very low hit rate (it mostly
  // surfaces filing agents, not owners). Skipped by default — the website and
  // web-search sources do the real work. Still available in the test harness.
  const [brain, websearch, news] = await Promise.all([
    findOwnerViaBrain(website, fcKey, apiKey, homepageContent, companyName).catch(() => null),
    findOwnerViaWebSearch(companyName, website, fcKey, apiKey, location).catch(() => null),
    findOwnerViaNews(companyName).catch(() => null),  // free — Google News RSS
  ]);

  const found = [brain, websearch, news].filter(Boolean);
  if (hunterName && looksLikeRealName(hunterName)) {
    found.push({ name: hunterName, title: hunterTitle || null, confidence: 'medium', source: 'hunter' });
  }
  if (found.length === 0) {
    console.log(`DM [${companyName}]: NO decision-maker found in any source`);
    return { name: null, title: null, score: 0, sources: [], corroborated: false, confidence: 'none' };
  }

  // Cluster the same human across sources (John Smith == John A. Smith)
  const clusters = [];
  for (const f of found) {
    const hit = clusters.find(c => sameName(c.name, f.name));
    if (hit) {
      hit.sources.push(f.source);
      hit.score += DM_SOURCE_WEIGHT[f.source] || 10;
      // Prefer the most authoritative title we've seen for this person
      if (f.title && authorityScore(f.title) > authorityScore(hit.title)) hit.title = f.title;
      if (f.evidence && !hit.evidence) hit.evidence = f.evidence;
    } else {
      clusters.push({
        name: f.name, title: f.title, evidence: f.evidence || '',
        sources: [f.source], score: DM_SOURCE_WEIGHT[f.source] || 10,
      });
    }
  }

  // Rank: corroboration first, then buying authority, then raw source weight.
  // A person named by 2 independent public records outranks a lone Hunter hit.
  clusters.forEach(c => {
    c.corroborated = c.sources.length >= 2;
    c.authority = authorityScore(c.title);
    // Corroboration bonus — this is the whole point of the multi-source design
    if (c.sources.length >= 3) c.score += 35;
    else if (c.sources.length === 2) c.score += 20;
    // Owner/founder titles are what we actually want for this ICP
    if (c.authority >= 90) c.score += 15;
    else if (c.authority < 40) c.score -= 20; // a coordinator is worse than useless
  });
  clusters.sort((a, b) => (b.score - a.score) || (b.authority - a.authority));

  const best = clusters[0];
  const confidence =
    best.score >= 80 ? 'high' :
    best.score >= 50 ? 'medium' : 'low';

  // ═══ THE AUTHORITY GATE ══════════════════════════════════════════════════
  // Reaching the wrong person wastes the entire audit. A VP of Maintenance or an
  // HR Director CANNOT buy a $25k software build or a $10k/mo retainer — emailing
  // them burns the lead permanently AND burns a send.
  //
  // For a founder-led company, the buyer is the Owner / Founder / CEO / President /
  // Managing Partner. Anything below that is a NO-SEND by default — the lead is
  // held back for a manual look rather than wasted on someone with no authority.
  const AUTHORITY_FLOOR = 75; // COO/GM and above. VP=50, Director=35, Manager=20.
  const hasAuthority = best.authority >= AUTHORITY_FLOOR;

  // EVIDENCE FLOOR: authority alone isn't enough. If the ONLY source is Hunter —
  // whose LinkedIn-biased index is exactly what surfaces the wrong people — then
  // we have one weak, unverified opinion. That is not enough to burn a lead on.
  // Require either corroboration (2+ independent sources) OR a strong single
  // source that is NOT Hunter (their own website / web search / registry).
  const nonHunterSources = best.sources.filter(s => s !== 'hunter');
  const hasRealEvidence = best.corroborated || nonHunterSources.length >= 1;

  best.canBuy = hasAuthority && hasRealEvidence;
  if (!best.canBuy) {
    const why = !hasAuthority
      ? `"${best.title}" (authority ${best.authority}) is below the buying floor`
      : 'Hunter is the ONLY source — no independent confirmation this is the real owner';
    console.log(`DM [${companyName}]: ⚠ ${best.name} — ${why}. HELD BACK.`);
    best.blockWhy = why;
  }

  console.log(`DM [${companyName}]: ${best.name} (${best.title || '?'}) | score ${best.score} | ${confidence} | sources: ${best.sources.join('+')}${best.corroborated ? ' [CORROBORATED]' : ''}`);

  return {
    name: best.name,
    title: best.title,
    score: Math.min(100, best.score),
    confidence,
    sources: best.sources,
    corroborated: best.corroborated,
    evidence: best.evidence || '',
    authority: best.authority,
    canBuy: best.canBuy,
    blockReason: best.canBuy ? null : (best.blockWhy || `"${best.title || 'unknown title'}" cannot authorize a purchase`),
    alternates: clusters.slice(1, 3).map(c => ({
      name: c.name, title: c.title, sources: c.sources, score: c.score,
      authority: c.authority, canBuy: c.authority >= 75,
    })),
  };
};

const findEmailFireproof = async ({ website, ceoName, ceoTitle, employees, contacts, fcKey, homepageContent, hunterEmail, hunterName, hunterTitle, verifierKey, siteConfirmed = false }) => {
  const domain = (website || '').replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '').toLowerCase();
  const name = ceoName || hunterName || '';
  const fail = { email: '', ...EMAIL_TIERS.NONE, name, pattern: null };
  if (!domain) return fail;

  // ── Hunter found an address — but is it the RIGHT PERSON? ─────────────────
  // CRITICAL: Hunter's LinkedIn-biased index surfaces VPs and HR directors, not
  // owners. If our decision-maker engine identified the CEO but Hunter's address
  // belongs to the VP of Maintenance, using it would send a pitch addressed to
  // the CEO into the wrong person's inbox. That burns the lead.
  //
  // So: only use Hunter's address if it's the SAME PERSON. Otherwise we still
  // LEARN the company's email convention from it (very valuable — it tells us
  // exactly how this company formats addresses) and use that to build the
  // correct address for the person we actually want.
  if (hunterEmail && hunterName) {
    console.log(`EMAIL [${domain}]: Hunter has ${hunterName} <${hunterEmail}>. Decision-maker we want: ${name || 'unknown'}.`);
    const learned = inferPattern(hunterEmail, hunterName);
    if (learned) domainPatternMemory.set(domain, learned);

    const isSamePerson = !name || sameName(hunterName, name);
    if (isSamePerson) {
      // "Hunter said so" is NOT the same as "we verified it" — and Hunter guesses
      // patterns too. Put it through the SAME rigor as every other address: on a
      // normal domain, SMTP-confirm before claiming T2; on a catch-all domain SMTP
      // is useless so Hunter's own confirmation makes it T3; only trust it blindly
      // when we have no verifier key at all.
      if (verifierKey) {
        const hunterCatchAll = await isCatchAllDomain(domain, verifierKey);
        if (hunterCatchAll === false) {
          const res = await verifyEmailSMTP(hunterEmail, verifierKey);
          if (res.valid === true) {
            console.log(`✓ EMAIL [${domain}] T2 CONFIRMED (Hunter + SMTP): ${hunterEmail}`);
            return { email: hunterEmail, ...EMAIL_TIERS.SMTP_VERIFIED, label: 'Verified by Hunter + SMTP', name: hunterName, pattern: learned };
          }
          if (res.invalid === true) {
            // Hunter's address does NOT exist on a normal domain — do not hand it
            // back. Fall through to scrape/pattern logic to find the real one.
            console.log(`EMAIL [${domain}]: Hunter's ${hunterEmail} REJECTED by SMTP — trying scrape/patterns instead`);
          } else {
            // SMTP inconclusive (greylist/timeout) — Hunter is still our best signal.
            return { email: hunterEmail, ...EMAIL_TIERS.SMTP_VERIFIED, label: 'Verified by Hunter', name: hunterName, pattern: learned };
          }
        } else {
          // Catch-all: SMTP can't confirm anything, so Hunter's confirmation is
          // pattern-grade, not mailbox-grade. T3 (sendable, but honest about it).
          console.log(`EMAIL [${domain}] T3 (Hunter on a catch-all domain — pattern confidence): ${hunterEmail}`);
          return { email: hunterEmail, ...EMAIL_TIERS.PATTERN_LEARNED, label: 'Hunter-provided (catch-all domain — pattern confidence)', name: hunterName, pattern: learned };
        }
      } else {
        // No verifier key — Hunter is the best we have.
        return { email: hunterEmail, ...EMAIL_TIERS.SMTP_VERIFIED, label: 'Verified by Hunter', name: hunterName, pattern: learned };
      }
    }

    // Different person. Hunter gave us the VP; we want the owner. Build the
    // owner's address using the pattern we just learned from Hunter's own data —
    // this is genuinely high-confidence, because we KNOW the company's convention.
    if (learned && name) {
      const built = applyPattern(learned, name, domain);
      if (built) {
        console.log(`EMAIL [${domain}]: Hunter had ${hunterName} (${hunterTitle || '?'}), but decision-maker is ${name}. Built ${built} using Hunter's own pattern (${learned}).`);
        // SMTP-verify it if we can — that upgrades it to fully confirmed
        if (verifierKey) {
          const catchAll = await isCatchAllDomain(domain, verifierKey);
          if (catchAll === false) {
            const res = await verifyEmailSMTP(built, verifierKey);
            if (res.valid === true) {
              console.log(`✓ EMAIL [${domain}] T2 CONFIRMED: ${built} — mailbox exists`);
              return { email: built, ...EMAIL_TIERS.SMTP_VERIFIED, name, pattern: learned };
            }
            if (res.invalid === true) {
              // We PROVED this mailbox doesn't exist on a non-catch-all domain.
              // Do NOT fall through and hand it back anyway — that would guarantee
              // a bounce. Try the other patterns instead.
              console.log(`EMAIL [${domain}]: ${built} REJECTED by SMTP — trying other patterns for ${name}`);
              // build locally: the shared `candidates` const is declared further down,
              // so referencing it here threw "Cannot access 'candidates' before initialization"
              for (const c of buildCandidates(name, domain).filter(x => x.pattern !== learned).slice(0, 4)) {
                const r2 = await verifyEmailSMTP(c.email, verifierKey);
                if (r2.valid === true) {
                  domainPatternMemory.set(domain, c.pattern);
                  console.log(`✓ EMAIL [${domain}] T2 CONFIRMED on retry: ${c.email} (${c.pattern})`);
                  return { email: c.email, ...EMAIL_TIERS.SMTP_VERIFIED, name, pattern: c.pattern };
                }
                await new Promise(r => setTimeout(r, 200));
              }
              console.log(`✗ EMAIL [${domain}]: no mailbox exists for ${name}. BLOCKED — sending would bounce.`);
              return fail;
            }
          }
        }
        // Can't SMTP-verify (catch-all or no verifier key), but the pattern came
        // from a REAL verified address at this exact domain — that's Tier 3.
        return {
          email: built, ...EMAIL_TIERS.PATTERN_LEARNED,
          label: `Built from ${hunterName}'s confirmed address pattern at this domain`,
          name, pattern: learned,
        };
      }
    }
  }

  // ── TIER 1: published on their own website ────────────────────────────────
  const scraped = await scrapeEmailsFromSite(website, fcKey, homepageContent, siteConfirmed);
  if (scraped.emails.length > 0) {
    // Learn the company's convention from every address we found
    for (const e of scraped.emails) {
      const p = inferPattern(e, name);
      if (p) { domainPatternMemory.set(domain, p); break; }
    }
    // Prefer an address matching our decision-maker, then any personal address,
    // then a generic one (at a 15-person company, info@ often IS the owner).
    const nameParts = name.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const nameMatch = scraped.emails.find(e => nameParts.some(p => e.split('@')[0].includes(p)));
    const personal  = scraped.emails.find(e => !GENERIC_LOCAL.test(e));
    const best = nameMatch || personal || scraped.emails[0];
    const isGeneric = GENERIC_LOCAL.test(best);
    console.log(`✓ EMAIL [${domain}] T1 scraped from ${scraped.source}: ${best}${isGeneric ? ' (generic)' : ''}`);
    return {
      email: best, ...EMAIL_TIERS.CONFIRMED_SCRAPED,
      label: isGeneric ? 'Published on their site (generic inbox)' : 'Published on their site',
      score: isGeneric ? 85 : 100,
      name, pattern: domainPatternMemory.get(domain) || null,
    };
  }

  // Everything below needs a name to build candidates from
  if (!name) return fail;
  const candidates = buildCandidates(name, domain);
  if (candidates.length === 0) return fail;

  // ── Is this domain catch-all? Determines whether SMTP means anything. ─────
  // Cached per domain, so we only pay this probe ONCE per company domain ever.
  const catchAll = await isCatchAllDomain(domain, verifierKey);

  // ── TIER 2: normal domain → verify patterns via SMTP ──────────────────────
  // CREDIT DISCIPLINE: the verifier gives 100 checks/day. So we:
  //   1. Try the LEARNED pattern first if we know this company's convention
  //      (from Hunter or a scraped address) — usually a 1-check hit.
  //   2. Otherwise try the 4 most common patterns, not all 8.
  //   3. Stop the instant one resolves.
  // Worst case ~5 checks/company; typical case 1-2. That's 25-50 companies/day.
  if (catchAll === false && verifierKey) {
    const learnedFirst = domainPatternMemory.get(domain);
    const ordered = learnedFirst
      ? [
          ...candidates.filter(c => c.pattern === learnedFirst),
          ...candidates.filter(c => c.pattern !== learnedFirst),
        ]
      : candidates;

    // Cap attempts — the 4 most common conventions cover the vast majority.
    const toTry = ordered.slice(0, learnedFirst ? 5 : 4);

    for (const c of toTry) {
      const res = await verifyEmailSMTP(c.email, verifierKey);
      if (res.valid === true) {
        domainPatternMemory.set(domain, c.pattern);
        console.log(`✓ EMAIL [${domain}] T2 SMTP-VERIFIED (mailbox exists): ${c.email} — pattern ${c.pattern}`);
        return { email: c.email, ...EMAIL_TIERS.SMTP_VERIFIED, name, pattern: c.pattern };
      }
      await new Promise(r => setTimeout(r, 200)); // be polite to the API
    }
    // Normal (non-catch-all) domain and none of the likely patterns resolve →
    // this person genuinely has no mailbox here. Sending would guarantee a bounce,
    // and a bounce damages the sending domain. Better to send nothing.
    console.log(`✗ EMAIL [${domain}] no pattern resolved on a normal domain — ${name} has no mailbox here. BLOCKED.`);
    return fail;
  }

  // ── TIER 3: catch-all, but we know this company's convention ──────────────
  const learned = domainPatternMemory.get(domain);
  if (learned) {
    const email = applyPattern(learned, name, domain);
    if (email) {
      console.log(`✓ EMAIL [${domain}] T3 learned pattern (${learned}): ${email}`);
      return { email, ...EMAIL_TIERS.PATTERN_LEARNED, name, pattern: learned };
    }
  }

  // ── TIER 4: catch-all, no learned pattern → statistical guess. NOT sendable. ──
  const inferred = candidates[0];
  console.log(`⚠ EMAIL [${domain}] T4 inferred only (catch-all, no evidence): ${inferred.email} — BLOCKED from sending`);
  return { email: inferred.email, ...EMAIL_TIERS.PATTERN_INFERRED, name, pattern: inferred.pattern };
};

// FACEBOOK AD LIBRARY VIA FIRECRAWL — automates the manual "All ads" check.
// The Ad Library is a JS app so plain fetch fails; Firecrawl renders it.
// Returns confirmed ad presence + rough count, no Meta token needed.
const checkAdLibraryViaFirecrawl = async (company, fcKey) => {
  if (!fcKey || !company) return { hasAds: false, adCount: 0, confirmed: false };
  try {
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&search_type=keyword_search&q=${encodeURIComponent(company)}`;
    const md = await firecrawlScrape(fcKey, url, 30000, 6 * 60 * 60 * 1000); // ad activity is live — 6h window
    if (!md || md.length < 200) return { hasAds: false, adCount: 0, confirmed: false };
    // CAUTION: this is a KEYWORD search (q=company), not a search by the
    // advertiser's Page. The "results" header therefore counts every ad in the
    // ENTIRE library matching the term — across ALL advertisers — and Facebook
    // caps the display at "10,000+". A large or round number is NOT this
    // company's ad count and must never be treated as fact (this is exactly how
    // "TrustLayer → 10000 ads" happened). Trust only a small, specific header.
    const m = md.match(/~?\s*([\d,]+)\s+results/i);
    const rawCount = m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
    const libIds = (md.match(/Library ID/gi) || []).length; // ad cards rendered on page 1
    const adCount = rawCount >= 500 ? Math.min(libIds, 30) : (rawCount || Math.min(libIds, 30));
    // A keyword search (q=company) matches ads across ALL advertisers, so its
    // count is NEVER provably this company's — regardless of magnitude. 180 is
    // as unverifiable as 10,000 (that's how Simplex got a phantom Marketing pitch).
    // So the count is presence-only: it can never drive money-on-fire or the
    // product recommendation. Only an on-page Google Ads tag counts as real spend.
    const countReliable = false;
    const hasAds = adCount > 0;
    console.log(`Ad Library (Firecrawl): ${company} → ${adCount} keyword hits (presence-only — not a verified per-advertiser count, won't drive recommendation)`);
    return { hasAds, adCount, countReliable, confirmed: true, source: 'ad_library_scrape' };
  } catch(e) { console.log('Ad Library scrape error:', e.message); return { hasAds: false, adCount: 0, confirmed: false }; }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXIT-PREP ENGINE — the single highest-value signal in the entire system
// ═══════════════════════════════════════════════════════════════════════════
// THE MATH THAT MAKES THIS THE BEST PITCH CROJUNGLE HAS:
//
//   "Every dollar saved in operational efficiency can be worth FIVE TIMES that
//    amount at the closing table."
//
//   $1M EBITDA × 5x multiple = $5M valuation.
//   Improve to $1.2M EBITDA  = $6M valuation.
//   → $200k of operational improvement = $1,000,000 MORE AT CLOSING.
//
// And from the valuation firms, on what LOWERS a multiple:
//   "What moves a multiple DOWN: extreme OWNER-DEPENDENCY, heavy debt,
//    and AGING TECHNOLOGY."
//
// That is Mike's entire thesis, priced. The fires the owner is personally putting
// out are LITERALLY DESTROYING HIS VALUATION. And aging tech — ICP #1 — is a
// named multiple-killer that every buyer's due diligence will find.
//
// THE PITCH:
//   "You're listing at $5M. Four people doing manual scheduling = $220k/yr in
//    loaded labor. Automate it, EBITDA goes up $220k, and at your 5x multiple
//    that's $1.1M more at closing. The build costs $50k and takes 90 days."
//   → A 22x return, with a deadline, to an owner who is definitionally motivated,
//     has money, and listed the business HIMSELF (so he is directly reachable).
//
// CROJungle also has an Exit/Valuation Advisory product. Direct fit.
//
// WHY THIS WAS BROKEN: the old scraper hit BizBuySell's category pages directly
// and got 0 results every run. We now have Firecrawl /search, which can find
// listings across EVERY broker network at once — BizBuySell, BizQuest, Sunbelt,
// Transworld, Murphy, and local brokers.
const findFounderVenting = async (fcKey, apiKey) => {
  if (!fcKey || !apiKey) return { leads: [], painLanguage: [] };
  try {
    // The subreddits where owner-operators actually live and complain
    const queries = [
      `site:reddit.com (r/smallbusiness OR r/Entrepreneur) "drowning in" OR "can't keep up" OR "buried in" scheduling OR quotes OR invoices owner`,
      `site:reddit.com (r/HVAC OR r/Construction OR r/Plumbing OR r/Trucking OR r/Dentistry) owner "office manager" OR "dispatch" OR "scheduling" nightmare OR chaos`,
    ];

    const batches = await Promise.all(
      queries.map(q => firecrawlSearch(fcKey, q, 4, false).catch(() => []))
    );
    const hits = batches.flat().slice(0, 8);
    if (hits.length === 0) return { leads: [], painLanguage: [] };

    const corpus = hits.map(h => `--- ${h.title}\nURL: ${h.url}\n${h.content}`)
      .join('\n\n').slice(0, 20000);

    const r = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1400,
        messages: [{ role: 'user', content: `These are real Reddit posts from business owners.

TWO TASKS:

TASK 1 — IDENTIFIABLE COMPANIES (rare but red-hot):
If an owner NAMED their company or linked their website, extract it. Most posts are
anonymous — that is expected, and an empty array here is a correct answer. Never guess
a company name from context.

TASK 2 — PAIN LANGUAGE (the real value):
Extract the EXACT WORDS owners use to describe the operational fire they're fighting.
Not a paraphrase — their literal phrasing. This is gold: it tells us how our buyer
actually talks about his problem, which makes every pitch we write sharper.

We are hunting descriptions of: being buried in manual work, scheduling/dispatch chaos,
quotes taking forever, the owner personally doing work he already delegated, hiring
people to fix a systems problem, growth outrunning their processes.

Return ONLY valid JSON:
{
  "companies":[{"name":"...","website":"...","evidence":"their exact words"}],
  "painLanguage":[{"quote":"their exact words, verbatim","theme":"scheduling|quoting|admin|hiring|growth|owner-trapped"}]
}

CONTENT:
${corpus}` }]
      }),
    }, 35000);

    const d = await r.json();
    let text = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
    if (fb >= 0 && lb > fb) text = text.slice(fb, lb + 1);
    const parsed = JSON.parse(text);

    // Anti-hallucination: the quote must actually exist in what we scraped
    const flat = corpus.toLowerCase().replace(/\s+/g, ' ');
    const painLanguage = (parsed.painLanguage || []).filter(p => {
      if (!p.quote) return false;
      return flat.includes(String(p.quote).toLowerCase().replace(/\s+/g, ' ').slice(0, 25));
    });

    const leads = (parsed.companies || [])
      .filter(c => c.name && c.name.length > 3)
      .map(c => ({
        name: c.name.trim(),
        website: c.website || '',
        jobTitle: `Owner venting publicly — "${String(c.evidence || '').slice(0, 90)}"`,
        source: 'founder_venting',
        signalAgeDays: 7,
        signalFreshness: 'hot',
        signals: { founder_venting: true, social_pain_signal: true, window_open: true },
      }));

    if (leads.length) console.log(`Founder venting: ${leads.length} IDENTIFIABLE owners publicly describing their pain — red hot`);
    if (painLanguage.length) console.log(`Pain language: captured ${painLanguage.length} verbatim owner quotes (sharpens every pitch)`);
    return { leads, painLanguage };
  } catch(e) {
    console.log('Founder-venting engine failed:', e.message);
    return { leads: [], painLanguage: [] };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GOLDEN TICKET #1 — BUSINESSES FOR SALE
// ═══════════════════════════════════════════════════════════════════════════
// I previously DISABLED this because the scraper returned 0 results. That was the
// wrong fix — I killed the signal instead of repairing it. This is arguably the
// single most motivated buyer that exists:
//
//   · An owner selling wants MAXIMUM VALUATION. At a 3-5x EBITDA multiple, every
//     $1 of new annual profit becomes $3-5 of exit value. A $65k profit lift is a
//     $200k-$325k bump in what he walks away with.
//   · He has a HARD DEADLINE. Improvements made now show up in the trailing
//     financials a buyer will scrutinize.
//   · He is ALREADY thinking about the business as an asset to improve.
//   · He IS the decision-maker — the seller is the owner, by definition.
//
// AND THE LISTING HANDS US THE FIRMOGRAPHICS FOR FREE: revenue, cash flow,
// employee count, industry, location, asking price. Data we normally pay for.
//
// The old version guessed at BizBuySell's URL structure and got nothing.
// This uses Firecrawl /search, which actually reaches the listings.
const findBusinessesForSale = async (fcKey, apiKey) => {
  if (!fcKey || !apiKey) return [];
  try {
    const queries = [
      'site:bizbuysell.com business for sale established cash flow owner retiring',
      '"business for sale" "seller financing" OR "owner retiring" established revenue cash flow',
    ];
    const batches = await Promise.all(
      queries.map(q => firecrawlSearch(fcKey, q, 5, false).catch(() => []))
    );
    const hits = batches.flat().slice(0, 8);
    if (hits.length === 0) { console.log('For-sale: no listings found'); return []; }

    const corpus = hits.map(h => `--- ${h.title}\nURL: ${h.url}\n${h.description}\n${h.content}`).join('\n\n').slice(0, 20000);

    const r = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: `These are business-for-sale listings scraped from the web.

TASK: Extract each REAL business being sold, with its firmographics.

RULES:
- Only report businesses that are ACTUALLY LISTED FOR SALE with real detail.
- SKIP anything that is a category page, a broker's homepage, an ad, or a generic "browse businesses" page.
- SKIP listings with no revenue/cash-flow figure — without financials it is not actionable.
- SKIP franchises-for-sale-as-a-concept (we want an existing operating business, not a franchise opportunity).
- Report figures EXACTLY as stated. Never estimate.
- Prefer listings that name the business or make it identifiable. If it is fully anonymous ("established HVAC company in Texas"), still include it — but say so, because we may be able to identify it later.

Return ONLY valid JSON:
{"listings":[{
  "name":"business name, or a precise description if anonymized",
  "industry":"e.g. HVAC, trucking, dental practice",
  "location":"city, state",
  "revenue":"as stated, e.g. $2.4M",
  "cashFlow":"as stated (this is the EBITDA the multiple applies to)",
  "askingPrice":"as stated",
  "employees": number or null,
  "reason":"stated reason for selling, if given (retiring, health, etc.)",
  "url":"listing URL",
  "identifiable": true/false
}]}

LISTINGS:
${corpus}` }]
      }),
    }, 35000);

    const d = await r.json();
    let text = (d.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    const fb = text.indexOf('{'); let lb = text.lastIndexOf('}');
    if (fb >= 0 && lb > fb) text = text.slice(fb, lb + 1);
    // The listings array is long and often gets truncated at max_tokens, which
    // made JSON.parse throw "Unexpected end of JSON input" and silently return
    // [] every run — the whole reason BizBuySell looked dead. Repair a truncated
    // object the same way the critique pass does: drop the last incomplete
    // element, then close any open brackets/braces.
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      let repaired = text;
      const lastComplete = repaired.lastIndexOf('}');
      if (lastComplete > 0) repaired = repaired.slice(0, lastComplete + 1);
      if ((repaired.match(/"/g) || []).length % 2 !== 0) repaired += '"';
      const opensArr = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length;
      const opensObj = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;
      if (opensObj > 0) repaired += '}'.repeat(opensObj);
      if (opensArr > 0) repaired += ']'.repeat(opensArr);
      try { parsed = JSON.parse(repaired); }
      catch { console.log('For-sale: JSON unrepairable, skipping run'); return []; }
    }

    const out = (parsed.listings || [])
      .filter(l => l.name && l.name.length > 3)
      .map(l => ({
        name: l.name,
        website: '',
        location: l.location || '',
        industry: l.industry || '',
        revenue: l.revenue || '',
        cashFlow: l.cashFlow || '',
        askingPrice: l.askingPrice || '',
        employees: l.employees || null,
        source: 'for_sale',
        icpProfile: 'exit_prep',
        jobUrl: l.url || '',
        // Selling owners are maximally motivated AND directly reachable.
        // Every $1 of profit we add multiplies into the sale price.
        jobTitle: `FOR SALE — ${l.revenue || 'revenue undisclosed'}${l.cashFlow ? ', ' + l.cashFlow + ' cash flow' : ''}${l.reason ? ' · ' + l.reason : ''}. Every $1 of new profit multiplies 3-5x into their exit.`,
        signals: {
          preparing_for_exit: true,
          // An owner listing it himself (not via a broker) is directly reachable
          brokerPosted: /broker|brokerage|advisors|business brokers/i.test(l.url || ''),
        },
        exitContext: {
          revenue: l.revenue, cashFlow: l.cashFlow, askingPrice: l.askingPrice,
          reason: l.reason, identifiable: l.identifiable,
        },
      }));

    console.log(`For-sale: ${out.length} businesses actively listed (the most motivated buyer that exists)`);
    return out;
  } catch(e) {
    console.log('findBusinessesForSale failed:', e.message);
    return [];
  }
};

const searchFacebookAds = async (fbToken) => {
  if (!fbToken) return [];
  const results = [];
  const searches = [
    'SaaS software',
    'e-commerce store',
    'professional services',
    'B2B company',
    'healthcare clinic',
    'real estate',
    'fitness gym',
    'restaurant',
  ];
  try {
    for (const term of searches.slice(0, 4)) {
      try {
        const url = `https://graph.facebook.com/v19.0/ads_archive?access_token=${fbToken}&ad_reached_countries=US&ad_active_status=ACTIVE&search_terms=${encodeURIComponent(term)}&fields=page_name,page_id,ad_delivery_start_time,spend&limit=10`;
        const r = await fetchT(url, {}, 8000);
        const d = await safeJson(r);
        if (d.error) { console.log('FB Ads error:', d.error.message); continue; }
        (d.data || []).forEach(ad => {
          if (!ad.page_name) return;
          const daysRunning = ad.ad_delivery_start_time
            ? Math.floor((Date.now() - new Date(ad.ad_delivery_start_time)) / 86400000)
            : 0;
          results.push({
            name: ad.page_name,
            website: `https://facebook.com/${ad.page_id}`,
            jobTitle: `Running Facebook Ads${daysRunning > 90 ? ` for ${daysRunning} days — stale creative` : ''}`,
            source: 'facebook_ads',
            signals: {
              running_fb_ads: true,
              stale_ads: daysRunning > 90,
              needs_marketing: true,
            },
          });
        });
      } catch(e) { /* silent */ }
    }
    // Dedupe
    const seen = new Set();
    const unique = results.filter(r => {
      const k = r.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    console.log(`Facebook Ads: ${unique.length}`);
    return unique;
  } catch(e) {
    console.error('Facebook Ads error:', e.message);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 5: REDDIT RSS — founders in active pain
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 6: PRODUCT HUNT — just launched
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 7: PR NEWSWIRE — expansions + hires
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// MASTER DISCOVERY — all 7 sources fire simultaneously
// Total budget: ~8 seconds (Render free tier safe)
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// FOUNDER-REACHABILITY SCORE — the ICP is not "who needs us" but
// "who will actually reply to a cold audit and can say yes alone."
// That means: owner-led, no CMO/procurement layer, reachable directly.
// We score this UPFRONT from signals each source can actually see,
// so we never waste a research call on an unreachable enterprise.
// Returns { score: 0-30, reasons: [], hardBlock: bool }
// ═══════════════════════════════════════════════════════════
const ENTERPRISE_HINTS = /\b(inc\.?|corporation|corp\.?|holdings|group|global|international|worldwide|enterprises|industries|systems|technologies|solutions|partners|associates|llc)\b/i;
const OWNER_LED_HINTS = /\b(family|family-owned|founder|owner|studio|shop|boutique|co\.|& sons|& co|and sons)\b/i;

// ═══════════════════════════════════════════════════════════════════════════
// REACHABILITY — P(this person reads a cold email AND can act on it)
// ═══════════════════════════════════════════════════════════════════════════
// REBUILT on real benchmark data (Belkins 7.5M emails, Sales.co 2M emails,
// Saleshandy 53M emails, 2025-2026), not intuition. What the data actually says:
//
//   · COMPANY SIZE is the strongest predictor and it is near-linear.
//     1-10 employees   → 2.40% reply, 18.2% POSITIVE
//     11-50            → strong
//     5,000+           → 1.37% reply, only 3.4% positive  (5.3x worse QUALITY)
//
//   · FOUNDERS/OWNERS are the most responsive seniority — beating C-level by 35%
//     and VPs by 80%. No EA filtering, no procurement chain, can say yes this week.
//
//   · 70% of all positive C-level replies come from companies with 1-50 employees.
//     Our ICP is not just good — it is where nearly all the yield lives.
//
//   · VERIFIED emails get ~2x the reply rate of unverified. (Bounces also poison
//     the sending domain, so this is doubly weighted.)
//
//   · ADVANCED personalization (real pain + recent trigger) → 17-18% reply,
//     vs 7-9% for generic. Another ~2x.
//
// ARCHITECTURE FIX: the old version read verifiedCEO and publicPainSignals at
// FIND time — where they are ALWAYS empty (they only get populated during
// Research). So it was silently scoring off headcount alone and calling it
// reachability. Now it runs in two modes and is RECOMPUTED after research, so
// the score actually reflects what we know at the moment we know it.
// ═══════════════════════════════════════════════════════════════════════════

// How likely is a person with THIS title, at a company of THIS size, to both
// reply AND be able to buy? The data shows this interaction matters enormously:
// a founder at 20 people is the single best target on earth; a CEO at 400 is
// insulated and slow; a Director at 300 replies well but cannot sign a $50k build.
// ═══════════════════════════════════════════════════════════════════════════
// SIGNAL ENGINE — freshness, decay, and ACTIVE stacking
// ═══════════════════════════════════════════════════════════════════════════
// Grounded in 2026 signal-based-selling benchmarks:
//
//   · Gartner: 99% of B2B purchases are triggered by a specific organizational
//     change. Not by good copy. By an EVENT.
//   · Only 5% of any market is in a buying window at a given moment. The other
//     95% will not engage no matter how good the email is. Find's ONLY job is to
//     isolate that 5%.
//   · SIGNAL STACKING is the whole game:
//        1 signal  → ~20% true-positive rate
//        2 signals → 50-60% true-positive rate   (2.5-3x better leads)
//     Our logs said "0 stacked" on EVERY run — because we were waiting for two
//     sources to coincidentally find the same company. That almost never happens.
//     THE FIX: stop waiting for coincidence. ACTIVELY go look for a second signal
//     on the companies we already found.
//   · SIGNAL DECAY is real: "intent data from three weeks ago is nearly worthless."
//     Funding decays 50% every 60 days. We were treating a 29-day-old job posting
//     exactly like one posted this morning.
//   · Emails referencing a specific trigger event: 18% reply vs 3.43% generic (5x).
//
// THE CORE INSIGHT FOR CROJUNGLE:
// When a company posts a job for a Scheduler / Dispatcher / Data Entry Clerk,
// they have ALREADY: identified the problem, allocated ~$55k of budget, and
// started a buying process — but have NOT yet committed. That is a live buying
// window with a hard closing date. We are not cold-pitching; we are intercepting
// a purchase decision already in motion and offering a better way to spend money
// they have already decided to spend. Once they hire, the window slams shut.
// ═══════════════════════════════════════════════════════════════════════════

// Every signal, weighted by real conversion power and given a decay half-life.
const SIGNAL_TIERS = {
  // ── TIER 1: the buying window is OPEN and we can still intercept ──────────
  // ═══ THE PERFECT STORM ═══════════════════════════════════════════════════
  // Hiring manual ops roles AND a marketing person at the same time. They need
  // the BUILD and the RETAINER. Budget allocated on both fronts, decision made
  // on neither. This is the single best lead the system can produce.
  needs_both_products:  { weight: 45, halfLife: 21, tier: 1, label: 'PERFECT STORM — hiring ops roles AND a marketing person. Needs the build AND the retainer.' },

  // ═══ THE RETAINER WINDOW (ICP #3 & #4) — CROJungle's core product ════════
  // They posted a marketing role. They have ALREADY decided to spend ~$70k/yr on
  // marketing. They have NOT decided how. CROJ offers a full senior team for the
  // price of that one junior hire. We were completely blind to this until now.
  hiring_marketing:     { weight: 34, halfLife: 21, tier: 1, label: 'Hiring a marketing person — budget allocated, direction NOT chosen. The retainer pitch writes itself.' },

  sba_funded:           { weight: 34, halfLife: 75, tier: 1, label: 'Just took an SBA loan — growth capital allocated at a MAIN-STREET SMB. Highest-ICP funding signal there is.' },
  perfect_icp_fit:      { weight: 20, halfLife: 21, tier: 1, label: 'Exact ICP match — found in their own industry, not by accident' },
  ai_replacement_heavy: { weight: 38, halfLife: 21, tier: 1, label: 'Drowning in manual labor — multiple roles across multiple functions' },
  ai_replacement_multi: { weight: 30, halfLife: 21, tier: 1, label: 'Hiring several manual roles — the owner is buried in ops' },
  // ═══ BUSINESSES FOR SALE — the most motivated buyer that exists ═══════════
  // At a 3-5x EBITDA multiple, every $1 of new annual profit becomes $3-5 of EXIT
  // VALUE. A $65k profit lift = $200k-$325k more in his pocket. He has a hard
  // deadline, he already thinks of the business as an asset to improve, and the
  // seller IS the owner — directly reachable by definition.
  preparing_for_exit:   { weight: 36, halfLife: 90, tier: 1, label: 'FOR SALE — every $1 of new profit multiplies 3-5x into their exit price. Maximum motivation, hard deadline, owner IS the seller.' },

  // ═══ OWNER PUBLICLY ASKING FOR HELP — the highest-intent signal there is ══
  // Someone posting "I'm drowning in scheduling, how do I automate this?" is
  // literally raising their hand. Nothing beats a self-declared problem.
  founder_venting:      { weight: 40, halfLife: 30, tier: 1, label: 'Owner is PUBLICLY asking for help with exactly what we sell — self-declared intent' },

  // ═══ EXECUTIVE-CHANGE SIGNALS — CORROBORATORS, NOT STANDALONE LEADS ══════
  // Hard-won insight: "a new VP of Sales" alone is a WEAK signal. It tells us a
  // title changed at SOME company — nothing about whether they're a fit, reachable,
  // or need us. A new VP of Sales at a 5,000-person enterprise is useless.
  //
  // These signals only become valuable when they STACK on a company we already
  // like: a new VP of Sales AT A SMALL COMPANY THAT'S ALREADY HIRING and has no
  // marketing team is gold — he has quota, no pipeline, and no one to feed him.
  //
  // So we weight them LOW as standalone (they won't surface a lead on their own)
  // but the stack multiplier makes them powerful when they corroborate an Adzuna
  // or EDGAR company. A title change is a MULTIPLIER on fit, never a substitute.
  new_sales_leader:     { weight: 12, halfLife: 60, tier: 3, label: 'New VP of Sales / CRO — quota, no pipeline, no marketing team. Strong ONLY when it stacks with a fit signal.' },
  new_ops_leader:       { weight: 10, halfLife: 60, tier: 3, label: 'New COO / VP of Ops — hired to fix operations. A corroborator, not a lead on its own.' },
  new_owner:            { weight: 14, halfLife: 90, tier: 3, label: 'New owner — wants growth, not attached to the old way. Strong when it stacks with hiring/ad signals.' },
  agency_pain:          { weight: 30, halfLife: 45, tier: 1, label: 'Just fired their agency — already tried cheap, it failed' },

  // ── TIER 2: they have budget and a live problem ──────────────────────────
  ai_replacement_signal:{ weight: 18, halfLife: 21, tier: 2, label: 'Hiring a manual role — automatable spend' },
  raised_funding:       { weight: 22, halfLife: 60, tier: 2, label: 'Recently raised — has cash, pre-CMO, founder still owns GTM' },
  running_ads:          { weight: 24, halfLife: 7,  tier: 2, label: 'Actively spending on ads — real budget flowing into a funnel we can audit' },
  growth_pain:          { weight: 22, halfLife: 45, tier: 2, label: 'Publicly saying they cannot keep up — growth has outrun their systems' },

  // ── TIER 3: context that sharpens a pitch but does not create a window ────
  expansion:            { weight: 12, halfLife: 45, tier: 3, label: 'Expanding — new location or scaling operations' },
  recently_acquired:    { weight: 10, halfLife: 60, tier: 3, label: 'Recently acquired — systems in flux' },
  rebranding:           { weight: 8,  halfLife: 60, tier: 3, label: 'Rebranding — digital presence under review' },
  recently_launched:    { weight: 8,  halfLife: 45, tier: 3, label: 'Just launched something new' },
};

// Exponential decay. A signal at its half-life is worth 50% of its fresh value.
// This is what stops us treating a 29-day-old job posting like today's.
const decayMultiplier = (ageDays, halfLife) => {
  if (ageDays == null) return 0.6;              // unknown age — assume middling
  if (ageDays <= 2) return 1.15;                // BURNING. Fresher than fresh.
  return Math.max(0.15, Math.pow(0.5, ageDays / halfLife));
};

// ── STACK RECONCILIATION ─────────────────────────────────────
// A "stack" means the SAME company was surfaced by TWO GENUINELY INDEPENDENT
// sources. That is a claim about EVIDENCE, so it gets exactly one source of
// truth: c.sources (written by the dedup merge), unioned with any source added
// by an ACTIVE check that went out and asked about this specific company.
//
// WHAT THIS REPLACES, AND WHY:
// stackSignalsOnLeads() looked every lead up in an index built from newsLeads /
// edgarLeads - which were `unique.filter(...)`, i.e. SUBSETS OF THE VERY ARRAY
// IT WAS ITERATING. So every news lead found ITSELF in newsIndex, and every
// EDGAR lead found ITSELF in edgarIndex. Each one got:
//     stackedSources = ['news_google','news_google']   // length 2
// which scoreSignals() read as nSources >= 2, awarding a 1.6x score multiplier
// and the badge "STACKED - 2 independent signals on the same account", plus a
// stackEvidence line rendered in the UI. All of it fabricated from a company
// matching itself.
//
// It could never have worked. Dedup runs FIRST and has already collapsed every
// true cross-source duplicate into one entry. Anything still standing as its own
// row in `unique` is, by construction, NOT a duplicate. So the function was
// incapable of producing a TRUE stack and capable only of producing FALSE ones -
// and it inflated precisely the leads we would have emailed first.
//
// The Set union below makes self-stacking structurally impossible: a Set cannot
// hold the same source twice. Even a future buggy caller cannot double-count.
const reconcileStackedSources = (leads) => {
  let stacked = 0;
  for (const lead of leads) {
    const s = new Set();
    for (const src of (lead.sources || [lead.source])) if (src) s.add(src);
    // Sources added by an ACTIVE third-party check (facebook_ads) are genuinely
    // independent and must survive.
    for (const src of (lead.stackedSources || [])) if (src) s.add(src);
    lead.stackedSources = [...s];
    lead.sourceCount    = lead.stackedSources.length;
    lead.stacked        = lead.stackedSources.length >= 2;
    if (lead.stacked) stacked++;
  }
  return stacked;
};

// ── THE SCORE ─────────────────────────────────────────────────────────────
// Fit × Intent × Timing, per the 2026 signal-selling framework — not a flat tally.
const scoreSignals = (c) => {
  const sig = c.signals || {};
  const age = c.signalAgeDays;
  let intent = 0;
  const firing = [];

  for (const [key, def] of Object.entries(SIGNAL_TIERS)) {
    if (!sig[key]) continue;
    const decay = decayMultiplier(age, def.halfLife);
    const pts = def.weight * decay;
    intent += pts;
    firing.push({ key, tier: def.tier, label: def.label, points: Math.round(pts), decay: +decay.toFixed(2) });
  }

  // ═══ ROLE-VOLUME SCALING — the fix for score collapse ══════════════════
  // Every AI-replacement lead fired the same 1-2 signals, so intent was flat and
  // every score converged to ~51. But a company hiring 6 manual roles across 3
  // functions is drowning FAR worse than one hiring 2 vague ops roles — and that
  // MUST separate them. Volume and function-spread are the real intensity signal.
  const roleCount = c.manualRoleCount || 0;
  const funcCount = c.manualCategories || c.functionCount || 0;
  if (roleCount > 0) {
    // +5 per role beyond the first (caps at +30 for 7+ roles)
    const volumeBonus = Math.min((roleCount - 1) * 5, 30);
    // +8 per distinct function beyond the first (a company bleeding across
    // dispatch AND CS AND data-entry is a much bigger build)
    const spreadBonus = Math.min(Math.max(funcCount - 1, 0) * 8, 24);
    intent += volumeBonus + spreadBonus;
    if (volumeBonus > 0) firing.push({ key: 'role_volume', tier: 2, label: `${roleCount} manual roles open — ${volumeBonus} pts of labor-bleed intensity`, points: volumeBonus, decay: 1 });
    if (spreadBonus > 0) firing.push({ key: 'role_spread', tier: 2, label: `Manual hiring across ${funcCount} functions — bleeding on multiple fronts`, points: spreadBonus, decay: 1 });
  }

  // ═══ THE STACK MULTIPLIER — the single biggest lever in Find ═══════════
  // Research: 1 signal = ~20% true positive. 2+ = 50-60%. That is a 2.5-3x
  // improvement in lead quality, and it is the entire reason signal-based
  // outbound beats spray-and-pray.
  const nSources = (c.stackedSources || [c.source]).filter(Boolean).length;
  const tier1Count = firing.filter(f => f.tier === 1).length;
  const distinctSignals = firing.length;

  let stackMult = 1.0;
  let stackWhy = 'Single signal';
  if (nSources >= 3 || (tier1Count >= 2 && distinctSignals >= 3)) {
    stackMult = 2.2; stackWhy = 'STACKED across 3+ independent signals — 50-60% true-positive rate';
  } else if (nSources >= 2 || (tier1Count >= 1 && distinctSignals >= 2)) {
    stackMult = 1.6; stackWhy = 'STACKED — 2 independent signals on the same account';
  } else if (distinctSignals >= 2) {
    stackMult = 1.25; stackWhy = 'Multiple signals from one source';
  }

  const score = Math.round(intent * stackMult);

  // Urgency — is the window actually open RIGHT NOW?
  const freshness = c.signalFreshness || 'unknown';
  const urgency =
    freshness === 'burning' ? 'ACT NOW — posted in the last 3 days, they have not hired yet' :
    freshness === 'hot'     ? 'Window open — still interviewing, we can intercept' :
    freshness === 'warm'    ? 'Window closing — they may have candidates' :
    freshness === 'cooling' ? 'Window nearly shut — likely close to an offer' :
    freshness === 'stale'   ? 'Window closed — almost certainly hired' :
                              'Timing unknown';

  return {
    intentScore: Math.min(130, score),
    firing: firing.sort((a, b) => b.points - a.points),
    stackMult,
    stackWhy,
    stackedSources: c.stackedSources || [c.source],
    urgency,
    freshness,
    isStacked: stackMult > 1.25,
  };
};

const scoreReachability = (c) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // REACHABILITY — the spine of the whole system. One question, plainly:
  // CAN WE PUT AN EMAIL IN FRONT OF THE DECISION-MAKER WHO FEELS THE PROBLEM?
  // Built only from live signals. Base is set by the reachability OUTCOME, then a
  // few small modifiers. No inert Adzuna/Clutch logic, no name-guessing.
  // ═══════════════════════════════════════════════════════════════════════════
  const sig = c.signals || {};
  const reasons = [];

  const dm = (c.decisionMaker && c.decisionMaker.name) ? c.decisionMaker : null;
  const owner = (dm && dm.name) || c.verifiedCEO || null;
  const foundOwner = !!owner;

  const ownerTokens = String(owner || '').toLowerCase().split(/\s+/).filter(w => w.length >= 3);
  const addr = (c.email || (c.emailResult && c.emailResult.email) || '').toLowerCase();
  const local = (addr.split('@')[0] || '').replace(/[^a-z.]/g, '');
  const tier = c.emailResult ? c.emailResult.tier : null;
  const deliverable = tier === 1 || tier === 2;      // verified real mailbox
  const patternEmail = tier === 3;                   // built from pattern, unverified
  const ROLE_INBOX = /^(info|sales|contact|office|admin|hello|hi|team|support|help|enquir|inquir|marketing|general|mail|reception|account|billing|service|customer|hr|jobs|careers|press|media|noreply|no-?reply|donotreply|webmaster|postmaster)/;
  const isRoleInbox = !!local && ROLE_INBOX.test(local);
  const personalMailbox = !!local && !isRoleInbox && /^[a-z]+(\.[a-z]+)?$/.test(local);
  const emailMatchesOwner = ownerTokens.length > 0 && !!local && localMatchesName(local, ownerTokens);
  // A SENIOR OPERATOR (GM, VP, Director, Partner, Principal) at a small business is
  // close to the owner, feels the pain, and can forward or influence the buy — worth
  // reaching, just not as the confirmed owner. A TRUE JUNIOR (coordinator, assistant,
  // HR, rep) would just burn the lead.
  const seniorOperator = /\b(gm|general manager|vice president|\bvp\b|director|partner|principal|managing|owner|founder|president|ceo|coo|chief)\b/i.test((dm && dm.title) || '');
  const trueJunior = /\b(coordinator|specialist|associate|assistant|recruiter|\bhr\b|clerk|receptionist|intern|apprentice|technician|customer service)\b/i.test((dm && dm.title) || '') && !seniorOperator;
  const juniorTitle = trueJunior;
  // Owner-level is a TITLE question, not an email question. Matching the mailbox to
  // the person only proves we found THEIR inbox — a Director of Marketing with a
  // matching email is still a Director of Marketing. Including emailMatchesOwner here
  // let a held-back contact (authority 35) score 92 as "decision-maker reachable".
  const ownerLevelTitle = /\b(owner|founder|president|ceo|coo|principal|managing (partner|director)|proprietor)\b/i.test((dm && dm.title) || '');

  // ── CORE OUTCOME (sets the base) ──────────────────────────────────────────
  let score;
  if (foundOwner && deliverable && (emailMatchesOwner || personalMailbox) && !juniorTitle) {
    score = 92; reasons.push(`${owner} identified with a verified personal mailbox (${local}@\u2026) — we reach the decision-maker directly`);
  } else if (foundOwner && deliverable && !juniorTitle) {
    score = 74; reasons.push(`${owner} identified and we have a verified email — reaches a real person (not confirmed as their personal box)`);
  } else if (foundOwner && (patternEmail || personalMailbox) && !juniorTitle) {
    score = 58; reasons.push(`${owner} identified; email likely but unverified — verify before sending`);
  } else if (foundOwner && isRoleInbox) {
    score = 38; reasons.push(`${owner} identified, but the only email is a shared inbox (${local}@\u2026) — a gatekeeper reads it, not them`);
  } else if (foundOwner) {
    score = 34; reasons.push(`${owner} identified, but no usable email yet`);
  } else if (deliverable && personalMailbox) {
    if (tier === 1) { score = 52; reasons.push(`Personal mailbox published on their own site (${local}@\u2026) — a real person reads this; confirm they're the owner/decision-maker before pitching hard`); }
    else { score = 30; reasons.push(`A verified personal mailbox exists (${local}@\u2026) but we could not confirm whose — identify the owner first`); }
  } else {
    score = 12; reasons.push('No decision-maker identified — we cannot confirm who to reach');
  }
  // SENIOR-OPERATOR FALLBACK: not the owner, but a senior person we CAN reach — give
  // a moderate, sendable score (they influence/forward the buy) with a verify flag.
  if (foundOwner && seniorOperator && !ownerLevelTitle) {
    if (deliverable) { score = Math.min(Math.max(score, 60), 66); }
    else if (patternEmail || personalMailbox) { score = Math.min(Math.max(score, 52), 58); }
    reasons.push(`Reaching ${dm && dm.name} (${(dm && dm.title) || 'senior'}) — a senior operator, not the confirmed owner. They likely feel the pain and can forward or influence the buy; verify authority before pitching hard.`);
  }
  if (foundOwner && trueJunior && !emailMatchesOwner) {
    score = Math.min(score, 38);
    reasons.push(`Contact title "${dm && dm.title}" is a junior role below buying authority — find the owner/founder`);
  }

  // ── BUSINESS-TYPE reachability confidence (who actually runs this place?) ──
  if (sig.local_owner_operated && sig.consolidation_risk) {
    reasons.push('Practice in a PE/DSO-consolidating field — confirm a real owner exists (a group-owned location has no reachable owner)');
  } else if (sig.local_owner_operated) {
    score += 6; reasons.push('Local owner-operated business — the owner runs the shop and reads their own email');
  }
  if (sig.preparing_for_exit || c.source === 'for_sale') {
    if (c.brokerPosted) reasons.push('For-sale via broker — a middleman sits between us and the owner');
    else { score += 8; reasons.push('Owner is personally selling — maximally motivated and directly reachable'); }
  }
  if (sig.founder_venting) { score += 6; reasons.push('Owner publicly asking for help — in the weeds and clearly reachable'); }

  // ── SIZE sanity: too big = owner insulated (only when we VERIFIED the count) ──
  if (c.verifiedEmployees) {
    const e = c.verifiedEmployees;
    if (e > 500)      { score -= 30; reasons.push(`${e} employees — too large, the owner does not read cold email`); }
    else if (e > 200) { score -= 10; reasons.push(`${e} employees — a marketing/exec layer likely sits between us and the owner`); }
  }

  // ── DO WE HAVE A PAIN TO NAME? (the "how do they know this" hook that earns the reply) ──
  if (c.publicPainSignals && c.publicPainSignals.length > 0) {
    score += 5; reasons.push('We have a specific, evidenced pain to open with — the "how do they know this" hook');
  }

  let capped = Math.max(0, Math.min(100, Math.round(score)));
  // After Research has actually run, no owner found = a poor send, full stop.
  const researchHasRun = !!(c.emailResult || c.decisionMaker !== undefined);
  if (researchHasRun && !foundOwner) capped = Math.min(capped, 25);

  return {
    score: capped,
    reasons,
    hardBlock: false,
    verdict:
      capped >= 80 ? 'Excellent — decision-maker identified and directly reachable' :
      capped >= 60 ? 'Good — reaches a real person; verify the contact' :
      capped >= 40 ? 'Moderate — reachable but the contact needs confirmation' :
                     'Poor — decision-maker not confirmed reachable',
    stage: (c.decisionMaker || c.emailResult) ? 'researched' : 'pre-research',
  };
};

app.get('/api/verify-website', async (req, res) => {
  const { url, company } = req.query;
  if (!url || !company) return res.status(400).json({ error: 'url and company required' });
  try {
    const r = await fetchT(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }, redirect: 'follow' }, 8000);
    const html = await safeText(r);
    const lc = html.toLowerCase();
    const companyWords = company.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
    const mentionsCompany = companyWords.some(w => lc.includes(w));
    const is404 = r.status === 404 || r.status === 410;
    // A 200/301/302/403 with real HTML = site is alive. Firecrawl will scrape it
    // during research even if a plain fetch gets a bot wall. Only a hard 404/410
    // or a totally dead connection is a real problem.
    const isAlive = r.status < 400 || r.status === 403 || r.status === 401 || r.status === 429;
    let verdict;
    if (is404) verdict = 'dead';
    else if (isAlive && mentionsCompany) verdict = 'ok';
    else if (isAlive) verdict = 'ok_unconfirmed'; // alive but couldn't confirm name (bot wall) — allow
    else verdict = 'wrong_site';
    console.log(`Verify ${url}: status=${r.status} verdict=${verdict}`);
    res.json({ ok: verdict === 'ok' || verdict === 'ok_unconfirmed', status: r.status, mentionsCompany, is404, verdict, finalUrl: r.url || url });
  } catch(e) {
    // Connection failed — often the site blocks datacenter IPs. Firecrawl can
    // still reach it. Treat as "probably fine, proceed" rather than a hard fail.
    console.log(`Verify ${url}: fetch failed (${e.message}) — likely bot-block, allowing`);
    res.json({ ok: true, verdict: 'ok_unconfirmed', note: 'Could not verify from our server (site may block datacenter IPs), but Firecrawl can usually still scrape it. Proceed.', error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// LEAD AUDIT PASS — the workflow step between Find and Research.
// Verifies COMPANY SIZE on the whole queue using only AUTHORITATIVE, mostly-free
// sources. This is NOT an AI guess — it reads real headcount from databases and
// refuses to fabricate. A lead the databases don't know stays honestly "unverified".
//
// SOURCE CASCADE (most accurate first):
//   1. The Companies API by DOMAIN (simplified=true = FREE) — most reliable
//   2. The Companies API by NAME (free, STRICT match — rejects scam/mismatch)
//   3. Wikipedia (catches famous enterprises)
//   4. SEC EDGAR (files 10-Ks => public => enterprise)
//
// VERDICTS:
//   verified_smb   — confirmed 1-200 employees        → keep, boost
//   too_big        — confirmed >200 employees         → remove
//   unverified     — not in any database              → keep but flag (honest unknown)
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/audit-leads', async (req, res) => {
  const { leads, companiesApiKey, pdlKey } = req.body;
  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'leads array required' });
  }

  const ICP_MAX = 200;
  const results = [];
  let verifiedSmb = 0, tooBig = 0, unverified = 0;

  // Authoritative size lookup for ONE lead. Returns { employees, source, band } or null.
  const authoritativeSize = async (lead) => {
    // ── 1. Companies API by DOMAIN (free simplified) — most accurate ──
    if (companiesApiKey && lead.website) {
      const byDomain = await enrichViaCompaniesAPI(lead.website, companiesApiKey);
      if (byDomain && byDomain.employees) {
        return { employees: byDomain.employees, band: byDomain.empBand, industry: byDomain.industry, source: 'companiesapi-domain' };
      }
      // domain resolved but no headcount — remember the resolved site
      if (byDomain && byDomain.website && !lead.website) lead.website = byDomain.website;
    }
    // ── 2. Companies API by NAME (free, strict match) ──
    if (companiesApiKey) {
      const byName = await searchCompaniesAPIByName(lead.name, companiesApiKey);
      if (byName && byName.employees) {
        return { employees: byName.employees, band: byName.empBand, industry: byName.industry, source: 'companiesapi-name' };
      }
      if (byName && byName.website && !lead.website) lead.website = byName.website;
    }
    // ── 3. People Data Labs by NAME (70M+ profiles incl. SMBs the others miss) ──
    if (pdlKey) {
      const pdl = await getPDLSize(lead.name, pdlKey, lead.location);
      if (pdl && pdl.employees) {
        return { employees: pdl.employees, band: pdl.band, industry: pdl.industry, source: 'peopledatalabs' };
      }
    }
    // ── 4. Wikipedia (famous enterprises) ──
    const wiki = await getSizeOnly(lead.name);
    if (wiki && wiki.employees) {
      return { employees: wiki.employees, source: 'wikipedia' };
    }
    // ── 4. SEC EDGAR (public company = enterprise) ──
    const edgar = await getEdgarHeadcount(lead.name);
    if (edgar && edgar.isPublic) {
      return { employees: edgar.employees, source: 'edgar-public' };
    }
    return null; // genuinely unknown — do NOT fabricate
  };

  // Process in small concurrent batches with a pause between them (rate-safe).
  const BATCH = 5;
  for (let i = 0; i < leads.length; i += BATCH) {
    const batch = leads.slice(i, i + BATCH);
    const settled = await Promise.allSettled(batch.map(authoritativeSize));
    batch.forEach((lead, idx) => {
      const r = settled[idx];
      const size = (r.status === 'fulfilled') ? r.value : null;
      let verdict, employees = null, source = null, note;
      if (size && size.employees) {
        employees = size.employees; source = size.source;
        if (employees > ICP_MAX) {
          verdict = 'too_big';
          note = `${employees} employees (${source}) — above the 200-employee ICP ceiling`;
          tooBig++;
        } else {
          verdict = 'verified_smb';
          note = `${employees} employees (${source}) — confirmed within ICP`;
          verifiedSmb++;
        }
      } else {
        verdict = 'unverified';
        note = 'Not found in any company database — size could not be confirmed';
        unverified++;
      }
      results.push({
        id: lead.id,
        name: lead.name,
        verdict,
        verifiedEmployees: employees,
        sizeSource: source,
        website: lead.website || null,
        note,
      });
    });
    // gentle pause between batches so we never trip a rate limit
    if (i + BATCH < leads.length) await new Promise(r => setTimeout(r, 500));
  }

  console.log(`Audit: ${leads.length} checked → ${verifiedSmb} verified SMB, ${tooBig} too big (removed), ${unverified} unverified`);
  res.json({
    results,
    summary: { total: leads.length, verifiedSmb, tooBig, unverified },
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULED AUTO-DISCOVERY (Render Cron)
// Runs Find automatically on a schedule with NO browser open. Reads API keys
// from Render environment variables (set once in the Render dashboard), runs
// the normal discovery pipeline, and saves fresh leads straight to Supabase so
// they appear in the app next time you open it.
//
// TheirStack costs credits, so it's GATED: it only runs if TS_MIN_HOURS have
// passed since its last cron run (tracked in Supabase). Free sources run every
// time. This lets you run free sources 3-4x/day while TheirStack stays ~2x/week.
//
// SECURITY: protected by a secret token (CRON_SECRET env var) so only Render's
// scheduler can trigger it.
// ═══════════════════════════════════════════════════════════════════════════
const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_KEY || '';

// Minimal Supabase REST helper (server-side)
const sbRest = async (path, options = {}) => {
  if (!SB_URL || !SB_KEY) return null;
  try {
    const r = await fetch(SB_URL + '/rest/v1' + path, {
      ...options,
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=minimal',
        ...(options.headers || {}),
      },
    });
    if (!r.ok) { console.log('Supabase REST error', r.status, await r.text()); return null; }
    const t = await r.text();
    return t ? JSON.parse(t) : null;
  } catch (e) { console.log('Supabase REST failed:', e.message); return null; }
};

// ── COMPANY SIZE CACHE (Supabase) ───────────────────────────────────────────
// The Companies API charges 1 credit per full enrich. Company headcount barely
// moves week to week, so we pay ONCE per domain and reuse it forever. This turns
// 500 credits from a per-run burn into a durable asset — after the first couple
// of runs, most sizing is free. TTL 45 days (re-verifies quarterly-ish).
// Requires a Supabase table:
//   create table company_size_cache (
//     domain text primary key, employees int, band text, industry text,
//     src text, updated_at timestamptz default now());
const SIZE_CACHE_TTL_MS = 45 * 24 * 60 * 60 * 1000;
const cleanDomainOf = (url) => (url || '')
  .replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
const getCachedSize = async (domain) => {
  if (!domain || !SB_URL || !SB_KEY) return null;
  const rows = await sbRest(
    `/company_size_cache?domain=eq.${encodeURIComponent(domain)}&select=domain,employees,band,industry,src,updated_at`,
    { method: 'GET', prefer: 'return=representation' }
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;
  if (Date.now() - new Date(row.updated_at).getTime() > SIZE_CACHE_TTL_MS) return null; // stale
  return {
    employees: row.employees || null, band: row.band || null, industry: row.industry || null,
    source: (row.src || 'cache') + '-cached', sizeConfidence: 'trusted',
    website: 'https://' + domain, cached: true,
  };
};
const cacheSize = async (domain, data) => {
  if (!domain || !SB_URL || !SB_KEY || !data) return;
  await sbRest('/company_size_cache?on_conflict=domain', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: JSON.stringify([{
      domain,
      employees: data.employees || null,
      band: data.band || data.empBand || null,
      industry: data.industry || null,
      src: data.source || 'companiesapi',
      updated_at: new Date().toISOString(),
    }]),
  });
};

// ── CONTACT CACHE (Supabase) — the big credit saver ─────────────────────────
// Owner-finding is the single most expensive step (Firecrawl map + 2 page scrapes
// + web searches + LLM extraction). Owners and email patterns barely change, so we
// cache them per domain and reuse — re-researching a lead becomes nearly free.
// QUALITY GUARD: we ONLY cache a CONFIDENT result (a corroborated/high-confidence
// owner, or a Tier 1-2 verified email). A weak guess is never cached, so the cache
// can never lock in a bad answer — a low-confidence lead gets re-searched fresh.
// Requires a Supabase table:
//   create table contact_cache (
//     domain text primary key, owner_name text, owner_title text,
//     owner_sources text, owner_confidence text, owner_corroborated bool,
//     email text, email_tier int, email_label text, revenue text,
//     updated_at timestamptz default now());
const CONTACT_CACHE_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const getCachedContact = async (domain) => {
  if (!domain || !SB_URL || !SB_KEY) return null;
  const rows = await sbRest(
    `/contact_cache?domain=eq.${encodeURIComponent(domain)}&select=*`,
    { method: 'GET', prefer: 'return=representation' }
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;
  if (Date.now() - new Date(row.updated_at).getTime() > CONTACT_CACHE_TTL_MS) return null; // stale
  return {
    owner: row.owner_name ? {
      name: row.owner_name, title: row.owner_title || null,
      sources: (row.owner_sources || '').split('+').filter(Boolean),
      confidence: row.owner_confidence || 'medium',
      corroborated: !!row.owner_corroborated, score: 80, cached: true,
    } : null,
    email: row.email ? { email: row.email, tier: row.email_tier || 3, label: (row.email_label || 'cached') + ' (cached)', score: row.email_tier === 1 ? 100 : row.email_tier === 2 ? 95 : 75, sendable: (row.email_tier || 3) <= 3, cached: true } : null,
    revenue: row.revenue || null,
    pain: row.pain_json ? (()=>{ try { return JSON.parse(row.pain_json); } catch { return null; } })() : null,
  };
};
const cacheContact = async (domain, { owner, email, revenue, pain }) => {
  if (!domain || !SB_URL || !SB_KEY) return;
  // Only cache CONFIDENT data — never lock in a weak guess.
  const okOwner = owner && owner.name && (owner.corroborated || owner.confidence === 'high');
  const okEmail = email && email.email && (email.tier === 1 || email.tier === 2);
  const okPain = pain && Array.isArray(pain.signals) && pain.signals.length > 0;
  if (!okOwner && !okEmail && !revenue && !okPain) return;
  await sbRest('/contact_cache?on_conflict=domain', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: JSON.stringify([{
      domain,
      owner_name: okOwner ? owner.name : null,
      owner_title: okOwner ? (owner.title || null) : null,
      owner_sources: okOwner ? (owner.sources || []).join('+') : null,
      owner_confidence: okOwner ? (owner.confidence || 'medium') : null,
      owner_corroborated: okOwner ? !!owner.corroborated : null,
      email: okEmail ? email.email : null,
      email_tier: okEmail ? email.tier : null,
      email_label: okEmail ? (email.label || null) : null,
      revenue: revenue || null,
      pain_json: okPain ? JSON.stringify(pain) : null,
      updated_at: new Date().toISOString(),
    }]),
  });
};

// Cheap name-only enterprise/staffing/health screen. Lets us SKIP paying The
// Companies API to "confirm" what a name pattern already rejects for free — so a
// credit is only ever spent on a lead that could plausibly be our ICP.
const looksLikeEnterpriseByName = (rawName) => {
  const n = (rawName || '').toLowerCase();
  if (!n) return false;
  const STAFFING = /\b(staffing|recruit(er|ing|ment)?|talent|personnel|placement|headhunt|manpower|workforce|temp agency|search partners|search group|employment (agency|partners|services))\b/;
  const ENTERPRISE = /\b(health systems?|healthcare system|medical center|health network|cruise line|airlines?|airways|university|federal|county of|city of|town of|township|state of|department of|housing authority|public schools?|municipal|cancer center|cancer institute|logistics|freight systems|truck rental|rent[- ]?a[- ]?car|dealer careers|worldwide|enterprises inc|holdings inc|construction company|automotive group|dealer group|distribution center|fulfillment center)\b/;
  const BIG_HEALTH = /\b(health care|healthcare|medical care|health system|hospital|regional medical|health plan)\b/;
  const SMALL_PRACTICE = /\b(dental|dentist|orthodont|veterinar|\bvet\b|derma|med spa|medspa|chiropract|optometr|physical therapy|family medicine|pediatric|urgent care|aesthetic)\b/;
  if (STAFFING.test(n)) return true;
  if (ENTERPRISE.test(n)) return true;
  if (BIG_HEALTH.test(n) && !SMALL_PRACTICE.test(n)) return true;
  return false;
};

// Map a discovered company to a discovered_queue row (mirrors the frontend shape)
const companyToQueueRow = (c) => ({
  id: c.id || (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40) + '_' + (c.source || 'find'),
  name: c.name || '',
  website: c.website || '',
  icp_score: c.icpScore || 0,
  source: c.source || '',
  signals: c.signals || {},
  job_title: c.jobTitle || '',
  location: c.location || '',
  manual_role_count: c.manualRoleCount || 0,
  stacked: !!c.stacked,
  reachability: c.reachability || 0,
  extra: JSON.stringify(c),
});

app.get('/api/cron/discover', async (req, res) => {
  // ── Auth: require the secret token ──
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'forbidden' });
  }
  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_KEY env vars not set' });
  }

  // ── Gather keys from env vars ──
  const adzunaId = process.env.ADZUNA_ID || '';
  const adzunaKey = process.env.ADZUNA_KEY || '';
  const firecrawlKey = process.env.FIRECRAWL_KEY || '';
  const companiesApiKey = process.env.COMPANIES_API_KEY || '';
  const theirstackKey = process.env.THEIRSTACK_KEY || '';
  const placesKey = process.env.GOOGLE_PLACES_KEY || '';
  const fbToken = process.env.FB_TOKEN || '';

  // ── Decide whether TheirStack runs this time (credit gate) ──
  const TS_MIN_HOURS = parseInt(process.env.TS_MIN_HOURS || '84', 10); // ~2x/week
  let runTheirStack = false;
  if (theirstackKey) {
    const rows = await sbRest('/cron_state?id=eq.theirstack&select=last_run');
    const last = rows && rows[0] && rows[0].last_run ? new Date(rows[0].last_run).getTime() : 0;
    const hoursSince = (Date.now() - last) / 3.6e6;
    runTheirStack = hoursSince >= TS_MIN_HOURS;
    console.log(`Cron: TheirStack last ran ${hoursSince.toFixed(1)}h ago; gate ${TS_MIN_HOURS}h → ${runTheirStack ? 'RUN' : 'skip'}`);
  }

  // ── Call the existing discover endpoint internally (reuses all logic) ──
  console.log('=== CRON DISCOVERY START ===');
  const port = process.env.PORT || 3001;
  let data;
  try {
    const r = await fetch(`http://127.0.0.1:${port}/api/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: ['SaaS', 'e-commerce', 'B2B software', 'professional services'],
        location: process.env.TARGET_LOCATION || '',
        keys: {
          adzunaId, adzunaKey, firecrawlKey, companiesApiKey, fbToken,
          // Only pass the TheirStack key when the gate allows it
          theirstackKey: runTheirStack ? theirstackKey : '',
        },
      }),
    });
    data = await r.json();
  } catch (e) {
    console.log('Cron discover call failed:', e.message);
    return res.status(500).json({ error: 'discover call failed: ' + e.message });
  }

  const companies = (data && data.companies) || [];
  if (companies.length === 0) {
    return res.json({ ok: true, added: 0, note: 'no companies returned', breakdown: data && data.breakdown });
  }

  // ── Save to Supabase (upsert — dedupes by id, so re-runs accumulate cleanly) ──
  const rows = companies.slice(0, 200).map(companyToQueueRow);
  await sbRest('/discovered_queue?on_conflict=id', {
    method: 'POST',
    body: JSON.stringify(rows),
    prefer: 'return=minimal,resolution=merge-duplicates',
  });

  // ── Record TheirStack run time if it ran ──
  if (runTheirStack) {
    await sbRest('/cron_state?on_conflict=id', {
      method: 'POST',
      body: JSON.stringify({ id: 'theirstack', last_run: new Date().toISOString() }),
      prefer: 'return=minimal,resolution=merge-duplicates',
    });
  }

  console.log(`=== CRON DISCOVERY END: ${rows.length} leads saved ===`);
  res.json({ ok: true, added: rows.length, theirstackRan: runTheirStack, breakdown: data.breakdown });
});

app.post('/api/discover', async (req, res) => {
  const { keywords, keys, apiKey } = req.body;
  const { adzunaId, adzunaKey, fbToken, firecrawlKey, companiesApiKey, theirstackKey } = keys || {};
  // Google Places key comes from Render env vars (not the frontend), so it stays
  // server-side and can't leak. Set GOOGLE_PLACES_KEY in Render's environment tab.
  const placesKey = process.env.GOOGLE_PLACES_KEY || '';

  console.log('\n=== DISCOVERY START ===');
  console.log('Keywords:', keywords);
  console.log('Adzuna keys present:', !!(adzunaId && adzunaKey));
  // DIAGNOSTIC: prove whether each key actually arrived from the frontend.
  console.log('Keys arrived →', JSON.stringify({
    adzuna: !!(adzunaId && adzunaKey),
    companiesApi: !!companiesApiKey,
    firecrawl: !!firecrawlKey,
    theirstack: theirstackKey ? ('yes, len=' + theirstackKey.length) : 'NO — key did not arrive from frontend',
  }));

  try {
    // FOUR-SOURCE SET — quality over volume, each tied to a product CROJungle sells. 
    // Parked: Clutch + Reddit (blocked without ScraperAPI), Product Hunt (wrong ICP),
    // PR Newswire (too broad). Their functions still exist above — re-enable by adding
    // them back here. Facebook Ads stays wired but returns [] until fbToken is set.
    // ═══════════════════════════════════════════════════════════════════════
    // EVERY SIGNAL SOURCE — each one catches a different buying window
    // ═══════════════════════════════════════════════════════════════════════
    const [tsRes, adzunaRes, secRes, sbaRes, newsRes, forSaleRes, ventingRes, fbAdsRes, placesRes] = await Promise.allSettled([
      // THEIRSTACK — size-filtered at the query (10-200 employees). No whales returned.
      searchTheirStack(theirstackKey),

      // ADZUNA — PULLED. It returned ~1,000 job-posters per run dominated by
      // enterprises (MetLife, Medtronic, PepsiCo…), forcing the entire size gate,
      // name blocklist, and credit spend just to filter its noise. Low yield vs.
      // Places/EDGAR/News, so it's disabled. Re-enable by restoring the call below
      // ONLY behind a hard at-source size filter.
      Promise.resolve([]), // searchAdzuna(adzunaId, adzunaKey, req.body.location),

      // JUST RAISED — capital allocated, board pressure, pre-CMO, founder still owns GTM
      searchSECEdgar(),

      // SBA LOANS — main-street growth capital, best-ICP funding signal
      searchSBALoans(),

      // TRIGGER EVENTS — expansion, new location, agency fired, new sales leader
      scrapeGoogleNews(),

      // ═══ GOLDEN TICKET: BUSINESSES FOR SALE ═══════════════════════════════
      // The single most motivated buyer that exists. At a 3-5x EBITDA multiple,
      // every $1 of new annual profit becomes $3-5 of EXIT VALUE. He has a hard
      // deadline, he's already thinking about the business as an asset to improve,
      // and the seller IS the owner — so he's directly reachable by definition.
      // The listing also hands us revenue, cash flow, and headcount for free.
      findBusinessesForSale(firecrawlKey, apiKey),

      // ═══ GOLDEN TICKET: OWNERS PUBLICLY ASKING FOR HELP ═══════════════════
      // An owner posting "I'm drowning in scheduling, how do I automate this?" is
      // the highest-intent signal that exists — they are literally raising their
      // hand. Reddit is IP-blocked from Render, but Firecrawl reaches it.
      // Most posts are anonymous; when one IS identifiable, it's red hot.
      // Either way we harvest their ACTUAL LANGUAGE for the pitch.
      findFounderVenting(firecrawlKey, apiKey),

      // CONFIRMED AD BUDGET (dormant until a Meta token is added)
      searchFacebookAds(fbToken),

      // ═══ GOOGLE PLACES — local owner-operated businesses (free tier) ═══════
      // The highest-reachability segment: the owner runs the shop and reads
      // their own email. No size data, so Research confirms owner + email.
      searchGooglePlaces(placesKey),
    ]);

    // Owner venting returns both identifiable leads AND the raw pain language
    const venting = ventingRes.value || { leads: [], painLanguage: [] };
    if (venting.painLanguage?.length) {
      console.log(`Owner pain language harvested (${venting.painLanguage.length} phrases) — use their words, not ours`);
    }

    // Defensive: any source returning a non-array (or rejecting) must never crash
    // the whole discovery. arr() coerces anything unexpected to [].
    const arr = (r) => (r && r.status === 'fulfilled' && Array.isArray(r.value)) ? r.value : [];
    const allCompanies = [
      ...arr(tsRes),
      ...arr(adzunaRes),
      ...arr(secRes),
      ...arr(sbaRes),
      ...arr(newsRes),
      ...arr(forSaleRes),
      ...(Array.isArray(venting.leads) ? venting.leads : []),
      ...arr(fbAdsRes),
      ...arr(placesRes),
    ];

    console.log('Raw total:', allCompanies.length);

    // Source volume debug — critical to see what's actually coming in
    const sourceVolume = {};
    allCompanies.forEach(c => { sourceVolume[c.source||'unknown'] = (sourceVolume[c.source||'unknown']||0)+1; });
    console.log('Source volumes BEFORE filter:', sourceVolume);

    // ── ICP FILTER — remove companies that are clearly too large ──
    const BLOCKED_COMPANIES = new Set([
      // Big tech + enterprises
      'google','amazon','apple','microsoft','meta','facebook','netflix','tesla','nvidia',
      'openai','anthropic','stripe','shopify','salesforce','hubspot','oracle','sap',
      'ibm','intel','qualcomm','adobe','zoom','slack','twitter','linkedin','uber',
      'airbnb','lyft','doordash','instacart','coinbase','robinhood','palantir',
      'snowflake','databricks','mongodb','twilio','okta','cloudflare','datadog',
      'new relic','zendesk','freshworks','servicenow','workday','paycom','paychex',
      'adp','square','block','paypal','visa','mastercard','amex','goldman sachs',
      'jpmorgan','bank of america','wells fargo','citibank','walmart','target',
      'costco','home depot','lowes','mcdonalds','starbucks','coca cola','pepsi',
      'johnson johnson','pfizer','merck','abbvie','unitedhealth','cvs','walgreens',
      'the new york times','washington post','cnn','fox','disney','warner','comcast',
      // Staffing agencies — they hire manual workers FOR others, not an ICP fit
      'robert half','aston carter','aerotek','teksystems','ttec','michael page',
      'manpower','adecco','randstad','kelly services','kelly','spherion','staffmark',
      'insight global','kforce','modis','apex group','cielo','hays','allegis',
      'volt','chs recruiting','staffworks','recruiting solutions',
      'actalent','lhh','lhh us','stride inc','stride, inc',
      // Large enterprises that keep slipping through
      'cvs','cvs health','spectrum','charter communications',
      'dollar general','dollar tree','amazon logistics','fedex','ups','usps',
      'aramark','sodexo','sysco','cintas','waste management',
      // Too large or wrong ICP caught in first run
      'honeywell','kroger','compass group','christus health','adventist health',
      'norwegian cruise line','canva','spacex','locumtenens','qureos',
      'mission healthcare','healthright 360','quadmed','gtangible',
      // Confirmed leakers from test runs
      'uline','thales','fujifilm','trinity health','berkshire hathaway',
      'entegris','sprague pest','quipt home medical',
      'mclarty','mclarty automotive','border states',
      'helen ross mcnabb','ymca','collabera',
      'state farm','circle k','social security',
      'renewal by andersen','renewal','bjs restaurants','bj restaurants',
      'green worldwide shipping','enersys',
      // Government / nonprofits / utilities
      'social security administration','social security','ymca','ywca',
      'red cross','salvation army','habitat for humanity','united way',
      // Large franchise/retail chains
      'circle k','state farm','allstate','progressive insurance',
      'dominos','dominos pizza','subway','mcdonalds','chick-fil-a','chipotle',
      'dollar general','dollar tree','family dollar','7-eleven',
      // Large staffing firms often in Adzuna
      'collabera','cybercoders','jobot','ampcus','aasritha',
      'viaplus','vinci','ao globe life','globe life',
      'kaiser','kaiser permanente','permanente','banner health','providence health',
      'ascension','commonspirit','hca healthcare','tenet healthcare','community health',
      'dignity health','advocate aurora','sutter health','northwell','mayo clinic',
      'cleveland clinic','johns hopkins','geisinger','spectrum health','intermountain',
      // Fortune 500 / large enterprises that slipped through
      'anduril','anduril industries','cigna','the cigna group','cigna group',
      'tag','schneider','schneider national','schneider electric',
      'humana','aetna','centene','molina healthcare','kaiser','kaiser permanente',
      'lockheed','lockheed martin','raytheon','northrop','northrop grumman',
      'boeing','general dynamics','l3harris','booz allen','leidos','saic',
      'mantech','caci','peraton','deloitte','kpmg','pwc','ernst young','accenture',
      'mckesson','cardinal health','amerisourcebergen','trellix','mandiant',
      'ttec','concentrix','teleperformance','conduent','cognizant','infosys','wipro',
      'tcs','tata','capgemini','dxc','ntt data','hcl','genpact',
      'marriott','hilton','hyatt','wyndham','ihg','choice hotels',
      'nfp','aon','marsh','willis towers','gallagher','brown brown',
      'grunley','vast data','chandra technologies','cybercoders','telex',
      'weisiger','kokosing','merrill gardens','ernest health','waterbox',
      'united heritage','nhrg','purple brand','soligo','harvey','bmb','atominvest',
      'aryon security','trophy games','al masraf','hardie grant',
    ]);

    // Known enterprise substrings — if the company name CONTAINS any of these, block it
    const ENTERPRISE_SUBSTRINGS = ['industries','national','international','group','holdings','enterprises','corporation','systems inc','technologies inc','solutions inc','health system','healthcare system','medical center','regional','university','federal','national'];

    // HARD SIZE FILTER: hiring 15+ roles in a single function = enterprise call center
    // Viking Land (18 dispatchers across 1 function) is actually a legit SMB trucking co.
    // But Spectrum/CVS hiring 20+ CS reps in one function = enterprise. Differentiate by
    // whether we already know it's a large company via the blocklist. Trust the name list.
    // ── KNOWN STAFFING / RECRUITING BRANDS (they SELL the labor they post) ──
    // A staffing firm's job posts are their PRODUCT, not a signal about their own
    // operations. They'd never buy AI to replace the workers they rent out. These
    // flood the queue with "hiring manual roles" noise. Block by name AND pattern.
    const STAFFING_BRANDS = new Set([
      'manpower','manpowergroup','vaco','talentrust','talent trust','aerotek','adecco',
      'randstad','kelly services','kforce','insight global','teksystems','robert half',
      'aston carter','collabera','cybercoders','jobot','apex systems','apex group',
      'the contractor consultants','contractor consultants','tandym','beacon hill',
      'addison group','on assignment','asgn','lhh','hays','spherion','staffmark',
      'volt','modis','allegis','cielo','nesco resource','pridestaff','express employment',
      'trueblue','peoplecaddy','integrity staffing','elwood staffing','snelling',
      'gpac','gqr','the judge group','judge group','system one','yoh','actalent',
      'medical solutions','cross country','crosscountry','host healthcare','aya healthcare',
      'trustaff','triage staffing','amn healthcare','favorite healthcare',
      'peopleready','trueblue','lvi associates','salesroads','perm staff jobs','ccs facility services',
    ]);
    // ── KNOWN ENTERPRISES / REITs / DISTRIBUTORS (too big — owner unreachable) ──
    const ENTERPRISE_BRANDS = new Set([
      'skanska','skanska constructions','avalonbay','avalonbay communities','reece',
      'lincoln property','lincoln property company','village green','equity residential',
      'greystar','camden property','mid-america apartment','udr','essex property',
      'aimco','invitation homes','american homes','bituminous roadways','vinci',
      'turner construction','dpr construction','mortenson','clark construction',
      'suffolk construction','hensel phelps','kiewit','fluor','jacobs','aecom',
      'brasfield gorrie','pcl construction','gilbane','balfour beatty','webcor',
      'msccn','path','avalonbay','ferguson','wesco','grainger','hd supply',
    ]);

    const icpFiltered = allCompanies.filter(c => {
      const name = (c.name||'').toLowerCase().trim();
      if (!name || name.length < 2) return false;
      const nameWords = name.split(/\s+/);
      const firstTwo = nameWords.slice(0, 2).join(' ');
      const firstWord = nameWords[0] === 'the' ? (nameWords[1]||'') : nameWords[0];

      // ── ORIGINAL BLOCKLIST (exact-ish) ──
      if (BLOCKED_COMPANIES.has(name)) return false;
      if (nameWords.some(w => BLOCKED_COMPANIES.has(w) && w.length >= 2)) return false;
      if (firstWord && BLOCKED_COMPANIES.has(firstWord)) return false;
      if (BLOCKED_COMPANIES.has(firstTwo)) return false;

      // ── STAFFING + ENTERPRISE BRAND SETS (name, first word, first two words) ──
      const nameNoThe = name.replace(/^the\s+/, '');
      if (STAFFING_BRANDS.has(name) || STAFFING_BRANDS.has(nameNoThe) || STAFFING_BRANDS.has(firstTwo) || STAFFING_BRANDS.has(firstWord)) return false;
      if (ENTERPRISE_BRANDS.has(name) || ENTERPRISE_BRANDS.has(nameNoThe) || ENTERPRISE_BRANDS.has(firstTwo) || ENTERPRISE_BRANDS.has(firstWord)) return false;

      // ── PATTERN-BASED STAFFING DETECTION (catches variants we've never seen) ──
      // These words in a company NAME almost always mean "we rent out labor."
      if (/\b(staffing|recruiting|recruitment|recruiter|staffing solutions|talent solutions|talent group|talent partners|talent acquisition|workforce|personnel|placement|headhunt|temp agency|temporaries|manpower|employment agency|employer of record|professional employer|\bpeo\b|hr outsourc|consultants|consulting group|resourcing|resource group|human capital)\b/i.test(name)) return false;
      // "talent" or "talents" as a standalone significant word (Talentrust, Talent Inc)
      if (nameWords.some(w => w === 'talent' || w === 'talents' || w === 'staffing' || w === 'recruiters')) return false;

      // ── PATTERN-BASED ENTERPRISE / REIT / PROPERTY-MGMT DETECTION ──
      // Large REITs and property managers are never founder-led SMBs.
      if (/\b(communities|residential|property company|property management|properties trust|realty trust|apartment homes|reit|worldwide|global logistics|international group|holdings corp)\b/i.test(name)) return false;

      // ── INVESTMENT FUNDS / SPVs — not operating businesses, no owner to sell to.
      // Catches EDGAR Form D noise: "Glade Brook Private Investors LV LP",
      // "BCP Great Lakes II Series B Offshore Feeder LP", "Feynman Point Fund LP" etc.
      if (/\b(fund|feeder|\blp\b|l\.p\.|spv|series [a-z]+ (llc|lp)|co-?investment|capital partners|private investors|opportunities fund|holdings llc|ventures? fund|partners fund|offshore|qp lp)\b/i.test(name)) return false;
      // "Series A/B/C" + LLC/LP structure = investment vehicle
      if (/series [a-z0-9]+.*(llc|lp|fund|feeder)/i.test(name)) return false;

      // ── NEWS-HEADLINE JUNK — the source returned a headline, not a company.
      // Catches "Papillion couple targeted by identity theft", "20+ Year Metal
      // Roofing Company – Tampa Region" (a for-sale listing title, not a name).
      if (/\b(couple|targeted|identity theft|arrested|charged|lawsuit|sentenced|indicted|convicted|man |woman |police|victim)\b/i.test(name)) return false;
      if (/\d+\+?\s*year/i.test(name)) return false;   // "20+ Year ..." listing titles
      if (name.includes('–') || name.includes('—')) {      // em/en-dash usually = headline/listing
        if (/region|area|for sale|listed|opportunity/i.test(name)) return false;
      }

      // ── SIZE / STRUCTURE HEURISTICS ──
      if (name.length > 55) return false;
      // Government / non-profit / institution
      if (/\b(university|college|school|district|county|city of|state of|department of|ministry|federal|government|hospital|health system|medical center|clinic network)\b/i.test(name)) return false;
      // Defense / aerospace
      if (/\b(defense contractor|aerospace|government contractor|department of defense|federal contractor)\b/i.test(name)) return false;

      // ── JOB-TITLE ENTERPRISE SIGNALS ──
      const jt = (c.jobTitle || c.jobSnippet || '').toLowerCase();
      if (/regional (sales|marketing) director|department of defense|intelligence community|federal (sales|accounts)|enterprise (sales|account)/i.test(jt)) return false;

      return true;
    });

    console.log(`After ICP filter: ${icpFiltered.length} (removed ${allCompanies.length - icpFiltered.length} large/irrelevant)`);

    // ═══ SIZE GATE — ONE lightweight search per lead, just headcount ═══════
    // At Find time we only need the size gate to block enterprises. The full
    // CEO/pain/revenue enrichment happens at Research time on leads you pursue.
    // This keeps Find fast and doesn't hammer DuckDuckGo.
    // Only enrich the top 40 by pre-score — the ones most likely to matter.
const WEIGHTS = {
      // Stage 4 — hottest, in market NOW
      agency_review: 45,
      social_pain_signal: 35,
      founder_venting: 10,
      // Stage 3-4 — actively in motion
      hiring_marketing: 30,
      salary_high: 20,
      raised_funding: 25,
      sba_funded: 34,
      running_fb_ads: 30,       // confirmed budget + digital presence
      stale_ads: 15,            // running same ads 90+ days = frustrated
      // Exit prep — owner motivated to grow revenue fast
      preparing_for_exit: 35,
      needs_revenue_growth: 15,
      owner_motivated: 10,
      // AI-replacement labor signals (Adzuna re-aim) — Tier 1 $25k-$75k builds
      ai_replacement_signal: 25,   // hiring any manual/repetitive role
      ai_replacement_multi: 20,    // 2+ functions or 3+ postings — real bleeding
      ai_replacement_heavy: 20,    // 3+ functions or 5+ postings — stacks on multi  
      // Other signals 
      hiring_ops: 10,
      tool_frustration: 20,
      recently_launched: 15,
      needs_marketing: 10,
      rebranding: 20,
      expanding: 12,
      recently_acquired: 18,
      salary_mid: 10,
      salary_low: 5,
      salary_unknown: 5,
    };

    // PRE-SCORE for enrichment ordering. icpScore doesn't exist yet (computed
    // ~270 lines below). Sorting by it was a no-op that took the first 40 in
    // array order (all Adzuna). Score on raw signals we already have so the
    // size gate, ad-check, and enrichment run on the most promising leads.
    const preScore = (c) => {
      const sig = c.signals || {};
      let sc = Object.entries(sig).reduce((t,[k,v]) => v ? t + (WEIGHTS[k] || 5) : t, 0);
      sc += ((c.stackedSources || c.sources || [c.source]).filter(Boolean).length - 1) * 20;
      const f = c.signalFreshness;
      sc += f === 'burning' ? 15 : f === 'hot' ? 10 : f === 'warm' ? 4 : 0;
      sc += Math.min((c.manualRoleCount || 0) * 3, 15);
      return sc;
    };
    // WIDENED SIZE GATE: simplified=true CompaniesAPI calls are FREE, so there's no
    // reason to only size the top 40. Size-gate the top 90 — enough to cover the
    // whole realistic queue — so enterprises get caught instead of waved through
    // with a "probably small" default. Credit is still only spent on the top 16.
    const preScored = icpFiltered
      .map(c => ({ c, _pre: preScore(c) }))
      .sort((a,b) => b._pre - a._pre);
    // Concentrate size credits where enterprises actually HIDE: Adzuna / EDGAR / News / SBA.
    // Google Places is already franchise-filtered + review-gated to owner-operated local
    // businesses — it is small-local by construction, so a paid size check there wastes
    // a credit on a lead that can't be an enterprise. This is why 1,604 Places leads were
    // starving the 140-slot budget and letting Adzuna whales (Nutanix, Danaher, WSP) slip
    // through unsized. Skip Places; size the rest deeper.
    const isPlacesLead = (c) => c.source === 'google_places' || !!(c.signals && c.signals.local_owner_operated);
    // Skip Places (small-local by construction) AND obvious enterprises/staffing/health
    // (a name pattern already blocks them for free downstream — no need to pay to confirm).
    const toEnrich = preScored.map(x => x.c)
      .filter(c => !isPlacesLead(c) && !looksLikeEnterpriseByName(c.name))
      .slice(0, 180);
    const enrichResults = new Map();
    let creditsSpent = 0;
    const CREDIT_CAP = 150; // hard per-run ceiling; the Supabase cache makes repeat runs nearly free
    console.log(`Size enrichment: sizing ${toEnrich.length} enterprise-prone (non-Places) leads of ${icpFiltered.length} total (Places trusted small-local, not credit-sized)...`);

    const SIZE_BATCH = 6;
    // Combined size lookup: cache → CompaniesAPI own-domain (1 credit) → name → Wikipedia/EDGAR
    const lookupSize = async (c, allowEdgar) => {
      // ── Source 1: The Companies API (exact headcount when available) ──
      if (companiesApiKey) {
        const hadOwnSite = !!c.website;
        let capi = null, viaOwnDomain = false;

        // 0. Cache first — pay once per domain, ever.
        const ownDomain = cleanDomainOf(c.website);
        if (ownDomain) {
          const cached = await getCachedSize(ownDomain);
          if (cached && cached.employees) return { ...cached, website: c.website };
        }

        // 1. Spend a credit on the lead's OWN domain — most accurate → 'trusted'.
        if (c.website && creditsSpent < CREDIT_CAP) {
          capi = await enrichViaCompaniesAPI(c.website, companiesApiKey, true); // full profile, 1 credit (0 if not found)
          creditsSpent++;
          if (capi && capi.employees) { viaOwnDomain = true; await cacheSize(ownDomain, { ...capi, source: 'companiesapi-domain' }); }
        }

        // 2. Fall back to strict name match (free), then a credit on the resolved domain.
        if (!capi || !capi.employees) {
          const byName = await searchCompaniesAPIByName(c.name, companiesApiKey);
          if (byName && byName.employees) capi = byName;
          else if (byName && byName.website && creditsSpent < CREDIT_CAP) {
            const nd = cleanDomainOf(byName.website);
            const ndCached = nd ? await getCachedSize(nd) : null;
            if (ndCached && ndCached.employees) capi = { ...ndCached, website: byName.website };
            else {
              const full = await enrichViaCompaniesAPI(byName.website, companiesApiKey, true);
              creditsSpent++;
              if (full && full.employees) { capi = { ...byName, employees: full.employees, industry: full.industry || byName.industry }; await cacheSize(nd, { ...full, source: 'companiesapi-name' }); }
              else capi = byName;
            }
          } else if (byName) capi = byName;
        }

        if (capi && capi.employees) {
          // sizeConfidence: 'trusted' ONLY when headcount came from the lead's OWN website.
          // Name-search-derived domain is 'weak' — how a $20B homebuilder (Lennar) resolved
          // to a 5-person dealer microsite. Weak-SMALL must NEVER earn verified-small floor;
          // weak-LARGE can still block (blocking big is always safe).
          const sizeConfidence = (viaOwnDomain && hadOwnSite) ? 'trusted' : 'weak';
          return { employees: capi.employees, website: capi.website || c.website, industry: capi.industry, source: 'companiesapi', sizeConfidence };
        }
        // Got a domain but no headcount — hold onto the website, keep checking
        if (capi && capi.website && !c.website) c.website = capi.website;
        var resolvedWebsite = capi?.website || c.website;
      }

      // ── Source 2: Wikipedia (catches famous enterprises) ──
      const wiki = await getSizeOnly(c.name);
      if (wiki && wiki.employees) {
        return { employees: wiki.employees, website: wiki.website || resolvedWebsite, source: 'wikipedia' };
      }

      // ── Source 3: SEC EDGAR (public company = enterprise, only on top leads) ──
      if (allowEdgar) {
        const edgar = await getEdgarHeadcount(c.name);
        if (edgar && edgar.isPublic) {
          return { employees: edgar.employees, website: resolvedWebsite, source: 'edgar-public' };
        }
      }

      // No headcount from any source — return website if we found one
      return resolvedWebsite ? { employees: null, website: resolvedWebsite, source: 'domain-only' } : (wiki || null);
    };
    for (let i = 0; i < toEnrich.length; i += SIZE_BATCH) {
      const batch = toEnrich.slice(i, i + SIZE_BATCH);
      // EDGAR (public-company check) only on the top ~60 for speed; credits are budget-gated inside lookupSize.
      const results = await Promise.allSettled(batch.map((c) => lookupSize(c, i < 60)));
      batch.forEach((c, idx) => {
        const r = results[idx];
        if (r.status === 'fulfilled' && r.value) {
          enrichResults.set(c.name, r.value);
          console.log(`Size [${c.name}]: emp=${r.value.employees||'?'} site=${r.value.website||'?'} src=${r.value.source||'wiki'}`);
        } else {
          console.log(`Size [${c.name}]: no data`);
        }
      });
      if (i + SIZE_BATCH < toEnrich.length) await new Promise(r => setTimeout(r, 600));
    }
    const sizedCount = [...enrichResults.values()].filter(v => v && v.employees).length;
    console.log(`Size enrichment done: ${sizedCount}/${toEnrich.length} leads got real headcount | ${creditsSpent} credits spent this run (cache serves repeats free)`);

    // ═══ AD-SPEND STACK CHECK — the strongest possible signal for CROJungle ══
    // A company hiring 4 schedulers AND running 800 paid ads is the perfect lead:
    // they are bleeding money on BOTH manual labor AND a broken funnel. That is
    // two independent, verifiable signals on the same account — which the research
    // says triples the true-positive rate (20% → 50-60%).
    //
    // This check used to happen only at RESEARCH time, which is too late to
    // influence which leads we prioritize. Now it runs on the top leads at FIND
    // time, so the ranking actually reflects it. Ad spend also decays fastest of
    // any signal (7-day half-life) — they could pause the campaign tomorrow.
    if (firecrawlKey) {
      const adCheckPool = toEnrich.slice(0, 12).filter(c => c.website);
      if (adCheckPool.length > 0) {
        const adResults = await Promise.allSettled(
          adCheckPool.map(c => checkAdLibraryViaFirecrawl(c.name, firecrawlKey))
        );
        let adsFound = 0;
        adCheckPool.forEach((c, idx) => {
          const r = adResults[idx];
          if (r.status === 'fulfilled' && r.value && r.value.adCount > 0) {
            c.signals = c.signals || {};
            c.signals.running_ads = true;
            c.adCount = r.value.adCount;
            c.signalAgeDays = 0; // ads running RIGHT NOW — freshest signal possible
            c.stackedSources = [...(c.stackedSources || [c.source]), 'facebook_ads'];
            c.stackEvidence = [...(c.stackEvidence || []), `${r.value.adCount} active paid ads running right now`];
            adsFound++;
          }
        });
        if (adsFound > 0) {
          console.log(`Ad-spend stack: ${adsFound} of ${adCheckPool.length} top leads are ALSO running paid ads — these are the best leads in the batch`);
        }
      }
    }
    
        // Apply enrichment + size gate
    // ═══════════════════════════════════════════════════════════════════════
    // BULLETPROOF SIZE GATE — multi-signal waterfall
    // ═══════════════════════════════════════════════════════════════════════
    // RECONCILING THE CEO'S ICPs WITH COLD-EMAIL REACHABILITY:
    // The CEO defined four client profiles CROJungle can SERVE profitably —
    // including retainer-marketing clients OVER $50M revenue with no upper limit,
    // and website clients up to $500M. Those are real, valuable clients.
    // BUT they are not cold-email-reachable: at that size there is no founder
    // reading their own inbox, and the buyer sits behind procurement and VP layers.
    // Those companies are won through Mike's network and referrals.
    //
    // THIS SYSTEM targets the cold-reachable slice — which maps almost exactly to
    // the CEO's ICP #4: $1.5M-$50M revenue, hiring, poor digital presence, stagnant
    // or bloated. That is roughly 10-200 employees. Plus the small end of the
    // software lane (high headcount-to-revenue, hiring people to do software work).
    //
    // So: block >500 (unreachable), flag 200-500 (fuzzy edge, verify), keep <=200
    // (confirmed cold-reachable ICP), and keep no-data (absence = SMB = our people).
    // ═══════════════════════════════════════════════════════════════════════
    // Philosophy: the gate answers ONE question — "is the owner reachable by a
    // cold email?" We NEVER block a likely-SMB (that's a lost customer), and we
    // block anything showing clear enterprise markers (that wastes research).
    // Decision uses independent signals; verified headcount wins when present,
    // otherwise we combine name-pattern + public-company + no-data-is-SMB logic.
    const ENTERPRISE_NAME = /\b(health systems?|healthcare system|medical center|health network|cruise line|airlines?|airways|university|federal|county of|city of|town of|township|state of|department of|social security|national health|regional medical|memorial hospital|health plan|housing authority|housing finance|public schools?|municipal|cancer center|cancer institute|rehabilitation and nursing|logistics|freight systems|truck rental|rent[- ]?a[- ]?car|dealer careers|medical centers|healthcare allied|home depot|rentals inc|national|worldwide|enterprises inc|holdings inc|construction company|automotive group|dealer group|supermarkets|grocery|distribution center|fulfillment center)\b/i;
    // KNOWN NATIONAL BRANDS that keep slipping through with no size data. These are
    // household-name enterprises Adzuna surfaces constantly. A hard name-block is the
    // only reliable stop when their headcount isn't in the free API tier.
    const NATIONAL_BRANDS = new Set([
      'us foods','united rentals','aecom','ryder','ryder system','u-haul','uhaul','carvana',
      'albertsons','medtronic','abbott','penn medicine','bmw','bmw dealer careers','amentum',
      'system one','tic','tic - the industrial company','cdm smith','david weekley homes',
      'f.h. paschen','fh paschen','garney construction','faulconer construction','unifirst',
      'unifirst corporation','rain for rent','cushman & wakefield','cushman wakefield',
      'national automotive training academy','amn healthcare','amn healthcare allied',
      'asset living','real property management','roers companies','lincoln property',
      'greystar','cbre','jll','jones lang lasalle','colliers','marcus & millichap',
      'us xpress','u.s. xpress','us xpress - dedicated','mtc','glc on-the-go','glc on the go',
      'ace handyman services','ace handyman','capital one','abbott','solaris healthcare',
      'legacy professional services','trc','trc companies','mri network','mrinetwork',
      'goodyear','the goodyear tire & rubber company','goodyear tire','morgan stanley','pnc',
      'fresenius','fresenius medical care','highmark','highmark health','amcor','logitech',
      'lithia','lithia & driveway','lithia motors','rust-oleum','rust-oleum corporation',
      'barnes & noble','barnes & noble education','the washington post','washington post',
      'liberty mutual','ocean spray','maersk','dover corporation','sharkninja',
      'kaiser permanente','kaiser','cross country nurses','cross country healthcare',
      // BizBuySell listing CATEGORIES (not companies — scraper noise)
      'education & children','building & construction','automotive & boat',
      'pet services','value a business','how to buy a business',
      'home based businesses','my business profile',
      'scale ai','bigcommerce','ingersoll rand','panda express','hub international',
      'digitas','leonardo drs','tradesmen international','shift digital',
      'sage hospitality','snapchat','hy-vee','bayada','brightspring',
      'norwegian cruise line','west shore home','perkins+will','perkinswill',
      'standardaero','lifetime brands','jpmorgan chase','jp morgan',
      'granite construction','republic services','herc rentals','four seasons','elevance',
      'elevance health','acxiom','lumen','medline','medline industries','flowserve',
      'caterpillar','bechtel','expeditors','eaton','kuehne+nagel','brinks','waste connections',
      'first student','penske','rush enterprises','ballard spahr','baptist health care',
      'roper st. francis','pruitthealth','fresenius medical','cross country healthcare',
      'american bureau of shipping','hersha hospitality management','isc2','flash appliance repair',
      // Leaked in the 2026-07-17 run — Fortune 500 / enterprise / competitor / health system
      'metlife','wabtec','md anderson','md anderson cancer center','ssm health','page group',
      'michael page','amsive','hungrypanda','iqvia','bloomberg','houston methodist','georgia-pacific',
      'carrier','owens & minor','owens and minor','sephora','idexx','sandisk','rippling','pvh',
      'pvh corp','tidelands health','hawaii pacific health','centerwell','relias','select sires',
    ]);

    let blockedCount = 0, blockReasons = {};
    const sizeGated = icpFiltered.filter(c => {
      const enrich = enrichResults.get(c.name);
      const nameLower = (c.name || '').toLowerCase();

      // Attach whatever verified data we got
      if (enrich) {
        if (enrich.employees) c.verifiedEmployees = enrich.employees;
        if (enrich.empBand) c.verifiedRevenueBand = enrich.empBand;
        if (enrich.revenue) c.verifiedRevenue = enrich.revenue;
        if (enrich.website && !c.website) c.website = enrich.website;
        if (enrich.industry) c.verifiedIndustry = enrich.industry;
        if (enrich.sizeConfidence) c.sizeConfidence = enrich.sizeConfidence;
        if (enrich.ceoName) { c.verifiedCEO = enrich.ceoName; c.verifiedCEOTitle = enrich.ceoTitle || 'CEO'; }
        if (enrich.painSignals && enrich.painSignals.length > 0) c.publicPainSignals = enrich.painSignals;
      }

      // ── STAFFING / RECRUITING — never our ICP. Block by verified industry
      //    (Companies API tags these 'staffing-and-recruiting') OR by name. ──
      if (/staffing|recruit/i.test(c.verifiedIndustry || '') ||
          (/\b(staffing|recruit(er|ing|ment)?|talent|personnel|placement|headhunt|manpower|workforce|temp agency|search partners|search group|employment (agency|partners|services)|technical resources)\b|staff\b|\b(mrinetwork|mri network|teema|peopleshare|aerotek|adecco|randstad|kforce|robert half|insight global|beacon hill|roth staffing|ledgent|apex systems|cybercoders|teksystems|aptask|amerit|actalent|tradesmen international|system one|magnit|allegis|populus group|tandym|beeline|cross country|maximus|integrated resources|artech|collabera|mastech)\b/i).test(c.name || '')) {
        console.log(`BLOCKED [${c.name}]: staffing/recruiting firm`);
        blockedCount++; blockReasons.staffing = (blockReasons.staffing||0)+1;
        return false;
      }

      // ── SIGNAL 1: Verified headcount (highest confidence) ──────────────
      if (c.verifiedEmployees) {
        if (c.verifiedEmployees > 500) {
          console.log(`BLOCKED [${c.name}]: ${c.verifiedEmployees} employees (verified)`);
          blockedCount++; blockReasons.headcount = (blockReasons.headcount||0)+1;
          return false;
        }
        if (c.verifiedEmployees > 200) {
          c.sizeWarning = `${c.verifiedEmployees} employees — mid-market, verify reachability`;
        }
        // Verified small (≤200) — this is a confirmed ICP lead, keep it. No further checks.
        return true;
      }

      // ── SIGNAL 2: No verified headcount — use cautious heuristics ───────
      // 2a. KNOWN NATIONAL BRANDS — hard block by name (no size data needed)
      const nm = nameLower.replace(/^the\s+/, '').trim();
      if (NATIONAL_BRANDS.has(nameLower) || NATIONAL_BRANDS.has(nm)) {
        console.log(`BLOCKED [${c.name}]: known national brand`);
        blockedCount++; blockReasons.nationalBrand = (blockReasons.nationalBrand||0)+1;
        return false;
      }

      // 2b-healthcare: block LARGE health systems by name, but KEEP small
      // practices (dental/vet/med-spa/chiro are perfect ICP). Big systems carry
      // 'health care/healthcare/medical care/health system/hospital'; small
      // practices carry the practice type instead.
      const SMALL_PRACTICE = /\b(dental|dentist|orthodont|veterinar|\bvet\b|derma|med spa|medspa|chiropract|optometr|physical therapy|family medicine|pediatric dent|urgent care clinic|aesthetic)\b/i;
      const BIG_HEALTH = /\b(health care|healthcare|medical care|health system|healthcare system|health network|hospital|regional medical|medical center|health plan|health services|healthcare services)\b/i;
      if (BIG_HEALTH.test(nameLower) && !SMALL_PRACTICE.test(nameLower)) {
        console.log(`BLOCKED [${c.name}]: large health system (name)`);
        blockedCount++; blockReasons.bigHealth = (blockReasons.bigHealth||0)+1;
        return false;
      }

      // 2b. Enterprise name patterns (health systems, logistics, gov, dealers, etc.)
      if (ENTERPRISE_NAME.test(nameLower)) {
        console.log(`BLOCKED [${c.name}]: enterprise name pattern`);
        blockedCount++; blockReasons.namePattern = (blockReasons.namePattern||0)+1;
        return false;
      }

      // 2c. Very long multi-word names are usually enterprises/institutions
      if ((c.name || '').length > 45) {
        c.sizeWarning = 'Long name — possible enterprise, verify';
      }

      // 2d. No size data. OLD behavior trusted these as "probably SMB" and let them
      // sit at full score — which is exactly how US Foods / AECOM reached the queue.
      // NEW: keep them (absence CAN mean SMB) but FLAG them unverified so the score
      // caps them below any size-verified lead. An unverified lead must never outrank
      // a confirmed small business.
      c.sizeUnverified = true;
      c.sizeWarning = c.sizeWarning || 'Size not verified — confirm before pitching';
      return true;
    });

    console.log(`After size gate: ${sizeGated.length} kept | blocked ${blockedCount} (${JSON.stringify(blockReasons)})`);

    // SIGNAL STACKING — merge across sources, union signals
    const merged = new Map();
    // Normalize company names for matching: lowercase, strip legal suffixes
    // (Inc, LLC, Corp, Co, Ltd), strip punctuation, collapse whitespace.
    // This is why stacking was 0 — "Viking Land Transportation" and
    // "Viking Land Transportation Inc" were treated as different companies.
    const normName = (raw) => (raw || '')
      .toLowerCase()
      .replace(/\s*\(cik\s*\d+\)\s*/gi, '')
      .replace(/\s*\([a-z]{2,5}\)\s*/gi, '')
      .replace(/[.,]/g, '')
      .replace(/\b(inc|incorporated|llc|corp|corporation|co|company|ltd|limited|group|holdings|lp|llp|plc|pllc)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    for (const c of sizeGated) {
      const key = normName(c.name);
      if (!key || key.length < 2) continue;
      if (!merged.has(key)) {
        merged.set(key, { ...c, signals: { ...(c.signals||{}) }, sources: [c.source] });
      } else {
        const ex = merged.get(key);
        for (const [k, v] of Object.entries(c.signals||{})) ex.signals[k] = ex.signals[k] || v;
        if (!ex.sources.includes(c.source)) ex.sources.push(c.source);
        // Prefer the longer, more complete name (usually has the real legal entity)
        if ((c.name||'').length > (ex.name||'').length) ex.name = c.name;
        if (!ex.website && c.website) ex.website = c.website;
        if (!ex.location && c.location) ex.location = c.location;
        if (!ex.jobSnippet && c.jobSnippet) ex.jobSnippet = c.jobSnippet;
        if (c.manualRoleCount && (!ex.manualRoleCount || c.manualRoleCount > ex.manualRoleCount)) {
          ex.manualRoleCount = c.manualRoleCount;
          ex.manualCategories = c.manualCategories;
        }
        if (c.icpProfile && (!ex.icpProfile || ex.icpProfile === 'any')) ex.icpProfile = c.icpProfile;
        // Preserve the buying lane across a cross-source merge. If two sources
        // disagree, the RICHER answer wins: retainer + software = both.
        if (c.buyingLane && !ex.buyingLane) ex.buyingLane = c.buyingLane;
        else if (c.buyingLane && ex.buyingLane && c.buyingLane !== ex.buyingLane) ex.buyingLane = 'both';
      }
    }
    const unique = [...merged.values()];

    // SECOND-PASS CROSS-SOURCE STACK — after the main merge, do a fuzzy cross-reference
    // between Adzuna leads and EDGAR/News leads. These often have name variants that
    // survived separate merge passes. Match on first 2 significant words of company name.
    const significantWords = (name) => normName(name).split(' ').filter(w => w.length > 3).slice(0, 2).join(' ');
    const edgarLeads = unique.filter(c => c.source === 'sec_edgar');
    const adzunaLeads = unique.filter(c => c.source === 'adzuna_ai');
    const newsLeads = unique.filter(c => (c.source||'').startsWith('news_'));
    // Build lookup maps by significant-word key
    const edgarMap = new Map(edgarLeads.map(c => [significantWords(c.name), c]));
    const newsMap = new Map(newsLeads.map(c => [significantWords(c.name), c]));
    let secondPassStacks = 0;
    for (const az of adzunaLeads) {
      const key = significantWords(az.name);
      if (key.length < 4) continue;
      const edgarMatch = edgarMap.get(key);
      const newsMatch = newsMap.get(key);
      const match = edgarMatch || newsMatch;
      if (match && !az.sources.includes(match.source)) {
        // Stack them: merge signals, add source
        az.sources.push(match.source);
        for (const [k, v] of Object.entries(match.signals||{})) az.signals[k] = az.signals[k] || v;
        if (!az.website && match.website) az.website = match.website;
        // Re-score with stacking bonus
        const raw = Object.entries(az.signals||{}).reduce((t,[k,v])=>v?t+(WEIGHTS[k]||0):t, 0);
        const stackBonus = az.sources.length >= 3 ? 30 : 15;
        const reach = scoreReachability(az);
        az.icpScore = Math.min(Math.round(raw + stackBonus + reach.score), 100);
        az.stacked = true;
        az.sourceCount = az.sources.length;
        secondPassStacks++;
        // Remove the duplicate from unique (the edgar/news version)
        const dupIdx = unique.indexOf(match);
        if (dupIdx >= 0) unique.splice(dupIdx, 1);
        if (edgarMatch) edgarMap.delete(key);
        if (newsMatch) newsMap.delete(key);
      }
    }
    if (secondPassStacks > 0) console.log(`Second-pass cross-source stack: ${secondPassStacks} additional stacks found`);

    const stackedCount = unique.filter(c => (c.sources||[]).length >= 2).length;
    console.log(`After merge: ${unique.length} unique (${stackedCount} stacked across 2+ sources)`);

    // ═══ STACK RECONCILIATION ══════════════════════════════════
    // Derive stackedSources from the ONE place cross-source truth is recorded:
    // c.sources, written by the dedup merge above when two DIFFERENT sources
    // produced the same normalized company name. Unioned with any source added
    // by an ACTIVE check that genuinely went out and asked (facebook_ads).
    //
    // A 0 here is a REAL 0, and it is information. Adzuna finds hirers, EDGAR
    // finds fundraisers, News finds newsmakers - they are largely different
    // companies. The only stack that reliably fires is the ad-library check,
    // because it is the only one that LEAVES THE POOL and asks a third party
    // about a specific company we already found. That is what a real active
    // stack is: a fetch, not an index lookup.
    const nowStacked = reconcileStackedSources(unique);
    const adStacked  = unique.filter(c => (c.stackedSources || []).includes('facebook_ads')).length;
    console.log(`Active stacking result: ${nowStacked} companies carry 2+ genuinely independent sources (${adStacked} of them via the live ad check)`);

    // Combo tally logged after scoring (below)
    


    // ═══ STACK COMBO CLASSIFIER ══════════════════════════════════════════
    // Combos are SIGNAL-based: which signals combined matters more than how
    // many sources agreed. Returns the hottest matching combo or null.
    // Stacking never gates — singles flow normally; combos only elevate.
    const classifyStack = (c) => {
      const s = c.signals || {};
      const funded = !!s.raised_funding;
      const manualMulti = !!(s.ai_replacement_multi || s.ai_replacement_heavy) || (c.manualRoleCount || 0) >= 3;
      const manualAny = !!s.ai_replacement_signal || (c.manualRoleCount || 0) >= 1;
      const mktgHire = !!s.hiring_marketing;
      const growthEvent = !!(s.expanding || s.recently_acquired || s.recently_launched || s.rebranding);
      const exitPrep = !!s.preparing_for_exit;
      const agencyPain = !!(s.agency_review || s.social_pain_signal);
      const multiSource = (c.sources || [c.source]).filter(Boolean).length >= 2;

      const newSalesLeader = !!s.new_sales_leader;
      const newOwner = !!s.new_owner;

      // TIER S — Perfect Storm: money + bleeding ops + growth mandate
      if (funded && manualMulti && (mktgHire || growthEvent)) return {
        tier: 'S', id: 'perfect_storm', boost: 35, label: '🌩 Perfect Storm',
        whyHot: 'Just funded + hiring multiple manual roles + active growth event — capital, urgency, and operational bleeding all at once',
        productHint: 'Custom AI Software Build + End-to-End Marketing bundle — board pressure makes this a fast yes'
      };

      // ═══ NEW SALES LEADER + FIT — the stack that makes a title change matter ══
      // A new VP of Sales ALONE is weak. But a new VP of Sales at a company that
      // is ALSO hiring (in-ICP, reachable) and has NO marketing team means he has
      // a quota, no pipeline, and no one to generate leads. He is the most
      // pressured buyer in the building — and now we have a fit reason to reach him.
      if (newSalesLeader && (manualAny || mktgHire || funded)) return {
        tier: 'A', id: 'pressured_sales_leader', boost: 28, label: '⚡ New Sales Leader, No Pipeline',
        whyHot: 'A new VP of Sales/CRO AND active hiring/budget signals — he has a quota and 90 days to prove himself, no marketing team feeding him, and the company is clearly in a growth push. He buys lead gen fast.',
        productHint: 'End-to-End Marketing / lead gen — pitch the new sales leader directly, not the owner. He owns the number and feels the pipeline gap personally.'
      };

      // New owner who is ALSO showing a growth/hiring signal — wants to make a mark
      if (newOwner && (manualAny || mktgHire || growthEvent)) return {
        tier: 'A', id: 'new_owner_growth', boost: 24, label: '⚡ New Owner in Growth Mode',
        whyHot: 'New owner AND active hiring/growth signals — they just bought the business, want to prove the thesis, and are not attached to the old vendors or the old way.',
        productHint: 'Lead with a fresh-start angle — they are actively rebuilding and open to new partners in a way an established owner is not.'
      };

      // TIER A combos
      if (funded && manualMulti) return {
        tier: 'A', id: 'funded_labor', boost: 25, label: '⚡ Funded & Bleeding Labor',
        whyHot: 'Fresh capital + multiple manual-role postings — money in the bank being spent on labor that software replaces',
        productHint: 'Custom AI Software Build — they can fund it today and the ROI math is immediate'
      };
      if (funded && mktgHire) return {
        tier: 'A', id: 'funded_marketing', boost: 25, label: '⚡ Funded & Buying Marketing',
        whyHot: 'Just raised + hiring marketing — new budget being deployed NOW; new marketing leaders re-evaluate vendors in their first 90 days',
        productHint: 'End-to-End Marketing — note: buyer may be the incoming marketing hire, not the owner; pitch to whoever owns the new budget'
      };
      if (growthEvent && manualMulti) return {
        tier: 'A', id: 'scaling_manual', boost: 25, label: '⚡ Scaling on Manual Ops',
        whyHot: 'Expanding/acquiring while stacking manual hires — growth is amplifying the labor waste every month',
        productHint: 'Custom AI Software Build — frame as scaling infrastructure, not cost-cutting'
      };
      if (exitPrep && manualAny) return {
        tier: 'A', id: 'exit_fat', boost: 25, label: '⚡ Exit with Fat to Trim',
        whyHot: 'Preparing to sell while carrying manual labor cost — every dollar cut multiplies straight into asking price',
        productHint: 'AI Software Build + Exit/Valuation Advisory — the Wall Street partner angle is the differentiator here'
      };
      if (agencyPain && (funded || manualAny || growthEvent)) return {
        tier: 'A', id: 'in_market_switcher', boost: 25, label: '⚡ In-Market Switcher',
        whyHot: 'Publicly frustrated with their current agency plus an active buying signal — actively shopping for a replacement',
        productHint: 'End-to-End Marketing — lead with what the last agency got wrong'
      };
      // TIER B — generic multi-source corroboration, no named combo
      if (multiSource) return {
        tier: 'B', id: 'corroborated', boost: 15, label: '🔗 Multi-Source',
        whyHot: 'Appeared in 2+ independent sources — higher confidence the signals are real',
        productHint: null
      };
      return null;
    };

    // Score — full 100 point scale
    // Discovery signals give a pre-research score
    // Higher signals = more confident ICP match


    // ═══════════════════════════════════════════════════════════════════════
    // THE SCORE — Fit × Intent × Timing (2026 signal-based-selling framework)
    // ═══════════════════════════════════════════════════════════════════════
    // Replaces the old flat point-tally. Three independent dimensions:
    //
    //   FIT     — is this the kind of company we can actually serve and reach?
    //             (size, reachability, decision-maker odds)
    //   INTENT  — is there real evidence they need what we sell, right now?
    //             (signal tiers, weighted, with decay)
    //   TIMING  — is the buying window open, or did we miss it?
    //             (freshness — a 29-day-old job posting is nearly worthless)
    //
    // A high-fit company with no intent is a bad lead. High intent with a closed
    // window is a bad lead. Only the intersection is worth a send — that is the
    // 5% of the market actually in a buying window (Gartner).
    const allScored = unique
      .map(c => {
        const intent = scoreSignals(c);          // intent + timing + stacking
        const reach  = scoreReachability(c);     // fit + reachability

        // Software-buyer signal: a SMALL company hiring MANY manual roles is
        // solving a scaling problem with headcount instead of software. That is
        // the CEO's ICP #2 verbatim, and it is the highest-ticket product.
        if (c.verifiedEmployees && c.verifiedEmployees <= 200 && (c.manualRoleCount || 0) >= 3) {
          c.softwareBuyerSignal = `${c.manualRoleCount} manual roles open at a ~${c.verifiedEmployees}-person company — solving scale with headcount instead of software`;
        }

        // ═══════════════════════════════════════════════════════════════════
        // FIND-TIME TRIAGE SCORE (rebuilt) — NOT a precise ICP score.
        // Find does not yet know the two things that matter most: whether the
        // owner is reachable and what the real pain is. Those are proven in
        // RESEARCH. So Find's number is deliberately a ROUGH TRIAGE: "is this
        // worth Research's time?" The real score is produced after research.
        //
        // PRINCIPLE (locked with Vin): reachability is the foundation, and
        // verified-small size is our best proxy for it. So:
        //   • VERIFIED small (1-200)  → the dominant positive. A confirmed
        //     40-person company hiring ONE role beats an unknown-size company
        //     hiring five. Size confirmed = owner reachable = worth pursuing.
        //   • ANY real signal qualifies (hiring / funded / for-sale / venting).
        //     We can pull financial or marketing levers for any business with a
        //     revenue problem, so we do NOT filter by need-type.
        //   • GOLDEN TICKET: verified-small + MULTIPLE ai-replaceable roles.
        //     Multiple roles ONLY boosts when size is verified small — so it can
        //     never again push a whale up on volume alone.
        //   • UNVERIFIED size → competitive second tier (Research will verify),
        //     never above a verified lead.
        // ═══════════════════════════════════════════════════════════════════
        // ═══════════════════════════════════════════════════════════════════
        // FIND TRIAGE (ICP score) — rough "is this worth Research?" rank.
        // Built on the workflow: a REAL ICP-revenue business where the OWNER is
        // LIKELY REACHABLE. At Find we don't have the email yet (that's Research),
        // so we rank on business TYPE (reachability likelihood) + revenue proxy.
        // ═══════════════════════════════════════════════════════════════════
        const emp = c.verifiedEmployees || 0;
        const s = c.signals || {};
        const isPlaces = c.source === 'google_places' || !!s.local_owner_operated;
        const rv = c.reviewCount || 0;
        let triage;

        if (emp > 500) {
          // Verified enterprise — owner unreachable. Floored.
          triage = 8;
        } else if (isPlaces) {
          // Local owner-operated: reachable by construction. Rank by revenue proxy
          // (review volume ≈ can-they-afford-us), refined by RATING (a thriving,
          // highly-rated business is more likely the established $800k+ we want;
          // a poorly-rated one is a shakier revenue bet), dock consolidation risk.
          const rating = c.rating || 0;
          let base = 74;
          // CONTINUOUS establishment curve (was stepped, which clustered everything
          // at 94). Review volume ≈ revenue, so a 45-review shop and a 300-review shop
          // should NOT score identically. Rises through the sweet spot, then tapers
          // above ~450 where a huge review count signals a regional brand (less
          // owner-reachable), not a bigger owner-operated business.
          let revBonus;
          if (rv <= 0)        revBonus = 0;
          else if (rv < 40)   revBonus = 2 + (rv / 40) * 8;                     // 2 → 10 approaching 40
          else if (rv <= 450) revBonus = 10 + ((rv - 40) / 410) * 12;          // 10 → 22 across the sweet spot
          else                revBonus = Math.max(6, 22 - ((rv - 450) / 550) * 14); // taper 22 → 6 for mega-brands
          base += Math.round(revBonus);
          // Rating refines within the same review band — a thriving 4.8★ outranks a wobbly 3.9★
          if (rv >= 20 && rating >= 4.7)      base += 3;
          else if (rv >= 20 && rating >= 4.4) base += 1;
          else if (rv >= 20 && rating && rating < 3.5) base -= 5; // struggling — shakier revenue bet
          if (s.consolidation_risk)           base -= 12;         // maybe group-owned → no reachable owner
          triage = Math.min(base, 97);
        } else if (c.source === 'for_sale' || s.preparing_for_exit) {
          // Owner IS the seller — directly reachable + urgent. Broker adds a layer.
          triage = c.brokerPosted ? 72 : 84;
        } else if (s.sba_funded || c.source === 'sba_loan') {
          // Just took growth capital, must deploy it — small biz owner, reachable.
          triage = 80;
        } else if (c.source === 'founder_venting' || s.founder_venting) {
          // Owner literally asking for help — most reachable + motivated.
          triage = 82;
        } else if ((c.source === 'theirstack' || c.sizeConfidence === 'trusted') && emp > 0 && emp <= 200) {
          // Verified-small (e.g. TheirStack when re-funded) — reachable size confirmed.
          triage = 76;
        } else if (s.raised_funding || c.source === 'sec_edgar' || c.source === 'news_funding') {
          // Funded/scaling: real revenue signal, but reachability UNVERIFIED (could
          // be VC-backed with layers). Middle tier — Research decides.
          triage = 60;
        } else if ((c.companyTriggers && c.companyTriggers.length) || c.source === 'google_news') {
          // A news trigger (hire, expansion) — a reason to reach out, reachability TBD.
          triage = 52;
        } else {
          triage = emp > 200 ? 25 : 40;
        }

        const icpScore = triage;

        // HONEST "EXACT ICP" — was: perfectFit = "came from an industry search",
        // which fired on staffing firms and enterprises alike. Now it requires
        // genuine fit: real manual-role volume AND a size that fits (or unknown,
        // which for a company not in any DB means small/owner-run).
        const sizeOk = !c.verifiedEmployees || (c.verifiedEmployees >= 5 && c.verifiedEmployees <= 200);
        const realVolume = (c.manualRoleCount || 0) >= 2 || !!c.signals?.ai_replacement_multi;
        const trueExactIcp = !!c.perfectFit && sizeOk && realVolume && !reach.hardBlock;

        return {
          ...c,
          perfectFit: trueExactIcp,
          icpScore,
          // Intent
          intentScore: intent.intentScore,
          signalsFiring: intent.firing,
          urgency: intent.urgency,
          freshness: intent.freshness,
          // Stacking — the 2.5-3x lever
          stacked: intent.isStacked,
          stackMult: intent.stackMult,
          stackWhy: intent.stackWhy,
          stackedSources: intent.stackedSources,
          sourceCount: intent.stackedSources.length,
          // Fit
          reachability: reach.score,
          reachabilityReasons: reach.reasons,
          reachabilityVerdict: reach.verdict,
          reachabilityBlocked: reach.hardBlock,
        };
      })
      // Sort by score, but a BURNING window jumps the queue — that lead expires.
      .sort((a, b) => {
        const aBurn = a.freshness === 'burning' ? 1 : 0;
        const bBurn = b.freshness === 'burning' ? 1 : 0;
        if (aBurn !== bBurn) return bBurn - aBurn;
        return b.icpScore - a.icpScore;
      });

    const comboTally = {};
    for (const c of allScored) if (c.stackCombo) comboTally[c.stackCombo.id] = (comboTally[c.stackCombo.id]||0)+1;
    if (Object.keys(comboTally).length) console.log('Stack combos:', JSON.stringify(comboTally));

    // Adzuna is now the highest-signal source (AI-replacement = biggest tickets).
    // Old 40% cap was built when it was noise — flip it to 70% majority.
    // Total raised to 120 so we return enough leads for a meaningful queue.
    const MAX_TOTAL = 120;
    const MAX_ADZUNA = Math.floor(MAX_TOTAL * 0.70); // 84 max from Adzuna
    const srcTally = {};
    const scored = [];
    for (const c of allScored) {
      const isPureAdzuna = c.sourceCount === 1 && c.source === 'adzuna_ai';
      if (isPureAdzuna) {
        srcTally['_adzuna'] = (srcTally['_adzuna']||0) + 1;
        if (srcTally['_adzuna'] > MAX_ADZUNA) continue;
      }
      scored.push(c);
      if (scored.length >= MAX_TOTAL) break;
    }

    // Breakdown by source
    const breakdown = {};
    scored.forEach(c => { breakdown[c.source] = (breakdown[c.source]||0)+1; });

    console.log('Unique:', unique.length, '| Returning:', scored.length);
    console.log('Breakdown:', breakdown);
    const reachSummary = {
      // Find-time reachability is an ESTIMATE — we have size but no confirmed
      // contact yet. "High" should mean genuinely high (small AND some corroborating
      // signal), not just "small company." Otherwise 86% score high and the metric
      // is useless as a filter. The REAL reachability score is computed post-research
      // once we have a decision-maker and verified email.
      high: scored.filter(c => c.reachability >= 24).length,
      medium: scored.filter(c => c.reachability >= 12 && c.reachability < 24).length,
      low: scored.filter(c => c.reachability < 12).length,
      blocked: scored.filter(c => c.reachabilityBlocked).length,
    };
    console.log('Owner-reachability:', reachSummary);
    console.log('=== DISCOVERY END ===\n');

    res.json({ companies: scored, total: scored.length, breakdown });

  } catch(e) {
    console.error('Discovery fatal error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════
// RESEARCH ENGINE — 15-point audit
// ═══════════════════════════════════════════════════════════
// Free fallback when Hunter credits run out: build the most likely email from
// the decision-maker's name + domain using standard corporate patterns.
// NOT verified — flagged clearly so it's never mistaken for a confirmed address.
const guessEmailFromName = (fullName, domain) => {
  if (!fullName || !domain) return '';
  const clean = domain.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','');
  const parts = fullName.trim().toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/);
  if (parts.length < 2) return '';
  const [first, last] = [parts[0], parts[parts.length-1]];
  // firstname.lastname@ is by far the most common corporate pattern
  return `${first}.${last}@${clean}`;
};

const pageSpeedCache = new Map();
// DIRECT SITE FINGERPRINTING — fetch the raw HTML and detect the actual
// scripts on the page. Far more reliable than scraping builtwith.com:
// a Google Ads conversion tag (AW-xxxx) in their source = they run Google Ads.
// fbq( = Meta pixel. These are facts from their own page, not third-party guesses.
// ── NINJAPEAR ENRICHMENT (optional) ──────────────────────────────────────────
// Real-time company data aggregated from the PUBLIC WEB (not LinkedIn scraping).
// Built by the former Proxycurl team explicitly to avoid the lawsuit that killed
// Proxycurl. Returns: employee count + growth, executives with titles, funding, HQ.
// Dormant until a ninjaPearKey is set in Settings — pay-per-use, no monthly minimum.
// This is the "LinkedIn signal" without the legal/operational death sentence.
const enrichCompany = async (domain, ninjaPearKey) => {
  if (!ninjaPearKey || !domain) return null;
  try {
    const clean = domain.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','');
    const r = await fetchT(
      `https://api.nubela.co/api/v2/company?website=${encodeURIComponent(clean)}&use_cache=if-present`,
      { headers: { 'Authorization': `Bearer ${ninjaPearKey}` } },
      12000
    );
    const d = await safeJson(r);
    if (!d || d.error) return null;
    const execs = (d.executives || []).slice(0, 5).map(e => ({ name: e.name || '', title: e.title || e.role || '', link: e.profile_url || '' }));
    return {
      employeeCount: d.employee_count || d.headcount || null,
      headcountRange: d.headcount_range || '',
      headcountGrowth: d.headcount_growth || null,
      executives: execs,
      founded: d.founded_year || null,
      hq: d.hq_address || d.location || '',
      totalRaised: d.total_raised || null,
      industry: d.industry || '',
      source: 'ninjapear',
    };
  } catch(e) { console.log('NinjaPear error:', e.message); return null; }
};

const checkBuiltWith = async (domain) => {
  try {
    const url = `https://${domain}`;
    const r = await fetchT(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html' } }, 10000);
    const html = await safeText(r);
    if (!html || html.length < 500) return { hasCRM:false, hasEmailMarketing:false, hasPixel:false, hasVideo:false, hasChat:false, hasGoogleAdsTag:false, hasMetaPixel:false, titleTag:'', hasMetaDesc:false, hasH1:false, hasSchema:false, hasEmailCapture:false, hasBooking:false, copyrightYear:0, contacts:{emails:[],phones:[],linkedin:[],facebook:[],owners:[],contactPage:''}, confirmed:false };
    return {
      // CRM / marketing automation — script fingerprints
      hasCRM: /hubspot|hs-scripts|salesforce|pardot|marketo|pipedrive|zoho.*crm/i.test(html),
      hasEmailMarketing: /klaviyo|mailchimp|list-manage|activecampaign|constantcontact|braze|iterable|sendgrid/i.test(html),
      // Analytics / pixels
      hasPixel: /gtag\(|google-analytics|googletagmanager|fbq\(|facebook\.net\/tr|hotjar|mixpanel|segment\.com|clarity\.ms/i.test(html),
      // Google Ads — conversion/remarketing tag is direct evidence of ad spend
      hasGoogleAdsTag: /AW-\d{8,}|googleadservices|google_conversion/i.test(html),
      // Meta pixel — direct evidence of Facebook/IG ad infrastructure
      hasMetaPixel: /fbq\(|facebook\.net\/tr|connect\.facebook\.net.*fbevents/i.test(html),
      hasVideo: /wistia|vimeo|youtube\.com\/embed|vidyard/i.test(html),
      hasChat: /intercom|drift|crisp\.chat|zendesk.*widget|tawk\.to|livechat/i.test(html),
      // ── ON-PAGE SEO & FRESHNESS (free — same HTML fetch) ──
      titleTag: (html.match(/<title[^>]*>([^<]{0,120})/i)?.[1] || '').trim(),
      hasMetaDesc: /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{30,}/i.test(html),
      hasH1: /<h1[\s>]/i.test(html),
      hasSchema: /application\/ld\+json/i.test(html),
      hasEmailCapture: /type=["']email["']|newsletter|subscribe/i.test(html),
      hasBooking: /calendly|acuity|cal\.com|savvycal|youcanbook|appointlet/i.test(html),
      copyrightYear: (() => { const ys = [...html.matchAll(/(?:©|&copy;|copyright)[^0-9]{0,20}(20\d\d)/gi)].map(m=>parseInt(m[1])); return ys.length ? Math.max(...ys) : 0; })(),
      // ── CONTACT INTELLIGENCE — extracted from THEIR page (facts, not guesses) ──
      contacts: (() => {
        const emails = [...new Set([...html.matchAll(/mailto:([^"'?\s>]+)/gi)].map(m=>m[1].toLowerCase()))].slice(0,5);
        const phones = [...new Set([...html.matchAll(/tel:([+\d()\-. ]{7,20})/gi)].map(m=>m[1].trim()))].slice(0,3);
        const linkedin = [...new Set([...html.matchAll(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-z0-9\-_%]+/gi)].map(m=>m[0]))].slice(0,3);
        const facebook = [...new Set([...html.matchAll(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9.\-_]+/gi)].map(m=>m[0]).filter(u=>!/facebook\.com\/(tr|plugins|sharer)/i.test(u)))].slice(0,2);
        const textOnly = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ');
        const nameHits = [...textOnly.matchAll(/([A-Z][a-z]{2,15} [A-Z][a-z]{2,18})\s*[,\u2013\-|]?\s*(Owner|Founder|Co-Founder|President|CEO|Principal)/g)].map(m=>({name:m[1],title:m[2]}));
        const owners = [...new Map(nameHits.map(h=>[h.name,h])).values()].slice(0,3);
        const contactPage = (html.match(/href=["']([^"']*(?:contact|about|team|our-story)[^"']*)["']/i)||[])[1] || '';
        return { emails, phones, linkedin, facebook, owners, contactPage };
      })(),
      hasBooking: /calendly|acuityscheduling|youcanbook|setmore|squareup\.com\/appointments|booksy|simplybook/i.test(html),
      confirmed: true,
    };
  } catch { return { hasCRM:false, hasEmailMarketing:false, hasPixel:false, hasVideo:false, hasChat:false, hasGoogleAdsTag:false, hasMetaPixel:false, confirmed:false }; }
};

// Google Ads Transparency page scrape — HEURISTIC ONLY, not reliable.
// Page-size check produces false positives/negatives. We report it as
// "possible" never "confirmed", and never build a pitch on it.
const checkGoogleAds = async (domain) => {
  try {
    const clean = domain.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','');
    const r = await fetchT(`https://adstransparency.google.com/advertiser?domain=${clean}&region=US`, {}, 8000);
    const html = await safeText(r);
    return { hasGoogleAds: html.length > 50000 || html.includes('ad-card'), confirmed: false, heuristic: true };
  } catch { return { hasGoogleAds: false, confirmed: false, heuristic: true }; }
};

const checkFacebookAds = async (name, fbToken) => {
  if (!fbToken) return { hasAds: false, ads: [], confirmed: false };
  try {
    const url = `https://graph.facebook.com/v19.0/ads_archive?access_token=${fbToken}&ad_reached_countries=US&ad_active_status=ACTIVE&search_terms=${encodeURIComponent(name)}&fields=page_name,ad_creative_body,ad_delivery_start_time&limit=5`;
    const r = await fetchT(url, {}, 8000);
    const d = await safeJson(r);
    if (d.error) return { hasAds: false, ads: [], confirmed: false };
    const ads = (d.data||[]).map(ad => ({ copy: (ad.ad_creative_body||'').slice(0,150), runningDays: ad.ad_delivery_start_time ? Math.floor((Date.now()-new Date(ad.ad_delivery_start_time))/86400000) : 0 }));
    return { hasAds: ads.length > 0, ads, confirmed: true };
  } catch { return { hasAds: false, ads: [], confirmed: false }; }
};

app.post('/api/research', async (req, res) => {
  // hasCTA is used across Brain audit + response assembly. Declared at
  // outer scope so it's visible to all references (fixes scope-leak crash).
  let hasCTA = false;
  FIRECRAWL_OUT_OF_CREDITS = false; // reset per run so the flag reflects THIS request
  const { company, keys, apiKey } = req.body;
  let website = req.body.website;  // mutable — the website guard may resolve/blank it
  const { firecrawlKey, fbToken, ninjaPearKey, companiesApiKey, verifierKey } = keys || {};
  const browserData = req.body.browserData || {};
  const pageSpeed = browserData.pageSpeed || {};
  const emailData = browserData.emailData || {};
  const companyData = browserData.companyData || {};
  const discoverySignals = req.body.discoverySignals || {};
  const discoverySource = req.body.discoverySource || '';
  const discoveryReason = req.body.discoveryReason || '';
  // LANE VISIBILITY - the retainer pitch silently falling back to software was a
  // real failure mode with no error attached. Now every research call states its lane.
  const _lane = req.body.buyingLane;
  if (!_lane) console.log(`[LANE] ${company}: buyingLane MISSING from request -> defaulting to software. If this company came from a marketing-role posting, the RETAINER pitch just failed silently.`);
  else console.log(`[LANE] ${company}: ${_lane}${_lane === 'retainer' ? '  <- RETAINER (core product)' : _lane === 'both' ? '  <- PERFECT STORM' : ''}`);

  const manualRoleCount = req.body.manualRoleCount || 0;
  let verifiedEmployees = req.body.verifiedEmployees || null;
  let verifiedRevenue = req.body.verifiedRevenue || null;
  let verifiedCEO = req.body.verifiedCEO || null;
  let verifiedCEOTitle = req.body.verifiedCEOTitle || null;
  let publicPainSignals = req.body.publicPainSignals || [];
  const manualCategories = req.body.manualCategories || 0;
  const icpProfile = req.body.icpProfile || '';
  const stackCombo = req.body.stackCombo || null;
  if (!company) return res.status(400).json({ error: 'Company name required' });

  // ═══ FULL ENRICHMENT AT RESEARCH TIME ══════════════════════════════════
  // Only runs for THIS one company (no rate-limiting risk). Gets CEO name,
  // public pain signals, revenue — the deep intelligence for the pitch.
  // Skip if we already have it from Find, or if no company name.
  // REMOVED: googleEnrich(). It used googleSearch(), which is IP-BLOCKED from
  // Render — it returned "2 chars" every single time and never once produced a
  // CEO name or a pain signal. It is fully replaced by findDecisionMaker()
  // (multi-source, corroborated) and findBusinessPain() (Firecrawl web search),
  // both of which actually work.

  // PRE-FLIGHT: log exactly what keys we received so we can debug 422s
  console.log(`Research: ${company} | website: ${website||'none'} | apiKey: ${apiKey ? apiKey.slice(0,12)+'...' : 'MISSING'} | firecrawl: ${firecrawlKey ? 'present' : 'MISSING'} | manualRoles: ${manualRoleCount}`);

  // Pre-flight check — return 400 immediately if Anthropic key is missing
  // so the error message is clear rather than a confusing 422
  if (!apiKey) {
    return res.status(400).json({
      brainFailed: true,
      reason: 'Anthropic API key missing — go to Settings and add your sk-ant-... key'
    });
  }

  let domain = website ? website.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','') : '';
  let verifiedIndustry = null;  // declared early — the domain-confirmation step uses it
  console.log(`Research: ${company} | ${website||'no website'}`);

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // WEBSITE INTEGRITY GUARD — audit the REAL business, never a listing page
    // ═══════════════════════════════════════════════════════════════════════
    // The #1 way an audit goes wrong: we scrape a BizBuySell/broker/directory
    // page instead of the actual business's website. Every finding would then be
    // about the WRONG site — "no CTA, no pixel" describes BizBuySell, not the
    // business. That destroys the entire audit's credibility.
    //
    // This blocks EVERY known listing/aggregator/directory host — not just
    // BizBuySell — and if the website we were handed is one of them (or empty,
    // as for-sale leads always are), it resolves the business's REAL domain via
    // search before anything is scraped. If it can't find a real domain, it runs
    // the audit WITHOUT a website rather than auditing the wrong one.
    const LISTING_OR_DIRECTORY_HOST = /(bizbuysell|bizquest|businessesforsale|businessbroker|loopnet|dealstream|flippa|businessmart|sunbeltnetwork|murphybusiness|transworld|acquisitions?\.com|empireflippers|quietlight|latonas|feinternational|crexi|costar|loopnet|linkedin|facebook|twitter|instagram|yelp|bbb\.org|manta|buzzfile|dnb\.com|dun|indeed|glassdoor|crunchbase|bloomberg|zoominfo|wikipedia|youtube|mapquest|yellowpages|angi\.com|thumbtack|houzz|google\.com\/maps)/i;

    const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
    const handedHost = hostOf(website);
    const handedIsListingOrEmpty = !website || LISTING_OR_DIRECTORY_HOST.test(handedHost);

    if (handedIsListingOrEmpty && website) {
      console.log(`WEBSITE GUARD [${company}]: handed a listing/directory URL (${handedHost}) — NOT the business's site. Resolving real domain…`);
    }

    // Resolve the real business domain if what we have isn't usable
    if (handedIsListingOrEmpty && firecrawlKey && company) {
      const real = await findWebsiteViaSearch(company, firecrawlKey, req.body.location);
      if (real && !LISTING_OR_DIRECTORY_HOST.test(hostOf(real))) {
        console.log(`WEBSITE GUARD [${company}]: resolved real domain → ${real}`);
        website = real;
        domain = hostOf(real);
      } else {
        console.log(`WEBSITE GUARD [${company}]: could NOT resolve a real business domain — auditing WITHOUT a website rather than auditing the wrong one`);
        website = ''; // never audit the listing page
      }
    }

    // Final safety check — after resolution, if the website is STILL a listing
    // host, blank it. We would rather have no site audit than a wrong one.
    if (website && LISTING_OR_DIRECTORY_HOST.test(hostOf(website))) {
      console.log(`WEBSITE GUARD [${company}]: website still points to a listing host after resolution — blanking it`);
      website = '';
    }

    const isBizBuySellUrl = false; // handled comprehensively above now

    const scrapeHomepage = async () => {
      if (!website || !firecrawlKey) return {};
      const doScrape = (timeout) => fetchT('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: website, formats: ['markdown', 'screenshot'], onlyMainContent: false, waitFor: 1500, maxAge: FC_CACHE_MS, blockAds: true, removeBase64Images: true }),
      }, timeout).then(r => r.json());
      const looksEmpty = (res) => {
        const md = (res?.data?.markdown || res?.markdown || '');
        return md.length < 200 || /connection reset|can'?t be reached|took too long|refused to connect|err_|502 bad gateway|503 service|504 gateway/i.test(md.slice(0, 400));
      };
      let res;
      try {
        res = await doScrape(20000);
      } catch(e) {
        console.log('Firecrawl timeout — retrying once with longer timeout');
        try { res = await doScrape(35000); } catch(e2) { console.log('Firecrawl retry also failed:', e2.message); return {}; }
      }
      // CONTENT-LEVEL RETRY: a "Connection Reset"/empty scrape is usually transient
      // on the free tier (A1 Restoration lost its whole audit to one). Pause and try
      // once more before we give up the homepage, the owner, and the audit.
      if (looksEmpty(res)) {
        console.log(`Firecrawl returned empty/error content for ${website} — retrying once after a pause`);
        await new Promise(r => setTimeout(r, 2500));
        try { const res2 = await doScrape(30000); if (!looksEmpty(res2)) { console.log(`Firecrawl retry recovered content for ${website}`); return res2; } } catch {}
      }
      return res || {};
    };

    const [firecrawlRes, fbAdsRes, builtWithRes, googleAdsRes, enrichRes] = await Promise.allSettled([
      scrapeHomepage(),
      fbToken ? checkFacebookAds(company, fbToken) : checkAdLibraryViaFirecrawl(company, firecrawlKey),
      domain ? checkBuiltWith(domain) : Promise.resolve({hasCRM:false}),
      domain ? checkGoogleAds(domain) : Promise.resolve({hasGoogleAds:false}),
      enrichCompany(domain, ninjaPearKey),
    ]);

    const firecrawlData = firecrawlRes.value || {};
    const content = firecrawlData.data?.markdown || firecrawlData.markdown || '';
    const screenshotUrl = firecrawlData.data?.screenshot || firecrawlData.screenshot || null;
    const fbAds = fbAdsRes.value || {};
    const enrichment = enrichRes.value || null;
    const builtWith = builtWithRes.value || {};
    const googleAds = googleAdsRes.value || {};
    const email = emailData; // from browser via browserData

    // ═══ CONFIRM WE'RE AUDITING THE RIGHT COMPANY ════════════════════════════
    // We resolved a domain and scraped it — but is it REALLY this company, or a
    // different business with the same name? Confirm before generating a single
    // finding. If it's clearly the wrong company, blank the site data so we don't
    // build an audit about someone else. A blank audit beats a confident wrong one.
    let domainConfirmation = { match: 'unknown', confidence: 'low', reason: '' };
    if (website && content && content.length > 100) {
      domainConfirmation = await confirmDomainMatch(company, content, {
        location: req.body.location,
        industry: verifiedIndustry || req.body.industry,
        signal: req.body.sourceSignal || req.body.discoveryReason,
        employees: verifiedEmployees,
      }, apiKey);
      console.log(`DOMAIN MATCH [${company}]: ${domainConfirmation.match} (${domainConfirmation.confidence}) — ${domainConfirmation.reason}`);

      if (domainConfirmation.match === 'no') {
        // Wrong company. Do NOT audit this site. Blank everything site-derived.
        console.log(`⛔ WRONG COMPANY [${company}]: resolved site is a different business. Discarding site audit — will not generate findings about the wrong company.`);
        website = '';
        domain = '';
      }
    }

    // If Hunter found a named contact, use them as the verified decision-maker.
    // Hunter is the most reliable source — it finds the actual person at the domain.
    if (!verifiedCEO && email.founderName && email.founderName.trim().length > 3) {
      verifiedCEO = email.founderName.trim();
      verifiedCEOTitle = email.title || email.founderTitle || 'Owner';
      console.log(`Hunter name used as CEO: ${verifiedCEO} (${verifiedCEOTitle})`);
    }

    // ═══ THE COMPANIES API — authoritative size/industry (if key present) ═══════
    if (companiesApiKey && website) {
      try {
        const capi = await enrichViaCompaniesAPI(website, companiesApiKey);
        if (capi) {
          if (capi.employees && !verifiedEmployees) verifiedEmployees = capi.employees;
          if (capi.industry) verifiedIndustry = capi.industry;
        }
      } catch(e) { console.log('CompaniesAPI research enrich skipped:', e.message); }
    }

    // NOTE: The old regex-based about-page CEO finder was REMOVED here. It was
    // the thing producing garbage like "on core (principal)", and it scraped the
    // same /about and /team pages that findOwnerViaBrain (below) scrapes anyway —
    // burning 1-3 Firecrawl credits per research for a worse answer.
    // findOwnerViaBrain does this properly: it uses /map to find the REAL
    // leadership pages, then has Claude read them.

    // ═══ SIZE VIA WEB SEARCH — closes the Companies API coverage gap ═══════
    // The Companies API returns emp=? on a big share of private SMBs. ZoomInfo's
    // public pages, D&B, Buzzfile and Manta all publish headcount and revenue for
    // private companies, free to read. Only runs when we still have no headcount.
    // CREDIT GATE: ~3 credits. Only if we genuinely have no headcount at all.
    // CREDIT GATE: skip entirely for Places/local-owner leads — we deliberately do
    // NOT size them (trusted small-local), so paying ~5 Firecrawl credits to size a
    // business we chose not to size was pure waste on our most common lead type.
    // ═══ REVENUE + SIZE VIA WEB SEARCH — the "Google their revenue" answer ═══
    // Prospeo/RocketReach/Growjo/ZoomInfo publish private-SMB revenue and it sits
    // in the search snippet, so this is now ~1 credit (snippet-only) — cheap enough
    // to run on EVERY research lead, including Places, to CONFIRM they clear the
    // ~$800k affordability bar instead of relying only on the review-count proxy.
    // ═══ DECISION-MAKER FIRST — it's the gate for everything expensive ═════
    // Owner-finding is the single most important step: no reachable owner = no
    // send, so it must run BEFORE we spend Firecrawl/Anthropic on pain + revenue.
    // (Previously those ran first and were wasted on unsendable leads.)
    // ═══ CONTACT CACHE — read first, skip the expensive lookups on a hit ═══
    // Owner + email + revenue barely change, so a fresh cached hit means near-zero
    // credits for a re-research. "Re-run Research" (forceRefresh) bypasses it.
    const forceRefresh = req.body.forceRefresh === true;
    const cachedContact = (domain && !forceRefresh) ? await getCachedContact(domain).catch(() => null) : null;
    if (cachedContact && (cachedContact.owner || cachedContact.email || cachedContact.revenue)) {
      console.log(`CACHE HIT [${domain}]: ${cachedContact.owner ? 'owner ' : ''}${cachedContact.email ? 'email ' : ''}${cachedContact.revenue ? 'revenue' : ''}— skipping paid lookups`);
    }
    if (cachedContact && cachedContact.revenue && !verifiedRevenue) verifiedRevenue = cachedContact.revenue;

    let decisionMaker = null;
    if (cachedContact && cachedContact.owner) {
      decisionMaker = cachedContact.owner;
      if (!verifiedCEO) { verifiedCEO = decisionMaker.name; verifiedCEOTitle = decisionMaker.title || 'Owner'; }
    } else if (company) {
      try {
        decisionMaker = await findDecisionMaker({
          companyName: company, website, fcKey: firecrawlKey, apiKey,
          homepageContent: content,
          hunterName: email.founderName || '', hunterTitle: email.title || '',
          location: req.body.location || '',
        });
        if (decisionMaker && decisionMaker.name) {
          if (!verifiedCEO || decisionMaker.corroborated || decisionMaker.confidence === 'high') {
            verifiedCEO = decisionMaker.name;
            verifiedCEOTitle = decisionMaker.title || verifiedCEOTitle || 'Owner';
          }
        }
      } catch(e) { console.log('Decision-maker engine failed (non-fatal):', e.message); }
    }
    const ownerFound = !!(decisionMaker && decisionMaker.name) || !!verifiedCEO;
    const isPlacesLead = discoverySource === 'google_places' || !!(discoverySignals && discoverySignals.local_owner_operated);

    // ═══ PAIN + REVENUE + CAREERS — only if reachable, run in PARALLEL ══════════
    let painSummary = '';
    let careers = null;
    let sitePages = null;
    if (cachedContact && cachedContact.pain && Array.isArray(cachedContact.pain.signals) && cachedContact.pain.signals.length) {
      publicPainSignals = cachedContact.pain.signals;
      painSummary = cachedContact.pain.summary || '';
      console.log(`PAIN [${company}]: from cache (${publicPainSignals.length} signals)`);
    }
    if ((ownerFound || isPlacesLead) && !(cachedContact && cachedContact.pain)) {
      // BEST pain source for a Places lead: their OWN Google reviews. Try it first —
      // their exact business (no disambiguation), maximally specific, cheaper than a
      // web search. Fall back to web-search pain only if reviews yield nothing.
      const placesKey = process.env.GOOGLE_PLACES_KEY || '';
      // ══ REVIEW-PATTERN MINE — the highest-reply-rate asset the system produces ══
      // Runs on EVERY Places lead, no exceptions: a pain named across MANY of their
      // own reviews ("7 of ~40 reviewers mention the same callback delay") is the
      // single strongest "how do they know THIS?" hook we can put in an email.
      // Deep pattern-mine first (scrapes their full reviews page, counts repeats);
      // if Google blocks the scrape, fall back to the free 5-review API mine so we
      // ALWAYS have something real. Web-search pain is the last resort.
      let reviewPainFound = false;
      if (req.body.placeId && firecrawlKey && apiKey && publicPainSignals.length === 0) {
        try {
          const deep = await deepReviewMine(company, req.body.placeId, firecrawlKey, apiKey);
          if (deep && deep.signals && deep.signals.length > 0) {
            publicPainSignals = deep.signals.map(sg => `${sg.pain} — evidence: "${String(sg.evidence).slice(0, 140)}" (${sg.source})`);
            painSummary = deep.summary || painSummary;
            reviewPainFound = true;
          }
        } catch(e) { console.log('Deep review mine skipped:', e.message); }
      }
      if (!reviewPainFound && req.body.placeId && placesKey && apiKey && publicPainSignals.length === 0) {
        try {
          const gr = await painFromGoogleReviews(company, req.body.placeId, placesKey, apiKey, null, false);
          if (gr.signals && gr.signals.length > 0) {
            publicPainSignals = gr.signals.map(sg => `${sg.pain} — evidence: "${String(sg.evidence).slice(0, 140)}" (${sg.source})`);
            painSummary = gr.summary || '';
            reviewPainFound = true;
          }
        } catch(e) { console.log('Google-reviews pain skipped:', e.message); }
      }
      const needPain = publicPainSignals.length === 0 && firecrawlKey && apiKey && company;
      const needRev  = !verifiedRevenue && firecrawlKey && apiKey && company && req.body.deepMode !== false;
      const [painRes, revRes, carRes, siteRes] = await Promise.allSettled([
        needPain ? findBusinessPain(company, website, firecrawlKey, apiKey, verifiedIndustry, req.body.location) : Promise.resolve(null),
        needRev  ? findSizeViaSearch(company, website, firecrawlKey, apiKey, req.body.location) : Promise.resolve(null),
        website  ? scrapeCareersPage(website, firecrawlKey, apiKey, company) : Promise.resolve(null),
        website  ? auditSitePages(website, firecrawlKey, apiKey, company) : Promise.resolve(null),
      ]);
      careers = carRes.status === 'fulfilled' ? carRes.value : null;
      sitePages = siteRes.status === 'fulfilled' ? siteRes.value : null;
      const pain = painRes.status === 'fulfilled' ? painRes.value : null;
      if (pain && pain.signals && pain.signals.length > 0) {
        publicPainSignals = pain.signals.map(sg => `${sg.pain} — evidence: "${String(sg.evidence).slice(0, 140)}" (${sg.source || 'web'})`);
        painSummary = pain.summary || '';
      }
      const sz = revRes.status === 'fulfilled' ? revRes.value : null;
      if (sz) {
        if (sz.employees && !verifiedEmployees) { verifiedEmployees = sz.employees; console.log(`SIZE [${company}]: recovered ${sz.employees} employees (${sz.source})`); }
        if (sz.revenue) { verifiedRevenue = sz.revenue; console.log(`REVENUE [${company}]: ${sz.revenue} via ${sz.source} (${sz.confidence})`); }
      }
    } else {
      console.log(`Deep audit skipped for ${company}: no owner found (unsendable lead) — saved pain + revenue credits`);
    }

    // ═══ FIREPROOF EMAIL ENGINE ════════════════════════════════════════════
    // Runs AFTER the CEO name is known (Hunter → About-page → Brain), because
    // the name is what makes pattern generation possible. Returns a scored,
    // tiered result — never a bare guess dressed up as a fact.
    let emailResult = (cachedContact && cachedContact.email) ? cachedContact.email : null;
    if (emailResult) {
      email.email = emailResult.email;
      if (!verifiedCEO && emailResult.name) verifiedCEO = emailResult.name;
      console.log(`EMAIL [${company}]: from cache — ${emailResult.email}`);
    } else if (website) {
      try {
        emailResult = await findEmailFireproof({
          website,
          ceoName: (decisionMaker && decisionMaker.name) || verifiedCEO,
          ceoTitle: (decisionMaker && decisionMaker.title) || verifiedCEOTitle,
          employees: verifiedEmployees,
          fcKey: firecrawlKey,
          homepageContent: content,
          hunterEmail: email.email || '',
          hunterName: email.founderName || '',
          hunterTitle: email.title || '',
          verifierKey,
          // We already PROVED this homepage belongs to the target company, so a
          // personal address published on it is theirs regardless of its domain.
          siteConfirmed: domainConfirmation ? (domainConfirmation.match === 'yes') : false,
        });
        if (emailResult && emailResult.email) {
          console.log(`EMAIL RESULT [${company}]: ${emailResult.email} | ${emailResult.label} | score ${emailResult.score} | sendable: ${emailResult.sendable}`);
          // Only overwrite the browser-found email if ours is better evidence
          if (!email.email || emailResult.tier <= 2) {
            email.email = emailResult.email;
          }
          if (!verifiedCEO && emailResult.name) verifiedCEO = emailResult.name;
        }
      } catch(e) { console.log('Email engine failed (non-fatal):', e.message); }
    }

    // ═══ WRITE THE CONTACT CACHE — so this lead is near-free to re-research ═══
    // Only confident results get stored (guard is inside cacheContact), so a weak
    // guess never gets locked in. Fire-and-forget; never blocks the response.
    if (domain && !cachedContact) {
      cacheContact(domain, { owner: decisionMaker, email: emailResult, revenue: verifiedRevenue, pain: { signals: publicPainSignals, summary: painSummary } }).catch(() => {});
    }

    // ═══ COMPANY NEWS TRIGGERS — recent events for the pitch cold-open ═══════
    // "I saw you just opened your third location" is a killer opener. Free via
    // Google News RSS. STRICTLY verified to be about THIS company — a mismatched
    // article would poison the pitch, so getCompanyNews rejects anything ambiguous.
    let companyTriggers = [];
    try {
      const news = await getCompanyNews(company, website, req.body.location || '');
      if (news.hasNews) companyTriggers = news.triggers;
    } catch(e) { console.log('News enrich skipped:', e.message); }

    const hasDiscoveryContext = manualRoleCount > 0 || discoverySignals.raised_funding || discoverySignals.preparing_for_exit || discoverySignals.rebranding || discoverySignals.recently_acquired;

    // ═══ SCRAPE SANITY CHECK (permissive) ════════════════════════════════
    // Detect a BROKEN scrape (bot wall, cookie modal, wrong page) so we don't
    // audit garbage as the homepage. Permissive: flags only clear failures, and
    // if a discovery signal exists (hiring/funding/exit) the audit STILL runs on
    // that — we just tell the Brain not to trust the page content. No real lead lost.
    const lowerContent = (content || '').toLowerCase();
    const scrapeLooksBroken = content.length > 50 && (
      /enable javascript|access denied|are you a robot|verify you are human|captcha|cloudflare|just a moment|checking your browser/i.test(lowerContent.slice(0, 800)) ||
      (content.length < 300 && !screenshotUrl)
    );
    const companyCore = (company || '').toLowerCase().replace(/[^a-z0-9 ]/g,'').split(' ').filter(w=>w.length>3).slice(0,2);
    const pageMentionsCompany = companyCore.length === 0 || companyCore.some(w => lowerContent.includes(w));
    const scrapeTrustworthy = content.length > 300 && !scrapeLooksBroken && pageMentionsCompany;
    // SITE UNREACHABLE — a genuine connection error / dead page, NOT bot-blocking.
    // A1 Restoration returned "Connection Reset" (24 chars) and we then confidently
    // pitched "your page shows a connection error" — auditing our own failed fetch.
    // This may be transient or our-side, so we must NOT claim their site is broken.
    const siteUnreachable = /connection reset|can'?t be reached|took too long|refused to connect|err_|dns_probe|502 bad gateway|503 service|504 gateway|temporarily unavailable|account suspended|domain (is )?(for sale|parked)/i.test(lowerContent.slice(0,600))
      || (content.length > 0 && content.length < 60 && !scrapeTrustworthy);
    if (siteUnreachable) console.log(`SITE UNREACHABLE [${company}]: page returned a connection/error state — auditing from signals only, NOT claiming their site is broken`);
    if (content.length > 50 && !scrapeTrustworthy) {
      console.log(`SCRAPE GUARD: content not trustworthy (broken:${scrapeLooksBroken}, mentionsCompany:${pageMentionsCompany}, len:${content.length}) — audit leans on discovery signals`);
    }
    // Broken scrape → send empty content so Brain audits from discovery signals,
    // never from a cookie banner. Screenshot still passes through if present.
    const trustedContent = scrapeTrustworthy ? content : '';

    // ═══ REACH INTELLIGENCE ═══════════════════════════════════════════════
    // Timing window — deterministic from discovery signals
    const reachWindow = discoverySignals.preparing_for_exit ? { window: 'NOW — actively listed for sale', urgency: 'high', note: 'Owner is in transaction mode; financial conversations land immediately' }
      : discoverySignals.agency_review ? { window: '~60 days', urgency: 'high', note: 'Actively shopping for agency replacement — window closes when they sign someone' }
      : discoverySignals.raised_funding ? { window: '30-90 days post-raise', urgency: 'medium-high', note: 'Deploying new capital; budgets being allocated right now' }
      : (discoverySignals.rebranding || discoverySignals.recently_launched) ? { window: '~30 days', urgency: 'medium', note: 'In transition — vendors being picked' }
      : (manualRoleCount >= 3) ? { window: 'while job postings are live', urgency: 'medium', note: 'Feeling the labor pain right now — live postings prove it is current' }
      : { window: 'standard', urgency: 'normal', note: '' };

    // Hunter contact verified against homepage
    const founderName = (email.founderName || '').trim();
    const founderLastName = founderName.split(' ').slice(-1)[0].toLowerCase();
    const nameOnPage = founderLastName.length > 2 && trustedContent.toLowerCase().includes(founderLastName);

    // Email quality — deterministic grade
    const emailAddr = (email.email || '').toLowerCase();
    const emailLocal = emailAddr.split('@')[0] || '';
    const isGenericInbox = /^(info|contact|hello|admin|office|support|sales|team|mail)$/.test(emailLocal);
    const isPersonalPattern = founderName && emailLocal.length > 1 && founderName.toLowerCase().split(' ').some(w => w.length > 2 && emailLocal.includes(w.slice(0, Math.min(w.length, 5))));
    const ownerTitle = /owner|founder|ceo|president|principal/i.test(email.title || email.founderTitle || '');
    const emailGrade = !emailAddr ? 'none'
      : isPersonalPattern && ownerTitle ? 'A — personal email of owner-level contact'
      : isPersonalPattern ? 'B — personal-pattern email'
      : ownerTitle && !isGenericInbox ? 'B — owner title, non-generic address'
      : isGenericInbox ? 'D — generic inbox (info@), low open odds'
      : 'C — email found, quality unclear';
    if (founderName || emailAddr) console.log(`Reach: ${founderName||'no name'} | grade: ${emailGrade} | nameOnPage: ${nameOnPage} | window: ${reachWindow.window}`);

    console.log(`Firecrawl: ${content.length} chars | screenshot: ${!!screenshotUrl} | scrapeTrustworthy: ${scrapeTrustworthy} | discoveryContext: ${hasDiscoveryContext} | apiKey: ${!!apiKey}`);

    // If we have content OR screenshot, run the full Brain audit
    let visualAnalysis = null;
    let brainAudit = null;
    let brainError = '';


    if (apiKey && (screenshotUrl || trustedContent.length > 100 || hasDiscoveryContext)) {
      try {
        // Build message content — always send text, add image if available
        const msgContent = [];

        let screenshotBase64 = null;
        if (screenshotUrl && !siteUnreachable) {
          try {
            const imgRes = await fetchT(screenshotUrl, {}, 10000);
            const imgBuffer = await imgRes.buffer();
            // Render free tier uploads slowly — a 4MB image alone can eat 20s.
            // Cap at 1.5MB: most above-fold screenshots fit; oversized ones get
            // skipped and the audit runs from the scraped text (still good).
            if (imgBuffer.length < 3 * 1024 * 1024) {
              screenshotBase64 = imgBuffer.toString('base64');
              msgContent.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 } });
            } else {
              console.log(`Screenshot too large (${Math.round(imgBuffer.length/1024/1024*10)/10}MB) — skipping image, auditing from text`);
            }
          } catch(e) { console.log('Screenshot fetch failed:', e.message); }
        }

        // ═══ VISION AUDIT — the eyes of the operation ════════════════════════
        // Look at the ACTUAL rendered page instead of grepping HTML. These
        // findings are mechanical (a human would agree) and OVERRIDE the
        // regex-based CTA/social-proof guesses when available — because a
        // screenshot can't be fooled by JS-rendered content the way source-scan can.
        if (screenshotBase64) {
          visualAnalysis = await visionAuditPage(screenshotBase64, company, apiKey);
          // visualAnalysis now carries the authoritative visual findings;
          // hasCTA (declared below) reads from it directly.

          // ═══ VISION EMAIL RECOVERY — the big reachability unlock ═══════════
          // Small businesses routinely publish their email as an IMAGE or write it
          // obfuscated ("jill [at] company dot com") to dodge scrapers. Our regex
          // scraper is structurally blind to both; the vision model READ the page
          // and can see them. If the email engine came up empty (or only found a
          // role inbox) and vision saw a real address on THEIR OWN confirmed
          // homepage, use it — that's a genuinely reachable human we were throwing
          // away. Tier 1 (published on their own site), same as a scraped email.
          const vEmail = visualAnalysis && visualAnalysis.visibleEmail;
          if (vEmail) {
            const vLocal = vEmail.split('@')[0];
            const vIsRole = /^(info|sales|contact|office|admin|hello|team|support|help|enquir|inquir|marketing|general|mail|reception|billing|service|customer|hr|jobs|careers|press|media|noreply|no-reply)$/i.test(vLocal);
            const haveNothing = !emailResult || !emailResult.email;
            const haveOnlyRole = emailResult && emailResult.email && /^(info|sales|contact|office|admin|hello|team|support|general|mail)@/i.test(emailResult.email);
            if (haveNothing || (haveOnlyRole && !vIsRole)) {
              const ownerToks = String(verifiedCEO || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
              const matchesOwner = ownerToks.length > 0 && localMatchesName(vLocal, ownerToks);
              emailResult = {
                email: vEmail,
                tier: 1,
                score: vIsRole ? 60 : 100,
                label: vIsRole
                  ? 'Shared inbox read from their homepage image'
                  : (matchesOwner ? 'Personal mailbox read from their homepage image (matches owner)' : 'Personal mailbox read from their homepage image'),
                sendable: true,
                name: matchesOwner ? verifiedCEO : null,
                source: 'vision_homepage',
              };
              email.email = vEmail;
              console.log(`✓ EMAIL RECOVERED BY VISION [${company}]: ${vEmail} — text scraper was blind to it${visualAnalysis.visibleEmailRaw && visualAnalysis.visibleEmailRaw !== vEmail ? ` (page shows it as "${visualAnalysis.visibleEmailRaw}")` : ''}`);
            }
          }
        }

        // ═══ ICP LANE CLASSIFIER — maps to the CEO's four real client profiles ═══
        // The CEO defined who CROJungle can SERVE. Our size gate defines who cold
        // email can REACH. This classifier finds the overlap and tells the Brain
        // which lane this company is in — which drives product + proof point choice.
        const icpLane = (() => {
          const emp = verifiedEmployees || 0;
          const roles = manualRoleCount || 0;
          const siteYear = builtWith.copyrightYear || null;
          const staleSite = siteYear && siteYear < 2021;
          const adSpendSignal = ((fbAds.adCount || 0) > 0 && fbAds.countReliable !== false) || !!builtWith.hasGoogleAdsTag;
          const lanes = [];

          // LANE 2 (software): grown fast then stagnated, high headcount:revenue ratio,
          // hiring people to do what software can do. Our Adzuna manual-role signal IS this.
          if (roles >= 2) {
            lanes.push({
              lane: 'SOFTWARE',
              why: `${roles} manual/repetitive roles open — hiring people to do what software can do. This is the "high employee-count-to-revenue ratio" profile.`,
              product: 'Custom AI Software Build',
              proofPoint: 'seasonal-business (relief + profit) or Kraft Heinz (if larger/more technical)',
            });
          }

          // LANE 1 (high-end website): site built pre-2021, poor digital presence, no AI
          if (staleSite || (builtWith.hasMetaDesc === false && builtWith.hasH1 === false)) {
            lanes.push({
              lane: 'WEBSITE_REBUILD',
              why: staleSite
                ? `Site copyright reads ${siteYear} — the digital footprint predates 2021 and is decaying.`
                : 'Site is missing fundamental on-page structure (no meta description, no H1) — a decayed digital presence.',
              product: 'Website Rebuild',
              proofPoint: 'University of Canada West (digital decay → working recruitment tool)',
            });
          }

          // LANE 4 (retainer marketing, SMB): $1.5M-$50M, hiring marketing, poor digital, stagnant
          if (adSpendSignal) {
            const reliableCount = (fbAds.countReliable !== false && (fbAds.adCount || 0) > 0) ? fbAds.adCount : null;
            lanes.push({
              lane: 'RETAINER_MARKETING',
              why: reliableCount
                ? `${reliableCount} active paid ads confirmed — real budget flowing into a funnel we can audit.`
                : `Google Ads tag live on the site — real paid budget flowing into a funnel we can audit.`,
              product: 'End-to-End Marketing / Ads Management',
              proofPoint: 'Sean ($140k on $4k in one month, ~30x over 8 months)',
            });
          }

          if (lanes.length === 0) {
            return {
              summary: 'No strong lane signal — audit from the site alone and pick the sharpest confirmed problem.',
              lanes: [],
            };
          }
          return {
            summary: lanes.map(l => `[${l.lane}] ${l.why} → likely product: ${l.product}. Best-parallel proof point: ${l.proofPoint}.`).join('\n'),
            lanes,
          };
        })();

        const homepageSnippet = trustedContent.slice(0, 4000);

    // You cannot argue with it, and no competitor will ever tell them.
    hasCTA = (typeof visualAnalysis?.hasVisibleCTA === 'boolean')
      ? visualAnalysis.hasVisibleCTA
      : /call|contact|get started|book|schedule|buy|request|demo|try|sign up|free trial/i.test(content.slice(0,3000));

    const moneyOnFire = (() => {
      const fires = [];
      const adCount = fbAds.adCount || 0;
      // A keyword-search count (countReliable === false) is NOT this advertiser's
      // ad volume — it must never manufacture a fire. Real ad presence still
      // counts if we have a reliable FB count OR an actual Google Ads tag on the page.
      const adCountReliable = fbAds.countReliable !== false;
      const hasAds = (adCount > 0 && adCountReliable) || !!builtWith.hasGoogleAdsTag;

      // FIRE 1 — Paying for traffic they cannot measure.
      if (hasAds && adCountReliable && adCount > 0 && adCount < 500 && !builtWith.hasMetaPixel) {
        fires.push({
          severity: 'critical',
          fire: `${adCount} paid ads running with NO Meta pixel installed`,
          cost: 'Every dollar of that ad spend is unmeasurable. They cannot tell a winning ad from a losing one, cannot retarget a single visitor, and cannot optimize anything. They are flying completely blind.',
        });
      }
      if (hasAds && !builtWith.hasPixel) {
        fires.push({
          severity: 'critical',
          fire: 'Paying for ads with NO analytics of any kind on the page',
          cost: 'Zero conversion tracking. They cannot answer "did that ad make money?" — for any ad, ever.',
        });
      }

      // FIRE 2 — Paying for traffic that lands somewhere it cannot convert.
      if (hasAds && !hasCTA) {
        fires.push({
          severity: 'critical',
          fire: `Paid traffic landing on a page with no call-to-action`,
          cost: 'They are renting attention and then giving it away. A visitor who WANTS to act has nowhere to click.',
        });
      }
      if (hasAds && !builtWith.hasEmailCapture && !builtWith.hasBooking) {
        fires.push({
          severity: 'high',
          fire: 'Paid traffic with no email capture and no booking tool',
          cost: 'Every visitor who is not ready to buy TODAY is lost permanently. No second chance, no nurture, nothing.',
        });
      }

      // FIRE 3 — Paying humans to do work software does once.
      if (manualRoleCount >= 2) {
        const annual = manualRoleCount * 55000;
        fires.push({
          severity: 'high',
          fire: `${manualRoleCount} manual roles open — roughly $${(annual/1000).toFixed(0)}k/yr in loaded salary`,
          cost: `That is a recurring, compounding cost for work a one-time build handles permanently. They pay it again every single year.`,
        });
      }

      // FIRE 4 — No CRM. Every lead they generate leaks out the side.
      if (hasAds && !builtWith.hasCRM) {
        fires.push({
          severity: 'high',
          fire: 'Running paid ads with no CRM detected',
          cost: 'Leads arrive and vanish. No follow-up, no pipeline, no idea which ones closed.',
        });
      }

      const critical = fires.filter(f => f.severity === 'critical').length;
      return {
        fires,
        count: fires.length,
        criticalCount: critical,
        // 3+ simultaneous fires with ad spend confirmed = the audit writes itself
        isBurning: fires.length >= 3 && hasAds,
        headline: fires.length === 0 ? '' :
          critical > 0
            ? `${fires.length} ways this business is losing money right now — ${critical} of them critical and provable`
            : `${fires.length} confirmed leaks in how this business converts and operates`,
      };
    })();
    if (moneyOnFire.count > 0) {
      console.log(`MONEY ON FIRE [${company}]: ${moneyOnFire.count} leaks (${moneyOnFire.criticalCount} critical)${moneyOnFire.isBurning ? ' — BURNING' : ''}`);
      moneyOnFire.fires.forEach(f => console.log(`  · [${f.severity}] ${f.fire}`));
    }

    // ═══ AUDIT-DRIVEN PRODUCT ELIGIBILITY ═══════════════════════════════════
    // The brain may ONLY recommend from this list, computed from what the audit
    // actually found. This is what stops the over-default to AI software: a
    // product is only eligible if its triggering signal is present. Marketing and
    // website are the defaults; software/AI Brain must be EARNED by a real signal.
    const _psig = req.body.discoverySignals || {};
    const _staleSite = builtWith.copyrightYear && builtWith.copyrightYear < 2021;
    const _weakSite = !hasCTA || _staleSite || (visualAnalysis && (visualAnalysis.heroIsBlank || /dated/i.test(visualAnalysis.designObservation || '') || visualAnalysis.overallConversionReadiness === 'weak'));
    const _hasAds = (fbAds.adCount || 0) > 0 || !!builtWith.hasGoogleAdsTag;
    const _underMarketed = !!_psig.under_marketed || !!_psig.local_owner_operated || req.body.discoverySource === 'google_places';
    // Careers-page hiring signals must be declared BEFORE the flags that read them.
    const _careersOps = !!(careers && careers.opsRoles && careers.opsRoles.length > 0);
    const _careersMktg = !!(careers && careers.mktgRoles && careers.mktgRoles.length > 0);
    const _mktgHire = !!_psig.hiring_marketing || _careersMktg;
    // Ops-hiring (→ AI software build) requires ACTUAL manual/ops roles — the
    // ai_replacement flags fire only on our curated ops searches (dispatcher,
    // scheduler, CS rep, data entry, bookkeeper). A marketing coordinator or
    // social media manager is a RETAINER problem, NOT something a software build
    // replaces. This is the Eat Right Atlanta bug: 2 marketing roles wrongly
    // triggered a $75k AI build pitch on an obvious retainer lead.
    // Careers page is now a first-class hiring signal (Adzuna's replacement, from their
    // own site): ops roles => software build, marketing roles => retainer.
    const _opsHire = !!_psig.ai_replacement_multi || !!_psig.ai_replacement_heavy || !!_psig.ai_replacement_signal || _careersOps;
    const _realOpsSignal = _opsHire && !_mktgHire;
    const _exitSignal = !!_psig.preparing_for_exit || req.body.discoverySource === 'for_sale';
    const _financialSignal = _exitSignal || !!_psig.raised_funding || !!_psig.sba_funded || req.body.discoverySource === 'sba_loan';
    const _noSystems = builtWith.hasCRM === false && (!!_psig.raised_funding || !!_psig.sba_funded);
    // Is our pain the GOLD kind — a pattern across their OWN Google reviews with a
    // count? That is the single most reply-worthy line we can open with, so the
    // prompt must be told to LEAD with it rather than bury it.
    const _reviewPain = publicPainSignals.filter(p => /their Google reviews/i.test(p));
    const _hasReviewPattern = _reviewPain.some(p => /\d+\s+(of\s+~?\d+\s+)?reviews? mention/i.test(p) || /\d+ reviewers/i.test(p));

    const _eligible = [];

    // ══════════════════════════════════════════════════════════════════════════
    // ROOT-CAUSE PRODUCT SELECTION
    // The old logic mapped a surface signal straight to a product ("they run ads
    // → sell ad management"), which recommended the wrong fix whenever the real
    // problem sat downstream of the signal. This diagnoses the actual BOTTLENECK
    // in their revenue chain first, then prescribes the product that fixes THAT.
    //
    // The revenue chain:  DEMAND → SITE/CONVERSION → CAPTURE → FOLLOW-UP → OPS
    // Money leaks at the FIRST broken link. Fixing a later link while an earlier
    // one is broken wastes their money — and they can tell, which kills the pitch.
    // ══════════════════════════════════════════════════════════════════════════
    // Site-wide evidence OVERRIDES the homepage-only read. Claiming "no booking tool"
    // when it lives on /schedule is a false statement to an owner who knows better —
    // the fastest way to lose a lead. Interior pages are the authority here.
    const _siteBooking = sitePages ? sitePages.booking : null;
    const _hasCapture = !!builtWith.hasCRM || !!builtWith.hasBooking || !!builtWith.hasEmailCapture
      || (sitePages && (sitePages.hasCapture === true || _siteBooking === 'online_booking'));
    const _siteConverts = hasCTA && !_weakSite;

    // ══ OPERATIONAL SIGNALS — the missing half of the audit ══════════════════
    // Every other signal we collect is a marketing/website signal, so every audit
    // concluded "marketing problem" and the $40-100k software build was effectively
    // unreachable. These derive an OPERATIONS read from data we already have.
    //
    // 1) REVENUE PER EMPLOYEE. A business doing $8.2M with 166 people ($49k/head) is
    //    carrying its revenue on labor; one doing $7M with 31 ($226k/head) is not.
    //    Low output per head is the clearest buy signal for automation there is.
    const _revNum = (() => {
      const r = String(verifiedRevenue || '');
      const m = r.match(/\$?\s*([\d.]+)\s*([mkb])/i);
      if (!m) return 0;
      const n = parseFloat(m[1]); const u = m[2].toLowerCase();
      return u === 'b' ? n * 1e9 : u === 'm' ? n * 1e6 : n * 1e3;
    })();
    const _revPerEmp = (_revNum > 0 && verifiedEmployees > 0) ? Math.round(_revNum / verifiedEmployees) : 0;
    // Below ~$90k/head is labor-heavy for almost any service business; above ~$180k
    // the business is already efficient and automation is a weaker pitch.
    const _laborHeavy = _revPerEmp > 0 && _revPerEmp < 90000 && verifiedEmployees >= 8;

    // 2) OPERATIONAL PAIN IN THEIR OWN REVIEWS. "Took three weeks for a quote",
    //    "nobody called me back", "had to chase them" are NOT marketing failures —
    //    they are process failures, and process failures are what software fixes.
    const _opsPainWords = /callback|call ?back|never called|no one (called|answered|got back)|took (weeks|days|forever)|slow(er)? (response|to respond|quote)|quote (delay|took)|schedul|reschedul|missed (the )?appointment|no follow[- ]?up|had to chase|kept waiting|paperwork|double[- ]?book|lost my|disorganiz/i;
    const _opsPainCount = (publicPainSignals || []).filter(p => _opsPainWords.test(String(p))).length;
    const _opsPainConfirmed = _opsPainCount >= 1;

    if (_revPerEmp) console.log(`OPS SIGNAL [${company}]: $${Math.round(_revPerEmp/1000)}k revenue per employee${_laborHeavy ? ' — LABOR-HEAVY, automation candidate' : ''}`);
    if (_opsPainConfirmed) console.log(`OPS SIGNAL [${company}]: ${_opsPainCount} operational pain pattern(s) in their own reviews — process problem, not a traffic problem`);

    let _bottleneck, _bottleneckWhy;
    if (_realOpsSignal) {
      _bottleneck = 'OPERATIONS';
      _bottleneckWhy = 'They are hiring manual/ops roles — the constraint is labor cost and process, not demand. Software replaces the recurring salary.';
    } else if (_laborHeavy && _opsPainConfirmed) {
      // Both operational signals agree: low output per head AND customers describing
      // process failures. That is an operations business, not a marketing business.
      _bottleneck = 'OPERATIONS';
      _bottleneckWhy = `They are carrying $${Math.round(_revPerEmp/1000)}k of revenue per employee across ${verifiedEmployees} people — labor-heavy for their size — AND their own reviews describe process failures (missed callbacks, scheduling, quote delays). That combination is not a traffic problem. Adding leads to a business that cannot service the ones it has makes the reviews worse. The constraint is throughput.`;
    } else if (_laborHeavy && !_hasAds) {
      _bottleneck = 'OPERATIONS';
      _bottleneckWhy = `$${Math.round(_revPerEmp/1000)}k revenue per employee across ${verifiedEmployees} people is labor-heavy, and they are not buying traffic — so the constraint is what it costs them to deliver, not what it costs to get found. Automation moves margin before marketing moves revenue.`;
    } else if (_hasAds && !_hasCapture) {
      _bottleneck = 'CAPTURE';
      _bottleneckWhy = 'They are PAYING for traffic but have no capture layer (no CRM, no booking, no email capture). The ads work; the catching does not. Every ad dollar buys a visitor the site cannot hold. Selling them more ad management here is selling more water for a leaking bucket.';
    } else if (_hasAds && !_siteConverts) {
      _bottleneck = 'CONVERSION';
      _bottleneckWhy = 'They are paying for traffic that lands on a page which cannot convert it (no clear CTA / dated or weak structure). The traffic is already bought — the page is where it dies.';
    } else if (_hasAds && _siteConverts) {
      _bottleneck = 'SCALE';
      _bottleneckWhy = 'Foundation is sound (site converts, capture exists) and they are already spending. The opportunity is owning and compounding the full funnel, not rebuilding anything.';
    } else if (_mktgHire) {
      _bottleneck = 'DEMAND';
      _bottleneckWhy = 'They are HIRING for marketing: budget is allocated, direction is not chosen. A retainer outperforms one junior hire and they are actively deciding right now.';
    } else if (!_siteConverts) {
      _bottleneck = 'FOUNDATION';
      _bottleneckWhy = 'No confirmed ad spend AND the site cannot convert. Driving traffic to this site would waste money — the site is the first broken link and must be fixed before demand is worth buying.';
    } else {
      _bottleneck = 'DEMAND';
      _bottleneckWhy = 'The site is functional but nothing is driving qualified traffic to it. The constraint is demand generation.';
    }

    // Prescribe by bottleneck — PRIMARY first (that is what the pitch must lead with)
    if (_bottleneck === 'OPERATIONS') {
      _eligible.push(_realOpsSignal
        ? 'Custom AI Software Build ($40k-$100k+) — PRIMARY: a CONFIRMED ops/manual-labor hiring signal exists. Frame against the recurring salary they are about to commit to, not against software cost.'
        : `Custom AI Software Build ($40k-$100k+) — PRIMARY: the operational evidence is ${_revPerEmp ? '$' + Math.round(_revPerEmp/1000) + 'k revenue per employee across ' + verifiedEmployees + ' people' : 'a labor-heavy operation'}${_opsPainConfirmed ? ' plus process failures customers describe in their own reviews' : ''}. Pitch the LABOR MATH, not software: what those people cost per year versus what a one-time build handles permanently. Never claim they are hiring unless a hiring signal was confirmed.`);
      _eligible.push('AI Brain ($40k-$70k) — SECONDARY: an intelligence layer over their existing systems if a full build is too large a first step.');
      if (!_siteConverts) _eligible.push('Website Rebuild ($50k+) — SECONDARY: the site is also weak, but the hiring signal is the live, time-boxed decision. Lead with the build.');
    } else if (_bottleneck === 'CAPTURE') {
      _eligible.push('Website Rebuild / Conversion System ($50k+) — PRIMARY: build the capture layer (lead capture, booking, follow-up path) so the traffic they ALREADY pay for stops disappearing. Do NOT lead with ad management; the ads are the one part working.');
      _eligible.push('End-to-End Marketing / Ads Management OR Revenue Growth / CRO Retainer ($10k-$35k/mo) — SECONDARY: own the full funnel so ads + capture + follow-up compound together. Frame as sealing the leak, never as "run more ads."');
    } else if (_bottleneck === 'CONVERSION') {
      _eligible.push('Website Rebuild ($50k+) — PRIMARY: they are buying traffic that lands on a page which cannot convert it. Rebuild the page the ad money is already flowing to.');
      _eligible.push('Revenue Growth / CRO Retainer ($10k-$35k/mo) — SECONDARY: ongoing conversion optimization once the foundation converts.');
    } else if (_bottleneck === 'SCALE') {
      _eligible.push('End-to-End Marketing / Ads Management ($10k-$35k/mo) — PRIMARY: foundation is sound and spend is live. Own the full funnel and compound it. This is the rare case where ad management genuinely IS the answer.');
      _eligible.push('Revenue Growth / CRO Retainer ($10k-$35k/mo) — SECONDARY: squeeze more from existing traffic.');
    } else if (_bottleneck === 'FOUNDATION') {
      _eligible.push('Website Rebuild ($50k+) — PRIMARY: the site cannot convert and nothing is being spent driving traffic to it. Fix the foundation FIRST — buying traffic for this site would waste their money, and saying so earns trust.');
      _eligible.push('Revenue Growth / CRO Retainer ($10k-$35k/mo) — SECONDARY: drive and convert demand once the foundation holds.');
    } else { // DEMAND
      _eligible.push('End-to-End Marketing / Ads Management ($10k-$35k/mo) or Revenue Growth / CRO Retainer ($10k-$35k/mo) — PRIMARY: the constraint is qualified demand.' + (_mktgHire ? ' They are HIRING for marketing — budget allocated, direction not chosen. The retainer pitch writes itself; do NOT pitch a software build for marketing roles.' : ''));
      if (!_siteConverts) _eligible.push('Website Rebuild ($50k+) — SECONDARY: the site also needs work; mention as the foundation that makes the demand work harder.');
    }

    // Cross-cutting products — independent of the funnel bottleneck
    if (_noSystems) _eligible.push('AI Brain ($40k-$70k) — funded with no marketing/CRM infrastructure detected');
    if (_financialSignal) _eligible.push('Wall Street-backed Financial Advisory — clean up revenue, margins & cash flow to fund growth or maximize exit valuation' + (_exitSignal ? ' (they are preparing to exit — valuation is the emotional lever)' : ''));
    if (_eligible.length === 0) _eligible.push('End-to-End Marketing / Ads Management OR Website Rebuild — audit the site and lead with the sharper of the two');

const eligibleProductsGuidance = `\u2550\u2550\u2550 WHAT WE READ BEYOND THE HOMEPAGE \u2550\u2550\u2550\n${sitePages ? `Pages read: ${sitePages.pagesRead.join(', ')}. Booking mechanism: ${sitePages.booking === 'online_booking' ? 'REAL self-serve online booking exists \u2014 do NOT claim they have no booking tool' : sitePages.booking === 'form' ? 'a form that submits and waits for a callback \u2014 they capture the lead but the customer waits' : sitePages.booking === 'phone_only' ? 'PHONE ONLY \u2014 if nobody answers, the customer is gone' : 'no booking path found on the pages we read'}. ${sitePages.services.length ? `What they actually sell: ${sitePages.services.slice(0,6).join(', ')}.` : ''}${sitePages.prices.length ? ` \u2705 THEIR OWN PUBLISHED PRICES: ${sitePages.prices.map(p => p.amount + ' (' + p.what + ')').join('; ')}. These are printed on their own website, so you MAY use them in the pitch arithmetic \u2014 they are the strongest and safest dollar figures available. Example of the right use: \u2018at your posted rate, one additional booking a month covers this several times over.\u2019` : ' No published pricing found \u2014 do NOT guess what they charge.'}` : 'Only the homepage was read \u2014 be careful about claiming something does not exist. Say what you SAW on the homepage, not what the business lacks.'}\n\n\u2550\u2550\u2550 OPERATIONAL EVIDENCE \u2550\u2550\u2550\n${careers && careers.roles.length ? `THEY ARE HIRING RIGHT NOW (from their own careers page): ${careers.roles.map(r => r.title + ' [' + r.type + ']' + (r.salary ? ' \u2014 posted at ' + r.salary : '')).join('; ')}.${careers.opsRoles.length ? ` \u26a0 ${careers.opsRoles.length} of these are repetitive back-office roles \u2014 recurring salary that a one-time build absorbs permanently. This is the software-build argument and it is made of THEIR numbers.` : ''}${careers.salaries.length ? ` \u2705 THESE POSTED SALARIES ARE HIS OWN PUBLISHED NUMBERS \u2014 you may use them in the pitch arithmetic. They are the strongest dollar figure available because he wrote them.` : ''}` : 'No careers page found or no open roles listed \u2014 do NOT claim they are hiring.'}\n${_revPerEmp ? `Revenue per employee: $${Math.round(_revPerEmp/1000)}k across ${verifiedEmployees} people.${_laborHeavy ? ' \u26a0 LABOR-HEAVY \u2014 they are carrying revenue on payroll. This is the strongest automation buy-signal that exists, and it is a MARGIN argument, not a marketing one.' : ' Efficient for their size \u2014 automation is a weak pitch here.'}` : 'Revenue per employee: unknown \u2014 do not speculate about their labor efficiency.'}\n${_opsPainConfirmed ? `\u26a0 Their own reviews describe PROCESS failures (missed callbacks / scheduling / quote delays). That is a throughput problem. Sending more leads into a business that cannot service the ones it has makes their reviews worse \u2014 say so plainly if it fits.` : ''}\n\n    ═══ DIAGNOSED BOTTLENECK: ${_bottleneck} ═══
${_bottleneckWhy}

Their revenue chain is: DEMAND → SITE/CONVERSION → CAPTURE → FOLLOW-UP → OPS.
Money leaks at the FIRST broken link. Recommend the product that fixes THAT link — not a later one, and not the one their surface behaviour suggests. If they are already paying for something that works (e.g. ads), do NOT sell them more of it; sell the thing that stops the waste. Naming the real bottleneck instead of the obvious symptom is what makes the owner think "how do they know this?"

═══ ELIGIBLE PRODUCTS — recommend ONLY from this audit-derived list ═══
The list is ORDERED: the PRIMARY product is what your pitch must lead with.
Based on THIS company's CONFIRMED audit signals, the only products you may recommend are:
${_eligible.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}
Your recommendedProduct and every item in topThreeProducts MUST come from this list. If a product is not listed, its triggering signal was NOT found — do NOT recommend it.${_realOpsSignal ? '' : '\n⚠ There is NO confirmed manual-labor signal, so Custom AI Software Build is NOT eligible. Do not recommend it under any framing.'}`;

        msgContent.push({
          type: 'text',
          text: `You are CROJungle's senior marketing auditor. Your job is to find the single most expensive problem in this business's digital presence and recommend the right CROJungle product to fix it.

COMPANY: ${company}
WEBSITE: ${website || 'Unknown'}
VERIFIED HEADCOUNT: ${verifiedEmployees ? verifiedEmployees.toLocaleString() + ' employees (confirmed via Google)' : 'Not verified — treat as unknown size'}
VERIFIED DECISION-MAKER: ${verifiedCEO ? verifiedCEO + ' (' + (verifiedCEOTitle || 'CEO') + ') — found in public search results, use their real name in the pitch' : 'Not identified — pitch to "the owner/CEO"'}
═══ WHAT THEIR HOMEPAGE ACTUALLY LOOKS LIKE (vision — we SAW this, not guessed) ═══
${visualAnalysis ? `${visualAnalysis.heroIsBlank ? '⚠ THE HERO IS BLANK OR BROKEN-LOOKING. ' : ''}Headline visible: ${visualAnalysis.hasHeadline ? 'yes — "' + (visualAnalysis.headlineObserved || '') + '"' : 'NO — no value-proposition headline visible on arrival'}. CTA visible: ${visualAnalysis.hasVisibleCTA ? 'yes — "' + (visualAnalysis.ctaObserved || '') + '"' : 'NO — no clear call-to-action button above the fold'}. Social proof above fold: ${visualAnalysis.hasVisibleSocialProof ? 'yes' : 'no'}. Design: ${visualAnalysis.designObservation || (visualAnalysis.looksDated ? 'looks dated' : 'current')}. Conversion readiness: ${visualAnalysis.overallConversionReadiness || 'unknown'}.
→ These are VISUAL FACTS — we looked at their actual rendered homepage. "Your homepage loads with a blank hero and no call-to-action" is undeniable when we've literally seen it. This is your sharpest, most credible ammunition. Use the exact observation.
${visualAnalysis.heroIsBlank && (fbAds.adCount||0) > 0 && fbAds.countReliable !== false ? '→ ⚠ THEY ARE RUNNING ' + fbAds.adCount + ' PAID ADS INTO A BLANK HOMEPAGE. This is the single most expensive, most provable problem they have. Lead with it.' : ''}` : 'No screenshot available — audit the site from scraped text only. Do NOT describe what the page "looks like" — we did not see it.'}

═══ MONEY ON FIRE — provable, undeniable, and no competitor will ever tell them ═══
${moneyOnFire.count > 0 ? `${moneyOnFire.headline}

${moneyOnFire.fires.map(f => `[${f.severity.toUpperCase()}] ${f.fire}\n   → ${f.cost}`).join('\n\n')}

→ THESE ARE FACTS, NOT OPINIONS. Every one is independently verifiable by them in under five minutes. That is what makes them impossible to dismiss.
→ The single most devastating one, when present, is ADS WITHOUT A PIXEL. They are paying for traffic they physically cannot measure. Not "underperforming" — literally blind. No competitor, no agency, and no employee has ever told them this.
→ Lead with the CRITICAL fires. Do not list all of them — pick the one that costs the most money and name it precisely. A single undeniable fact beats five soft observations.
${moneyOnFire.isBurning ? '→ ⚠ THIS COMPANY IS BURNING ON MULTIPLE FRONTS AT ONCE. The audit essentially writes itself — lead with the arithmetic.' : ''}` : 'No confirmed money-on-fire signals — the audit must come from the site and operational evidence only. Do NOT invent financial leaks.'}

═══ THE FIRE HE IS ACTUALLY FIGHTING (highest-value intel we have) ═══
${painSummary ? 'THE SINGLE BIGGEST OPERATIONAL FIRE: ' + painSummary + '\n' : ''}${publicPainSignals.length > 0 ? 'VERIFIED OPERATIONAL PAIN (from real reviews, complaints, and employee feedback — each carries the exact quote that proves it):\n' + publicPainSignals.map(p => '- ' + p).join('\n') + `

→ THIS IS THE MOST IMPORTANT INPUT IN THIS ENTIRE PROMPT. Mike's core insight is that owners are trapped putting out fires in areas they already delegated. THIS is that fire, and we can PROVE it.
→ A pitch that names the operational fire ("your reviews say quotes take three weeks and you're hiring four schedulers to keep up") is in a completely different league from one that names a website flaw ("your homepage has no lead capture form"). The first makes the owner feel SEEN. The second sounds like every other agency email.
→ CONNECT the operational pain to the website/ad finding wherever they genuinely link — that combination is the sharpest possible pitch. Example: "You are running 840 ads into a page with no form, while your reviews say quotes take three weeks. You are paying to generate leads you cannot answer."
→ NEVER quote the review verbatim in the email (it embarrasses them publicly). Reference the PATTERN, not the quote. "Your reviews mention slow quote turnaround" — not "one customer said you're incompetent."${_hasReviewPattern ? `\n\n\u2605\u2605 MANDATORY OPENING \u2605\u2605\nWe mined THEIR OWN Google reviews and found a pain that REPEATS across multiple reviews, with a count. This is the strongest opening line available to us and it MUST be where the pitch starts.\n\u2192 Your pitchAngle MUST open by naming this recurring pattern AND its count. The count is what makes it undeniable: one complaint is an anecdote, seven is a problem the owner already knows about and has not fixed.\n\u2192 Say the NUMBER out loud. "Seven of your last forty reviews mention the same thing" lands far harder than "some customers mention".\n\u2192 Never reproduce the review text and never name a reviewer \u2014 describe the PATTERN only. The count plus the theme is the punch; the raw quote is a liability.\n\u2192 THEN connect it to the money/product finding in the same breath. That pairing (their operational fire + what it costs) is the sharpest email this system can write.\n\u2192 RELEVANCE TEST \u2014 this mandate applies ONLY when the pattern is something CROJungle actually fixes (slow callbacks, missed calls, no follow-up, quote/estimate delays, scheduling chaos, leads going unanswered). If the recurring pattern is about PRICING, WORKMANSHIP, STAFF ATTITUDE or DAMAGE, do NOT open with it \u2014 we cannot fix that, and naming it makes us sound like a complaint tracker before an irrelevant pivot. Use the next-strongest confirmed fact instead and ignore the pattern.\n\u2192 The test: can the owner draw a straight line from the pain you named to what we sell? If yes, lead with it. If no, it is not our hook regardless of the count.\n\u2192 GOOD: "Nine of your recent reviews mention waiting days for a callback \u2014 and you are paying for 27 ads driving straight to a page with no way to capture those people. Worth 20 minutes?"\n\u2192 BAD: "Your website has no lead capture form." (True, generic, ignorable \u2014 and it buries the one thing that would make him stop scrolling.)` : ''}` : 'No verified operational pain found in public sources — pitch from the site/ad audit only. Do NOT invent operational pain: fabricating a complaint would destroy credibility instantly.'}
RECENT NEWS TRIGGERS: ${companyTriggers.length > 0 ? '\n' + companyTriggers.map(t => `- [${t.type}, ${t.ageDays}d ago, identified via ${t.idBasis}] ${t.headline}`).join('\n') + '\n\u2192 Each line shows HOW we tied it to this company. "via domain" or "via location" = strong evidence. "via distinctive name" = a NAME MATCH ONLY and is NOT confirmed to be them.\n\u2192 You may use a trigger as the cold-open (\"I saw you just...\") ONLY if it was identified via domain or location AND the headline obviously describes THIS business. Company names repeat across the country \u2014 a condo complex, a street address, a school, or a different town sharing the name is NOT them.\n\u2192 If you are not certain a headline is about this exact business, do NOT reference it at all. Opening with someone else\u2019s news proves we did not do our homework and kills the lead instantly.' : 'No recent company-specific news found \u2014 do not invent any; pitch from the site audit.'}
SOURCE SIGNAL: ${req.body.sourceSignal || 'Not specified'}

═══ THE BUYING WINDOW WE ARE INTERCEPTING (this determines the ENTIRE pitch) ═══
${req.body.buyingLane === 'both' ? `⚡ PERFECT STORM — they are hiring manual ops roles AND a marketing person AT THE SAME TIME.
They have allocated budget on BOTH fronts and committed on NEITHER. This is the strongest possible position.
THE PITCH: they are about to spend ~$125k/year on two hires (one to do repetitive work software handles, one junior marketer). CROJ replaces the first with a build and the second with a senior team — for less, and it compounds.
Lead with whichever is bleeding more money. Do NOT pitch both products in one email — name the sharper fire, and let the call surface the rest.`
: req.body.buyingLane === 'retainer' ? `📣 THE RETAINER WINDOW — they posted a MARKETING role.
THIS IS THE MOST IMPORTANT THING TO UNDERSTAND ABOUT THIS LEAD:
They have ALREADY DECIDED to spend money on marketing. The budget is allocated (~$70k/yr). What they have NOT decided is HOW to spend it. We are not asking them to open their wallet — it is already open.
THE PITCH: "You're about to hire one junior marketer for $70k. For that money you can have a senior team — strategy, ads, creative, and the technology behind it — that has already done this." A single junior hire cannot run strategy, build the funnel, produce creative, AND manage spend. A team can.
This maps to the CEO's ICP #3 and #4 — CROJungle's CORE PRODUCT. Do NOT pitch a software build here unless the audit turns up an overwhelming ops problem.
The strongest proof point here is Sean ($140k on $4k in one month, ~30x over 8 months) — it is exactly the "one marketing hire vs. a team" comparison, in dollars.`
: (manualRoleCount >= 2) ? `🔧 THE SOFTWARE WINDOW — they posted manual/repetitive OPS roles.
They have already identified the problem and allocated the budget (~$55k/yr per role). They have started a hiring process but have NOT yet committed.
THE PITCH: "You're about to pay a human $55k a year, every year, to do work software does once and then does forever." Name the exact roles. Do the math on the loaded salary. This maps to ICP #2 — the $40k-$100k+ custom build.
The strongest proof point is the seasonal business (relief + profit) for an owner-operator, or Kraft Heinz if they are larger and more technical.`
: `🔎 AUDIT-DRIVEN WINDOW — there is NO confirmed hiring signal for this lead${req.body.discoverySource === 'google_places' ? ' (it is a local owner-operated business found via Google Places)' : ''}.
CRITICAL: Do NOT default to a software/AI build. This lead did not post ops roles, so there is NO evidence they are drowning in manual labor. Pitch ONLY what the SITE AND AD AUDIT actually reveal. For a local owner-operated business the answer is almost always one of two things:
  1) WEBSITE REBUILD ($50k+) — if the site is dated, has no clear CTA, weak positioning, or looks like it predates 2021. Note: a standalone landing page is NOT one of our products and must never be recommended or priced as the offering. Describing dedicated conversion pages as part of a full rebuild is fine — just never present one as the product itself.
  2) END-TO-END MARKETING / ADS RETAINER — if they are running ads, have a thin/under-managed online presence, or are clearly under-marketed for their size.
Recommend AI Software or AI Brain ONLY if the audit surfaces a genuine, confirmed operational or systems gap — never as a default. Lead with the single sharpest confirmed problem from the audit.`}

ICP LANE (secondary context — which profile they match and which proof point parallels their situation):
${icpLane.summary}

REACHABILITY REALITY (important context for the pitch, not a reason to soften it):
This company is being contacted COLD. That means the pitch has to earn a conversation from someone who has never heard of us. CROJungle also serves much larger companies ($50M-$500M) — but those are won through Mike's network and referrals, not cold email, because there is no reachable founder at that size. This prospect is in the cold-reachable lane: the owner or a senior operator still reads their own email and still feels the fire personally. Pitch to THAT person — someone who is close enough to the problem to recognize it instantly when you name it.

HOMEPAGE CONTENT (scraped):
${homepageSnippet || 'Not available'}

ON-PAGE SEO & SITE FRESHNESS (from their page source — facts):
- Title tag: ${builtWith.titleTag ? `"${builtWith.titleTag}"` : 'missing or unreadable'}
- Meta description: ${builtWith.hasMetaDesc ? 'present' : 'MISSING'}
- H1: ${builtWith.hasH1 ? 'present' : 'MISSING'}
- Schema markup: ${builtWith.hasSchema ? 'present' : 'none'}
- Email capture: ${builtWith.hasEmailCapture ? 'present' : 'NONE — no list building'}
- Booking tool: ${builtWith.hasBooking ? 'present' : 'none'}
- Copyright year in footer: ${builtWith.copyrightYear || 'not found'}${builtWith.copyrightYear && builtWith.copyrightYear < new Date().getFullYear() - 1 ? ' — STALE, site looks abandoned' : ''}

TECH STACK (page-level scan — CAUTION: can miss server-side/tag-managed tools; a positive is reliable, a "none detected" is NOT proof of absence. Do not build the pitch on claimed absence of CRM/pixel/email unless the company is clearly small):
- CRM: ${builtWith.hasCRM ? 'Yes (confirmed)' : 'None detected on page (unverified)'}
- Email Marketing: ${builtWith.hasEmailMarketing ? 'Yes (confirmed)' : 'None detected on page (unverified)'}
- Tracking Pixel: ${builtWith.hasPixel ? 'Yes (confirmed)' : 'None detected on page (unverified)'}
- Live Chat: ${builtWith.hasChat ? 'Yes (confirmed)' : 'None detected on page (unverified)'}

ADS:
- Google Ads: ${builtWith.hasGoogleAdsTag ? 'CONFIRMED — Google Ads conversion tag found in their page source (they are running or have run Google Ads)' : googleAds.hasGoogleAds ? 'Possibly running (unverified heuristic - do NOT state as fact)' : 'No ads tag found on page (inconclusive - do NOT claim they run no ads)'}
- Facebook Ads: ${fbAds.hasAds && (fbAds.countReliable !== false) ? `${fbAds.adCount}+ active ads VERIFIED AS THEIRS in Ad Library (attribution-checked; true count may be higher — cite as "at least ${fbAds.adCount}"). Confirmed ad spend into a weak funnel IS the pitch.` : fbAds.hasAds ? `Ad Library keyword search returned hits for this company name, but the count is NOT attribution-verified \u2014 it may include other advertisers or even a different company with a similar name. \u26a0 You MUST NOT state an ad count, imply a specific number of ads, or say they are \"running N ads\". Putting an unverified number in a real sales email is a fabrication. If ad spend matters to the pitch you may only reference it when the Meta pixel is ALSO present, and only as \"ads appear to be running\" with no number \u2014 otherwise leave Facebook ads out of the pitch entirely.` : builtWith.hasMetaPixel ? 'Meta pixel on their site — ad infrastructure exists but ZERO ads verified as theirs in Ad Library. Do NOT state an ad count or claim active campaigns.' : fbAds.confirmed ? 'No ads attributable to them in Ad Library — do NOT claim they run Facebook ads' : 'Could not check — do not claim anything about their Facebook ads'}
${fbAds.ads?.length > 0 ? '- Longest running ad: ' + Math.max(...(fbAds.ads||[]).map(a=>a.runningDays||0)) + ' days' : ''}

${siteUnreachable ? 'WARNING: The homepage could NOT be reached during our scan — it returned a connection/error state (e.g. "Connection Reset" or a timeout). This is very likely transient or on OUR side, NOT proof their site is down. DO NOT claim their website is broken, blank, or showing an error — that would be a fabrication. Do NOT audit the homepage at all. Audit ONLY from the discovery signals and tech-stack data, and note in the pitch angle that the site needs a manual look.' : screenshotUrl ? 'I have also provided a screenshot of their homepage above.' : trustedContent.length > 100 ? 'No screenshot available — audit from scraped content only.' : 'WARNING: Homepage could not be reliably scraped (site blocked Firecrawl or returned a bot/cookie page). Do NOT make up ANY homepage findings, headlines, or CTAs. Audit ONLY from the discovery signals and tech stack data provided above. Focus on the operational/funding/exit angle.'}

${stackCombo ? `STACKED SIGNAL COMBO — HIGHEST-CONFIDENCE LEAD TYPE:
${stackCombo.label} (Tier ${stackCombo.tier})
Why hot: ${stackCombo.whyHot}
${stackCombo.productHint ? 'Product guidance: ' + stackCombo.productHint : ''}
LEAD THE PITCH WITH THIS COMBO NARRATIVE — the intersection of these signals IS the story. A founder who just raised AND is hiring manual roles feels both facts daily; naming both together proves we understand their exact moment.

` : ''}CONTACT INTELLIGENCE (all FACTS — from their own page + Hunter; NEVER invent contacts beyond these):
- Hunter contact: ${founderName ? founderName + ' (' + (email.founderTitle||'title unknown') + ') — ' + (email.email || 'no address') : 'none found'}
- Email quality grade: ${emailGrade}
- Hunter name on their homepage: ${founderName ? (nameOnPage ? 'YES — likely current' : 'NOT on page — may be outdated; prefer role over name if uncertain') : 'N/A'}
- Owners/decision-makers named ON THEIR OWN PAGE: ${builtWith.contacts?.owners?.length ? builtWith.contacts.owners.map(o=>o.name+' ('+o.title+')').join(', ') : 'none stated'}
- Emails displayed on their site: ${builtWith.contacts?.emails?.length ? builtWith.contacts.emails.join(', ') : 'none'}
- Phone displayed on their site: ${builtWith.contacts?.phones?.length ? builtWith.contacts.phones.join(', ') + ' — prominently displayed phone means they welcome calls' : 'none'}
- LinkedIn: ${builtWith.contacts?.linkedin?.length ? builtWith.contacts.linkedin[0] : 'not linked'}
- Contact/About page: ${builtWith.contacts?.contactPage ? 'yes — ' + builtWith.contacts.contactPage : 'not found'}
${enrichment ? `- Company size: ${enrichment.employeeCount || enrichment.headcountRange || 'unknown'} employees${enrichment.headcountGrowth ? ' (growth: ' + enrichment.headcountGrowth + ')' : ''} — ${(enrichment.employeeCount && enrichment.employeeCount < 50) ? 'SMALL: owner is almost certainly the decision-maker and reachable' : (enrichment.employeeCount && enrichment.employeeCount < 200) ? 'MID: owner or a single VP owns this decision' : 'LARGER: expect a decision layer'}
- Executives (verified via public web): ${enrichment.executives?.length ? enrichment.executives.map(e=>e.name+' ('+e.title+')').join(', ') : 'none found'}${enrichment.founded ? '\n- Founded: ' + enrichment.founded : ''}` : ''}

TIMING WINDOW (deterministic from their discovery signals — use this in reachPlan.timing):
${reachWindow.window} | urgency: ${reachWindow.urgency}${reachWindow.note ? ' | ' + reachWindow.note : ''}

WHY THIS COMPANY WAS FLAGGED (discovery signal — factor this into your audit):
- Source: ${discoverySource || 'unknown'}
- Signal: ${discoveryReason || 'general ICP match'}
${manualRoleCount >= 2 ? `- HIRING SIGNAL: currently hiring ${manualRoleCount} manual/repetitive roles${manualCategories ? ` across ${manualCategories} functions` : ''} — a strong sign of automatable labor spend (potential AI software build)` : ''}
${discoverySignals.raised_funding ? '- FUNDING SIGNAL: recently raised capital — board pressure to show growth, budget to deploy' : ''}
${discoverySignals.preparing_for_exit ? '- EXIT SIGNAL: preparing to sell — motivated to maximize revenue and valuation before exit' : ''}
${discoverySignals.rebranding ? '- REBRAND SIGNAL: rebranding — full marketing rebuild in motion, vendors up for grabs' : ''}

VISUAL PRECISION RULE: Only quote text you can read clearly in the screenshot. If text is blurry, truncated, or partially visible, describe without quoting. Never guess truncated text — a wrong quote destroys credibility with a founder who knows their own site.

AUDIT TASK — CROJungle is a full-service growth partner, NOT a single-product vendor. Audit the ENTIRE business across all five areas, then lead with the sharpest, most expensive problem:
1. ACQUISITION — are they capturing demand? (ads, SEO, paid search presence)
2. CONVERSION — does the website/funnel convert? (CTA, positioning, social proof, mobile)
3. INFRASTRUCTURE — do they have marketing systems? (CRM, tracking, automation)
4. OPERATIONS — are they bleeding money on manual labor that AI software could replace? (use the hiring signal above)
5. GROWTH & VALUE — funding/exit context: what's suppressing their revenue or valuation?

Then answer:
- What is the single most expensive problem across ALL five areas? Be specific — reference their actual content, tech gaps, hiring, or exit context.
- What is the ONE thing a founder would be embarrassed about if you pointed it out?
- Which CROJungle offering fixes it and why?

═══ WHO CROJUNGLE ACTUALLY IS (this governs the voice of every pitch) ═══
CROJungle is led by Mike Taft and Muhammad Junaid. Mike is a faith-led entrepreneur whose career runs through government contracting, private technology, Wall Street investing, and building companies from the ground up. Mike is the tip of the spear: he meets a leader on the specific things keeping them from their goals, and uses CROJ as the production engine — custom software, AI integration, marketing — to bring cost down and profit up.

THE CORE INSIGHT THAT SELLS (use this framing, it is the sharpest thing we have):
Most executives and owners are trapped in a cycle — performing at a high level themselves while constantly putting out fires in areas they already handed to someone else. There is never a good time to stop and fix it. The only two options are to live in the cycle longer, or bring in someone who can do what you would do yourself if you weren't stuck in it. CROJ is the door out of that cycle. When a pitch can credibly name the fire the owner is stuck putting out, THAT is the emotional hook — not the tactic.

WHAT WE ARE (positioning — do not soften this):
A $5,000/month agency executes a marketing function. CROJ determines what is actually preventing growth, then assembles the strategy, marketing, technology, software, and operational solution to fix it. The difference is not more deliverables — it is the ability to solve a larger and more consequential class of business problem. We are, more accurately, a revenue-metrics special ops team that happens to sit under the marketing category.
A $5k agency conversation sounds like: "run ads, get leads."
A CROJ conversation sounds like: "revenue dipped across these three product lines — diagnose why, build the plan, implement it, optimized for max sales in a 12-month window."
We are also structurally built for scale a small shop cannot touch: optimized for $20k+/month ad spend, capable up to $5M+/month.

REAL PROOF POINTS (use ONE, only where it genuinely parallels this prospect's situation — never stack them, never stretch them):
- Small business (Sean): $140k returned on a $4k investment in a single month; ~30x average ROI over 8 months.
- Small business, seasonal/high-margin, $1M topline: +$65k revenue in 3 months; on track for +$130k net profit year one and +$400k more by end of year two. Critically, that $65k offset their off-season losses for the first time in company history — the owner got a stress-free off-season for the first time ever. (This is the best proof point for an owner-operator: it is about relief, not just revenue.)
- Enterprise (Kraft Heinz): end-to-end research, product planning, and implementation of a mobile app — 500k+ downloads.
- Enterprise (University of Canada West): rebuilt a decayed 70,000-page digital footprint into a consolidated ~250-page site with custom CMS — turned digital decay into a working recruitment and donor tool.

HOW MIKE WANTS TO BE PITCHED (mirror this — it is exactly how the prospect wants to be treated):
1. Listened to first. Their scenario, their goals, their definition of success — before any prescription.
2. Shown this is familiar territory and well-handled here. Precedent, not promises.
3. Given a precise plan, a clear price, and the confidence that proceeding is easy.
A cold email cannot do step 1 — so the email must EARN step 1 by proving we already looked closely. That is what the audit is for. The email shows the work, then asks for the conversation. It never prescribes before listening.

WHAT THE CTA IS (never invent a different one):
A reply leads to a short qualifying/listening call with an SDR, then a direct meeting with Mike. So the ask is small and conversational — a short call to walk through what we found and hear their side. NOT "book a demo," NOT "let's get you a proposal."

VOICE RULES:
- Confident and specific, never salesy or hypey. Mike would rather refer someone elsewhere than pretend to be a cheap ad shop.
- Lead with the diagnosis, not the service. The service is the answer to a question they haven't been asked yet.
- Name the fire they are stuck putting out. That is the line that gets the reply.
- No flattery, no "I hope this finds you well," no fake personalization. The proof-of-work IS the personalization.

${eligibleProductsGuidance}

CROJungle offerings (full-service — can combine):
- Website Rebuild ($50k+): homepage conversion failures, weak positioning, no CTA — full rebuild only
- End-to-End Marketing / Ads Management ($10k-$35k/month): running ads but leaking revenue, needs full-funnel ownership
- AI Brain ($40k-$70k): no marketing intelligence layer, disconnected systems, no automation
- Custom AI Software Build ($40k-$100k+): manual/repetitive labor (customer service, data entry, scheduling, bookkeeping) that software can replace — recommend ONLY when there is a CONFIRMED manual-labor signal (multiple ops job postings). Never default to it.
- Revenue Growth / CRO Retainer ($10k-$35k/month): confirmed traffic but poor conversion, ongoing optimization
- Exit / Valuation Advisory (via Wall Street-backed partner): for companies preparing to sell — increase revenue AND advise on valuation/M&A. Nobody else offers this combination.

DOLLAR-FIGURE RULE: job posting counts are FACTS; salary totals derived from them are ESTIMATES. Any labor-cost dollar figure MUST be framed as an estimate ("est.", "roughly") and must show its basis. Never present a derived number as a measured one.

Prioritize by CONFIRMED dollar impact, driven by what the AUDIT actually found — not by ticket size. Do NOT inflate to a bigger-ticket product (AI Software or AI Brain) without a confirmed signal for it: a Website Rebuild or Marketing Retainer they genuinely need beats an AI build they don't. The right recommendation is whatever the audit proves is bleeding the most money — usually that is marketing/website work, sometimes software, occasionally exit advisory. Only recommend what the evidence supports — never fabricate, never default.

Return ONLY valid JSON, no markdown:
{
  "ctaText": "exact CTA text or null",
  "heroHeadline": "exact headline",
  "headlineQuality": "specific/generic/missing",
  "designQuality": "professional/dated/poor",
  "decisionMaker": "Look through ALL the page content (homepage, about, team, footer, any 'meet the founder' or leadership text) and identify the owner/founder/CEO/president BY NAME if their name appears ANYWHERE. Return an object {name, title, confidence} where confidence is 'high' (name explicitly tied to a leadership title like 'John Smith, CEO' or 'founded by Jane Doe'), 'medium' (name present and clearly the principal but title less explicit), or 'low' (a name appears but role is ambiguous). Return null ONLY if genuinely no personal name appears anywhere. Do NOT guess or invent — only extract names actually present in the content. Do NOT return generic words like 'Team', 'Leadership', 'Owner' as the name.",
  "overallConversionRating": "strong/moderate/weak",
  "operationsOpportunity": "if hiring signal present: what manual work could be automated and rough labor cost, else null",
  "exitValueAngle": "if exit/funding signal present: what would increase their revenue or valuation, else null",
  "realPain": "The single most expensive confirmed problem — expressed in terms of wasted money, lost revenue, or bleeding labor cost. Must reference a specific confirmed signal (ad spend, job postings, conversion gap). No technical jargon. One founder-facing sentence.",
  "embarrassingFinding": "the one thing the founder would be embarrassed about",
  "recommendedProduct": "The single best-fit primary offering (this is what the pitch leads with)",
  "recommendedPrice": "price range for the primary",
  "recommendedReason": "why THIS specific offering beats the others for THIS company — reference their confirmed situation, not generic reasoning. If you recommend Custom AI Software Build, you must justify why software specifically over marketing/website/growth work — do not default to it just because they hire people.",
  "topThreeProducts": "REQUIRED — always return exactly 3 items. Array of the 3 most relevant CROJungle offerings ranked by dollar-impact fit, each as {product, price, why}. #1 MUST match recommendedProduct. #2 and #3 are the NEXT best fits — always include all 3 even if the fit is weaker. Never return fewer than 3. Rank by what would move the most money for THIS business. ANTI-DEFAULT: only rank Custom AI Software Build #1 when there is a CONFIRMED manual-labor signal (multiple job postings) — otherwise lead with marketing, CRO, or exit advisory.",
  "reachPlan": "Object {who, channel, timing, opener} — the BEST way to reach the decision-maker. STRICT: 'who' must be a name from CONTACT INTELLIGENCE (site owners or Hunter contact) or a role like 'the owner' — NEVER invent a name. 'channel' = highest-grade real option: personal email > phone from their site > LinkedIn > contact form. 'timing' = use the TIMING WINDOW given. 'opener' = one sentence on how to open given who they are and why now. If no contact info exists, return null.",
  "savingsEstimate": "Money estimate ONLY with a real input. Object {monthlyLow, monthlyHigh, annualLow, annualHigh, basis, execution} OR null. RULES: (1) numbers ONLY from a CONFIRMED input: job-posting count (labor) OR verified ads + broken funnel (ad waste). NEVER invent from a weak website alone. (2) MODERATE ranges: labor = roles x $45k-$65k loaded salary x 60-80% automatable; ad waste = verified ad count x $800-$2000/mo placeholder x 20-40% waste. (3) basis = one sentence showing inputs and math. (4) execution = one sentence on HOW CROJungle captures it, so the closer knows what to sell. No confirmed input = null, never fabricate.",
  "pitchAngle": "The one line that earns a reply. WRITTEN FOR A BUSINESS OWNER, NOT A MARKETER \u2014 he owns a roofing company or a CPA practice, has never heard of an H1 tag, and files anything with agency vocabulary next to every other agency email. BANNED WORDS: pixel, retargeting, H1, meta, schema, SEO, above the fold, funnel, CRM, conversion rate, CTA, landing page, attribution, impressions, nurture, optimization, UX. Say it as he would: not \u2018no retargeting layer\u2019 but \u2018when someone leaves your site there is no way to get back in front of them\u2019; not \u2018no lead capture\u2019 but \u2018if they do not call right then, you never hear from them again\u2019. FRAME IT AS LOSS, NOT UPSIDE \u2014 owners act on money already leaking, not on improvements available. Dollar figures may ONLY come from numbers HE published (his posted prices, posted salaries, visible ad count, review count, staff count) plus honest arithmetic on those. NEVER invent a loss figure and NEVER state his revenue back to him \u2014 our revenue number is a third-party estimate, it is frequently wrong, and quoting it reads as surveillance rather than research. STRICT RULES: (0) IF the prompt above shows a MANDATORY OPENING (a pain repeating across their own Google reviews with a count), you MUST open with that pattern and its number — it outranks every other opener including news triggers. The ONE permitted pairing is: that review pattern + the money finding it connects to. (1) Otherwise ONE confirmed pain only — never chain several. (2) 45 words max. (3) No hedging ('appears to', 'looks like') — unconfirmed does not go in the pitch. (4) NAME THE FIRE THEY ARE STUCK PUTTING OUT. Mike's core insight: owners are trapped performing at a high level while constantly firefighting in areas they already delegated. The pitch should make them feel seen, not sold to. (5) MATCH VOCABULARY TO THE READER: exit-prep / just-funded / financially sophisticated → unit-economics language is the sharpest weapon (margin, multiple, EBITDA). Owner-operator (trucking, clinics, local services, contractors) → plain dollars and salaries, zero finance vocabulary. (6) Lead with the diagnosis and the money, close with a small conversational ask — a short call to walk through what we found and hear their side. NEVER 'book a demo' or 'send a proposal'. (7) No flattery, no 'hope this finds you well'. The audit IS the personalization. GOOD (owner-operator): 'You are paying four salaries to do work software handles overnight — and you are still the one fixing it when it breaks. Worth a short call to show you the math?' GOOD (exit-prep): 'Every dollar of manual labor you cut before the sale multiplies straight into your asking price. Want fifteen minutes to see what is automatable?' GOOD (stagnated/bloated): 'You have grown headcount faster than revenue and the ads are pouring into a page that cannot convert — that combination is exactly the fire that never gets put out. Short call?'"
}`
        });

        // 45s timeout — vision calls with screenshots regularly take 25-40s.
        // The old 20s timeout was killing valid calls mid-flight.
        const visionRes = await fetchT('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 6000,
            messages: [{ role: 'user', content: msgContent }]
          }),
        }, 45000);

        const vd = await safeJson(visionRes);
        // Surface actual API errors instead of swallowing them
        if (vd.error) {
          const et = (vd.error.type || '') + ' ' + (vd.error.message || '');
          if (/rate.?limit|429|too many requests/i.test(et)) {
            brainError = 'Anthropic rate limit — too many requests too fast (NOT a billing/credits problem). Retry in a moment.';
          } else if (/overloaded|529|503/i.test(et)) {
            brainError = 'Anthropic servers are temporarily overloaded (NOT a billing problem). Retry in a moment.';
          } else if (/credit balance|too low|billing|payment/i.test(et)) {
            brainError = 'Anthropic credit balance is low — top up at console.anthropic.com.';
          } else {
            brainError = `Claude API error: ${vd.error.type || ''} — ${vd.error.message || JSON.stringify(vd.error).slice(0,200)}`;
          }
          console.log('BRAIN ERROR:', brainError);
        }
        const vText = vd.content?.[0]?.text || '';
        if (!vText && !vd.error) {
          brainError = `Claude returned empty response (status shape: ${JSON.stringify(Object.keys(vd))})`;
          console.log('BRAIN ERROR:', brainError);
        }
        try {
          const clean = vText.replace(/```json|```/g,'').trim();
          let parsed;
          try {
            parsed = JSON.parse(clean);
          } catch(parseErr) {
            // Try to repair truncated JSON by finding the last valid closing brace
            let repaired = clean;
            // Count open braces and add missing closes
            const opens = (repaired.match(/\{/g)||[]).length;
            const closes = (repaired.match(/\}/g)||[]).length;
            const missing = opens - closes;
            if (missing > 0) {
              // Close any open string first
              if ((repaired.match(/"/g)||[]).length % 2 !== 0) repaired += '"';
              repaired += '}'.repeat(missing);
            }
            try {
              parsed = JSON.parse(repaired);
              console.log('Brain JSON repaired successfully');
            } catch(e2) {
              // Last resort: extract what we can
              const extract = (key) => { const m = clean.match(new RegExp(`"${key}"\\s*:\\s*"([^"]{0,500})`)); return m ? m[1] : null; };
              parsed = {
                heroHeadline: extract('heroHeadline'),
                ctaText: extract('ctaText'),
                headlineQuality: extract('headlineQuality') || 'generic',
                designQuality: extract('designQuality') || 'unknown',
                overallConversionRating: extract('overallConversionRating') || 'unknown',
                realPain: extract('realPain'),
                embarrassingFinding: extract('embarrassingFinding'),
                recommendedProduct: extract('recommendedProduct'),
                pitchAngle: extract('pitchAngle'),
                _truncated: true
              };
              console.log('Brain JSON truncated — partial extraction used');
            }
          }
          visualAnalysis = parsed;

          // ═══ DETERMINISTIC SOURCE VERIFICATION ═══════════════════════════
          // The strongest guarantee: any EXACT quote Claude makes (headline, CTA)
          // must actually appear in the scraped homepage. This is not another
          // model's opinion — it's a string match against real source. A founder
          // who knows their site will instantly spot a misquoted headline, so
          // every quotable detail is verified against the raw page before shipping.
          const sourceText = (trustedContent || '').toLowerCase().replace(/\s+/g, ' ');
          const verifyQuote = (q) => {
            if (!q || typeof q !== 'string' || q.length < 4) return null; // nothing to verify
            const norm = q.toLowerCase().replace(/["'']/g, '').replace(/\s+/g, ' ').trim();
            if (norm.length < 4) return null;
            // Direct match, or match ignoring punctuation
            const stripped = norm.replace(/[^a-z0-9 ]/g, '');
            const sourceStripped = sourceText.replace(/[^a-z0-9 ]/g, '');
            return sourceText.includes(norm) || sourceStripped.includes(stripped);
          };
          const quoteChecks = {
            heroHeadline: verifyQuote(parsed.heroHeadline),
            ctaText: verifyQuote(parsed.ctaText),
          };
          // If a quote was claimed but NOT found in source, null it out so the
          // audit can't display or pitch a headline/CTA that isn't really there.
          const unverifiedQuotes = [];
          if (parsed.heroHeadline && quoteChecks.heroHeadline === false) {
            unverifiedQuotes.push(`headline "${parsed.heroHeadline}" not found in page source`);
            parsed.heroHeadline = null; // suppress unverified quote
          }
          if (parsed.ctaText && quoteChecks.ctaText === false) {
            unverifiedQuotes.push(`CTA "${parsed.ctaText}" not found in page source`);
            parsed.ctaText = null;
          }
          if (unverifiedQuotes.length) {
            console.log('SOURCE VERIFY: suppressed unverified quotes:', unverifiedQuotes.join('; '));
          } else {
            console.log('SOURCE VERIFY: all quotes matched page source');
          }
          // Attach verification result so the frontend can show a trust badge
          parsed._quoteVerification = {
            checked: !!content && content.length > 100,
            headlineVerified: quoteChecks.heroHeadline === true,
            ctaVerified: quoteChecks.ctaText === true,
            suppressed: unverifiedQuotes,
          };
          brainAudit = {
            realPain: parsed.realPain,
            embarrassingFinding: parsed.embarrassingFinding,
            recommendedProduct: parsed.recommendedProduct,
            recommendedPrice: parsed.recommendedPrice,
            recommendedReason: parsed.recommendedReason,
            topThreeProducts: Array.isArray(parsed.topThreeProducts) ? parsed.topThreeProducts.slice(0,3) : [],
            pitchAngle: parsed.pitchAngle,
            operationsOpportunity: parsed.operationsOpportunity,
            exitValueAngle: parsed.exitValueAngle,
            quoteVerification: parsed._quoteVerification || null,
            reachPlan: (() => {
              const rp = parsed.reachPlan;
              if (!rp || typeof rp !== 'object') return null;
              const knownNames = [founderName, verifiedCEO, ...((builtWith.contacts||{}).owners||[]).map(o=>o.name)].filter(Boolean).map(n=>n.toLowerCase());
              const who = (rp.who || '').trim();
              const isRole = /^the |owner|founder|ceo|president|decision.maker/i.test(who);
              const nameKnown = knownNames.some(n => who.toLowerCase().includes(n.split(' ').slice(-1)[0]));
              if (who && !isRole && !nameKnown) { console.log(`REACH PLAN: rejected invented name "${who}"`); rp.who = 'the owner'; }
              return { who: rp.who || 'the owner', channel: rp.channel || '', timing: rp.timing || reachWindow.window, opener: rp.opener || '' };
            })(),
            contactIntel: (builtWith.contacts) || null,
            enrichment: enrichment || null,
            emailGrade,
            reachWindow,
            savingsEstimate: (() => {
              const se = parsed.savingsEstimate;
              if (!se || typeof se !== 'object') return null;
              const ml = Number(se.monthlyLow), mh = Number(se.monthlyHigh);
              let al = Number(se.annualLow), ah = Number(se.annualHigh);
              if (![ml,mh,al,ah].every(n => Number.isFinite(n) && n > 0)) return null;
              if (ml > mh || al > ah) return null;
              if (!se.basis || se.basis.length < 10) return null;
              // DEFENSIBILITY CEILING from confirmed inputs
              const laborCap = (manualRoleCount || 0) * 65000 * 0.8;
              const adsCap = (fbAds.adCount || 0) * 2000 * 0.4 * 12;
              const ceiling = (laborCap + adsCap) * 1.15;
              if (ceiling === 0) { console.log('SAVINGS REJECT: no confirmed dollar input'); return null; }
              if (ah > ceiling) {
                console.log(`SAVINGS CLAMP: claimed $${ah}, evidence supports max $${Math.round(ceiling)}`);
                ah = Math.round(ceiling); if (al > ah) al = Math.round(ah * 0.6);
              }
              return { monthlyLow: Math.round(al/12), monthlyHigh: Math.round(ah/12), annualLow: Math.round(al), annualHigh: Math.round(ah), basis: se.basis, execution: se.execution || '' };
            })(),
          };
          console.log('Brain audit complete:', parsed.recommendedProduct, '|', parsed.realPain?.slice(0,60));

          // ── BRAIN-EXTRACTED DECISION-MAKER ─────────────────────────────
          // Claude read the whole page — it's far better than regex at finding
          // the founder's name. Use it if we don't already have a verified CEO,
          // or upgrade a low-confidence name with a high-confidence one.
          const dm = parsed.decisionMaker;
          if (dm && typeof dm === 'object' && dm.name && dm.name.length > 3) {
            const dmName = dm.name.trim();
            const isGeneric = /^(the |our |team|leadership|management|owner|founder|ceo|president|staff)$/i.test(dmName);
            const looksLikeName = /^[A-Z][a-z]+(\s+[A-Z][a-z.]+){1,2}$/.test(dmName);
            if (!isGeneric && looksLikeName && (dm.confidence === 'high' || dm.confidence === 'medium')) {
              if (!verifiedCEO || dm.confidence === 'high') {
                verifiedCEO = dmName;
                verifiedCEOTitle = dm.title || verifiedCEOTitle || 'Owner';
                console.log(`Brain extracted decision-maker: ${verifiedCEO} (${verifiedCEOTitle}) [${dm.confidence}]`);
              }
            }
          }

          // ── SELF-CRITIQUE CALL ─────────────────────────────────────────
          // Second Claude call reviews the first audit's claims against the raw
          // evidence — catches overstated numbers and unverified findings.
          // SPEED GATE: this is the single most expensive step after the audit
          // itself (~30s, a third of total runtime). In QUICK mode we skip it so
          // you can crank through leads; the audit's own anti-fabrication guards
          // (source verification, evidence floors, ad-count reliability) still
          // apply. Run Deep mode on a lead before you actually send it.
          // REMOVED FROM THE DEFAULT PATH. Two reasons, both measured:
          //   1) It cost ~30s — a third of total research time.
          //   2) It OVERWROTE the Brain's pitchAngle with its own conservative
          //      35-word rewrite, which blunted the sharpest pitches the system
          //      produced. A slower AND blander result is not a quality gate.
          // The audit's real anti-fabrication guards (source verification, evidence
          // floors, ad-count reliability, quote verification) all still run.
          // Set deepMode:true explicitly if you ever want the second opinion back.
          if (req.body.deepMode !== true) {
            console.log(`Critique skipped — ~30s saved on ${company}`);
          } else
          try {
            const critiquePrompt = `You are a quality-control auditor reviewing a marketing audit before it goes to a founder.

RAW EVIDENCE (what we actually confirmed):
- Company: ${company}
- Website: ${website || 'none'}
- VERIFIED HEADCOUNT: ${verifiedEmployees ? verifiedEmployees.toLocaleString() + ' employees (confirmed via Google search)' : 'Not verified'}
- ICP CHECK: ${verifiedEmployees ? (verifiedEmployees <= 200 ? '✓ PASS — ' + verifiedEmployees + ' employees, founder likely reachable' : verifiedEmployees <= 500 ? '⚠ SOFT — ' + verifiedEmployees + ' employees, may have management layers' : '✗ FAIL — ' + verifiedEmployees + ' employees, this is an enterprise, NOT our ICP') : 'Size unknown — could not verify'}
- Firecrawl scraped: ${content.length} characters of homepage content
- Screenshot taken: ${!!screenshotUrl}
- Facebook ads: ${fbAds.hasAds && fbAds.countReliable !== false ? fbAds.adCount + ' ads verified as theirs (attribution-checked)' : fbAds.hasAds ? 'keyword hits only — NOT attribution-verified, no count may be stated' : fbAds.confirmed ? 'none found attributable to them' : 'not checked'}
- Google Ads tag on page: ${builtWith.hasGoogleAdsTag ? 'YES (confirmed in source)' : 'NOT FOUND (may still run ads via tag manager)'}
- Meta pixel on page: ${builtWith.hasMetaPixel ? 'YES (confirmed)' : 'NOT FOUND'}
- CRM detected: ${builtWith.hasCRM ? 'YES' : 'not detected on-page'}
- Email marketing detected: ${builtWith.hasEmailMarketing ? 'YES' : 'not detected on-page'}
- Tracking pixel detected: ${builtWith.hasPixel ? 'YES' : 'not detected on-page'}
- Live chat detected: ${builtWith.hasChat ? 'YES' : 'not detected on-page'}
- Manual roles hiring (job board signal): ${manualRoleCount} postings confirmed
- Funding signal: ${discoverySignals.raised_funding ? 'YES - Form D filing' : 'none'}
- Exit signal: ${discoverySignals.preparing_for_exit ? 'YES - BizBuySell listing' : 'none'}
- Copyright year: ${builtWith.copyrightYear || 'not found'}
- Title tag: "${builtWith.titleTag || 'not found'}"
- Email capture on site: ${builtWith.hasEmailCapture ? 'YES' : 'not found'}
- Booking tool: ${builtWith.hasBooking ? 'YES' : 'not found'}
- PageSpeed mobile: ${pageSpeed.mobileScore || 'not checked'}

AUDIT PRODUCED BY FIRST CALL:
Real pain: ${parsed.realPain || 'none'}
Embarrassing finding: ${parsed.embarrassingFinding || 'none'}
Recommended product: ${parsed.recommendedProduct} at ${parsed.recommendedPrice}
Reason: ${parsed.recommendedReason || 'none'}
Pitch angle: ${parsed.pitchAngle || 'none'}
Operations opportunity: ${parsed.operationsOpportunity || 'none'}
Exit angle: ${parsed.exitValueAngle || 'none'}

WHAT THE CRITIQUE MUST ACCEPT AS VALID (do NOT flag these):
- Any finding about visual elements, headline text, CTA buttons, design, layout, or above-fold content — these come from Claude's own vision analysis of a real screenshot and are valid even though you cannot see the image.
- Job posting counts — these are confirmed from the job board API.
- Any signal labeled "[Job-board signal]", "[SEC filing signal]", "[Site scan]", "[Ad Library]" — these are sourced.
- Estimates that are clearly framed as estimates ("est.", "roughly", "on the order of").

WHAT TO FLAG:
- ICP MISMATCH: If verified headcount is over 500, flag this loudly — this company is NOT our ICP (too large, owner unreachable). The audit should not be sent.
- VOICE FAILURE (flag this — it is as damaging as a factual error): CROJungle's pitch must sound like Mike Taft, not like a generic AI audit tool. Flag the pitch if it: (a) reads like a template or a marketing agency blast, (b) leads with a service instead of a diagnosis, (c) uses flattery or filler ("hope this finds you well", "I was really impressed by"), (d) asks for a demo or a proposal instead of a short conversational call, (e) fails to name the actual fire this owner is stuck putting out, or (f) stacks multiple pains instead of landing one. The strongest CROJ pitch makes the owner feel SEEN — it names the specific fire they have been living with — and then asks for a short call. If the pitch would not make a founder stop and think "how do they know that", say so.
- PROOF-POINT MISUSE: If a client result is cited, it must genuinely parallel this prospect's situation. Citing Kraft Heinz to a 15-person trucking company is a mismatch. Citing the $1M seasonal business (off-season relief) to an owner-operator is a strong parallel. Flag any stretched or irrelevant proof point.
- Dollar figures stated as facts without an estimate label.
- Claims about what competitors are doing (we have no competitor data).
- Claims about internal company data (revenue, headcount, margins) unless from a confirmed source.
- Ad counts not attributed to the company specifically.
- Absence claims stated as facts ("they have no CRM") — acceptable only as "not detected on-page."
- Any specific named person other than what Hunter returned.

YOUR JOB:
1. Check every specific claim in the audit against the RAW EVIDENCE above.
2. Flag anything that: (a) states a fact not in the evidence, (b) presents an estimate as a fact, (c) claims absence of something we couldn't verify (e.g. "no CRM" when we only checked the page source), (d) overstates a number.
3. Rewrite ONLY the pitch angle — make it 100% grounded in confirmed evidence only. Keep it under 35 words. No hedging language but no unverified claims.
4. Score your confidence in the audit 0-10 (10 = everything verified, 0 = mostly speculation).

Return ONLY valid JSON:
{
  "verifiedClaims": ["list of claims directly supported by evidence"],
  "flaggedClaims": ["list of claims that overstate or aren't supported — be specific"],
  "correctedPitchAngle": "rewritten pitch using only confirmed evidence, 35 words max",
  "confidenceScore": 0-10,
  "critiqueNote": "one sentence summary of biggest accuracy risk in this audit",
  "icpBlocker": "Flag this company OUTSIDE our ICP (one short phrase; otherwise empty string) ONLY on POSITIVE evidence — NEVER on missing or unknown data. Block only if the evidence clearly shows: (a) verified headcount over ~200 OR revenue clearly over ~$20M; (b) it is a holding company, PE/portfolio rollup, or a franchise SYSTEM (not a single local franchisee); (c) it is an enterprise, government body, publicly-traded giant, hospital/health system, or a staffing/recruiting firm; (d) a dedicated in-house marketing department or CMO clearly already exists. CRITICAL: DO NOT block for unverified or unknown headcount — most of our BEST leads are local owner-operated businesses we deliberately do not size, so 'size unknown' is EXPECTED and is NOT a disqualifier. DO NOT block on reachability — that is scored separately by the system. When in doubt, leave this EMPTY.",
  "estimatedEmployees": "your best estimate of employee count as a number if you can infer it from the evidence, otherwise null"
}`;

            const critiqueRes = await fetchT('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
              body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 800,
                messages: [{ role: 'user', content: critiquePrompt }]
              }),
            }, 25000);

            const cd = await critiqueRes.json();
            const cText = cd.content?.[0]?.text || '';
            let cClean = cText.replace(/```json|```/g, '').trim();
            // Extract just the JSON object if there's trailing text
            const firstBrace = cClean.indexOf('{');
            const lastBrace = cClean.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
              cClean = cClean.slice(firstBrace, lastBrace + 1);
            }
            let critique;
            try {
              critique = JSON.parse(cClean);
            } catch(parseErr) {
              // Repair truncated JSON
              let repaired = cClean;
              if ((repaired.match(/"/g)||[]).length % 2 !== 0) repaired += '"';
              const opens = (repaired.match(/\{/g)||[]).length;
              const closes = (repaired.match(/\}/g)||[]).length;
              if (opens > closes) repaired += '}'.repeat(opens - closes);
              critique = JSON.parse(repaired);
            }
            const conf = Number.isFinite(Number(critique.confidenceScore)) ? Number(critique.confidenceScore) : 7;
            brainAudit.critique = {
              verifiedClaims: critique.verifiedClaims || [],
              flaggedClaims: critique.flaggedClaims || [],
              correctedPitchAngle: critique.correctedPitchAngle || parsed.pitchAngle,
              confidenceScore: conf,
              critiqueNote: critique.critiqueNote || '',
              icpBlocker: critique.icpBlocker || '',
              estimatedEmployees: critique.estimatedEmployees || null,
            };
            // If critique identifies an ICP blocker (too big, enterprise, gov), flag the whole lead
            if (critique.icpBlocker && critique.icpBlocker.length > 3) {
              brainAudit.icpBlocked = true;
              brainAudit.icpBlockerReason = critique.icpBlocker;
              console.log(`ICP BLOCKED by critique [${company}]: ${critique.icpBlocker}`);
            }
            // Use corrected pitch angle if confidence is reasonable
            if (critique.correctedPitchAngle && conf >= 5) {
              brainAudit.pitchAngle = critique.correctedPitchAngle;
            }
            console.log('Critique complete: confidence', conf, '| flags:', (critique.flaggedClaims||[]).length);
          } catch(e) {
            console.log('Critique call failed (non-fatal):', e.message);
            // Non-fatal — audit continues without critique
          }
        } catch(e) {
          if (!brainError) brainError = `Claude responded but JSON parse failed: ${e.message} — response started with: "${vText.slice(0,120)}"`;
          console.log('Brain parse error:', e.message, vText.slice(0,200));
        }
      } catch(e) {
        brainError = e.message.includes('abort') || e.message.includes('timeout')
          ? 'Claude API call timed out after 45s — Render free tier may be too slow, retry usually works'
          : `Brain call failed: ${e.message}`;
        console.log('Brain audit error:', e.message);
      }
    }

    // Merge text analysis with visual analysis
    // VISION FIRST: if the vision audit looked at the rendered page, its verdict is
    // authoritative. Fall back to source-regex only when there's no screenshot.
    // ═══════════════════════════════════════════════════════════════════
    // MONEY ON FIRE — the most undeniable audit finding we can produce
    // ═══════════════════════════════════════════════════════════════════
    // We already detect all of these SEPARATELY and have never combined them.
    // A company doing several at once is setting money on fire in multiple
    // ways simultaneously — and every single one is PROVABLE, not an opinion.
    //
    // The brutal one is ads-without-a-pixel: they are paying for traffic they
    // physically cannot measure. Not "underperforming" — literally blind.


    const hasWeakHeadline = visualAnalysis ? visualAnalysis.headlineQuality === 'generic' : /^welcome to|we are a|we provide|we help businesses|we offer/i.test(content.slice(0,300));
    const hasTestimonials = visualAnalysis?.hasSocialProof ?? /testimonial|review|client said|case study|trusted by/i.test(content);
    const hasPricing = /pricing|plans|per month|subscription|\$/i.test(content);
    const hasVideo = visualAnalysis?.hasVideo ?? /video|youtube|vimeo|wistia/i.test(content);
    const hasAgency = /powered by|designed by|marketing by/i.test(content);
    const designQuality = visualAnalysis?.designQuality || 'unknown';
    const conversionRating = visualAnalysis?.overallConversionRating || 'unknown';

    // Dunford positioning score
    const positioningScore = (() => {
      let s = 0;
      if (visualAnalysis) {
        if (visualAnalysis.headlineQuality === 'specific') s+=3;
        if (visualAnalysis.hasSocialProof) s+=2;
        if (visualAnalysis.trustSignals?.length > 2) s+=2;
        if (!visualAnalysis.aboveFoldClutter) s+=1;
        if (visualAnalysis.hasVideo) s+=1;
        if (visualAnalysis.designQuality === 'professional') s+=1;
      } else {
        if (!hasWeakHeadline) s+=2;
        if (content.slice(0,1000).match(/for\s+\w+\s+(who|that|with)/i)) s+=2;
        if (hasTestimonials) s+=2;
        if (content.match(/unlike|instead of|compared to|vs\./i)) s+=2;
        if (hasPricing) s+=1;
        if (hasVideo) s+=1;
      }
      return Math.min(s, 10);
    })();

    // 4 Buckets — enhanced with visual analysis
    const buckets = {
      ACQUISITION: {
        googleAds: builtWith.hasGoogleAdsTag ? 'Google Ads conversion tag found on site — confirmed ad infrastructure' : googleAds.hasGoogleAds ? 'Google Ads possibly running (unverified heuristic)' : 'No Google Ads tag on page (they may still run ads — unverified)',
        seoBasics: builtWith.confirmed ? [
          !builtWith.titleTag || builtWith.titleTag.length < 15 ? 'weak/missing title tag' : '',
          !builtWith.hasMetaDesc ? 'no meta description' : '',
          !builtWith.hasH1 ? 'no H1' : '',
          !builtWith.hasSchema ? 'no schema markup' : '',
        ].filter(Boolean).length ? 'On-page SEO gaps: ' + [
          !builtWith.titleTag || builtWith.titleTag.length < 15 ? 'weak/missing title tag' : '',
          !builtWith.hasMetaDesc ? 'no meta description' : '',
          !builtWith.hasH1 ? 'no H1' : '',
          !builtWith.hasSchema ? 'no schema markup' : '',
        ].filter(Boolean).join(', ') : 'On-page SEO fundamentals in place (title, meta, H1, schema)' : '',
        facebookAds: fbAds.hasAds && fbAds.countReliable !== false ? `${fbAds.adCount || fbAds.ads?.length || ''}+ active Facebook ads verified as THEIRS in Ad Library (attribution-checked)`.trim() : fbAds.hasAds ? 'Ad Library keyword hits found but NOT attribution-verified — no ad count can be claimed' : builtWith.hasMetaPixel ? 'Meta pixel on site — ad infrastructure exists, but no ads verified as theirs in Ad Library' : fbAds.confirmed ? 'No Facebook ads attributable to them in Ad Library' : 'Facebook ads: could not check (Ad Library scrape failed)',
        fbAdAge: fbAds.ads?.length > 0 ? `Longest running: ${Math.max(...fbAds.ads.map(a=>a.runningDays))} days` : '',
        staleFbAds: fbAds.ads?.some(a=>a.runningDays>180) ? 'Warning: ads running 6+ months without refresh' : '',
      },
      CONVERSION: {
        hasCTA: hasCTA ? `CTA present above fold${visualAnalysis?.ctaText ? ` — "${visualAnalysis.ctaText}"` : ''}` : 'No clear CTA detected above fold',
        headline: hasWeakHeadline
          ? `Generic headline${visualAnalysis?.heroHeadline ? ` — "${visualAnalysis.heroHeadline}"` : ''}`
          : `Specific headline${visualAnalysis?.heroHeadline ? ` — "${visualAnalysis.heroHeadline}"` : ''}`,
        socialProof: hasTestimonials
          ? `Social proof present${visualAnalysis?.socialProofType ? ` (${visualAnalysis.socialProofType})` : ''}`
          : 'No social proof detected',
        pricing: hasPricing ? 'Pricing visible' : 'No pricing shown',
        mobileScore: pageSpeed.mobileScore ? `${pageSpeed.mobileScore}/100 mobile score` : 'Mobile score unavailable',
        lcp: pageSpeed.lcp ? `Load time: ${pageSpeed.lcp}` : '',
        positioningScore: `Dunford positioning: ${positioningScore}/10`,
        designQuality: visualAnalysis ? `Design: ${designQuality}` : '',
        conversionRating: visualAnalysis ? `Overall conversion: ${conversionRating}` : '',
        biggestVisualIssue: visualAnalysis?.biggestVisualIssue || '',
        visuallyAnalyzed: !!visualAnalysis,
      },
      AUTHORITY: {
        agencyFooter: hasAgency ? 'Agency relationship detected in footer' : 'No agency footer detected',
        video: hasVideo ? 'Video content present' : 'No video content detected',
        linkedinNote: 'Check LinkedIn manually for CMO presence and last post date',
      },
      INFRASTRUCTURE: {
        crm: builtWith.hasCRM ? 'CRM detected' : builtWith.confirmed ? 'No CRM detected on-page (scan can miss server-side tools)' : 'CRM: could not verify (scan blocked)',
        emailMarketing: builtWith.hasEmailMarketing ? 'Email marketing tool active' : builtWith.confirmed ? 'No email tool detected on-page (unverified)' : 'Email marketing: could not verify',
        trackingPixel: builtWith.hasPixel ? 'Analytics/pixel present' : builtWith.confirmed ? 'No pixel detected on-page (scan can miss it)' : 'Tracking: could not verify',
        chat: builtWith.hasChat ? 'Live chat present' : builtWith.confirmed ? 'No live chat detected (unverified)' : 'Chat: could not verify',
        emailCapture: builtWith.confirmed ? (builtWith.hasEmailCapture ? 'Email capture present' : 'No email capture form found — zero list building from site traffic') : '',
        booking: builtWith.confirmed ? (builtWith.hasBooking ? 'Booking/scheduler tool present' : 'No booking tool — every conversion requires manual back-and-forth') : '',
        siteFreshness: (builtWith.copyrightYear && builtWith.copyrightYear < new Date().getFullYear() - 1) ? `Footer copyright says ${builtWith.copyrightYear} — site appears untouched for ${new Date().getFullYear() - builtWith.copyrightYear} years` : '',
        video: builtWith.hasVideo ? 'Video hosting detected' : '',
      },
      // OPERATIONS — the AI-replacement / software-build opportunity.
      // Populated from the discovery signal (manual hiring), not the website.
      // This is what the old website-only audit was completely blind to.
      OPERATIONS: {
        manualHiring: manualRoleCount >= 2
          ? `[Job-board signal] Hiring ${manualRoleCount} manual/repetitive roles${manualCategories ? ` across ${manualCategories} functions` : ''} — confirmed postings, automatable work`
          : discoverySignals.ai_replacement_signal
          ? '[Job-board signal] Hiring manual/repetitive roles — automation opportunity'
          : 'No manual-hiring signal detected',
        laborCostEstimate: manualRoleCount >= 2
          ? `[Job-board signal] ${manualRoleCount} active postings for repetitive roles — recurring salary spend software could reduce`
          : '',
        automationOpportunity: manualRoleCount >= 3
          ? 'HIGH — multiple repetitive roles could be replaced with a single software build'
          : manualRoleCount >= 2
          ? 'MEDIUM — repetitive workflows automatable'
          : '',
        techStackMaturity: (!builtWith.hasCRM && !builtWith.hasEmailMarketing && !builtWith.hasChat)
          ? '[Site scan] No connected systems detected — greenfield for AI Brain / workflow automation'
          : '[Site scan] Some tools present — integration opportunity',
      },
      // GROWTH — funding / exit-prep signals that suppress or unlock revenue
      GROWTH: {
        funding: discoverySignals.raised_funding
          ? '[SEC filing signal] Recently raised — capital to deploy, board pressure to show growth'
          : '',
        exitPrep: discoverySignals.preparing_for_exit
          ? '[Listing signal] Preparing for exit — motivated to maximize revenue/valuation fast'
          : '',
        triggerEvent: (discoverySignals.rebranding || discoverySignals.recently_acquired || discoverySignals.recently_launched)
          ? `In flux (${discoverySignals.rebranding ? 'rebrand' : discoverySignals.recently_acquired ? 'acquisition' : 'launch'}) — vendors up for grabs, marketing reset needed`
          : '',
        adSpend: (googleAds.hasGoogleAds || fbAds.hasAds)
          ? 'Confirmed ad spend — leaking revenue if funnel is broken'
          : 'No confirmed ad spend',
      },
    };

    // Flaws — ONLY flag what we can CONFIRM, not what we can't detect
    // "Not detected" ≠ "Doesn't exist" — be conservative to avoid false pitches
    const flaws = [];

    // HIGH CONFIDENCE — visual or direct confirmation
    if (!hasCTA && visualAnalysis && !visualAnalysis.hasCTAAboveFold) flaws.push('no_cta');
    else if (!hasCTA && !visualAnalysis && content.length > 500) flaws.push('no_cta'); // fallback if no screenshot

    if (hasWeakHeadline && visualAnalysis?.headlineQuality === 'generic') flaws.push('weak_hero');
    else if (hasWeakHeadline && !visualAnalysis) flaws.push('weak_hero');

    if (!hasTestimonials && visualAnalysis && !visualAnalysis.hasSocialProof) flaws.push('no_social_proof');
    else if (!hasTestimonials && !visualAnalysis && content.length > 500) flaws.push('no_social_proof');

    // MEDIUM CONFIDENCE — BuiltWith confirmed absence (only flag if content is rich enough to be reliable)
    if (!builtWith.hasCRM && builtWith.checked && content.length > 1000) flaws.push('no_crm');
    if (!builtWith.hasPixel && builtWith.checked) flaws.push('no_tracking');

    // HIGH CONFIDENCE — confirmed running via API
    if (fbAds.hasAds && fbAds.ads?.some(a=>a.runningDays>180)) flaws.push('stale_fb_ads');

    // Mobile — only flag if actually checked and confirmed bad
    if (pageSpeed.mobileScore && pageSpeed.mobileScore < 50) flaws.push('slow_mobile');
    if (positioningScore < 4) flaws.push('weak_positioning');

    // OPERATIONS — AI-replacement signals (from discovery, high confidence)
    if (manualRoleCount >= 5) flaws.push('heavy_manual_labor');
    else if (manualRoleCount >= 2) flaws.push('manual_labor');
    // GROWTH — funding / exit signals
    if (discoverySignals.raised_funding && !builtWith.hasCRM) flaws.push('funded_no_infra');
    if (discoverySignals.preparing_for_exit) flaws.push('exit_prep');
    if (builtWith.confirmed && !builtWith.hasEmailCapture) flaws.push('no_email_capture');
    if (builtWith.copyrightYear && builtWith.copyrightYear < new Date().getFullYear() - 1) flaws.push('stale_site');

    // DO NOT flag absence of ads as a flaw — we don't know if they're running them elsewhere
    // DO NOT flag no_google_ads or no_fb_ads — SpyFu/Facebook checks are unreliable without keys

    // Top pain
    const painMap = [
      { id:'heavy_manual_labor', pain:`Actively hiring ${manualRoleCount} manual/repetitive roles (confirmed job postings) — recurring labor that custom software could largely replace`, opportunity:'Custom AI software build to automate repetitive workflows', product:'Custom AI Software Build', price:'$40k–$100k+' },
      { id:'exit_prep', pain:'Preparing for exit — every dollar of new revenue and every efficiency gain directly raises the sale price', opportunity:'Revenue growth + valuation advisory before the sale closes', product:'Exit / Valuation Advisory', price:'Custom' },
      { id:'manual_labor', pain:`Hiring ${manualRoleCount} manual roles — repetitive work that software could handle at a fraction of the cost`, opportunity:'Workflow automation / custom software', product:'Custom AI Software Build', price:'$40k–$100k+' },
      { id:'funded_no_infra', pain:'Recently funded but no CRM or marketing infrastructure — capital to grow with nothing to capture or convert leads', opportunity:'Full marketing infrastructure + intelligence layer', product:'AI Brain', price:'$40k–$70k' },
      { id:'stale_site', pain:`Footer copyright reads ${builtWith.copyrightYear} — the site has visibly not been touched in years, and prospects notice`, opportunity:'Full website rebuild', product:'Website Rebuild', price:'$50k+' },
      { id:'no_cta', pain:'No CTA above fold — visitors arrive and have nowhere to go', opportunity:'Homepage rebuild with a real conversion path', product:'Website Rebuild', price:'$50k+' },
      { id:'no_email_capture', pain:'No email capture anywhere on the site — every visitor who does not convert today is lost forever', opportunity:'Lead capture + email nurture system', product:'Revenue Growth Retainer', price:'$10k–$35k/mo' },
      { id:'weak_positioning', pain:`Positioning ${positioningScore}/10 — generic messaging any competitor could use`, opportunity:'Brand positioning + website rewrite', product:'Website Rebuild', price:'$50k+' },
      { id:'stale_fb_ads', pain:'Same Facebook ads running 6+ months — creative fatigue killing performance', opportunity:'Ad creative refresh + conversion path rebuild', product:'End-to-End Marketing', price:'$10k–$35k/mo' },
      { id:'no_crm', pain:'No CRM detected — leads are falling through the cracks with no system to catch them', opportunity:'CRM + marketing automation setup', product:'Revenue Growth Retainer', price:'$10k–$35k/mo' },
      { id:'no_tracking', pain:'No tracking pixel — spending on marketing with no way to measure what works', opportunity:'Analytics + tracking infrastructure', product:'Revenue Growth Retainer', price:'$10k–$35k/mo' },
      { id:'slow_mobile', pain:`Mobile score ${pageSpeed.mobileScore}/100 — majority of traffic leaves before seeing the offer`, opportunity:'Site speed + mobile rebuild', product:'Website Rebuild', price:'$50k+' },
      { id:'no_google_ads', pain:'No Google Ads — competitors are capturing demand this company cannot see', opportunity:'Paid search with a conversion-ready destination', product:'End-to-End Marketing', price:'$10k–$35k/mo' },
      { id:'no_social_proof', pain:'No testimonials or case studies — buyers cannot verify claims before buying', opportunity:'Social proof system', product:'Website Rebuild', price:'$50k+' },
      { id:'weak_hero', pain:'Homepage headline does not differentiate from a single competitor', opportunity:'Positioning + homepage rewrite', product:'Website Rebuild', price:'$50k+' },
    ];
    const topPain = (() => {
      // Brain found a specific pain — use it, it's more accurate than rule-based
      if (brainAudit?.realPain) {
        return {
          pain: brainAudit.realPain,
          opportunity: brainAudit.embarrassingFinding || brainAudit.pitchAngle || 'See pitch angle below',
          product: brainAudit.recommendedProduct,
          price: brainAudit.recommendedPrice,
          pitchAngle: brainAudit.pitchAngle,
          fromBrain: true,
        };
      }
      return painMap.find(p => flaws.includes(p.id));
    })();

    // Recommended product — Brain audit takes priority when available
    const getRecommendedProduct = () => {
      // Brain already made the call — trust it
      if (brainAudit?.recommendedProduct) {
        return {
          product: brainAudit.recommendedProduct,
          price: brainAudit.recommendedPrice || '$50k+',
          reason: brainAudit.recommendedReason || brainAudit.realPain || '',
          pitchAngle: brainAudit.pitchAngle || '',
          flag: '',
        };
      }
      // Fallback logic when Brain didn't run
      const hasAdSpend = googleAds.hasGoogleAds || fbAds.hasAds;
      const hasInfra = builtWith.hasCRM || builtWith.hasPixel;
      const isAIOpportunity = !builtWith.hasCRM && !builtWith.hasEmailMarketing && !builtWith.hasChat;
      const isBroken = flaws.includes('no_cta') || positioningScore < 4 || (pageSpeed.mobileScore && pageSpeed.mobileScore < 40);
      const isMediaOrAgency = /media|agency|creative|PR|communications|marketing firm|studio/i.test(content.slice(0,500));
      if (isAIOpportunity && isMediaOrAgency) return { product:'Software Build / AI Integration', price:'$40k–$100k+', reason:'Merged or growing operation with no unified tech stack', flag:'' };
      if (hasAdSpend && !hasInfra) return { product:'Growth Retainer', price:'$10k–$35k/mo', reason:'Confirmed ad spend but no infrastructure to convert — revenue leaking', flag:'' };
      if (isAIOpportunity && content.length > 2000) return { product:'AI Brain', price:'$40k–$70k', reason:'No intelligence layer — disconnected systems, no automation, no tracking', flag:'' };
      if (isBroken) return { product:'Website Rebuild', price:'$50k+', reason:'Homepage has critical conversion failures', flag:'' };
      return { product:'Website Rebuild', price:'$50k+', reason:'Homepage conversion gaps identified', flag:'' };
    };

    const recommendedProduct = (() => {
      // If Brain audit ran successfully, trust it over rule-based logic
      // Brain saw the actual content + screenshot and made a specific recommendation
      if (brainAudit?.recommendedProduct && brainAudit?.recommendedReason) {
        console.log('Using Brain audit recommendation:', brainAudit.recommendedProduct);
        return {
          product: brainAudit.recommendedProduct,
          price: brainAudit.recommendedPrice || '$5k–$75k',
          reason: brainAudit.recommendedReason,
          flag: '',
          fromBrain: true,
        };
      }
      // Fallback to rule-based if Brain didn't run (no API key or no content)
      return getRecommendedProduct();
    })();

    // Post-research score — adds up to 15 points on top of discovery score
    // Discovery was capped at 85, research adds the final 15
    const researchBonus = (() => {
      let bonus = 0;
      if (topPain) bonus += 5;                          // confirmed specific pain
      if (flaws.length >= 3) bonus += 3;                // multiple confirmed issues
      if (email.email) bonus += 3;                      // found founder email
      if (visualAnalysis) bonus += 2;                   // visual analysis completed
      if (pageSpeed.mobileScore && pageSpeed.mobileScore < 60) bonus += 2; // confirmed mobile issue
      return Math.min(bonus, 15);
    })();

    // ── BRAIN GATE — if Brain didn't run, don't return fake rule-based data ──
    // Rule-based checks are not reliable enough to show to users
    if (!brainAudit) {
      const reason = brainError
        ? brainError
        : !firecrawlKey
        ? 'Firecrawl key missing — add fc-... key in Settings so we can scrape the homepage'
        : 'Brain analysis failed — the Anthropic API returned an error. If this says "rate limit," it is NOT a billing problem — just retry. Otherwise check your key (sk-ant-...) in Settings.';

      console.log(`Brain gate blocked: ${reason}`);
      return res.status(422).json({
        brainFailed: true,
        reason,
        screenshotUrl: screenshotUrl || null, // still return screenshot so user can verify website
        partialData: {
          email: email.email||'',
          founderName: email.founderName||'',
        }
      });
    }

    // ═══ RECOMPUTE REACHABILITY — now with REAL inputs ══════════════════════
    // THE ARCHITECTURAL FIX: at Find time, scoreReachability() reads verifiedCEO,
    // emailResult and painSignals — which are ALL empty at that stage, because
    // they only get populated here in Research. So the Find-time score was
    // silently a headcount-only pre-score wearing a "reachability" label.
    //
    // Now that we actually know WHO the decision-maker is, whether we can REACH
    // them, and what fire they're fighting, we score it properly and overwrite.
    // ═══ OWNER/EMAIL MATCH — did we build the email for the SAME person we named
    // as the owner? Southwest exposed this: owner = "Lori Palmer", email = mcurrent@
    // (a different person). An email to the wrong human is a wasted send no matter
    // how sharp the audit. Flag it loudly rather than let it pass silently. ═══
    const ownerNameForMatch = ((decisionMaker && decisionMaker.name) || verifiedCEO || '').toLowerCase();
    const ownerTokensM = ownerNameForMatch.split(/\s+/).filter(w => w.length >= 3);
    const emailLocalM = (email.email || '').split('@')[0].toLowerCase().replace(/[^a-z.]/g, '');
    const ROLE_RE_M = /^(info|sales|contact|office|admin|hello|team|support|help|enquir|inquir|marketing|general|mail|reception|account|billing|service|customer|hr|jobs|careers|press|media|noreply)/;
    let ownerEmailMatch = 'unknown', ownerEmailMatchReason = '';
    if (ownerTokensM.length && emailLocalM) {
      if (localMatchesName(emailLocalM, ownerTokensM)) {
        ownerEmailMatch = 'match'; ownerEmailMatchReason = `Email (${emailLocalM}@\u2026) matches ${decisionMaker?.name || verifiedCEO} — reaching the right person`;
      } else if (ROLE_RE_M.test(emailLocalM)) {
        ownerEmailMatch = 'shared_inbox'; ownerEmailMatchReason = `Owner is ${decisionMaker?.name || verifiedCEO}, but the only email is a shared inbox (${emailLocalM}@\u2026) — a gatekeeper reads this, not them`;
      } else {
        ownerEmailMatch = 'different_person'; ownerEmailMatchReason = `\u26a0 Owner identified as ${decisionMaker?.name || verifiedCEO}, but the email (${emailLocalM}@\u2026) appears to belong to a DIFFERENT person — verify before sending`;
      }
      console.log(`OWNER/EMAIL MATCH [${company}]: ${ownerEmailMatch} — ${ownerEmailMatchReason}`);
    }

    const reach = scoreReachability({
      source: discoverySource,
      manualRoleCount,
      jobTitle: req.body.jobTitle || '',
      verifiedEmployees,
      verifiedCEO, verifiedCEOTitle,
      decisionMaker,
      emailResult,
      email: email.email,
      ownerOnOwnSite: nameOnPage || (decisionMaker && (decisionMaker.sources||[]).some(x => /own_website|website/i.test(x))),
      publicPainSignals,
      companyTriggers,
    });
    console.log(`REACHABILITY [${company}]: ${reach.score}/100 — ${reach.verdict}`);

    console.log(`Research complete: ${company} | ${flaws.length} flaws | ${recommendedProduct.product} | +${researchBonus} research bonus`);

    res.json({
      reachability: reach.score,
      reachabilityVerdict: reach.verdict,
      reachabilityReasons: reach.reasons,
      ownerEmailMatch,
      ownerEmailMatchReason,
      email: email.email||'',
      founderName: email.founderName||'',
      founderTitle: email.title||'',
      buckets, flaws, topPain, positioningScore, recommendedProduct, researchBonus, brainAudit,
      visualAnalysis,
      screenshotUrl,
      companyTriggers,
      verifiedCEO, verifiedCEOTitle, verifiedEmployees, verifiedRevenue,
      emailResult, decisionMaker,
      publicPainSignals, painSummary,
      // INTEGRITY STAMP: the exact website every finding was measured against.
      // If this is blank, no site was audited (we refused to audit a listing page).
      // The frontend shows this so you can verify at a glance it's the real business.
      auditedWebsite: website || '',
      auditedWebsiteResolved: website && website !== req.body.website,
      // Did we confirm this site really belongs to THIS company (not a same-name
      // different business)? 'yes' = confirmed, 'no' = wrong company (site discarded),
      // 'unclear'/'unknown' = couldn't confirm — treat findings with more caution.
      domainMatch: domainConfirmation.match,
      domainMatchConfidence: domainConfirmation.confidence,
      domainMatchReason: domainConfirmation.reason,
      visionAudit: visualAnalysis || null,
      // ═══ CONFIDENCE LABELS — the key to defensible accuracy ════════════════
      // Every finding tagged by HOW we know it. A finding is only "wrong" if its
      // confidence label overstates its certainty. This never overstates.
      //   mechanical  = a machine measured it; a human would agree (highest)
      //   visual      = vision looked at the rendered page (high)
      //   limited     = we checked but can't see everything (e.g. server-side CRM)
      //   judgment    = Claude's structured opinion (lowest — always verify)
      signalConfidence: {
        facebook_ads:   { level: 'mechanical', method: 'Meta Ad Library direct lookup' },
        meta_pixel:     { level: 'mechanical', method: 'page source scan for fbq/facebook.net/tr' },
        google_ads_tag: { level: 'mechanical', method: 'page source scan for gtag AW-' },
        analytics:      { level: 'mechanical', method: 'page source scan for GA4/GTM' },
        cta_above_fold: { level: visualAnalysis ? 'visual' : 'limited', method: visualAnalysis ? 'vision read the rendered screenshot' : 'source regex (may miss JS-rendered)' },
        social_proof:   { level: visualAnalysis ? 'visual' : 'limited', method: visualAnalysis ? 'vision read the rendered screenshot' : 'source regex' },
        crm:            { level: 'limited', method: 'page source scan — server-side CRMs are invisible; "none detected" is not "none exists"' },
        decision_maker: { level: (decisionMaker?.corroborated ? 'mechanical' : 'limited'), method: (decisionMaker?.sources || []).join(' + ') || 'search' },
        email:          { level: (emailResult?.tier <= 2 ? 'mechanical' : emailResult?.tier === 3 ? 'limited' : 'judgment'), method: emailResult?.label || 'none' },
        positioning:    { level: 'judgment', method: 'Claude structured opinion (Dunford framework) — always verify' },
        operational_pain: { level: publicPainSignals.length ? 'mechanical' : 'limited', method: 'verified against exact quotes from real reviews' },
      },
      firecrawlOutOfCredits: FIRECRAWL_OUT_OF_CREDITS,
      signals: { no_cta:!hasCTA, weak_positioning:positioningScore<5, no_crm:!builtWith.hasCRM, no_tracking:!builtWith.hasPixel, running_google_ads:!!builtWith.hasGoogleAdsTag, has_meta_pixel:!!builtWith.hasMetaPixel, running_fb_ads:!!fbAds.hasAds },
      homepageContent: content.slice(0,3000),
      richData: {
        googleAds: buckets.ACQUISITION.googleAds,
        fbAds: buckets.ACQUISITION.facebookAds,
        mobileScore: buckets.CONVERSION.mobileScore,
        hasCRM: buckets.INFRASTRUCTURE.crm,
        hasPixel: buckets.INFRASTRUCTURE.trackingPixel,
        positioningScore: buckets.CONVERSION.positioningScore,
        designQuality: designQuality,
        conversionRating: conversionRating,
        visuallyAnalyzed: true, // Brain always does visual analysis
      },
    });
  } catch(e) {
    console.error('Research error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`CROJungle v6 — port ${PORT}`));

// ── DIAGNOSTICS — tests all sources at once ───────────────
// ═══════════════════════════════════════════════════════════════════════════
// LINKEDIN CONTENT MACHINE — draft posts from REAL aggregate audit data
// ═══════════════════════════════════════════════════════════════════════════
// The machine writes the draft. Mike reviews and edits before every post — this
// endpoint NEVER posts anything itself, it only produces drafts for human review.
// GROUNDING RULE: every number in every draft must trace back to a real researched
// lead passed in. No invented statistics, no rounding up, no "many companies" when
// the actual count is 4. If the batch doesn't support a claim, the draft says less,
// not more.
// ═══════════════════════════════════════════════════════════════════════════
// HUNTER SEQUENCES SEND — pushes researched leads into a live Hunter sequence
// ═══════════════════════════════════════════════════════════════════════════
// Runs server-side so the Hunter API key never reaches the browser.
// Hunter's API: create/save the lead (with the personalized pitch as notes),
// then add it to the sequence by ID. Free — no premium plan required.
// Hunter processes one contact per call (no native bulk endpoint), so we chunk
// gently with a small delay between calls to stay well within rate limits.
// Ensures a Hunter custom attribute exists with this label, returns its slug.
// Custom attributes must exist BEFORE a lead can carry a value for them — this
// creates it once (idempotent: if it already exists, Hunter's list tells us the
// slug instead of erroring).
const ensureHunterAttribute = async (hunterKey, label) => {
  try {
    const listRes = await fetchT(`https://api.hunter.io/v2/leads_custom_attributes`, {
      headers: { 'Authorization': `Bearer ${hunterKey}` },
    }, 8000);
    const listData = await safeJson(listRes);
    const existing = (listData?.data?.leads_custom_attributes || []).find(a => a.label === label);
    if (existing) return existing.slug;

    const createRes = await fetchT(`https://api.hunter.io/v2/leads_custom_attributes`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${hunterKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    }, 8000);
    const createData = await safeJson(createRes);
    return createData?.data?.slug || null;
  } catch(e) {
    console.log(`ensureHunterAttribute(${label}) failed:`, e.message);
    return null;
  }
};

// List the user's Hunter sequences so they can find the correct Sequence ID.
// Hunter's API still calls sequences "campaigns" under the hood.
// Check remaining Hunter credits so the app can warn before they run out.
// Check remaining Firecrawl credits. This matters more than it sounds: Firecrawl
// now powers ~8 of our data sources. If it silently runs dry, the system produces
// thin audits and empty decision-maker lookups WITHOUT any error — which looks
// exactly like a broken engine. This makes an empty tank visible.
app.get('/api/firecrawl-credits', async (req, res) => {
  const key = req.query.key;
  if (!key) return res.status(400).json({ error: 'key required' });
  try {
    const r = await fetchT('https://api.firecrawl.dev/v1/team/credit-usage', {
      headers: { 'Authorization': `Bearer ${key}` },
    }, 8000);
    const d = await safeJson(r);
    const remaining = d?.data?.remaining_credits ?? d?.remaining_credits ?? null;
    const planCredits = d?.data?.plan_credits ?? null;
    res.json({
      remaining,
      planCredits,
      // ~6-8 credits per fully-researched company
      companiesLeft: remaining != null ? Math.floor(remaining / 7) : null,
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/hunter-credits', async (req, res) => {
  const key = req.query.key;
  if (!key) return res.status(400).json({ error: 'key required' });
  try {
    const r = await fetchT(`https://api.hunter.io/v2/account?api_key=${encodeURIComponent(key)}`, {}, 8000);
    const d = await safeJson(r);
    const used = d?.data?.requests?.searches?.used ?? null;
    const available = d?.data?.requests?.searches?.available ?? null;
    res.json({
      used, available,
      remaining: (available != null && used != null) ? available - used : null,
      plan: d?.data?.plan_name || null,
      resetDate: d?.data?.reset_date || null,
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/hunter-sequences', async (req, res) => {
  const hunterKey = req.query.key;
  if (!hunterKey) return res.status(400).json({ error: 'key required' });
  try {
    const r = await fetchT(`https://api.hunter.io/v2/campaigns?api_key=${encodeURIComponent(hunterKey)}`, {}, 10000);
    const d = await safeJson(r);
    if (!r.ok) return res.status(r.status).json({ error: 'Hunter returned ' + r.status, raw: d });
    const seqs = (d?.data?.campaigns || d?.data || []).map(c => ({ id: c.id, name: c.name, status: c.status }));
    console.log(`Hunter sequences: found ${seqs.length}`);
    res.json({ sequences: seqs });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST HARNESS — verify the decision-maker + email engines on any company
// ═══════════════════════════════════════════════════════════════════════════
// Runs every source INDEPENDENTLY and shows you exactly what each one returned,
// so you can see whether the engine actually works instead of trusting a summary.
app.post('/api/test-contact-engine', async (req, res) => {
  const { company, website, keys } = req.body;
  const { firecrawlKey, hunterKey, verifierKey } = keys || {};
  const apiKey = req.body.apiKey;
  if (!company || !website) return res.status(400).json({ error: 'company and website required' });

  const t0 = Date.now();
  const out = { company, website, sources: {}, decisionMaker: null, email: null, timing: {} };

  try {
    // Scrape the homepage once, reuse everywhere (same as the real flow)
    let homepageContent = '';
    if (firecrawlKey) {
      const s = Date.now();
      homepageContent = await firecrawlScrape(firecrawlKey, website, 20000);
      // Retry once with a longer timeout — a 0-char scrape collapses the whole
      // engine to Hunter-only, which is exactly the failure we're trying to fix.
      if (!homepageContent || homepageContent.length < 200) {
        console.log(`TEST [${company}]: homepage scrape empty, retrying...`);
        homepageContent = await firecrawlScrape(firecrawlKey, website, 35000);
      }
      out.timing.scrape = Date.now() - s;
      out.sources.homepage_chars = homepageContent.length;
    }

    // ── Each source, run independently so you can see who found what ──
    const s1 = Date.now();
    const brain = await findOwnerViaBrain(website, firecrawlKey, apiKey, homepageContent, company).catch(e => ({ error: e.message }));
    out.sources.own_website_brain = brain || 'nothing found';
    out.timing.brain = Date.now() - s1;

    const sW = Date.now();
    const websearch = await findOwnerViaWebSearch(company, website, firecrawlKey, apiKey).catch(e => ({ error: e.message }));
    out.sources.web_search = websearch || 'nothing found';
    out.timing.web_search = Date.now() - sW;

    const s2 = Date.now();
    const registry = await findOwnerViaRegistry(company, firecrawlKey).catch(e => ({ error: e.message }));
    out.sources.registry = registry || 'nothing found';
    out.timing.registry = Date.now() - s2;

    const s3 = Date.now();
    const news = await findOwnerViaNews(company).catch(e => ({ error: e.message }));
    out.sources.news = news || 'nothing found';
    out.timing.news = Date.now() - s3;

    // Hunter — the incumbent we're measuring against
    let hunterEmail = '', hunterName = '', hunterTitle = '';
    if (hunterKey) {
      const s4 = Date.now();
      try {
        const domain = website.replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '');
        const r = await fetchT(`https://api.hunter.io/v2/domain-search?domain=${domain}&type=personal&limit=5&api_key=${hunterKey}`, {}, 10000);
        const d = await safeJson(r);
        const emails = (d?.data?.emails || []).map(e => ({
          email: e.value, name: `${e.first_name||''} ${e.last_name||''}`.trim(),
          title: e.position || '', confidence: e.confidence,
          authority: authorityScore(e.position || ''),
        })).sort((a,b) => b.authority - a.authority);
        out.sources.hunter = emails.length ? emails : 'nothing found';
        if (emails[0]) { hunterEmail = emails[0].email; hunterName = emails[0].name; hunterTitle = emails[0].title; }
      } catch(e) { out.sources.hunter = { error: e.message }; }
      out.timing.hunter = Date.now() - s4;
    } else {
      out.sources.hunter = 'no key provided';
    }

    // ── The corroborated verdict ──
    const s5 = Date.now();
    out.decisionMaker = await findDecisionMaker({
      companyName: company, website, fcKey: firecrawlKey, apiKey,
      homepageContent, hunterName, hunterTitle,
    });
    out.timing.decisionMaker = Date.now() - s5;

    // ── The email, using the decision-maker we just identified ──
    const s6 = Date.now();
    out.email = await findEmailFireproof({
      website,
      ceoName: out.decisionMaker?.name,
      ceoTitle: out.decisionMaker?.title,
      fcKey: firecrawlKey,
      homepageContent,
      hunterEmail, hunterName, hunterTitle,
      verifierKey,
    });
    out.timing.email = Date.now() - s6;

    // ── Honest head-to-head scoring ──
    out.verdict = {
      hunterFoundPerson: !!hunterName,
      hunterTitle: hunterTitle || null,
      hunterAuthority: hunterName ? authorityScore(hunterTitle) : 0,
      oursFoundPerson: !!out.decisionMaker?.name,
      oursTitle: out.decisionMaker?.title || null,
      oursAuthority: out.decisionMaker?.authority || 0,
      oursCorroborated: !!out.decisionMaker?.corroborated,
      oursSources: out.decisionMaker?.sources || [],
      oursCanBuy: out.decisionMaker?.canBuy === true,
      oursBlockReason: out.decisionMaker?.blockReason || null,
      emailSendable: out.email?.sendable === true,
      emailEvidence: out.email?.label || null,
      winner:
        (!hunterName && out.decisionMaker?.name) ? 'OURS (Hunter found nobody)' :
        (hunterName && !out.decisionMaker?.name) ? 'HUNTER (we found nobody)' :
        (!hunterName && !out.decisionMaker?.name) ? 'NEITHER' :
        (out.decisionMaker?.authority > authorityScore(hunterTitle)) ? 'OURS (higher authority person)' :
        (out.decisionMaker?.authority < authorityScore(hunterTitle)) ? 'HUNTER (higher authority person)' :
        out.decisionMaker?.corroborated ? 'OURS (same person, but corroborated)' : 'TIE',
    };

    out.timing.total = Date.now() - t0;
    console.log(`TEST [${company}]: ${out.verdict.winner} | ours: ${out.decisionMaker?.name || 'none'} (${out.decisionMaker?.sources?.join('+') || '-'}) | hunter: ${hunterName || 'none'}`);
    res.json(out);
  } catch(e) {
    console.log('Test harness error:', e.message);
    res.status(500).json({ error: e.message, partial: out });
  }
});

app.post('/api/send-to-hunter', async (req, res) => {
  const { leads, sequenceId, hunterKey } = req.body;
  if (!Array.isArray(leads) || leads.length === 0) return res.status(400).json({ error: 'leads array required' });
  if (!sequenceId) return res.status(400).json({ error: 'sequenceId required — the Hunter sequence (campaign) to add leads to' });
  if (!hunterKey) return res.status(400).json({ error: 'hunterKey required' });

  const results = { sent: [], failed: [] };

  // ═══ One-time setup: make sure the custom attributes exist ═══════════════
  // These slugs are what you insert into your Hunter sequence's email content
  // via the { } "Insert attribute" button — that's what makes the personalized
  // pitch actually appear in the sent email instead of a generic template.
  const pitchSlug = await ensureHunterAttribute(hunterKey, 'Pitch Body');
  const subjectSlug = await ensureHunterAttribute(hunterKey, 'Pitch Subject');
  const angleSlug = await ensureHunterAttribute(hunterKey, 'Pitch Angle');

  for (const lead of leads) {
    if (!lead.email) { results.failed.push({ name: lead.name, reason: 'no email' }); continue; }
    // HARD GUARD: never push a lead without real content. A missing pitch or
    // subject would send a broken/fallback email to a real founder — worse than
    // not sending at all. Fail here, before it ever reaches Hunter's queue.
    if (!lead.pitch || !lead.pitch.trim()) {
      results.failed.push({ name: lead.name, email: lead.email, reason: 'no pitch body — blocked before send' });
      continue;
    }
    if (!lead.subject || !lead.subject.trim()) {
      results.failed.push({ name: lead.name, email: lead.email, reason: 'no subject line — blocked before send' });
      continue;
    }
    // HARD GUARD: never send to an unverified guess. A bounce costs sender
    // reputation, which is far more expensive than a missed lead. Tier 4
    // (inferred pattern on a catch-all domain) is explicitly not sendable.
    if (lead.emailResult && lead.emailResult.sendable === false) {
      results.failed.push({
        name: lead.name, email: lead.email,
        reason: `email not verified (${lead.emailResult.label}) — blocked to protect sender reputation`
      });
      continue;
    }
    // REACHABILITY GUARD: never burn a lead we cannot actually reach. This uses
    // the SAME reachability score as the Research gate and the Generate checklist,
    // so a lead that was approvable can never silently fail here. (Previously this
    // used the old canBuy authority flag, which contradicted reachability — e.g. an
    // owner with a verified personal email but an unknown title.)
    if ((lead.reachability || 0) < 45) {
      results.failed.push({
        name: lead.name, email: lead.email,
        reason: `Reachability ${lead.reachability || 0}/100 — decision-maker not confirmed reachable. Find the owner or verify the email before sending.`
      });
      continue;
    }
    const fullName = (lead.founderName || lead.verifiedCEO || '').trim();
    const parts = fullName.split(/\s+/);
    try {
      const customAttrs = {};
      if (pitchSlug) customAttrs[pitchSlug] = (lead.pitch || '').slice(0, 5000);
      if (subjectSlug) customAttrs[subjectSlug] = lead.subject || '';
      if (angleSlug) customAttrs[angleSlug] = lead.brainAudit?.pitchAngle || '';

      // Upsert (create-or-update by email) — avoids duplicate-email errors if
      // this lead was already saved in Hunter from an earlier find/enrich step.
      const leadRes = await fetchT('https://api.hunter.io/v2/leads', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${hunterKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: lead.email,
          first_name: parts[0] || undefined,
          last_name: parts.slice(1).join(' ') || undefined,
          company: lead.name || undefined,
          website: lead.website || undefined,
          custom_attributes: customAttrs,
        }),
      }, 10000);
      const leadData = await safeJson(leadRes);
      if (!leadRes.ok) {
        results.failed.push({ name: lead.name, email: lead.email, reason: `Lead save failed: HTTP ${leadRes.status}` });
        continue;
      }
      const leadId = leadData?.data?.id;

      // Add the saved lead to the sequence so it enters the send queue
      const addRes = await fetchT(`https://api.hunter.io/v2/campaigns/${sequenceId}/recipients`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${hunterKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(leadId ? { lead_ids: [leadId] } : { emails: [lead.email] }),
      }, 10000);
      if (addRes.ok) {
        results.sent.push({ id: lead.id, name: lead.name, email: lead.email });
      } else {
        const errText = await safeText(addRes);
        results.failed.push({ name: lead.name, email: lead.email, reason: `Sequence add failed: HTTP ${addRes.status}: ${errText.slice(0,200)}` });
      }
    } catch(e) {
      results.failed.push({ name: lead.name, email: lead.email, reason: e.message });
    }
    // Gentle pacing between calls — respectful of Hunter's rate limits
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`Hunter send: ${results.sent.length} sent, ${results.failed.length} failed`);
  res.json({ ...results, attributeSlugs: { pitchSlug, subjectSlug, angleSlug } });
});

app.post('/api/linkedin-drafts', async (req, res) => {
  const { leads, apiKey } = req.body;
  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'leads array required — pass already-researched leads from the pipeline' });
  }
  if (!apiKey) return res.status(400).json({ error: 'Anthropic apiKey required' });

  try {
    // ── Build the real aggregate from actual researched leads (no fabrication) ──
    const researched = leads.filter(l => l.brainAudit && !l.brainAudit.icpBlocked);
    if (researched.length === 0) {
      return res.json({ drafts: [], note: 'No researched, non-blocked leads in this batch — nothing to aggregate.' });
    }

    const flawCounts = {};
    const productCounts = {};
    const industryCounts = {};
    let totalAdSpendLeads = 0, totalManualLaborLeads = 0, totalStaleSiteLeads = 0;
    const realExamples = [];

    researched.forEach(l => {
      (l.flaws || []).forEach(f => { flawCounts[f] = (flawCounts[f]||0) + 1; });
      const prod = l.brainAudit?.recommendedProduct;
      if (prod) productCounts[prod] = (productCounts[prod]||0) + 1;
      if (l.verifiedIndustry) industryCounts[l.verifiedIndustry] = (industryCounts[l.verifiedIndustry]||0) + 1;
      if ((l.brainAudit?.enrichment?.adCount || 0) > 0) totalAdSpendLeads++;
      if ((l.manualRoleCount || 0) >= 2) totalManualLaborLeads++;
      if (l.flaws?.includes('stale_site')) totalStaleSiteLeads++;
      if (l.brainAudit?.realPain) {
        realExamples.push({ industry: l.verifiedIndustry || 'unknown', pain: l.brainAudit.realPain, savingsEst: l.brainAudit.savingsEstimate });
      }
    });

    const aggregateSummary = `
BATCH SIZE: ${researched.length} real companies audited (this is the ONLY count you may cite — never round up or say "dozens" if it's fewer)
FLAW FREQUENCY (real counts, only cite if count >= 3): ${JSON.stringify(flawCounts)}
PRODUCT RECOMMENDATIONS (real counts): ${JSON.stringify(productCounts)}
INDUSTRIES REPRESENTED: ${JSON.stringify(industryCounts)}
Companies with confirmed active ad spend: ${totalAdSpendLeads} of ${researched.length}
Companies with 2+ manual-labor roles open: ${totalManualLaborLeads} of ${researched.length}
Companies with a stale/pre-2021 site: ${totalStaleSiteLeads} of ${researched.length}

REAL EXAMPLE FINDINGS (anonymized — do not use company names, describe by industry/size only):
${realExamples.slice(0, 8).map((e,i) => `${i+1}. [${e.industry}] ${e.pain}`).join('\n')}
`.trim();

    const r = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: `You are drafting LinkedIn posts for Mike Taft, CEO of CROJungle — a growth partner for founder-led businesses ($1.5M-$50M revenue). Mike's background: government contracting, Wall Street, private technology, building companies from the ground up. His core insight: owners get trapped performing at a high level while constantly firefighting in areas they already delegated — there's never a good time to stop and fix it. CROJ is the door out of that cycle.

These are DRAFTS ONLY — Mike will review, edit, and post them himself, so write in a voice he can quickly make his own, not a finished polished piece.

REAL DATA FROM THIS WEEK'S AUDITS (the ONLY facts you may use — do not invent, round up, or generalize beyond what's here):
${aggregateSummary}

RULES:
1. Every number in the post must come directly from the data above. If the batch is small (e.g. "4 of 12 companies"), say the real number — small honest numbers build more credibility than vague "many companies" claims.
2. NEVER name a specific company — describe by industry/size/situation only ("a regional trucking company", "a $2M home services business").
3. Voice: direct, operator-to-operator, no marketing language, no hashtag spam, no "I'm excited to announce". Mike would rather sound like he's talking to one specific founder than broadcasting to a feed.
4. Lead with the diagnosis/insight, not a sales pitch. The post should make a founder reading it think "that's literally my problem" — it should NOT mention CROJungle by name or pitch services; save that for a soft one-line close at most.
5. Length: 80-150 words. LinkedIn rewards short, scannable posts with white space, not paragraphs.
6. Produce exactly 3 DIFFERENT angles on the same real data — not 3 versions of the same post.

Return ONLY valid JSON, no markdown:
{
  "drafts": [
    {"angle": "short label like 'the labor-cost insight'", "post": "the full draft text", "groundedIn": "one sentence citing which specific data point this post is built from"},
    {"angle": "...", "post": "...", "groundedIn": "..."},
    {"angle": "...", "post": "...", "groundedIn": "..."}
  ]
}`
        }]
      }),
    }, 30000);

    const data = await r.json();
    const text = data.content?.[0]?.text || '';
    let clean = text.replace(/```json|```/g, '').trim();
    const fb = clean.indexOf('{'), lb = clean.lastIndexOf('}');
    if (fb >= 0 && lb > fb) clean = clean.slice(fb, lb + 1);

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch(e) { return res.status(502).json({ error: 'Draft generation returned invalid JSON', raw: clean.slice(0, 500) }); }

    console.log(`LinkedIn drafts: ${(parsed.drafts||[]).length} generated from ${researched.length} real audits`);
    res.json({ drafts: parsed.drafts || [], batchSize: researched.length, aggregateSummary });
  } catch(e) {
    console.log('LinkedIn draft generation failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/diagnostics', async (req, res) => {
  const { keys } = req.body;
  const { adzunaId, adzunaKey, indeedKey, crunchbaseKey, hunterKey, firecrawlKey } = keys || {};
  const results = {};

  // Test Adzuna
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${adzunaId}&app_key=${adzunaKey}&results_per_page=5&what=dispatcher&sort_by=date&max_days_old=30`;
    const r = await fetchT(url, { headers: { 'Accept': 'application/json' } }, 8000);
    const d = await safeJson(r);
    results.adzuna = { ok: r.ok && (d.results||[]).length > 0, count: (d.results||[]).length, total: d.count||0, error: d.exception||null };
  } catch(e) { results.adzuna = { ok: false, error: e.message }; }

  // Test SEC EDGAR
  try {
    const r = await fetchT(`https://efts.sec.gov/LATEST/search-index?q=%22marketing%22&forms=D&dateRange=custom&startdt=${new Date(Date.now()-30*864e5).toISOString().split('T')[0]}&enddt=${new Date().toISOString().split('T')[0]}`, { headers: { 'Accept': 'application/json' } }, 8000);
    const d = await safeJson(r);
    results.sec_edgar = { ok: true, count: d.hits?.hits?.length || 0, total: d.hits?.total?.value || 0 };
  } catch(e) { results.sec_edgar = { ok: false, error: e.message }; }

  // Test Google News RSS
  try {
    const r = await fetchT('https://news.google.com/rss/search?q=company+hires+CMO&hl=en-US&gl=US&ceid=US:en', {}, 6000);
    const xml = await safeText(r);
    const items = (xml.match(/<item>/g)||[]).length;
    results.google_news = { ok: items > 0, count: items };
  } catch(e) { results.google_news = { ok: false, error: e.message }; }

  // Test Hunter.io
  if (hunterKey) {
    try {
      const r = await fetchT(`https://api.hunter.io/v2/account?api_key=${hunterKey}`, {}, 6000);
      const d = await safeJson(r);
      results.hunter = { ok: !!d.data, requests_remaining: d.data?.requests?.searches?.available || 0, error: d.errors?.[0]?.details || null };
    } catch(e) { results.hunter = { ok: false, error: e.message }; }
  } else { results.hunter = { ok: false, error: 'No key provided' }; }

  // Test BizBuySell — RSS first, Firecrawl fallback
  try {
    const xml = await fetchViaProxy('https://www.bizbuysell.com/rss/businesses-for-sale/', 8000);
    const items = (xml && !xml.trim().startsWith('<!DOCTYPE')) ? (xml.match(/<item>/g)||[]).length : 0;
    if (items > 0) {
      results.bizbuysell = { ok: true, count: items, source: 'rss' };
    } else if (firecrawlKey) {
      // RSS blocked — try Firecrawl render
      const md = await firecrawlScrape(firecrawlKey, 'https://www.bizbuysell.com/businesses-for-sale/', 30000);
      const listings = (md && md.match(/business-opportunity/gi)||[]).length;
      results.bizbuysell = { ok: listings > 0, count: listings, source: 'firecrawl', error: listings === 0 ? 'Firecrawl returned no listings' : null };
    } else {
      results.bizbuysell = { ok: false, error: 'RSS blocked, no Firecrawl key to fall back to' };
    }
  } catch(e) { results.bizbuysell = { ok: false, error: e.message }; }

  // Test backend itself
  results.backend = { ok: true, version: 'v8' };

  // Test name normalization (stacking fix)
  const normName = (raw) => (raw || '')
    .toLowerCase().replace(/[.,]/g, '')
    .replace(/\b(inc|incorporated|llc|corp|corporation|co|company|ltd|limited|group|holdings|lp|llp|plc|pllc)\b/g, '')
    .replace(/\s+/g, ' ').trim();
  const stackingTests = [
    ['Viking Land Transportation', 'Viking Land Transportation Inc'],
    ['Athletico Physical Therapy', 'Athletico Physical Therapy LLC'],
    ['Acme Corp', 'ACME Corporation'],
  ];
  results.stacking_normalizer = {
    ok: true,
    tests: stackingTests.map(([a, b]) => ({ a, b, match: normName(a) === normName(b), normA: normName(a), normB: normName(b) }))
  };

  res.json(results);
});
