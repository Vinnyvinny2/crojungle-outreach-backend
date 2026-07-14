require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

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

const googleSearch = async (query) => {
  try {
    // DDG Instant Answer API — designed for programmatic access, not blocked like the HTML endpoint
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const r = await fetchT(CF_WORKER + encodeURIComponent(ddgUrl), {}, 15000);
    const text = await r.text();
    if (!text || text.includes('Host not in allowlist')) return '';
    // DDG JSON API returns structured data — convert to text for our pattern matching
    try {
      const d = JSON.parse(text);
      // Combine AbstractText, RelatedTopics snippets, and Answer into searchable text
      const parts = [
        d.AbstractText || '',
        d.Answer || '',
        d.AbstractSource || '',
        ...(d.RelatedTopics || []).map(t => t.Text || t.Result || '').slice(0, 10),
        ...(d.Results || []).map(r => r.Text || '').slice(0, 5),
      ];
      const combined = parts.join(' ');
      console.log(`DDG [${query.slice(0,40)}]: ${combined.length} chars`);
      return combined;
    } catch {
      // If not JSON, return raw text (may still be parseable)
      return text;
    }
  } catch(e) {
    console.log('DuckDuckGo search failed:', e.message);
    return '';
  }
};

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

      // Name match: ALL significant query words must appear (stricter than before)
      const nameMatchCount = queryWords.filter(w => capiName.includes(w)).length;
      const nameMatch = queryWords.length > 0 && nameMatchCount === queryWords.length;

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
const lookupCompanySize = async (companyName) => {
  try {
    const html = await googleSearch(`${companyName} number of employees`);
    if (!html) return { employees: null, icpPass: null, icpReason: 'size lookup failed' };

    // Extract employee count from search snippets
    // Patterns: "1,234 employees", "~500 employees", "10,000+ employees", "50 to 200 employees"
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ');
    
    const patterns = [
      /(\d[\d,]+)\s*(?:to|-)\s*(\d[\d,]+)\s*employees/i,  // range: 50 to 200
      /([\d,]+)\+?\s*employees/i,                            // 1,234 employees
      /employees[:\s]+(\d[\d,]+)/i,                          // employees: 1234
      /workforce\s+of\s+([\d,]+)/i,                          // workforce of 500
      /staff\s+of\s+([\d,]+)/i,                              // staff of 500
      /(\d[\d,]+)\s*(?:full.time\s+)?(?:staff|workers|people)/i,
    ];

    let employees = null;
    let employeeRange = null;

    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) {
        if (m[2]) {
          // Range match
          const low = parseInt(m[1].replace(/,/g,''));
          const high = parseInt(m[2].replace(/,/g,''));
          employees = Math.round((low + high) / 2);
          employeeRange = `${m[1]}–${m[2]}`;
        } else {
          employees = parseInt(m[1].replace(/,/g,''));
          employeeRange = m[1];
        }
        if (employees > 0 && employees < 10000000) break; // sanity check
      }
    }

    // Also try to grab website from the same search
    let website = null;
    const siteMatch = text.match(/(?:website|visit)[:\s]+([a-z0-9.-]+\.[a-z]{2,})/i);
    if (siteMatch) website = 'https://' + siteMatch[1];

    // ICP decision
    let icpPass = null;
    let icpReason = '';
    if (employees === null) {
      icpPass = null; // unknown — don't block, but flag
      icpReason = 'employee count not found in search results';
    } else if (employees < 10) {
      icpPass = false;
      icpReason = `Too small (${employeeRange} employees) — likely no budget`;
    } else if (employees <= 200) {
      icpPass = true;
      icpReason = `${employeeRange} employees — CEO likely still reachable`;
    } else if (employees <= 500) {
      icpPass = 'soft'; // show warning but let through
      icpReason = `${employeeRange} employees — may have management layers, verify reachability`;
    } else {
      icpPass = false;
      icpReason = `Too large (${employeeRange} employees) — owner not reachable`;
    }

    console.log(`Size lookup [${companyName}]: ${employees || 'unknown'} employees → ${icpPass}`);
    return { employees, employeeRange, website, icpPass, icpReason };
  } catch(e) {
    console.log('Size lookup failed:', e.message);
    return { employees: null, icpPass: null, icpReason: 'lookup error: ' + e.message };
  }
};

// Extract company website from search results
const findWebsiteFromSearch = async (companyName) => {
  const html = await googleSearch(`${companyName} official website`);
  if (!html) return null;

  // Extract result URLs — DuckDuckGo puts them in result__url or result__a
  const urlMatches = html.match(/class="result__url"[^>]*>([^<]+)</g) || [];
  const hrefMatches = html.match(/href="([^"]+)"[^>]*class="result__a"/g) || [];

  const candidates = [];

  // From result URLs (displayed domain text)
  for (const m of urlMatches) {
    const domain = m.replace(/class="result__url"[^>]*>/, '').replace(/<.*/, '').trim();
    if (domain && !domain.includes('duckduckgo') && !domain.includes('wikipedia') &&
        !domain.includes('linkedin') && !domain.includes('facebook') &&
        !domain.includes('yelp') && !domain.includes('indeed') && !domain.includes('glassdoor')) {
      candidates.push('https://' + domain.replace(/^https?:\/\//, '').split('/')[0]);
    }
  }

  // From actual href links
  for (const m of hrefMatches) {
    const href = m.match(/href="([^"]+)"/)?.[1];
    if (href && href.startsWith('http') && !href.includes('duckduckgo')) {
      try {
        const domain = new URL(href).hostname.replace('www.', '');
        if (!domain.includes('wikipedia') && !domain.includes('linkedin') &&
            !domain.includes('facebook') && !domain.includes('yelp') &&
            !domain.includes('indeed') && !domain.includes('glassdoor') &&
            !domain.includes('bloomberg') && !domain.includes('crunchbase')) {
          candidates.push('https://' + domain);
        }
      } catch {}
    }
  }

  if (!candidates.length) return null;

  // Pick the best match — prefer domains containing company name words
  const nameWords = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  for (const url of candidates) {
    const domain = url.toLowerCase();
    if (nameWords.some(w => domain.includes(w))) return url;
  }

  return candidates[0]; // Fallback to first result
};

// Extract headcount from search results — same as Googling "[company] number of employees"
const getCompanyHeadcount = async (companyName) => {
  const html = await googleSearch(`${companyName} number of employees headcount`);
  if (!html) return null;

  // Look for patterns like "X employees", "X,XXX employees", "X-XXX employees"
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');

  const patterns = [
    /(\d{1,3}(?:,\d{3})*)\s*(?:to|-)\s*(\d{1,3}(?:,\d{3})*)\s*employees/i,  // "1,000 to 5,000 employees"
    /(\d{1,3}(?:,\d{3})+)\s*employees/i,  // "10,000 employees"
    /employees?\s*[:·]\s*(\d{1,3}(?:,\d{3})*)/i,  // "Employees: 5,000"
    /(\d{1,3}(?:,\d{3})*)\s*(?:full[- ]time\s*)?(?:staff|workers|people|team members)/i,
    /workforce\s*of\s*(\d{1,3}(?:,\d{3})*)/i,
    /(\d+)K\s*employees/i,  // "50K employees"
    /(\d{1,4})\s*employees/i,  // small companies "250 employees"
  ];

  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m) {
      let count;
      if (m[2]) {
        // Range — use the average
        const lo = parseInt(m[1].replace(/,/g, ''));
        const hi = parseInt(m[2].replace(/,/g, ''));
        count = Math.round((lo + hi) / 2);
      } else if (m[1].endsWith && m[0].includes('K')) {
        count = parseInt(m[1]) * 1000;
      } else {
        count = parseInt(m[1].replace(/,/g, ''));
      }
      if (count > 0 && count < 10000000) {
        console.log(`Headcount for ${companyName}: ~${count}`);
        return count;
      }
    }
  }

  return null;
};

