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

app.get('/', (req, res) => res.json({ status: 'CROJungle Backend v8 — reachability + full-business audit, zero fabrication', sources: ['adzuna_ai','sec_edgar','google_news','bizbuysell','facebook_ads(token)'], ok: true }));

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
app.get('/api/find-website', async (req, res) => {
  const { company } = req.query;
  if (!company) return res.status(400).json({ error: 'Company name required' });

  // Method 1: Clearbit autocomplete — fast, free, reasonably accurate for known brands
  // This works best for companies with a unique name. Generic names ("Central Diesel") often fail.
  try {
    const r = await fetchT(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(company)}`,
      { headers: { 'Accept': 'application/json' } },
      5000
    );
    const d = await safeJson(r);
    if (Array.isArray(d) && d.length > 0 && d[0].domain) {
      // Confidence check: does the result name actually match the company we searched?
      const resultName = (d[0].name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const searchName = company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
      const confident = resultName.includes(searchName.slice(0, 6)) || searchName.includes(resultName.slice(0, 6));
      const website = `https://${d[0].domain}`;
      console.log(`Clearbit: ${website} | confident: ${confident}`);
      return res.json({ website, source: 'clearbit', confident });
    }
  } catch(e) { console.log('Clearbit failed:', e.message); }

  // Nothing found — modal will show empty field for manual entry
  console.log(`No website found for "${company}" — modal will prompt manual entry`);
  res.json({ website: '', source: 'not_found', confident: false });
});

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 1: ADZUNA — runs searches IN PARALLEL
// Key fix: parallel not sequential = 3s not 90s
// ═══════════════════════════════════════════════════════════
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
        byCompany.set(key, { name: p.company.trim(), location: p.location, cats: new Set(), roles: [], count: 0, maxSalary: 0 });
      }
      const c = byCompany.get(key);
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
      const name = src.entity_name || src.company_name || src.entityName || src.display_names?.[0] || '';
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
const firecrawlScrape = async (fcKey, url, timeout = 25000) => {
  if (!fcKey) return '';
  try {
    const r = await fetchT('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${fcKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: false, waitFor: 3000 }),
    }, timeout);
    const d = await r.json();
    return d.data?.markdown || d.markdown || '';
  } catch(e) { console.log('firecrawlScrape error:', e.message); return ''; }
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
            website: link,
            jobTitle: brokerPosted ? 'Listed for sale via broker' : 'Listed for sale — owner wants to maximize value',
            jobSnippet: (desc.replace(/<[^>]+>/g, '').slice(0, 150)) + (revenue ? ` | ${revenue}` : ''),
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
          if (/sign in|register|broker|sell your|search|advanced|franchise directory/i.test(clean)) continue;
          seen.add(clean.toLowerCase());
          const brokerPosted = /broker|agent/i.test(clean);
          results.push({
            name: clean.slice(0, 60),
            website: link,
            jobTitle: brokerPosted ? 'Listed for sale via broker' : 'Listed for sale — owner wants to maximize value',
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

app.post('/api/discover', async (req, res) => {
  const { keywords, keys } = req.body;
  const { adzunaId, adzunaKey, fbToken, firecrawlKey } = keys || {};

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
    ]);

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
      if (nameWords.some(w => BLOCKED_COMPANIES.has(w) && w.length > 4)) return false;
      // Block companies with "Inc." that are clearly enterprises (very long names = conglomerates)
      if (name.length > 55) return false;
      // Block government/non-profit signals
      if (/\b(university|college|school|district|county|city of|state of|department of|ministry|federal|government|hospital|health system|medical center)\b/i.test(name)) return false;
      // Block staffing agencies and workforce companies by keyword
      if (/\b(staffing|recruiting|recruitment|temp agency|talent agency|placement agency|headhunter|workforce solutions|labor solutions|employment agency|talent solutions|workforce management|employer of record|professional employer|peo |hr outsourc)\b/i.test(name)) return false;
      return true;
    });

    console.log(`After ICP filter: ${icpFiltered.length} (removed ${allCompanies.length - icpFiltered.length} large/irrelevant)`);

    // SIGNAL STACKING — merge across sources, union signals
    const merged = new Map();
    for (const c of icpFiltered) {
      const key = (c.name||'').toLowerCase().trim();
      if (!key || key.length < 2) continue;
      if (!merged.has(key)) {
        merged.set(key, { ...c, signals: { ...(c.signals||{}) }, sources: [c.source] });
      } else {
        const ex = merged.get(key);
        for (const [k, v] of Object.entries(c.signals||{})) ex.signals[k] = ex.signals[k] || v;
        if (!ex.sources.includes(c.source)) ex.sources.push(c.source);
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
    const stackedCount = unique.filter(c => (c.sources||[]).length >= 2).length;
    console.log(`After merge: ${unique.length} unique (${stackedCount} stacked across 2+ sources)`);
    

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
        // STACKING MULTIPLIER — independent sources agreeing is a strong confidence 
        // boost. 2 sources = +15, 3+ = +30. Stacked leads can reach 100 and top the
        // queue; single-source leads cap at 85 so they can't crowd out real winners.
        const srcN = (c.sources || [c.source]).filter(Boolean).length;
        const stacked = srcN >= 2;
        const stackBonus = srcN >= 3 ? 30 : srcN === 2 ? 15 : 0;
        // FOUNDER-REACHABILITY — the ICP gate. A lead we can't reach an owner at
        // is worth little no matter how much pain it has. This score (0-30) is
        // added, and a hard block sinks unreachable enterprises below research cutoff.
        const reach = scoreReachability(c);
        const base = raw + stackBonus + reach.score;
        // Hard block → cap at 20 so it sinks to the bottom, never researched first.
        const icpScore = reach.hardBlock
          ? Math.min(Math.round(base), 20)
          : Math.min(Math.round(base), stacked ? 100 : 90);
        return {
          ...c,
          icpScore,
          stacked,
          sourceCount: srcN,
          reachability: reach.score,
          reachabilityReasons: reach.reasons,
          reachabilityBlocked: reach.hardBlock,
        };
      })
      .sort((a,b) => b.icpScore - a.icpScore);

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
const getFounderEmail = async (domain, hunterKey) => {
  if (!hunterKey || !domain) return { email:'', founderName:'' };
  try {
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
    return { email: best?.value||'', founderName: `${best?.first_name||''} ${best?.last_name||''}`.trim(), title: best?.position||'' };
  } catch { return { email:'', founderName:'' }; }
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
const checkBuiltWith = async (domain) => {
  try {
    const url = `https://${domain}`;
    const r = await fetchT(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html' } }, 10000);
    const html = await safeText(r);
    if (!html || html.length < 500) return { hasCRM:false, hasEmailMarketing:false, hasPixel:false, hasVideo:false, hasChat:false, hasGoogleAdsTag:false, hasMetaPixel:false, titleTag:'', hasMetaDesc:false, hasH1:false, hasSchema:false, hasEmailCapture:false, hasBooking:false, copyrightYear:0, confirmed:false };
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
  const { company, website, keys, apiKey } = req.body;
  const { firecrawlKey, fbToken } = keys || {};
  const browserData = req.body.browserData || {};
  const pageSpeed = browserData.pageSpeed || {};
  const emailData = browserData.emailData || {};
  const companyData = browserData.companyData || {};
  const discoverySignals = req.body.discoverySignals || {};
  const discoverySource = req.body.discoverySource || '';
  const discoveryReason = req.body.discoveryReason || '';
  const manualRoleCount = req.body.manualRoleCount || 0;
  const manualCategories = req.body.manualCategories || 0;
  const icpProfile = req.body.icpProfile || '';
  if (!company) return res.status(400).json({ error: 'Company name required' });

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
    const [firecrawlRes, fbAdsRes, builtWithRes, googleAdsRes] = await Promise.allSettled([
      website && firecrawlKey
        ? fetchT('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: website, formats: ['markdown', 'screenshot'], onlyMainContent: false, waitFor: 2000 }),
          }, 20000).then(r=>r.json()).catch(e => { console.log('Firecrawl error:', e.message); return {}; })
        : Promise.resolve({}),
      fbToken ? checkFacebookAds(company, fbToken) : checkAdLibraryViaFirecrawl(company, firecrawlKey),
      domain ? checkBuiltWith(domain) : Promise.resolve({hasCRM:false}),
      domain ? checkGoogleAds(domain) : Promise.resolve({hasGoogleAds:false}),
    ]);

    const firecrawlData = firecrawlRes.value || {};
    const content = firecrawlData.data?.markdown || firecrawlData.markdown || '';
    const screenshotUrl = firecrawlData.data?.screenshot || firecrawlData.screenshot || null;
    const fbAds = fbAdsRes.value || {};
    const builtWith = builtWithRes.value || {};
    const googleAds = googleAdsRes.value || {};
    const email = emailData; // from browser via browserData

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
            if (imgBuffer.length < 1.5 * 1024 * 1024) {
              const base64 = imgBuffer.toString('base64');
              msgContent.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } });
            } else {
              console.log(`Screenshot too large (${Math.round(imgBuffer.length/1024/1024*10)/10}MB) — skipping image, auditing from text`);
            }
          } catch(e) { console.log('Screenshot fetch failed:', e.message); }
        }

        const homepageSnippet = trustedContent.slice(0, 4000);

        msgContent.push({
          type: 'text',
          text: `You are CROJungle's senior marketing auditor. Your job is to find the single most expensive problem in this business's digital presence and recommend the right CROJungle product to fix it.

COMPANY: ${company}
WEBSITE: ${website || 'Unknown'}
SOURCE SIGNAL: ${req.body.sourceSignal || 'Not specified'}

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

WHY THIS COMPANY WAS FLAGGED (discovery signal — factor this into your audit):
- Source: ${discoverySource || 'unknown'}
- Signal: ${discoveryReason || 'general ICP match'}
${manualRoleCount >= 2 ? `- HIRING SIGNAL: currently hiring ${manualRoleCount} manual/repetitive roles${manualCategories ? ` across ${manualCategories} functions` : ''} — a strong sign of automatable labor spend (potential AI software build)` : ''}
${discoverySignals.raised_funding ? '- FUNDING SIGNAL: recently raised capital — board pressure to show growth, budget to deploy' : ''}
${discoverySignals.preparing_for_exit ? '- EXIT SIGNAL: preparing to sell — motivated to maximize revenue and valuation before exit' : ''}
${discoverySignals.rebranding ? '- REBRAND SIGNAL: rebranding — full marketing rebuild in motion, vendors up for grabs' : ''}

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

CROJungle offerings (full-service — can combine):
- Website Rebuild ($10k-$25k): homepage conversion failures, weak positioning, no CTA
- Landing Page ($5k-$15k): running ads to homepage, no dedicated conversion page
- End-to-End Marketing / Ads Management ($8k-$35k/month): running ads but leaking revenue, needs full-funnel ownership
- AI Brain ($40k-$70k): no marketing intelligence layer, disconnected systems, no automation
- Custom AI Software Build ($25k-$75k+): manual/repetitive labor (customer service, data entry, scheduling, bookkeeping) that software can replace — often the biggest ticket
- Revenue Growth / CRO Retainer ($8k-$35k/month): confirmed traffic but poor conversion, ongoing optimization
- Exit / Valuation Advisory (via Wall Street-backed partner): for companies preparing to sell — increase revenue AND advise on valuation/M&A. Nobody else offers this combination.

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
  "biggestVisualIssue": "single most important visual problem with specific detail",
  "overallConversionRating": "strong/moderate/weak",
  "savingsEstimate": "A money estimate ONLY if you have a real input. Return an object {monthlyLow, monthlyHigh, annualLow, annualHigh, basis, execution} OR null if you have no real input. RULES: (1) ONLY produce numbers when there is a CONFIRMED input: a job-posting count (labor replacement) OR confirmed active ads + a broken funnel (ad waste). NEVER invent a number from a weak website alone — we don't know their traffic or revenue, so any such number is fabrication. (2) Use MODERATE ranges, not conservative, not inflated. Labor: assume typical fully-loaded salary $45k-$65k per manual role, and that software replaces 60-80% of that cost. Ad waste: only if confirmed ads — assume a broken funnel wastes 20-40% of spend, and estimate spend as (confirmed active ad count × $800-$2000/mo per active ad as a rough industry placeholder) — clearly a rough range. (3) 'basis' = one short sentence showing the exact inputs and math, e.g. '4 confirmed manual roles × ~$55k salary × 70% automatable'. (4) 'execution' = one short sentence on HOW CROJungle captures it, so the closer knows what to sell, e.g. 'Build a custom intake+scheduling AI that replaces the manual workflow across all sites.' If you have NO confirmed dollar input, return null and rely on the qualitative pain instead — do NOT fabricate.",
  "operationsOpportunity": "if hiring signal present: what manual work could be automated and rough labor cost, else null",
  "exitValueAngle": "if exit/funding signal present: what would increase their revenue or valuation, else null",
  "realPain": "The single most expensive confirmed problem — expressed in terms of wasted money, lost revenue, or bleeding labor cost. Must reference a specific confirmed signal (ad spend, job postings, conversion gap). No technical jargon. One founder-facing sentence.",
  "embarrassingFinding": "the one thing the founder would be embarrassed about",
  "recommendedProduct": "The single best-fit primary offering (this is what the pitch leads with)",
  "recommendedPrice": "price range for the primary",
  "recommendedReason": "why THIS specific offering beats the others for THIS company — reference their confirmed situation, not generic reasoning. If you recommend Custom AI Software Build, you must justify why software specifically over marketing/website/growth work — do not default to it just because they hire people.",
  "topThreeProducts": "Array of the 3 most relevant offerings ranked by dollar-impact fit, each as {product, price, why}. The #1 must match recommendedProduct. Rank by what would move the most money for THIS business, not by what's most expensive. Every business could 'use AI' — only rank Custom AI Software Build #1 when there is a CONFIRMED, specific, expensive manual-labor signal (multiple job postings), not as a lazy default.",
  "pitchAngle": "STRICT RULES: (1) Pick the ONE most expensive confirmed pain — never chain two or three pains into one sentence. (2) 35 words maximum. (3) No hedging ('what looks like', 'appears to') — if it is not confirmed, it does not go in the pitch. (4) MATCH THE VOCABULARY TO THE READER: exit-prep or just-funded or pre-IPO reader → unit economics language IS the sharpest weapon (margin, multiple, valuation, EBITDA) — use it confidently. Owner-operator (trucking, clinics, local services) → plain dollars and salaries, zero finance vocabulary. (5) Lead with the money, end with a short curiosity question. GOOD (owner-operator): 'You're paying four salaries to manually do work software could handle overnight — want to see the math?' GOOD (exit-prep): 'Every dollar of manual labor cost you cut before the sale multiplies straight into your asking price — want to see what's automatable?'"
}`
        });

        // 45s timeout — vision calls with screenshots regularly take 25-40s.
        // The old 20s timeout was killing valid calls mid-flight.
        const visionRes = await fetchT('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1500,
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
          const parsed = JSON.parse(clean);
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
          const visionSourced = [];
          // With a screenshot, the screenshot IS a valid source — hero text is
          // often an image/slider and won't appear in markdown. Only suppress
          // quotes when there's no screenshot to have read them from.
          if (parsed.heroHeadline && quoteChecks.heroHeadline === false) {
            if (screenshotUrl) { visionSourced.push('headline (read from screenshot, not in text)'); }
            else { unverifiedQuotes.push(`headline "${parsed.heroHeadline}" not found in page source`); parsed.heroHeadline = null; }
          }
          if (parsed.ctaText && quoteChecks.ctaText === false) {
            if (screenshotUrl) { visionSourced.push('CTA (read from screenshot, not in text)'); }
            else { unverifiedQuotes.push(`CTA "${parsed.ctaText}" not found in page source`); parsed.ctaText = null; }
          }
          if (unverifiedQuotes.length) {
            console.log('SOURCE VERIFY: suppressed unverified quotes:', unverifiedQuotes.join('; '));
          } else {
            console.log('SOURCE VERIFY: all quotes matched page source');
          }
          // Attach verification result so the frontend can show a trust badge
          parsed._quoteVerification = {
            checked: trustedContent.length > 100 || !!screenshotUrl,
            headlineVerified: quoteChecks.heroHeadline === true,
            ctaVerified: quoteChecks.ctaText === true,
            visionSourced,
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
            savingsEstimate: (() => {
              const se = parsed.savingsEstimate;
              if (!se || typeof se !== 'object') return null;
              const ml = Number(se.monthlyLow), mh = Number(se.monthlyHigh);
              let al = Number(se.annualLow), ah = Number(se.annualHigh);
              if (![ml,mh,al,ah].every(n => Number.isFinite(n) && n > 0)) return null;
              if (ml > mh || al > ah) return null;
              // Require a basis (the math) — no math shown, no number shown.
              if (!se.basis || se.basis.length < 10) return null;
              // ── DETERMINISTIC DEFENSIBILITY CEILING ──
              // The max savings our CONFIRMED inputs can support:
              //   labor: roles × $65k top salary × 80% automatable
              //   ads:   attributed ads × $2k/mo top placeholder × 40% waste × 12
              // If the Brain's number exceeds what the evidence supports, clamp it.
              const laborCap = (manualRoleCount || 0) * 65000 * 0.8;
              const adsCap = (fbAds.adCount || 0) * 2000 * 0.4 * 12;
              const ceiling = (laborCap + adsCap) * 1.15; // 15% slack for rounding
              if (ceiling > 0 && ah > ceiling) {
                console.log(`SAVINGS CLAMP: Brain claimed $${ah} annual, evidence supports max $${Math.round(ceiling)} — clamping`);
                ah = Math.round(ceiling);
                if (al > ah) al = Math.round(ah * 0.6);
              }
              // No confirmed input at all → no number, period.
              if (ceiling === 0) {
                console.log('SAVINGS REJECT: no confirmed dollar input (no roles, no attributed ads)');
                return null;
              }
              return {
                monthlyLow: Math.round(al/12), monthlyHigh: Math.round(ah/12),
                annualLow: Math.round(al), annualHigh: Math.round(ah),
                basis: se.basis,
                execution: se.execution || '',
              };
            })(),
          };
          console.log('Brain audit complete:', parsed.recommendedProduct, '|', parsed.realPain?.slice(0,60));

          // ── SELF-CRITIQUE CALL ─────────────────────────────────────────
          // Second Claude call reviews the first audit's claims against the
          // raw evidence — catches hallucinations, overstated numbers, unverified
          // findings. Runs text-only (no vision) so it's fast: ~5-8s.
          try {
            const critiquePrompt = `You are a quality-control auditor reviewing a marketing audit before it goes to a founder.

RAW EVIDENCE (what we actually confirmed):
- Company: ${company}
- Website: ${website || 'none'}
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
Savings estimate: ${parsed.savingsEstimate ? `$${parsed.savingsEstimate.annualLow}-$${parsed.savingsEstimate.annualHigh}/yr — basis: ${parsed.savingsEstimate.basis}` : 'none given'}

WHAT THE CRITIQUE MUST ACCEPT AS VALID (do NOT flag these):
- Any finding about visual elements, headline text, CTA buttons, design, layout, or above-fold content — these come from Claude's own vision analysis of a real screenshot and are valid even though you cannot see the image.
- Job posting counts — these are confirmed from the job board API.
- Any signal labeled "[Job-board signal]", "[SEC filing signal]", "[Site scan]", "[Ad Library]" — these are sourced.
- Estimates that are clearly framed as estimates ("est.", "roughly", "on the order of").

WHAT TO FLAG:
- Dollar figures stated as facts without an estimate label.
- Claims about what competitors are doing (we have no competitor data).
- Claims about internal company data (revenue, headcount, margins) unless from a confirmed source.
- Ad counts not attributed to the company specifically.
- Absence claims stated as facts ("they have no CRM") — acceptable only as "not detected on-page."
- Any specific named person other than what Hunter returned.
- A savings estimate whose basis doesn't match the confirmed inputs above (e.g. basis claims "6 roles" when the evidence shows 4 postings, or cites ad spend with zero attributed ads).

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
  "critiqueNote": "one sentence summary of biggest accuracy risk in this audit"
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
            const cClean = cText.replace(/```json|```/g, '').trim();
            const critique = JSON.parse(cClean);
            brainAudit.critique = {
              verifiedClaims: critique.verifiedClaims || [],
              flaggedClaims: critique.flaggedClaims || [],
              correctedPitchAngle: critique.correctedPitchAngle || parsed.pitchAngle,
              confidenceScore: critique.confidenceScore ?? 7,
              critiqueNote: critique.critiqueNote || '',
            };
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

  res.json(results);
});