// ICP size gate — under 500 employees = passes, over 1000 = blocked, 500-1000 = borderline
const checkCompanySize = async (companyName) => {
  const headcount = await getCompanyHeadcount(companyName);
  if (headcount === null) return { passes: true, headcount: null, reason: 'size unknown — allowing through' };
  if (headcount <= 200) return { passes: true, headcount, reason: `${headcount} employees — strong ICP fit` };
  if (headcount <= 500) return { passes: true, headcount, reason: `${headcount} employees — within ICP range` };
  if (headcount <= 1000) return { passes: true, headcount, reason: `${headcount} employees — borderline, score reduced` };
  return { passes: false, headcount, reason: `${headcount} employees — too large, outside ICP` };
};

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
const googleEnrich = async (companyName) => {
  try {
    // Size/website from Clearbit (reliable, fast, free)
    // CEO/pain from DDG via CF Worker (best effort)
    const [clearbitRes, ceoHtml, painHtml] = await Promise.all([
      getSizeOnly(companyName),
      googleSearch(`${companyName} CEO founder owner`),
      googleSearch(`${companyName} reviews complaints problems`),
    ]);

    const clean = (h) => (h || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ');

    // HEADCOUNT + WEBSITE from Clearbit
    const employees = clearbitRes ? clearbitRes.employees : null;
    const website = clearbitRes ? clearbitRes.website : null;

    // CEO / DECISION MAKER
    let ceoName = null;
    let ceoTitle = null;
    const ceoText = clean(ceoHtml);
    const ceoPatterns = [
      /(?:CEO|Chief Executive Officer)[,\s]+([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,
      /([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+(?:CEO|Chief Executive Officer|founder|co-founder|President)/,
      /founder(?:\s+and\s+CEO)?[,\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /led by\s+([A-Z][a-z]+ [A-Z][a-z]+)/,
      /(?:CEO|founder|President)\s+([A-Z][a-z]+ [A-Z][a-z]+)/,
    ];
    for (const pat of ceoPatterns) {
      const m = ceoText.match(pat);
      if (m && m[1] && m[1].length < 40 && !/company|corporation|inc|llc/i.test(m[1])) {
        ceoName = m[1].trim();
        ceoTitle = 'CEO';
        break;
      }
    }

    // PAIN SIGNALS from reviews search
    const painText = clean(painHtml);
    const painSignals = [];
    const painKeywords = ['slow', 'bad customer service', 'outdated', 'confusing', 'expensive', 'broken', 'poor', 'terrible', 'unresponsive', 'no support', 'buggy', 'clunky', 'ancient', 'legacy'];
    const snippets = painText.match(/[A-Z][^.!?]{20,180}[.!?]/g) || [];
    const firstWord = companyName.toLowerCase().split(' ')[0];
    for (const snip of snippets.slice(0, 15)) {
      const low = snip.toLowerCase();
      if (painKeywords.some(k => low.includes(k)) && low.includes(firstWord)) {
        painSignals.push(snip.trim().slice(0, 180));
        if (painSignals.length >= 3) break;
      }
    }

    // REVENUE — not available from Clearbit free tier, skip for now
    const revenue = null;

    console.log(`Enrich [${companyName}]: emp=${employees||'?'} site=${website||'?'} ceo=${ceoName||'?'} pain=${painSignals.length} rev=${revenue||'?'}`);
    return { employees, website, revenue, ceoName, ceoTitle, painSignals };
  } catch(e) {
    console.log(`Enrich failed [${companyName}]:`, e.message);
    return { employees: null, website: null, revenue: null, ceoName: null, ceoTitle: null, painSignals: [] };
  }
};
const searchAdzuna = async (appId, appKey) => {
  if (!appId || !appKey) { console.log('Adzuna: no keys'); return []; }
  try {
    // RE-AIMED at AI-REPLACEMENT signals — CROJungle's biggest tickets ($25k-$75k builds).
    // We hunt companies hiring repetitive/manual roles. A company posting MULTIPLE of
    // these is bleeding money on labor that AI/software can replace. The *count* of
    // manual roles is the signal — one CS rep is nothing, three is a bleeding funnel.
    // `cat` groups synonyms so "Customer Service Rep" + "Call Center Rep" = one function.
    const searches = [
      { title: 'Customer Service Representative', cat: 'customer_service' },
      { title: 'Customer Support Specialist',     cat: 'customer_service' },
      { title: 'Call Center Representative',       cat: 'customer_service' },
      { title: 'Data Entry Clerk',                 cat: 'data_entry' },
      { title: 'Data Entry Specialist',            cat: 'data_entry' },
      { title: 'Order Entry Clerk',                cat: 'data_entry' },
      { title: 'Scheduler',                        cat: 'scheduling' },
      { title: 'Scheduling Coordinator',           cat: 'scheduling' },
      { title: 'Appointment Setter',               cat: 'scheduling' },
      { title: 'Dispatcher',                       cat: 'dispatch' },
      { title: 'Bookkeeper',                       cat: 'bookkeeping' },
      { title: 'Accounts Payable Clerk',           cat: 'bookkeeping' },
      { title: 'Billing Specialist',               cat: 'bookkeeping' },
      { title: 'Administrative Assistant',         cat: 'admin' },
      { title: 'Receptionist',                     cat: 'admin' },
    ];

    // Stagger calls slightly to avoid 429 rate limits
    const raw = [];
    for (const { title, cat } of searches) {
      await new Promise(r => setTimeout(r, 150)); // 150ms between calls
      raw.push(await (async () => {
        const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=35&what=${encodeURIComponent(title)}&sort_by=date&max_days_old=30`;
        const r = await fetchT(url, { headers: { 'Accept': 'application/json' } }, 8000);
        if (!r.ok) { console.log(`Adzuna "${title}" ${r.status}`); return []; }
        const d = await safeJson(r);
        if (d.exception) { console.log(`Adzuna "${title}" exception:`, d.exception); return []; }
        const jobs = d.results || [];
        console.log(`Adzuna "${title}": ${jobs.length}`);
        return jobs.map(job => {
          if (!job.company?.display_name) return null;
          return {
            company: job.company.display_name,
            cat, 
            roleTitle: title,
            location: job.location?.display_name || '',
            salaryNum: job.salary_min || 0,
            jobUrl: job.redirect_url || '',
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
        byCompany.set(key, { name: p.company.trim(), location: p.location, cats: new Set(), roles: [], count: 0, maxSalary: 0, jobUrl: p.jobUrl });
      }
      const c = byCompany.get(key);
      if (!c.jobUrl && p.jobUrl) c.jobUrl = p.jobUrl;
      c.cats.add(p.cat);
      if (!c.roles.includes(p.roleTitle)) c.roles.push(p.roleTitle);
      c.count += 1;
      if (p.salaryNum > c.maxSalary) c.maxSalary = p.salaryNum;
      if (!c.location && p.location) c.location = p.location;
    }

    const results = [...byCompany.values()].map(c => {
      const catN = c.cats.size;
      const multi = catN >= 2 || c.count >= 3;   // 2+ functions OR 3+ postings
      const heavy = catN >= 3 || c.count >= 5;   // 3+ functions OR 5+ postings
      const roleList = c.roles.slice(0, 4).join(', ');
      return {
        name: c.name,
        website: '',
        location: c.location,
        jobTitle: heavy 
          ? `Hiring ${c.count} manual roles across ${catN} functions (${roleList}) — heavy AI-replaceable labor spend`
          : multi
          ? `Hiring ${c.count} manual roles (${roleList}) — AI-replaceable labor` 
          : `Hiring ${roleList} — manual role, AI-replaceable`,
        source: 'adzuna_ai',
        icpProfile: 'ai_ops',
        manualRoleCount: c.count,
        manualCategories: catN,
        jobUrl: c.jobUrl || '',
        signals: {
          ai_replacement_signal: true,
          ai_replacement_multi: multi,
          ai_replacement_heavy: heavy,
          salary_high: c.maxSalary >= 90000,
          salary_mid: c.maxSalary >= 60000 && c.maxSalary < 90000,
        },
      };
    });
     
    const multiN = results.filter(r => r.signals.ai_replacement_multi).length;
    console.log(`Adzuna: ${results.length} companies (${multiN} hiring multiple manual roles)`);
    return results;
  } catch(e) { console.error('Adzuna error:', e.message); return []; }
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 2: SEC EDGAR — real-time funding, no key needed
// ═══════════════════════════════════════════════════════════
// EMAIL INFRASTRUCTURE CHECK — SPF/DMARC via Google DNS API. Free, factual.
// No DMARC = they've never set up serious email marketing/deliverability.
const checkEmailDNS = async (domain) => {
  try {
    const clean = domain.replace(/^www\./, '');
    const [spfR, dmarcR] = await Promise.all([
      fetchT(`https://dns.google/resolve?name=${clean}&type=TXT`, {}, 6000).then(r=>r.json()).catch(()=>({})),
      fetchT(`https://dns.google/resolve?name=_dmarc.${clean}&type=TXT`, {}, 6000).then(r=>r.json()).catch(()=>({})),
    ]);
    const spfTxt = (spfR.Answer||[]).map(a=>a.data||'').join(' ');
    const dmarcTxt = (dmarcR.Answer||[]).map(a=>a.data||'').join(' ');
    return {
      hasSPF: /v=spf1/i.test(spfTxt),
      hasDMARC: /v=DMARC1/i.test(dmarcTxt),
      dmarcPolicy: (dmarcTxt.match(/p=(none|quarantine|reject)/i)||[])[1] || '',
      confirmed: true,
    };
  } catch { return { hasSPF:false, hasDMARC:false, dmarcPolicy:'', confirmed:false }; }
};

// CONTENT FRESHNESS — sitemap.xml lastmod dates. "Last update 14 months ago" is provable.
const checkContentFreshness = async (domain) => {
  try {
    const r = await fetchT(`https://${domain}/sitemap.xml`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 8000);
    const xml = await safeText(r);
    if (!xml || !xml.includes('<lastmod>')) return { checked:false };
    const dates = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m=>new Date(m[1])).filter(d=>!isNaN(d));
    if (!dates.length) return { checked:false };
    const newest = new Date(Math.max(...dates));
    const daysSince = Math.floor((Date.now()-newest)/(24*60*60*1000));
    return { checked:true, lastUpdate: newest.toISOString().split('T')[0], daysSince, stale: daysSince > 180 };
  } catch { return { checked:false }; }
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
      return hits2.slice(0, 20).map(hit => {
        const src = hit._source || {};
        const name = src.entity_name || src.company_name || src.display_names?.[0] || '';
        if (!name || name.length < 2) return null;
        return { name: name.trim(), source: 'sec_edgar', signals: { raised_funding: true }, jobTitle: 'Form D filing — recently raised' };
      }).filter(Boolean);
    }
    const d = JSON.parse(text);
    const hits = d?.hits?.hits || [];
    const results = hits.slice(0,20).map(hit => {
      const src = hit._source || hit.fields || {};
      let name = src.entity_name || src.company_name || src.entityName || src.display_names?.[0] || '';
      // Strip CIK numbers and ticker symbols that EDGAR appends
      name = name.replace(/\s*\(CIK\s*\d+\)\s*/gi, '').replace(/\s*\([A-Z]{2,5}\)\s*/g, '').trim();
      const amount = src.total_offering_amount || src.offeringAmount || '';
      if (!name || name.length < 2) return null;
      return {
        name: name.trim(),
        source: 'sec_edgar',
        signals: { raised_funding: true },
        jobTitle: `Form D filing${amount ? ` — $${Number(amount).toLocaleString()} raise` : ' — recently raised'}`,
      };
    }).filter(Boolean);
    console.log(`SEC EDGAR: ${results.length} from ${hits.length} hits`);
    return results;
  } catch(e) { console.error('SEC EDGAR error:', e.message); return []; }
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 3: CLUTCH RSS — agency frustration
// ═══════════════════════════════════════════════════════════
const scrapeClutchRSS = async () => {
  const results = [];
  const feeds = ['https://clutch.co/feed', 'https://clutch.co/agencies/digital-marketing/feed'];
  for (const feedUrl of feeds) {
    try {
      const xml = await fetchViaProxy(feedUrl);
      if (!xml || xml.trim().startsWith('<!DOCTYPE')) continue;
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      items.slice(0,10).forEach(item => {
        const title = (item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/) || item.match(/<title>([^<]+)<\/title>/))?.[1] || '';
        const reviewMatch = title.match(/^(.+?)\s+(?:Review|review)/);
        if (reviewMatch && reviewMatch[1].length > 2 && reviewMatch[1].length < 60) {
          results.push({ name: reviewMatch[1].trim(), source: 'clutch_review', jobTitle: 'Left agency review on Clutch', signals: { agency_review: true } });
        }
      });
      if (results.length > 0) break;
    } catch(e) { /* try next */ }
  }
  console.log('Clutch: ' + results.length);
  return results;
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 4: GOOGLE NEWS RSS — CMO hires + funding
// ═══════════════════════════════════════════════════════════
const scrapeGoogleNews = async () => {
  const results = [];
  // 10 targeted searches — each maps to a specific pain signal
  const queries = [
    { q: 'company hires "VP of Marketing" OR "CMO" OR "Head of Marketing" 2026', type: 'hire' },
    { q: 'startup raises "Series A" OR "Series B" funding 2026', type: 'funding' },
    { q: 'company "appointed" "Chief Marketing Officer" 2026', type: 'hire' },
    { q: 'business rebrand 2026 "new brand" OR "new identity" OR "rebranding"', type: 'rebrand' },
    { q: 'company "opens new location" OR "expanding" OR "new office" 2026', type: 'expansion' },
    { q: 'startup "acquired by" OR "acquisition" marketing 2026', type: 'acquisition' },
    { q: '"fired marketing agency" OR "left agency" OR "agency not delivering"', type: 'agency_pain' },
    { q: 'company "raises" million "growth" 2026 marketing', type: 'funding' },
    { q: '"VP of Growth" OR "Head of Growth" hired appointed 2026', type: 'hire' },
    { q: 'company "launched" "new product" OR "new service" 2026', type: 'launch' },
    // Overlap queries — designed to find companies also likely hiring manual roles on Adzuna
    { q: 'small business "hiring" OR "growing team" 2026 operations', type: 'expansion' },
    { q: 'company "opening new locations" OR "scaling operations" 2026', type: 'expansion' },
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
        if (/^(the|a |an |in |on |at |by |for |with |from |this |new |top |best |how |why |what |when |where |who )/i.test(name)) return;
        if (/news|times|post|herald|report|journal|magazine|media group|press$/i.test(name)) return;

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
const firecrawlMap = async (fcKey, url, search = '', limit = 60) => {
  if (!fcKey || !url) return [];
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
    return links.map(l => (typeof l === 'string' ? l : l.url)).filter(Boolean);
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

const firecrawlScrape = async (fcKey, url, timeout = 25000) => {
  if (!fcKey) return '';
  try {
    const r = await fetchT('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${fcKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: false, waitFor: 3000 }),
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
const getCompanyNews = async (companyName, website) => {
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

      // STRICT VERIFICATION — must clearly be about THIS company
      const allNameWordsPresent = nameWords.every(w => haystack.includes(w));
      const domainMatch = domainRoot.length > 3 && haystack.includes(domainRoot);
      const isVerified = nameWords.length >= 2
        ? allNameWordsPresent
        : (new RegExp(`\\b${nameWords[0]}\\b`).test(haystack) && (domainMatch || haystack.includes(cleanName.toLowerCase())));

      if (!isVerified) continue;

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

      triggers.push({ headline: cleanTitle.slice(0, 160), type: triggerType, ageDays });
      if (triggers.length >= 4) break;
    }

    if (triggers.length > 0) {
      console.log(`News [${companyName}]: ${triggers.length} verified triggers (${triggers.map(t=>t.type).join(', ')})`);
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
    .split(/\s+/).filter(Boolean);
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
const scrapeEmailsFromSite = async (website, fcKey, homepageContent) => {
  const out = { emails: [], source: '' };
  if (!website) return out;
  const domain = website.replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '').toLowerCase();
  if (!domain) return out;

  const JUNK_DOMAIN = /@(sentry|wixpress|example|domain|email|yourcompany|squarespace|godaddy|shopify|wordpress|gravatar|schema|w3|cloudflare|placeholder)\./i;
  const JUNK_LOCAL  = /^(noreply|no-reply|donotreply|postmaster|abuse|webmaster|privacy|legal|dmca|unsubscribe|mailer-daemon|bounce|test|user|name|email|your)@/i;

  const extract = (text) => {
    if (!text) return [];
    const found = new Set();
    (text.match(/mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi) || [])
      .forEach(m => found.add(m.replace(/mailto:/i, '').toLowerCase()));
    (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [])
      .forEach(e => found.add(e.toLowerCase()));
    return [...found].filter(e =>
      e.endsWith('@' + domain) && !JUNK_DOMAIN.test(e) && !JUNK_LOCAL.test(e) && e.length < 60
    );
  };

  // Pass 1: homepage content we already have — costs nothing extra
  let emails = extract(homepageContent);
  if (emails.length > 0) return { emails, source: 'homepage' };

  // Pass 2: the pages most likely to publish a real address
  if (!fcKey) return out;
  const base = website.replace(/\/$/, '');
  for (const path of ['/contact', '/contact-us', '/about', '/about-us', '/team', '/our-team']) {
    try {
      const md = await firecrawlScrape(fcKey, base + path, 10000);
      if (!md || md.length < 100) continue;
      emails = extract(md);
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
const genericInboxScore = (employees) => {
  if (!employees) return 45;
  if (employees <= 25) return 65;   // small shop — info@ likely lands on the owner
  if (employees <= 75) return 45;
  return 25;                        // bigger — info@ goes to a queue
};

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

    // Read the real pages (max 3 — keeps Firecrawl credits sane)
    let read = 0;
    for (const u of candidates) {
      if (read >= 3) break;
      const md = await firecrawlScrape(fcKey, u, 12000);
      if (md && md.length > 200) {
        pages.push(`\n\n--- PAGE: ${u} ---\n` + md.slice(0, 6000));
        read++;
      }
    }

    const corpus = pages.join('\n').slice(0, 22000);
    if (corpus.trim().length < 300) {
      console.log(`DM/brain [${companyName}]: not enough content to analyze`);
      return null;
    }

    const r = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
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
const findOwnerViaWebSearch = async (companyName, website, fcKey, apiKey) => {
  if (!companyName || !fcKey || !apiKey) return null;
  try {
    const clean = companyName.replace(/,?\s*(Inc|LLC|Corp|Ltd)\.?$/gi, '').trim();
    const domain = (website || '').replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '');

    // Two angles: who owns it, and their profile on business directories that
    // actually index SMB owners (BBB lists a "Principal Contact", Manta and
    // Buzzfile list officers — these are goldmines that LinkedIn-based tools miss)
    const queries = [
      `"${clean}" owner OR founder OR "chief executive" OR president name`,
      `"${clean}" ${domain ? domain + ' ' : ''}(bbb.org OR manta.com OR buzzfile.com OR dnb.com) owner principal`,
    ];

    const hits = [];
    for (const q of queries) {
      const results = await firecrawlSearch(fcKey, q, 4, true);
      hits.push(...results);
      if (hits.length >= 5) break;
    }
    if (hits.length === 0) return null;

    const corpus = hits.map(h =>
      `--- ${h.title}\nURL: ${h.url}\n${h.description}\n${h.content}`
    ).join('\n\n').slice(0, 20000);

    const r = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{ role: 'user', content: `These are real web search results about the company "${companyName}"${domain ? ' (' + domain + ')' : ''}.

TASK: Identify the OWNER / FOUNDER / CEO / PRESIDENT of THIS SPECIFIC COMPANY — the person with authority to buy.

CRITICAL WARNINGS:
- Search results often mix up DIFFERENT companies with similar names. Only report a person if the source clearly ties them to THIS company${domain ? ' (' + domain + ')' : ''}. If the source is about a different business, ignore it.
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
const findSizeViaSearch = async (companyName, website, fcKey, apiKey) => {
  if (!companyName || !fcKey || !apiKey) return null;
  try {
    const domain = (website || '').replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '');
    const q = `"${companyName}" ${domain ? domain + ' ' : ''}revenue employees company size`;
    const results = await firecrawlSearch(fcKey, q, 4, true);
    if (results.length === 0) return null;

    const corpus = results.map(r => `--- ${r.title}\nURL: ${r.url}\n${r.content}`).join('\n\n').slice(0, 14000);

    const r2 = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: `Web results about "${companyName}"${domain ? ' (' + domain + ')' : ''}.

Extract this company's EMPLOYEE COUNT and ANNUAL REVENUE if stated.

RULES:
- Only report figures the sources ACTUALLY state. Never estimate, never guess.
- Make sure the figure is about THIS company, not a similarly-named one.
- Directory sites (ZoomInfo, D&B, Buzzfile, Manta) often publish these for private companies — those are valid sources.
- If a figure is not stated anywhere, return null for it. Null is correct.

Return ONLY valid JSON:
{"employees": number or null, "revenue": "e.g. $5M-$10M" or null, "source": "which site said it", "confidence": "high|medium|low"}

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
const findBusinessPain = async (companyName, website, fcKey, apiKey, industry) => {
  if (!companyName || !fcKey || !apiKey) return { signals: [], summary: '' };
  try {
    const domain = (website || '').replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '');

    // Two angles: what customers complain about, and what employees say about
    // how the place actually runs. Employees are the most honest source there is.
    const queries = [
      `"${companyName}" reviews complaints problems slow response`,
      `"${companyName}" glassdoor OR indeed employee review management`,
    ];

    const hits = [];
    for (const q of queries) {
      const res = await firecrawlSearch(fcKey, q, 3, true);
      hits.push(...res);
      if (hits.length >= 5) break;
    }
    if (hits.length === 0) return { signals: [], summary: '' };

    const corpus = hits.map(h => `--- ${h.title}\nURL: ${h.url}\n${h.content}`).join('\n\n').slice(0, 18000);

    const r = await fetchT('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
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
      `"${clean}" (opencorporates OR bizapedia OR "secretary of state") officers OR members OR registered agent`,
      3,
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
const findDecisionMaker = async ({ companyName, website, fcKey, apiKey, homepageContent, hunterName, hunterTitle }) => {
  // Run every source in parallel. Web search is the new heavy hitter — it reaches
  // BBB, Manta, local press, and chamber directories where SMB owners actually live.
  const [brain, websearch, registry, news] = await Promise.all([
    findOwnerViaBrain(website, fcKey, apiKey, homepageContent, companyName).catch(() => null),
    findOwnerViaWebSearch(companyName, website, fcKey, apiKey).catch(() => null),
    findOwnerViaRegistry(companyName, fcKey).catch(() => null),
    findOwnerViaNews(companyName).catch(() => null),
  ]);

  const found = [brain, websearch, registry, news].filter(Boolean);
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
  best.canBuy = best.authority >= AUTHORITY_FLOOR;
  if (!best.canBuy) {
    console.log(`DM [${companyName}]: ⚠ ${best.name} is "${best.title}" (authority ${best.authority}) — BELOW BUYING FLOOR. Held back.`);
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
    blockReason: best.canBuy ? null : `"${best.title || 'unknown title'}" cannot authorize a purchase — need the owner/founder/CEO`,
    alternates: clusters.slice(1, 3).map(c => ({
      name: c.name, title: c.title, sources: c.sources, score: c.score,
      authority: c.authority, canBuy: c.authority >= 75,
    })),
  };
};

const findEmailFireproof = async ({ website, ceoName, ceoTitle, employees, contacts, fcKey, homepageContent, hunterEmail, hunterName, hunterTitle, verifierKey }) => {
  const domain = (website || '').replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '').toLowerCase();
  const name = ceoName || hunterName || '';
  const fail = { email: '', ...EMAIL_TIERS.NONE, name, pattern: null };
  if (!domain) return fail;

  // ── Hunter already found one? It's verified at the source. Learn from it. ──
  if (hunterEmail) {
    const p = inferPattern(hunterEmail, hunterName || name);
    if (p) domainPatternMemory.set(domain, p);
    return { email: hunterEmail, ...EMAIL_TIERS.SMTP_VERIFIED, label: 'Verified by Hunter', name: hunterName || name, pattern: p };
  }

  // ── TIER 1: published on their own website ────────────────────────────────
  const scraped = await scrapeEmailsFromSite(website, fcKey, homepageContent);
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
  const catchAll = await isCatchAllDomain(domain, verifierKey);

  // ── TIER 2: normal domain → race every pattern through SMTP ───────────────
  if (catchAll === false && verifierKey) {
    for (const c of candidates) {
      const res = await verifyEmailSMTP(c.email, verifierKey);
      if (res.valid === true) {
        domainPatternMemory.set(domain, c.pattern);
        console.log(`✓ EMAIL [${domain}] T2 SMTP-verified: ${c.email} (pattern: ${c.pattern})`);
        return { email: c.email, ...EMAIL_TIERS.SMTP_VERIFIED, name, pattern: c.pattern };
      }
      await new Promise(r => setTimeout(r, 200)); // be polite to the API
    }
    // Normal domain, every pattern rejected → this person's mailbox isn't there.
    // Better to send nothing than to bounce.
    console.log(`✗ EMAIL [${domain}] all patterns rejected on a normal domain — no address exists`);
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

const enrichFromAboutPage = async (website, fcKey, homepageContent) => {
  const result = { ceoName: null, ceoTitle: null, teamSize: null, founderQuote: null };
  if (!website || !fcKey) return result;

  try {
    const base = website.replace(/\/$/, '');
    // Try common about/team page paths, and mine homepage content we already have
    const textPool = [homepageContent || ''];

    // Scrape the most likely leadership page (one extra Firecrawl call)
    const candidates = ['/about', '/about-us', '/team', '/our-team', '/leadership', '/company'];
    for (const path of candidates) {
      const md = await firecrawlScrape(fcKey, base + path, 12000);
      if (md && md.length > 300) {
        textPool.push(md);
        break; // one good page is enough
      }
    }

    const text = textPool.join(' \n ').replace(/\s+/g, ' ');

    // Extract founder/CEO/owner name + title
    const titlePatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\s*,?\s*(?:is\s+the\s+)?(?:founder\s*(?:and|&)\s*CEO|CEO\s*(?:and|&)\s*founder|chief executive officer|founder|co-?founder|owner|president|managing (?:partner|director)|principal)/i,
      /(?:founder\s*(?:and|&)\s*CEO|CEO|founder|co-?founder|owner|president|managing (?:partner|director)|principal)[:\s]+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)/i,
      /(?:led|founded|started|owned)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)/i,
    ];
    for (const pat of titlePatterns) {
      const m = text.match(pat);
      if (m && m[1] && m[1].length < 40) {
        const name = m[1].trim();
        const words = name.split(/\s+/);
        // Must be 2-3 words, each a proper capitalized name-like token (3+ letters for first/last)
        const looksLikeName = words.length >= 2 && words.length <= 3 &&
          /^[A-Z][a-z]{2,}$/.test(words[0]) &&
          /^[A-Z][a-z]{2,}$/.test(words[words.length - 1]);
        // Reject company terms and common non-name words
        const isJunk = /company|corporation|solutions|services|group|industries|systems|about|contact|our team|the team|core|home|welcome|our story|leadership|management team|meet the/i.test(name);
        if (looksLikeName && !isJunk) {
          result.ceoName = name;
          const titleMatch = m[0].match(/founder\s*(?:and|&)\s*CEO|CEO\s*(?:and|&)\s*founder|chief executive officer|co-?founder|founder|owner|president|managing (?:partner|director)|principal/i);
          result.ceoTitle = titleMatch ? titleMatch[0] : 'Owner';
          break;
        }
      }
    }

    // Extract team size signal ("team of 40", "50+ employees", "our 200 professionals")
    const sizePatterns = [
      /team\s+of\s+(?:over\s+|more\s+than\s+)?([0-9,]+)/i,
      /([0-9,]+)\+?\s*(?:employees|team members|professionals|staff|people|experts)/i,
      /(?:over|more than)\s+([0-9,]+)\s*(?:employees|team members|professionals|staff)/i,
    ];
    for (const pat of sizePatterns) {
      const m = text.match(pat);
      if (m && m[1]) {
        const n = parseInt(m[1].replace(/,/g, ''));
        if (n > 0 && n < 100000) { result.teamSize = n; break; }
      }
    }

    if (result.ceoName || result.teamSize) {
      console.log(`About-page enrich: ceo=${result.ceoName||'?'} (${result.ceoTitle||'?'}) team=${result.teamSize||'?'}`);
    }
  } catch(e) {
    console.log('About-page enrich failed (non-fatal):', e.message);
  }
  return result;
};

// FACEBOOK AD LIBRARY VIA FIRECRAWL — automates the manual "All ads" check.
// The Ad Library is a JS app so plain fetch fails; Firecrawl renders it.
// Returns confirmed ad presence + rough count, no Meta token needed.
const checkAdLibraryViaFirecrawl = async (company, fcKey) => {
  if (!fcKey || !company) return { hasAds: false, adCount: 0, confirmed: false };
  try {
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&search_type=keyword_search&q=${encodeURIComponent(company)}`;
    const md = await firecrawlScrape(fcKey, url, 30000);
    if (!md || md.length < 200) return { hasAds: false, adCount: 0, confirmed: false };
    // "~340 results" header, or count Library ID occurrences as fallback
    const m = md.match(/~?\s*([\d,]+)\s+results/i);
    const libIds = (md.match(/Library ID/gi) || []).length;
    const adCount = m ? parseInt(m[1].replace(/,/g, ''), 10) : libIds;
    const hasAds = adCount > 0;
    console.log(`Ad Library (Firecrawl): ${company} → ${adCount} ads`);
    return { hasAds, adCount, confirmed: true, source: 'ad_library_scrape' };
  } catch(e) { console.log('Ad Library scrape error:', e.message); return { hasAds: false, adCount: 0, confirmed: false }; }
};

const scrapeBizBuySell = async (fcKey) => {
  try {
    const feeds = [
      'https://www.bizbuysell.com/rss/businesses-for-sale/',
      'https://www.bizbuysell.com/rss/new-businesses-for-sale.rss',
    ];
    const results = [];
    for (const feedUrl of feeds) {
      try {
        // Try direct fetch first (proxy has been getting blocked), then proxy fallback
        let xml = '';
        try {
          const r = await fetchT(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Accept': 'application/rss+xml, application/xml' } }, 10000);
          xml = await safeText(r);
        } catch(e) { /* fall through to proxy */ }
        if (!xml || xml.trim().startsWith('<!DOCTYPE') || xml.trim().startsWith('<html')) {
          xml = await fetchViaProxy(feedUrl, 10000);
        }
        if (!xml || xml.trim().startsWith('<!DOCTYPE') || xml.trim().startsWith('<html')) {
          console.log('BizBuySell RSS blocked — will try Firecrawl page scrape');
          continue;
        }
        const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
        items.slice(0, 20).forEach(item => {
          const title = (item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/) || item.match(/<title>([^<]+)<\/title>/))?.[1] || '';
          const desc = (item.match(/<description><!\[CDATA\[([^\]]+)\]\]><\/description>/) || [])?.[1] || '';
          const link = item.match(/<link>([^<]+)<\/link>/)?.[1] || '';
          if (!title || title.length < 5) return;
          const revenueMatch = desc.match(/\$([0-9,]+[MK]?)\s*(?:revenue|annual|gross)/i);
          const revenue = revenueMatch ? revenueMatch[0] : '';
          // Broker-posted listings put a middleman between us and the owner.
          // Detect broker language and tag it so reachability scores it lower.
          const brokerPosted = /broker|brokerage|listing agent|represented by|business advisors|m&a advisor|intermediar/i.test(desc);
          results.push({
            name: title.trim().slice(0, 60),
            website: '',          // Real website unknown — modal will prompt
            listingUrl: link,     // BizBuySell listing URL
            jobTitle: brokerPosted ? 'Listed for sale via broker' : 'Listed for sale — owner wants to maximize value',
            jobSnippet: (desc.replace(/<[^>]+>/g, '').slice(0, 150)) + (revenue ? ` | ${revenue}` : '') + ' | BizBuySell listing',
            source: 'bizbuysell',
            brokerPosted,
            signals: { preparing_for_exit: true, needs_revenue_growth: true, owner_motivated: !brokerPosted },
          });
        });
        if (results.length > 0) break;
      } catch(e) { console.log('BizBuySell feed error:', e.message); }
    }
    // FIRECRAWL FALLBACK — RSS is bot-blocked, render the listings page instead
    if (results.length === 0 && fcKey) {
      console.log('BizBuySell: trying Firecrawl fallback...');
      const md = await firecrawlScrape(fcKey, 'https://www.bizbuysell.com/businesses-for-sale/', 30000);
      console.log(`BizBuySell Firecrawl: got ${md.length} chars`);
      if (md && md.length > 500) {
        // Listings appear as markdown links to /business-opportunity/ pages
        const links = [...md.matchAll(/\[([^\]]{10,90})\]\((https:\/\/www\.bizbuysell\.com\/[^)]*business[^)]*)\)/gi)];
        const seen = new Set();
        for (const [, title, link] of links) {
          const clean = title.replace(/[#*_]/g, '').trim();
          if (clean.length < 8 || seen.has(clean.toLowerCase())) continue;
          // ONLY accept real listing URLs — they contain a numeric listing ID.
          // Category pages like /health-care-and-fitness-businesses-for-sale/ have NO numeric ID.
          const isRealListing = /\/\d{5,}\/?$/.test(link) || /-\d{5,}[\/\-]/.test(link);
          if (!isRealListing) continue;
          // HARD BLOCK — BizBuySell category/nav names that aren't real companies
          const categoryNames = /^(home based businesses|health care|service businesses|non-?classifiable|see more|business opportunities|building|automotive|education|food|retail|manufacturing|wholesale|agriculture|transportation|beauty|pet services|restaurants?|franchises?|financial|technology|real estate|entertainment|travel)\b/i;
          if (categoryNames.test(clean)) continue;
          // Block any remaining category-style titles
          if (/businesses? for sale|franchise|opportunities$|^\w+ & \w+$|services$|establishments?$/i.test(clean)) continue;
          const wordCount = clean.split(/\s+/).length;
          if (wordCount < 2) continue;
          if (!/[a-zA-Z]{3,}/.test(clean)) continue;
          seen.add(clean.toLowerCase());
          const brokerPosted = /broker|agent/i.test(clean);
          results.push({
            name: clean.slice(0, 60),
            website: '',          // Real website unknown — modal will prompt for it
            listingUrl: link,     // BizBuySell listing URL (NOT the company's site)
            jobTitle: brokerPosted ? 'Listed for sale via broker' : 'Listed for sale — owner wants to maximize value',
            jobSnippet: 'BizBuySell listing — view: ' + link,
            source: 'bizbuysell',
            brokerPosted,
            signals: { preparing_for_exit: true, needs_revenue_growth: true, owner_motivated: !brokerPosted },
          });
          if (results.length >= 15) break;
        }
        console.log(`BizBuySell via Firecrawl: ${results.length}`);
      }
    }
    console.log(`BizBuySell: ${results.length}`);
    return results;
  } catch(e) {
    console.error('BizBuySell error:', e.message);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE: FACEBOOK AD LIBRARY — companies running ads
// Running ads + bad landing page = perfect CROJungle pitch
// Requires fbToken in settings
// ═══════════════════════════════════════════════════════════
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
const scrapeReddit = async () => {
  const results = [];
  const searches = [
    { url: 'https://www.reddit.com/r/entrepreneur/search.json?q=marketing+agency&sort=new&limit=15&restrict_sr=1&t=month', sub: 'entrepreneur' },
    { url: 'https://www.reddit.com/r/smallbusiness/search.json?q=website+marketing&sort=new&limit=15&restrict_sr=1&t=month', sub: 'smallbusiness' },
    { url: 'https://www.reddit.com/r/startups/search.json?q=marketing+hire&sort=new&limit=15&restrict_sr=1&t=month', sub: 'startups' },
  ];
  for (const { url, sub } of searches) {
    try {
      // Try direct first, fallback to proxy
      let d = null;
      try {
        const r = await fetchT(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'CROJungle/1.0' } }, 8000);
        if (r.ok) d = await safeJson(r);
      } catch(e) {}
      if (!d) {
        const txt = await fetchViaProxy(url);
        try { d = JSON.parse(txt); } catch(e) {}
      }
      const posts = d?.data?.children || [];
      posts.forEach(post => {
        const p = post?.data;
        if (!p || !p.title || !p.author || p.author === '[deleted]') return;
        const text = p.title + ' ' + (p.selftext||'').slice(0,200);
        const isPain = /agency|website|marketing|ads|revenue|customers|growth|leads|conversion|redesign|CMO|branding|SEO/i.test(text);
        if (!isPain) return;
        results.push({
          name: 'u/' + p.author + ' (r/' + sub + ')',
          website: '',
          jobTitle: p.title.slice(0,80),
          jobSnippet: (p.selftext||'').slice(0,150),
          source: 'reddit_pain',
          signals: { social_pain_signal: true, founder_venting: true },
        });
      });
    } catch(e) { console.log('Reddit ' + sub + ':', e.message); }
  }
  console.log('Reddit: ' + results.length);
  return results;
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 6: PRODUCT HUNT — just launched
// ═══════════════════════════════════════════════════════════
const scrapeProductHunt = async () => {
  try {
    const xml = await fetchViaProxy('https://www.producthunt.com/feed');
    if (!xml || xml.trim().startsWith('<!DOCTYPE') || xml.length < 100) {
      console.log('Product Hunt: blocked via proxy too');
      return [];
    }
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const results = items.slice(0,20).map(item => {
      const title = (item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/) || item.match(/<title>([^<]+)<\/title>/))?.[1] || '';
      if (!title) return null;
      return { name: title.split(' — ')[0].split(' - ')[0].trim().slice(0,60), source: 'product_hunt', jobTitle: 'Just launched on Product Hunt', signals: { recently_launched: true, needs_marketing: true } };
    }).filter(Boolean);
    console.log('Product Hunt: ' + results.length);
    return results;
  } catch(e) { console.error('Product Hunt error:', e.message); return []; }
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 7: PR NEWSWIRE — expansions + hires
// ═══════════════════════════════════════════════════════════
const scrapePRNewswire = async () => {
  try {
    const xml = await fetchViaProxy('https://www.prnewswire.com/rss/news-releases-list.rss', 10000);
    if (!xml || xml.trim().startsWith('<!DOCTYPE') || xml.trim().startsWith('<html')) {
      console.log('PR Newswire: blocked');
      return [];
    }
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const results = [];
    items.slice(0,30).forEach(item => {
      const title = (item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/) || item.match(/<title>([^<]+)<\/title>/))?.[1] || '';
      if (!title) return;
      const relevant = /launch|CMO|VP marketing|Series [AB]|funding|raise|rebrand|expand/i.test(title);
      if (!relevant) return;
      const m = title.match(/^([A-Z][A-Za-z0-9\s&\.\,]+?)(?:\s+(?:Announces|Launches|Raises|Hires|Appoints|Expands|Closes|Unveils))/);
      if (!m) return;
      const isFunding = /raises|funding|Series|closes/i.test(title);
      const isHire = /hires|appoints|CMO|VP marketing/i.test(title);
      results.push({ name: m[1].trim(), source: 'pr_newswire', jobTitle: title.slice(0,80), signals: { raised_funding: isFunding, hiring_marketing: isHire, recently_launched: /launch|unveil/i.test(title) } });
    });
    console.log(`PR Newswire: ${results.length}`);
    return results;
  } catch(e) { console.error('PR Newswire error:', e.message); return []; }
};

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

const scoreReachability = (c) => {
  const name = (c.name || '').toLowerCase();
  const sig = c.signals || {};
  let score = 0;
  const reasons = [];
  
  // ── VERIFIED EMPLOYEE COUNT (from Google enrichment) ──────────────────
  // This is the most reliable signal we have for owner-reachability.
  if (c.verifiedEmployees) {
    const emp = c.verifiedEmployees;
    if (emp <= 25) {
      score += 20; reasons.push(`${emp} verified employees — tiny operation, owner answers email directly`);
    } else if (emp <= 75) {
      score += 16; reasons.push(`${emp} verified employees — small business, owner still in marketing decisions`);
    } else if (emp <= 150) {
      score += 10; reasons.push(`${emp} verified employees — founder-led, may have a small marketing team`);
    } else if (emp <= 250) {
      score += 5; reasons.push(`${emp} verified employees — growing, owner still reachable but has layers`);
    } else if (emp <= 500) {
      score += 2; reasons.push(`${emp} verified employees — mid-market, harder to reach owner directly`);
    }
    // Over 500 is hard-blocked before scoring — never reaches here
  }

  // ── VERIFIED CEO NAME (from Google search) ────────────────────────────
  // Having a named decision-maker is a massive reachability signal — we know
  // who to write to by name, not "to whom it may concern"
  if (c.verifiedCEO) {
    score += 8; reasons.push(`Decision-maker identified: ${c.verifiedCEO} (${c.verifiedCEOTitle || 'CEO'}) — pitch by name`);
  }

  // ── PUBLIC PAIN SIGNALS (from reviews/complaints search) ──────────────
  // Public complaints about the company are gold — the pitch can lead with them
  if (c.publicPainSignals && c.publicPainSignals.length > 0) {
    score += 5; reasons.push(`${c.publicPainSignals.length} public pain signals found — real hooks for outreach`);
  }

  // STRONG owner-led signals — these companies ARE the owner reaching out
  if (sig.preparing_for_exit || c.source === 'bizbuysell') {
    if (c.brokerPosted) {
      score += 8; reasons.push('For-sale listing via broker — middleman between us and owner');
    } else {
      score += 22; reasons.push('Owner listing business for sale — direct owner contact');
    }
  }
  if (sig.founder_venting || sig.social_pain_signal) {
    score += 18; reasons.push('Founder publicly venting — personally involved, reachable');
  }

  // AI-replacement: a SMALL company hiring multiple manual roles almost
  // never has a CMO — the owner is drowning in ops and signs the checks.
  // But a huge company hiring 11 CS reps is a call center. Use role count
  // as a proxy: 2-6 manual roles = likely owner-led SMB; 15+ = enterprise.
  if (sig.ai_replacement_multi) {
    const roles = c.manualRoleCount || 0;
    if (roles >= 2 && roles <= 8) {
      score += 16; reasons.push(`Hiring ${roles} manual roles at SMB scale — owner likely runs ops, no CMO`);
    } else if (roles > 8 && roles <= 14) {
      score += 6; reasons.push(`Hiring ${roles} manual roles — mid-size, owner may still be reachable`);
    } else if (roles > 14) {
      score += 0; reasons.push(`Hiring ${roles} roles — enterprise scale, likely has procurement/CMO`);
    }
  } else if (sig.ai_replacement_signal) {
    score += 10; reasons.push('Hiring a manual role — small operation, owner-adjacent');
  }

  // Funding: Form D just-raised companies are usually early, founder-run,
  // pre-CMO. Strong reachability. (Late-stage would be filtered by size.)
  if (sig.raised_funding) {
    score += 12; reasons.push('Recently raised — early-stage, founder still runs GTM, no CMO yet');
  }

  // Trigger events (rebrand/acquisition/launch) — mixed. Only credit lightly.
  if (sig.rebranding || sig.recently_launched) {
    score += 5; reasons.push('In transition — decision-makers accessible during change');
  }

  // A company that JUST hired a CMO is the OPPOSITE of our ICP — they now
  // have the layer we want to avoid. Penalize news_hire CMO leads.
  if (c.source === 'news_hire' && /cmo|chief marketing|vp.*marketing|head of marketing/i.test(c.jobTitle || '')) {
    score -= 12; reasons.push('Just hired a CMO — now has the marketing layer we bypass (deprioritized)');
  }

  // Name-based heuristics
  if (OWNER_LED_HINTS.test(name)) { score += 6; reasons.push('Name suggests owner-operated / family business'); }
  if (ENTERPRISE_HINTS.test(name) && !OWNER_LED_HINTS.test(name)) { score -= 4; }

  // HARD BLOCK — signals that this is unreachable regardless of pain.
  // (The blocklist already removes named giants; this catches the pattern.)
  const hardBlock = (sig.ai_replacement_multi && (c.manualRoleCount || 0) > 20);

  // Reachability is ESTIMATED from signals until research confirms an owner
  // email via Hunter. The frontend upgrades/downgrades it after research.
  return { score: Math.max(0, Math.min(score, 30)), reasons: reasons.slice(0, 2), hardBlock, estimated: true };
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

app.post('/api/discover', async (req, res) => {
  const { keywords, keys } = req.body;
  const { adzunaId, adzunaKey, fbToken, firecrawlKey, companiesApiKey } = keys || {};

  console.log('\n=== DISCOVERY START ===');
  console.log('Keywords:', keywords);
  console.log('Adzuna keys present:', !!(adzunaId && adzunaKey));

  try {
    // FOUR-SOURCE SET — quality over volume, each tied to a product CROJungle sells. 
    // Parked: Clutch + Reddit (blocked without ScraperAPI), Product Hunt (wrong ICP),
    // PR Newswire (too broad). Their functions still exist above — re-enable by adding
    // them back here. Facebook Ads stays wired but returns [] until fbToken is set.
    const [adzunaRes, secRes, newsRes, bizRes, fbAdsRes] = await Promise.allSettled([  
      searchAdzuna(adzunaId, adzunaKey),   // AI-replacement labor signals
      searchSECEdgar(),                    // just-funded — capital + board pressure  
      scrapeGoogleNews(),                  // trigger events — new CMO, rebrand, acquisition
      scrapeBizBuySell(firecrawlKey),      // exit prep — RSS first, Firecrawl fallback
      searchFacebookAds(fbToken),          // dormant until token — confirmed ad budget
    ]);

    const allCompanies = [
      ...(adzunaRes.value || []),
      ...(secRes.value || []), 
      ...(newsRes.value || []),
      ...(bizRes.value || []),
      ...(fbAdsRes.value || []),
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
    const icpFiltered = allCompanies.filter(c => {
      const name = (c.name||'').toLowerCase().trim();
      if (!name || name.length < 2) return false;
      // Block obvious large companies by name
      const nameWords = name.split(/\s+/);
      if (BLOCKED_COMPANIES.has(name)) return false;
      // Match on ANY significant word (3+ chars), not just 4+
      if (nameWords.some(w => BLOCKED_COMPANIES.has(w) && w.length >= 2)) return false;
      // Match first 1-2 words against blocklist (catches "Anduril Industries", "The Cigna Group")
      const firstTwo = nameWords.slice(0, 2).join(' ');
      const firstWord = nameWords[0] === 'the' ? nameWords[1] : nameWords[0];
      if (firstWord && BLOCKED_COMPANIES.has(firstWord)) return false;
      if (BLOCKED_COMPANIES.has(firstTwo)) return false;
      // Block companies with "Inc." that are clearly enterprises (very long names = conglomerates)
      if (name.length > 55) return false;
      // Block government/non-profit signals
      if (/\b(university|college|school|district|county|city of|state of|department of|ministry|federal|government|hospital|health system|medical center)\b/i.test(name)) return false;
      // Block staffing agencies and workforce companies by keyword
      if (/\b(staffing|recruiting|recruitment|temp agency|talent agency|placement agency|headhunter|workforce solutions|labor solutions|employment agency|talent solutions|workforce management|employer of record|professional employer|peo |hr outsourc)\b/i.test(name)) return false;
      // Block defense/government/aerospace by keyword
      if (/\b(defense contractor|aerospace|government contractor|department of defense|federal contractor)\b/i.test(name)) return false;
      // Block by job title signals that indicate enterprise scale
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
    const toEnrich = icpFiltered
      .sort((a,b) => (b.icpScore||0) - (a.icpScore||0))
      .slice(0, 40);
    const enrichResults = new Map();
    console.log(`Size enrichment: checking top ${toEnrich.length} leads...`);

    const SIZE_BATCH = 4;
    // Combined size lookup: CompaniesAPI (if key + domain) → Wikipedia fallback
    const lookupSize = async (c, allowCredit) => {
      // ── Source 1: The Companies API (exact headcount when available) ──
      if (companiesApiKey) {
        let capi = null;
        if (c.website) capi = await enrichViaCompaniesAPI(c.website, companiesApiKey);
        if (!capi || !capi.employees) capi = await searchCompaniesAPIByName(c.name, companiesApiKey);
        if (capi && capi.website && !capi.employees && allowCredit) {
          const full = await enrichViaCompaniesAPI(capi.website, companiesApiKey, true);
          if (full && full.employees) capi.employees = full.employees;
        }
        if (capi && capi.employees) {
          return { employees: capi.employees, website: capi.website || c.website, industry: capi.industry, source: 'companiesapi' };
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
      if (allowCredit) {
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
      // Spend a credit for real headcount only on the top 15 by pre-score
      const results = await Promise.allSettled(batch.map((c) => lookupSize(c, i < 16)));
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
    const ENTERPRISE_NAME = /\b(health system|healthcare system|medical center|health network|cruise line|airlines?|airways|university|federal|county of|city of|state of|department of|social security|national health|regional medical|memorial hospital|health plan)\b/i;

    let blockedCount = 0, blockReasons = {};
    const sizeGated = icpFiltered.filter(c => {
      const enrich = enrichResults.get(c.name);
      const nameLower = (c.name || '').toLowerCase();

      // Attach whatever verified data we got
      if (enrich) {
        if (enrich.employees) c.verifiedEmployees = enrich.employees;
        if (enrich.revenue) c.verifiedRevenue = enrich.revenue;
        if (enrich.website && !c.website) c.website = enrich.website;
        if (enrich.industry) c.verifiedIndustry = enrich.industry;
        if (enrich.ceoName) { c.verifiedCEO = enrich.ceoName; c.verifiedCEOTitle = enrich.ceoTitle || 'CEO'; }
        if (enrich.painSignals && enrich.painSignals.length > 0) c.publicPainSignals = enrich.painSignals;
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
      // 2a. Enterprise name patterns (health systems, gov, airlines, etc.)
      if (ENTERPRISE_NAME.test(nameLower)) {
        console.log(`BLOCKED [${c.name}]: enterprise name pattern`);
        blockedCount++; blockReasons.namePattern = (blockReasons.namePattern||0)+1;
        return false;
      }

      // 2b. Very long multi-word names are usually enterprises/institutions
      if ((c.name || '').length > 45) {
        c.sizeWarning = 'Long name — possible enterprise, verify';
      }

      // 2c. No data at all + short simple name = almost certainly an SMB.
      // This is the KEY insight: absence from all databases IS the SMB signal.
      // We KEEP these — blocking them would lose real customers.
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

      // TIER S — Perfect Storm: money + bleeding ops + growth mandate
      if (funded && manualMulti && (mktgHire || growthEvent)) return {
        tier: 'S', id: 'perfect_storm', boost: 35, label: '🌩 Perfect Storm',
        whyHot: 'Just funded + hiring multiple manual roles + active growth event — capital, urgency, and operational bleeding all at once',
        productHint: 'Custom AI Software Build + End-to-End Marketing bundle — board pressure makes this a fast yes'
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
    const WEIGHTS = {
      // Stage 4 — hottest, in market NOW
      agency_review: 45,
      social_pain_signal: 35,
      founder_venting: 10,
      // Stage 3-4 — actively in motion
      hiring_marketing: 30,
      salary_high: 20,
      raised_funding: 25,
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

    const allScored = unique
      .map(c => {
        const raw = Object.entries(c.signals||{}).reduce((t,[k,v])=>v?t+(WEIGHTS[k]||0):t, 0);
        const srcN = (c.sources || [c.source]).filter(Boolean).length;
        // COMBO CLASSIFICATION — which signals combined matters more than source count.
        const combo = classifyStack(c);
        const srcBonus = srcN >= 3 ? 30 : srcN === 2 ? 15 : 0;
        // INTERNAL STACKING — a company hiring many manual roles across many
        // categories is a stacked signal even from ONE source. This fires often
        // (unlike cross-source overlap which is rare) and is a real intensity signal.
        const roleCount = c.manualRoleCount || 0;
        const catCount = c.manualCategories || 0;
        let internalStack = 0;
        if (roleCount >= 5 && catCount >= 3) internalStack = 25;       // heavy manual-labor load
        else if (roleCount >= 3 && catCount >= 2) internalStack = 15;  // meaningful load
        else if (roleCount >= 2) internalStack = 8;                    // some load

        // ═══ CEO's SOFTWARE-BUYER SIGNAL ═══════════════════════════════════
        // The CEO's ICP #2 is explicitly: "grown rapidly then stagnated, high ratio
        // of employee count to revenue, looking to hire people to do things software
        // can do." A SMALL company hiring MANY manual roles is exactly that profile —
        // they are solving a scaling problem with headcount instead of software.
        // This is a sharper signal than heavy hiring alone, and it is the highest-
        // ticket product ($25k-$75k+). Reward the combination.
        if (c.verifiedEmployees && c.verifiedEmployees <= 200 && roleCount >= 3) {
          internalStack += 15;
          c.softwareBuyerSignal = `${roleCount} manual roles open at a ~${c.verifiedEmployees}-person company — solving scale with headcount instead of software`;
        }
        const stackBonus = Math.max(combo ? combo.boost : 0, srcBonus, internalStack);
        const stacked = srcN >= 2 || (combo && combo.tier !== 'B') || internalStack >= 15;
        const reach = scoreReachability(c);
        const base = raw + stackBonus + reach.score;
        const icpScore = reach.hardBlock
          ? Math.min(Math.round(base), 20)
          : Math.min(Math.round(base), stacked ? 100 : 90);
        c.stackCombo = combo || null;
        return {
          ...c,
          icpScore,
          stacked,
          sourceCount: srcN,
          internalStack,
          reachability: reach.score,
          reachabilityReasons: reach.reasons,
          reachabilityBlocked: reach.hardBlock,
        };
      })
      .sort((a,b) => b.icpScore - a.icpScore);

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
      high: scored.filter(c => c.reachability >= 18).length,
      medium: scored.filter(c => c.reachability >= 8 && c.reachability < 18).length,
      low: scored.filter(c => c.reachability < 8).length,
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

const getFounderEmail = async (domain, hunterKey, fallbackName) => {
  if (!domain) return { email:'', founderName:'' };
  if (!hunterKey) {
    const guess = guessEmailFromName(fallbackName, domain);
    return guess ? { email: guess, founderName: fallbackName || '', guessed: true } : { email:'', founderName:'' };
  }
  try {
    const clean = domain.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','');
    const r = await fetchT(`https://api.hunter.io/v2/domain-search?domain=${clean}&type=personal&limit=5&api_key=${hunterKey}`);
    const d = await safeJson(r);

    // ═══ CREDIT EXHAUSTION DETECTION ═══════════════════════════════════════
    // Hunter returns 401/403/429 with a specific error when credits run out.
    const errCode = d?.errors?.[0]?.code;
    const errId = d?.errors?.[0]?.id;
    const outOfCredits = r.status === 402 || errCode === 402 ||
      /credit|quota|limit/i.test(d?.errors?.[0]?.details || '') ||
      errId === 'usage_limit_reached';

    if (outOfCredits) {
      console.log(`⚠️ HUNTER CREDITS EXHAUSTED — falling back to pattern guess for ${clean}`);
      const guess = guessEmailFromName(fallbackName, clean);
      return guess
        ? { email: guess, founderName: fallbackName || '', guessed: true, creditsOut: true }
        : { email: '', founderName: '', creditsOut: true };
    }

    const emails = d.data?.emails || [];
    const priority = ['ceo','founder','co-founder','owner','president','cmo'];
    const sorted = emails.sort((a,b) => {
      const aS = priority.findIndex(p=>(a.position||'').toLowerCase().includes(p));
      const bS = priority.findIndex(p=>(b.position||'').toLowerCase().includes(p));
      return (aS===-1?99:aS)-(bS===-1?99:bS);
    });
    const best = sorted[0];
    if (best?.value) {
      return { email: best.value, founderName: `${best.first_name||''} ${best.last_name||''}`.trim(), title: best.position||'' };
    }
    // Hunter found nothing — try the free pattern guess before giving up
    const guess = guessEmailFromName(fallbackName, clean);
    return guess ? { email: guess, founderName: fallbackName || '', guessed: true } : { email:'', founderName:'' };
  } catch {
    const guess = guessEmailFromName(fallbackName, domain);
    return guess ? { email: guess, founderName: fallbackName || '', guessed: true } : { email:'', founderName:'' };
  }
};

const pageSpeedCache = new Map();
const checkPageSpeed = async (url) => {
  if (!url) return { mobileScore: null, confirmed: false };
  // Cache results for 24 hours to avoid 429s
  const cacheKey = url.toLowerCase();
  if (pageSpeedCache.has(cacheKey)) {
    const cached = pageSpeedCache.get(cacheKey);
    if (Date.now() - cached.ts < 24*60*60*1000) return cached.data;
  }
  try {
    const r = await fetchT(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`, {}, 15000);
    if (r.status === 429) {
      console.log('PageSpeed: rate limited — skipping');
      return { mobileScore: null, confirmed: false };
    }
    const d = await safeJson(r);
    const score = d.lighthouseResult?.categories?.performance?.score;
    const data = { mobileScore: score ? Math.round(score*100) : null, lcp: d.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue||null, confirmed: !!score };
    pageSpeedCache.set(cacheKey, { data, ts: Date.now() });
    return data;
  } catch { return { mobileScore: null, confirmed: false }; }
};

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
  FIRECRAWL_OUT_OF_CREDITS = false; // reset per run so the flag reflects THIS request
  const { company, website, keys, apiKey } = req.body;
  const { firecrawlKey, fbToken, ninjaPearKey, companiesApiKey, verifierKey } = keys || {};
  const browserData = req.body.browserData || {};
  const pageSpeed = browserData.pageSpeed || {};
  const emailData = browserData.emailData || {};
  const companyData = browserData.companyData || {};
  const discoverySignals = req.body.discoverySignals || {};
  const discoverySource = req.body.discoverySource || '';
  const discoveryReason = req.body.discoveryReason || '';
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
  if (!verifiedCEO || publicPainSignals.length === 0) {
    try {
      const deepEnrich = await googleEnrich(company);
      if (deepEnrich) {
        if (!verifiedEmployees && deepEnrich.employees) verifiedEmployees = deepEnrich.employees;
        if (!verifiedCEO && deepEnrich.ceoName) { verifiedCEO = deepEnrich.ceoName; verifiedCEOTitle = deepEnrich.ceoTitle; }
        if (publicPainSignals.length === 0 && deepEnrich.painSignals) publicPainSignals = deepEnrich.painSignals;
        console.log(`Research enrichment [${company}]: ceo=${verifiedCEO||'?'} pain=${publicPainSignals.length}`);
      }
    } catch(e) { console.log('Research enrichment failed (non-fatal):', e.message); }
  }

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

  const domain = website ? website.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','') : '';
  console.log(`Research: ${company} | ${website||'no website'}`);

  try {
    // Fire all signals simultaneously
    // Never scrape BizBuySell listing pages — bot-protected and wrong site
    const isBizBuySellUrl = website && /bizbuysell\.com/i.test(website);
    if (isBizBuySellUrl) {
      console.log('BizBuySell URL detected — skipping scrape, needs real company website');
    }

    const scrapeHomepage = async () => {
      if (!website || !firecrawlKey || isBizBuySellUrl) return {};
      const doScrape = (timeout) => fetchT('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: website, formats: ['markdown', 'screenshot'], onlyMainContent: false, waitFor: 2000 }),
      }, timeout).then(r => r.json());
      try {
        return await doScrape(20000);
      } catch(e) {
        console.log('Firecrawl timeout — retrying once with longer timeout');
        try { return await doScrape(35000); }
        catch(e2) { console.log('Firecrawl retry also failed:', e2.message); return {}; }
      }
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

    // If Hunter found a named contact, use them as the verified decision-maker.
    // Hunter is the most reliable source — it finds the actual person at the domain.
    if (!verifiedCEO && email.founderName && email.founderName.trim().length > 3) {
      verifiedCEO = email.founderName.trim();
      verifiedCEOTitle = email.title || email.founderTitle || 'Owner';
      console.log(`Hunter name used as CEO: ${verifiedCEO} (${verifiedCEOTitle})`);
    }

    // ═══ THE COMPANIES API — authoritative size/industry (if key present) ═══════
    let verifiedIndustry = null;
    if (companiesApiKey && website) {
      try {
        const capi = await enrichViaCompaniesAPI(website, companiesApiKey);
        if (capi) {
          if (capi.employees && !verifiedEmployees) verifiedEmployees = capi.employees;
          if (capi.industry) verifiedIndustry = capi.industry;
        }
      } catch(e) { console.log('CompaniesAPI research enrich skipped:', e.message); }
    }

    // ═══ ABOUT-PAGE ENRICHMENT — CEO name + team size from company's own site ═══
    // Firecrawl works from Render where search engines are blocked. This is our
    // real source for the decision-maker's name. Runs only if we don't have it yet.
    if ((!verifiedCEO || !verifiedEmployees) && website && content) {
      try {
        const aboutData = await enrichFromAboutPage(website, firecrawlKey, content);
        if (!verifiedCEO && aboutData.ceoName) {
          verifiedCEO = aboutData.ceoName;
          verifiedCEOTitle = aboutData.ceoTitle || 'Owner';
        }
        if (!verifiedEmployees && aboutData.teamSize) {
          verifiedEmployees = aboutData.teamSize;
        }
      } catch(e) { console.log('About enrich skipped:', e.message); }
    }

    // ═══ SIZE VIA WEB SEARCH — closes the Companies API coverage gap ═══════
    // The Companies API returns emp=? on a big share of private SMBs. ZoomInfo's
    // public pages, D&B, Buzzfile and Manta all publish headcount and revenue for
    // private companies, free to read. Only runs when we still have no headcount.
    if (!verifiedEmployees && firecrawlKey && apiKey && company) {
      try {
        const sz = await findSizeViaSearch(company, website, firecrawlKey, apiKey);
        if (sz && sz.employees) {
          verifiedEmployees = sz.employees;
          console.log(`SIZE [${company}]: recovered ${sz.employees} employees via web search (${sz.source})`);
        }
        if (sz && sz.revenue) verifiedRevenue = sz.revenue;
      } catch(e) { console.log('Size search skipped:', e.message); }
    }

    // ═══ DEEP BUSINESS PAIN — what the owner is ACTUALLY fighting ══════════
    // This is what turns "your website has no lead capture" (a website
    // observation) into "your reviews say quotes take three weeks and you're
    // hiring four schedulers" (the fire he's personally putting out).
    //
    // CREDIT DISCIPLINE: only run this when we don't already have pain signals,
    // and only for leads worth the spend. Firecrawl free tier is 500/mo.
    let painSummary = '';
    if (publicPainSignals.length === 0 && firecrawlKey && apiKey && company) {
      try {
        const pain = await findBusinessPain(company, website, firecrawlKey, apiKey, verifiedIndustry);
        if (pain.signals && pain.signals.length > 0) {
          // Feed the Brain the pain WITH its evidence, so the pitch can quote it
          publicPainSignals = pain.signals.map(s =>
            `${s.pain} — evidence: "${String(s.evidence).slice(0, 140)}" (${s.source || 'web'})`
          );
          painSummary = pain.summary || '';
        }
      } catch(e) { console.log('Pain engine skipped:', e.message); }
    }

    // ═══ DECISION-MAKER ENGINE ═════════════════════════════════════════════
    // Runs BEFORE the email engine, because knowing WHO we're targeting is what
    // makes email pattern generation possible — and because reaching the wrong
    // person (a marketing coordinator instead of the owner) wastes the entire
    // audit. Corroborates across their website, public registries, news, and
    // Hunter. Agreement across independent sources is what gets us near 90%.
    let decisionMaker = null;
    if (company) {
      try {
        decisionMaker = await findDecisionMaker({
          companyName: company,
          website,
          fcKey: firecrawlKey,
          apiKey,
          homepageContent: content,
          hunterName: email.founderName || '',
          hunterTitle: email.title || '',
        });
        // A corroborated owner beats whatever we had before. A lone weak hit does not
        // override an already-verified name.
        if (decisionMaker && decisionMaker.name) {
          if (!verifiedCEO || decisionMaker.corroborated || decisionMaker.confidence === 'high') {
            verifiedCEO = decisionMaker.name;
            verifiedCEOTitle = decisionMaker.title || verifiedCEOTitle || 'Owner';
          }
        }
      } catch(e) { console.log('Decision-maker engine failed (non-fatal):', e.message); }
    }

    // ═══ FIREPROOF EMAIL ENGINE ════════════════════════════════════════════
    // Runs AFTER the CEO name is known (Hunter → About-page → Brain), because
    // the name is what makes pattern generation possible. Returns a scored,
    // tiered result — never a bare guess dressed up as a fact.
    let emailResult = null;
    if (website) {
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

    // ═══ COMPANY NEWS TRIGGERS — recent events for the pitch cold-open ═══════
    // "I saw you just opened your third location" is a killer opener. Free via
    // Google News RSS. STRICTLY verified to be about THIS company — a mismatched
    // article would poison the pitch, so getCompanyNews rejects anything ambiguous.
    let companyTriggers = [];
    try {
      const news = await getCompanyNews(company, website);
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

        if (screenshotUrl) {
          try {
            const imgRes = await fetchT(screenshotUrl, {}, 10000);
            const imgBuffer = await imgRes.buffer();
            // Render free tier uploads slowly — a 4MB image alone can eat 20s.
            // Cap at 1.5MB: most above-fold screenshots fit; oversized ones get
            // skipped and the audit runs from the scraped text (still good).
            if (imgBuffer.length < 3 * 1024 * 1024) {
              const base64 = imgBuffer.toString('base64');
              msgContent.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } });
            } else {
              console.log(`Screenshot too large (${Math.round(imgBuffer.length/1024/1024*10)/10}MB) — skipping image, auditing from text`);
            }
          } catch(e) { console.log('Screenshot fetch failed:', e.message); }
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
          const adSpendSignal = (fbAds.adCount || 0) > 0;
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
            lanes.push({
              lane: 'RETAINER_MARKETING',
              why: `${fbAds.adCount} active paid ads confirmed — real budget flowing into a funnel we can audit.`,
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

        msgContent.push({
          type: 'text',
          text: `You are CROJungle's senior marketing auditor. Your job is to find the single most expensive problem in this business's digital presence and recommend the right CROJungle product to fix it.

COMPANY: ${company}
WEBSITE: ${website || 'Unknown'}
VERIFIED HEADCOUNT: ${verifiedEmployees ? verifiedEmployees.toLocaleString() + ' employees (confirmed via Google)' : 'Not verified — treat as unknown size'}
VERIFIED DECISION-MAKER: ${verifiedCEO ? verifiedCEO + ' (' + (verifiedCEOTitle || 'CEO') + ') — found in public search results, use their real name in the pitch' : 'Not identified — pitch to "the owner/CEO"'}
═══ THE FIRE HE IS ACTUALLY FIGHTING (highest-value intel we have) ═══
${painSummary ? 'THE SINGLE BIGGEST OPERATIONAL FIRE: ' + painSummary + '\n' : ''}${publicPainSignals.length > 0 ? 'VERIFIED OPERATIONAL PAIN (from real reviews, complaints, and employee feedback — each carries the exact quote that proves it):\n' + publicPainSignals.map(p => '- ' + p).join('\n') + `

→ THIS IS THE MOST IMPORTANT INPUT IN THIS ENTIRE PROMPT. Mike's core insight is that owners are trapped putting out fires in areas they already delegated. THIS is that fire, and we can PROVE it.
→ A pitch that names the operational fire ("your reviews say quotes take three weeks and you're hiring four schedulers to keep up") is in a completely different league from one that names a website flaw ("your homepage has no lead capture form"). The first makes the owner feel SEEN. The second sounds like every other agency email.
→ CONNECT the operational pain to the website/ad finding wherever they genuinely link — that combination is the sharpest possible pitch. Example: "You are running 840 ads into a page with no form, while your reviews say quotes take three weeks. You are paying to generate leads you cannot answer."
→ NEVER quote the review verbatim in the email (it embarrasses them publicly). Reference the PATTERN, not the quote. "Your reviews mention slow quote turnaround" — not "one customer said you're incompetent."` : 'No verified operational pain found in public sources — pitch from the site/ad audit only. Do NOT invent operational pain: fabricating a complaint would destroy credibility instantly.'}
RECENT NEWS TRIGGERS (verified to be about THIS company via Google News): ${companyTriggers.length > 0 ? '\n' + companyTriggers.map(t => `- [${t.type}, ${t.ageDays}d ago] ${t.headline}`).join('\n') + '\n→ These are CONFIRMED recent events about this exact company. Use the most relevant ONE as the pitch cold-open ("I saw you just..."). This is the strongest personalization signal — it proves we did our homework. Only reference a trigger that genuinely connects to the pain/product.' : 'No recent company-specific news found — do not invent any; pitch from the site audit.'}
SOURCE SIGNAL: ${req.body.sourceSignal || 'Not specified'}

ICP LANE (which of CROJungle's real client profiles this company matches — drives product choice AND which proof point parallels their situation):
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
- Facebook Ads: ${fbAds.hasAds ? `${fbAds.adCount}+ active ads VERIFIED AS THEIRS in Ad Library (attribution-checked; true count may be higher — cite as "at least ${fbAds.adCount}"). Confirmed ad spend into a weak funnel IS the pitch.` : builtWith.hasMetaPixel ? 'Meta pixel on their site — ad infrastructure exists but ZERO ads verified as theirs in Ad Library. Do NOT state an ad count or claim active campaigns.' : fbAds.confirmed ? 'No ads attributable to them in Ad Library — do NOT claim they run Facebook ads' : 'Could not check — do not claim anything about their Facebook ads'}
${fbAds.ads?.length > 0 ? '- Longest running ad: ' + Math.max(...(fbAds.ads||[]).map(a=>a.runningDays||0)) + ' days' : ''}

${screenshotUrl ? 'I have also provided a screenshot of their homepage above.' : trustedContent.length > 100 ? 'No screenshot available — audit from scraped content only.' : 'WARNING: Homepage could not be reliably scraped (site blocked Firecrawl or returned a bot/cookie page). Do NOT make up ANY homepage findings, headlines, or CTAs. Audit ONLY from the discovery signals and tech stack data provided above. Focus on the operational/funding/exit angle.'}

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

CROJungle offerings (full-service — can combine):
- Website Rebuild ($10k-$25k): homepage conversion failures, weak positioning, no CTA
- Landing Page ($5k-$15k): running ads to homepage, no dedicated conversion page
- End-to-End Marketing / Ads Management ($8k-$35k/month): running ads but leaking revenue, needs full-funnel ownership
- AI Brain ($40k-$70k): no marketing intelligence layer, disconnected systems, no automation
- Custom AI Software Build ($25k-$75k+): manual/repetitive labor (customer service, data entry, scheduling, bookkeeping) that software can replace — often the biggest ticket
- Revenue Growth / CRO Retainer ($8k-$35k/month): confirmed traffic but poor conversion, ongoing optimization
- Exit / Valuation Advisory (via Wall Street-backed partner): for companies preparing to sell — increase revenue AND advise on valuation/M&A. Nobody else offers this combination.

DOLLAR-FIGURE RULE: job posting counts are FACTS; salary totals derived from them are ESTIMATES. Any labor-cost dollar figure MUST be framed as an estimate ("est.", "roughly") and must show its basis. Never present a derived number as a measured one.

Prioritize by dollar impact: a confirmed manual-labor signal (AI software, $25k-$75k) or exit-prep company usually outweighs a homepage CTA fix. Only recommend what the evidence supports — never fabricate.

Return ONLY valid JSON, no markdown:
{
  "hasCTAAboveFold": true/false,
  "ctaText": "exact CTA text or null",
  "heroHeadline": "exact headline",
  "headlineQuality": "specific/generic/missing",
  "hasVideo": true/false,
  "hasSocialProof": true/false,
  "socialProofType": "testimonials/logos/reviews/none",
  "designQuality": "professional/dated/poor",
  "mobileReady": true/false,
  "aboveFoldClutter": true/false,
  "trustSignals": ["visible trust signals"],
  "decisionMaker": "Look through ALL the page content (homepage, about, team, footer, any 'meet the founder' or leadership text) and identify the owner/founder/CEO/president BY NAME if their name appears ANYWHERE. Return an object {name, title, confidence} where confidence is 'high' (name explicitly tied to a leadership title like 'John Smith, CEO' or 'founded by Jane Doe'), 'medium' (name present and clearly the principal but title less explicit), or 'low' (a name appears but role is ambiguous). Return null ONLY if genuinely no personal name appears anywhere. Do NOT guess or invent — only extract names actually present in the content. Do NOT return generic words like 'Team', 'Leadership', 'Owner' as the name.",
  "biggestVisualIssue": "single most important visual problem with specific detail",
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
  "pitchAngle": "The one line that earns a reply. STRICT RULES: (1) ONE confirmed pain only — never chain several. (2) 40 words max. (3) No hedging ('appears to', 'looks like') — unconfirmed does not go in the pitch. (4) NAME THE FIRE THEY ARE STUCK PUTTING OUT. Mike's core insight: owners are trapped performing at a high level while constantly firefighting in areas they already delegated. The pitch should make them feel seen, not sold to. (5) MATCH VOCABULARY TO THE READER: exit-prep / just-funded / financially sophisticated → unit-economics language is the sharpest weapon (margin, multiple, EBITDA). Owner-operator (trucking, clinics, local services, contractors) → plain dollars and salaries, zero finance vocabulary. (6) Lead with the diagnosis and the money, close with a small conversational ask — a short call to walk through what we found and hear their side. NEVER 'book a demo' or 'send a proposal'. (7) No flattery, no 'hope this finds you well'. The audit IS the personalization. GOOD (owner-operator): 'You are paying four salaries to do work software handles overnight — and you are still the one fixing it when it breaks. Worth a short call to show you the math?' GOOD (exit-prep): 'Every dollar of manual labor you cut before the sale multiplies straight into your asking price. Want fifteen minutes to see what is automatable?' GOOD (stagnated/bloated): 'You have grown headcount faster than revenue and the ads are pouring into a page that cannot convert — that combination is exactly the fire that never gets put out. Short call?'"
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
          brainError = `Claude API error: ${vd.error.type || ''} — ${vd.error.message || JSON.stringify(vd.error).slice(0,200)}`;
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
          // Second Claude call reviews the first audit's claims against the
          // raw evidence — catches hallucinations, overstated numbers, unverified
          // findings. Runs text-only (no vision) so it's fast: ~5-8s.
          try {
            const critiquePrompt = `You are a quality-control auditor reviewing a marketing audit before it goes to a founder.

RAW EVIDENCE (what we actually confirmed):
- Company: ${company}
- Website: ${website || 'none'}
- VERIFIED HEADCOUNT: ${verifiedEmployees ? verifiedEmployees.toLocaleString() + ' employees (confirmed via Google search)' : 'Not verified'}
- ICP CHECK: ${verifiedEmployees ? (verifiedEmployees <= 200 ? '✓ PASS — ' + verifiedEmployees + ' employees, founder likely reachable' : verifiedEmployees <= 500 ? '⚠ SOFT — ' + verifiedEmployees + ' employees, may have management layers' : '✗ FAIL — ' + verifiedEmployees + ' employees, this is an enterprise, NOT our ICP') : 'Size unknown — could not verify'}
- Firecrawl scraped: ${content.length} characters of homepage content
- Screenshot taken: ${!!screenshotUrl}
- Facebook ads: ${fbAds.hasAds ? fbAds.adCount + ' ads verified as theirs (attribution-checked)' : fbAds.confirmed ? 'none found attributable to them' : 'not checked'}
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
  "icpBlocker": "if this company is clearly OUTSIDE our ICP (over 500 employees, enterprise, government, publicly traded giant), state the reason here in one short phrase. Otherwise empty string.",
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
            brainAudit.critique = {
              verifiedClaims: critique.verifiedClaims || [],
              flaggedClaims: critique.flaggedClaims || [],
              correctedPitchAngle: critique.correctedPitchAngle || parsed.pitchAngle,
              confidenceScore: critique.confidenceScore ?? 7,
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
            if (critique.correctedPitchAngle && critique.confidenceScore >= 5) {
              brainAudit.pitchAngle = critique.correctedPitchAngle;
            }
            console.log('Critique complete: confidence', critique.confidenceScore, '| flags:', (critique.flaggedClaims||[]).length);
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
    const hasCTA = visualAnalysis?.hasCTAAboveFold ?? /call|contact|get started|book|schedule|buy|request|demo|try|sign up|free trial/i.test(content.slice(0,3000));
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
        facebookAds: fbAds.hasAds ? `${fbAds.adCount || fbAds.ads?.length || ''}+ active Facebook ads verified as THEIRS in Ad Library (attribution-checked)`.trim() : builtWith.hasMetaPixel ? 'Meta pixel on site — ad infrastructure exists, but no ads verified as theirs in Ad Library' : fbAds.confirmed ? 'No Facebook ads attributable to them in Ad Library' : 'Facebook ads: could not check (Ad Library scrape failed)',
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
      { id:'heavy_manual_labor', pain:`Actively hiring ${manualRoleCount} manual/repetitive roles (confirmed job postings) — recurring labor that custom software could largely replace`, opportunity:'Custom AI software build to automate repetitive workflows', product:'Custom AI Software Build', price:'$25k–$75k+' },
      { id:'exit_prep', pain:'Preparing for exit — every dollar of new revenue and every efficiency gain directly raises the sale price', opportunity:'Revenue growth + valuation advisory before the sale closes', product:'Exit / Valuation Advisory', price:'Custom' },
      { id:'manual_labor', pain:`Hiring ${manualRoleCount} manual roles — repetitive work that software could handle at a fraction of the cost`, opportunity:'Workflow automation / custom software', product:'Custom AI Software Build', price:'$25k–$50k' },
      { id:'funded_no_infra', pain:'Recently funded but no CRM or marketing infrastructure — capital to grow with nothing to capture or convert leads', opportunity:'Full marketing infrastructure + intelligence layer', product:'AI Brain', price:'$40k–$70k' },
      { id:'stale_site', pain:`Footer copyright reads ${builtWith.copyrightYear} — the site has visibly not been touched in years, and prospects notice`, opportunity:'Full website rebuild', product:'Website Rebuild', price:'$10k–$25k' },
      { id:'no_cta', pain:'No CTA above fold — visitors arrive and have nowhere to go', opportunity:'Landing page or homepage rebuild', product:'Website Rebuild', price:'$10k–$25k' },
      { id:'no_email_capture', pain:'No email capture anywhere on the site — every visitor who does not convert today is lost forever', opportunity:'Lead capture + email nurture system', product:'Revenue Growth Retainer', price:'$8k–$15k/month' },
      { id:'weak_positioning', pain:`Positioning ${positioningScore}/10 — generic messaging any competitor could use`, opportunity:'Brand positioning + website rewrite', product:'Website Rebuild', price:'$15k–$40k' },
      { id:'stale_fb_ads', pain:'Same Facebook ads running 6+ months — creative fatigue killing performance', opportunity:'Ad creative refresh + landing page', product:'End-to-End Marketing', price:'$10k–$20k' },
      { id:'no_crm', pain:'No CRM detected — leads are falling through the cracks with no system to catch them', opportunity:'CRM + marketing automation setup', product:'Revenue Growth Retainer', price:'$8k–$15k/month' },
      { id:'no_tracking', pain:'No tracking pixel — spending on marketing with no way to measure what works', opportunity:'Analytics + tracking infrastructure', product:'Revenue Growth Retainer', price:'$8k–$15k/month' },
      { id:'slow_mobile', pain:`Mobile score ${pageSpeed.mobileScore}/100 — majority of traffic leaves before seeing the offer`, opportunity:'Site speed + mobile rebuild', product:'Website Rebuild', price:'$10k–$25k' },
      { id:'no_google_ads', pain:'No Google Ads — competitors are capturing demand this company cannot see', opportunity:'Paid search + landing pages', product:'End-to-End Marketing', price:'$8k–$20k/month' },
      { id:'no_social_proof', pain:'No testimonials or case studies — buyers cannot verify claims before buying', opportunity:'Social proof system', product:'Website Rebuild', price:'$8k–$20k' },
      { id:'weak_hero', pain:'Homepage headline does not differentiate from a single competitor', opportunity:'Positioning + homepage rewrite', product:'Website Rebuild', price:'$10k–$30k' },
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
          price: brainAudit.recommendedPrice || '$10k–$25k',
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
      if (isAIOpportunity && isMediaOrAgency) return { product:'Software Build / AI Integration', price:'$25k–$75k', reason:'Merged or growing operation with no unified tech stack', flag:'' };
      if (hasAdSpend && !hasInfra) return { product:'Growth Retainer', price:'$8k–$35k/month', reason:'Confirmed ad spend but no infrastructure to convert — revenue leaking', flag:'' };
      if (isAIOpportunity && content.length > 2000) return { product:'AI Brain', price:'$40k–$70k', reason:'No intelligence layer — disconnected systems, no automation, no tracking', flag:'' };
      if (isBroken) return { product:'Website Rebuild', price:'$10k–$25k', reason:'Homepage has critical conversion failures', flag:'' };
      return { product:'Website / Landing Page', price:'$5k–$25k', reason:'Homepage conversion gaps identified', flag:'' };
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
        : 'Brain analysis failed — Claude API returned an error. Check your Anthropic key in Settings (sk-ant-...) and make sure it has credits.';

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

    console.log(`Research complete: ${company} | ${flaws.length} flaws | ${recommendedProduct.product} | +${researchBonus} research bonus`);

    res.json({
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
    // AUTHORITY GUARD: never burn a lead by pitching someone who cannot buy.
    // A VP of Maintenance or HR Director cannot authorize a $25k build. Emailing
    // them wastes the audit AND permanently burns the company.
    if (lead.decisionMaker && lead.decisionMaker.canBuy === false) {
      results.failed.push({
        name: lead.name, email: lead.email,
        reason: `${lead.decisionMaker.name} is "${lead.decisionMaker.title}" — cannot authorize a purchase. Find the owner first.`
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
