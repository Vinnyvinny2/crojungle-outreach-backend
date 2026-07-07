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
const fetchViaProxy = async (url, ms=10000) => {
  const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
  const r = await fetchT(proxyUrl, { headers: { 'Accept': 'application/json' } }, ms);
  const d = await safeJson(r);
  return d.contents || '';
};
const fetchT = (url, opts={}, ms=10000) => Promise.race([
  fetch(url, { ...opts, headers: { 'User-Agent': 'Mozilla/5.0 CROJungle/1.0', ...(opts.headers||{}) } }),
  new Promise((_,rej) => setTimeout(() => rej(new Error('timeout')), ms))
]);

app.get('/', (req, res) => res.json({ status: 'CROJungle Backend v6', sources: ['adzuna','sec_edgar','clutch_rss','google_news','reddit','product_hunt','pr_newswire'], ok: true }));

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

  const BLOCKED = [
    'google.','facebook.com','linkedin.com','twitter.com','instagram.com',
    'youtube.com','indeed.com','glassdoor.com','yelp.com','wikipedia.org',
    'bloomberg.com','crunchbase.com','pitchbook.com','zoominfo.com','apollo.io',
    'reddit.com','amazon.com','apple.com','microsoft.com','trustpilot.com',
    'bbb.org','clutch.co','g2.com','capterra.com','getapp.com','ziprecruiter.com',
    'monster.com','careerbuilder.com','simplyhired.com','salary.com','payscale.com',
    'sec.gov','irs.gov','usa.gov','github.com','producthunt.com','techcrunch.com',
    'forbes.com','businessinsider.com','wsj.com','nytimes.com','ft.com',
  ];

  const isBlocked = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.','').toLowerCase();
      return BLOCKED.some(b => domain.includes(b)) || domain.length < 4;
    } catch { return true; }
  };

  try {
    // Method 1: Try Clearbit free autocomplete API
    try {
      const r = await fetchT(
        `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(company)}`,
        { headers: { 'Accept': 'application/json' } },
        5000
      );
      const d = await safeJson(r);
      if (Array.isArray(d) && d.length > 0 && d[0].domain) {
        const website = `https://${d[0].domain}`;
        console.log(`Clearbit found: ${website}`);
        return res.json({ website, source: 'clearbit' });
      }
    } catch(e) { console.log('Clearbit lookup failed:', e.message); }

    // Method 2: DuckDuckGo instant answer (less likely to block than Google)
    try {
      const q = encodeURIComponent(`${company} official website`);
      const r = await fetchT(
        `https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1&no_html=1`,
        { headers: { 'Accept': 'application/json' } },
        6000
      );
      const d = await safeJson(r);
      const official = d.AbstractURL || d.OfficialWebsite || '';
      if (official && !isBlocked(official)) {
        const parsed = new URL(official);
        console.log(`DuckDuckGo found: ${parsed.origin}`);
        return res.json({ website: parsed.origin, source: 'duckduckgo' });
      }
      // Check related topics
      const topics = d.RelatedTopics || [];
      for (const t of topics) {
        const url = t.FirstURL || '';
        if (url && !isBlocked(url)) {
          try {
            const parsed = new URL(url);
            if (parsed.hostname.includes(company.toLowerCase().replace(/\s+/g,'').slice(0,6))) {
              return res.json({ website: parsed.origin, source: 'duckduckgo' });
            }
          } catch {}
        }
      }
    } catch(e) { console.log('DuckDuckGo failed:', e.message); }

    // Method 3: Google search as last resort with aggressive filtering
    try {
      const q = encodeURIComponent(`"${company}" official site`);
      const r = await fetchT(
        `https://www.google.com/search?q=${q}&num=10`,
        { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } },
        8000
      );
      const html = await safeText(r);
      const urlMatches = [...html.matchAll(/href="(https?:\/\/[^"&>]+)"/g)];
      for (const m of urlMatches) {
        const url = m[1];
        if (!isBlocked(url)) {
          try {
            const parsed = new URL(url);
            const domain = parsed.hostname.replace('www.','').toLowerCase();
            // Domain should somewhat match company name
            const companySlug = company.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8);
            const domainSlug = domain.split('.')[0].replace(/[^a-z0-9]/g,'');
            if (domainSlug.includes(companySlug.slice(0,4)) || companySlug.includes(domainSlug.slice(0,4))) {
              console.log(`Google found: ${parsed.origin}`);
              return res.json({ website: parsed.origin, source: 'google' });
            }
          } catch {}
        }
      }
    } catch(e) { console.log('Google search failed:', e.message); }

    console.log(`No website found for "${company}"`);
    res.json({ website: '' });
  } catch(e) {
    console.error('find-website error:', e.message);
    res.json({ website: '' });
  }
});

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 1: ADZUNA — runs searches IN PARALLEL
// Key fix: parallel not sequential = 3s not 90s
// ═══════════════════════════════════════════════════════════
const searchAdzuna = async (appId, appKey) => {
  if (!appId || !appKey) { console.log('Adzuna: no keys'); return []; }
  try {
    const searches = [
      // Marketing signals → retainer/website/landing page leads
      { title: 'marketing manager', isOps: false },
      { title: 'VP marketing', isOps: false },
      { title: 'head of marketing', isOps: false },
      { title: 'growth marketing', isOps: false },
      { title: 'demand generation', isOps: false },
      { title: 'performance marketing', isOps: false },
      // Ops signals → AI replacement / software build leads
      { title: 'operations manager', isOps: true },
      { title: 'customer service manager', isOps: true },
      { title: 'business analyst', isOps: true },
    ];

    // ALL IN PARALLEL — critical fix
    const results = await Promise.allSettled(
      searches.map(async ({ title, isOps }) => {
        const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=${encodeURIComponent(title)}&sort_by=date&max_days_old=30`;
        const r = await fetchT(url, { headers: { 'Accept': 'application/json' } }, 8000);
        if (!r.ok) { console.log(`Adzuna "${title}" ${r.status}`); return []; }
        const d = await safeJson(r);
        if (d.exception) { console.log(`Adzuna "${title}" exception:`, d.exception); return []; }
        const jobs = d.results || [];
        console.log(`Adzuna "${title}": ${jobs.length}`);
        return jobs.map(job => {
          if (!job.company?.display_name) return null;
          const salaryNum = job.salary_min || 0;
          return {
            name: job.company.display_name,
            website: '',
            location: job.location?.display_name || '',
            jobTitle: job.title || title,
            salary: salaryNum ? `$${Math.round(salaryNum/1000)}k-$${Math.round((job.salary_max||salaryNum)/1000)}k` : '',
            jobSnippet: (job.description||'').replace(/<[^>]+>/g,'').slice(0,150),
            source: isOps ? 'adzuna_ops' : 'adzuna_jobs',
            signals: {
              hiring_marketing: !isOps,
              hiring_ops: isOps,
              ai_replacement_signal: isOps,
              salary_high: salaryNum >= 90000,
              salary_mid: salaryNum >= 60000 && salaryNum < 90000,
              salary_low: salaryNum > 0 && salaryNum < 60000,
              salary_unknown: !salaryNum,
            },
          };
        }).filter(Boolean);
      })
    );

    const combined = results.flatMap(r => r.value || []);
    const seen = new Set();
    const unique = combined.filter(r => {
      const k = r.name.toLowerCase().trim();
      if (!k || seen.has(k)) return false;
      seen.add(k); return true;
    });
    console.log(`Adzuna total: ${unique.length} unique companies`);
    return unique;
  } catch(e) { console.error('Adzuna error:', e.message); return []; }
};

// ═══════════════════════════════════════════════════════════
// SIGNAL SOURCE 2: SEC EDGAR — real-time funding, no key needed
// ═══════════════════════════════════════════════════════════
const searchSECEdgar = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now()-30*24*60*60*1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const url = `https://efts.sec.gov/LATEST/search-index?q=%22marketing%22&dateRange=custom&startdt=${thirtyDaysAgo}&enddt=${today}&forms=D`;
    const r = await fetchT(url, { headers: { 'Accept': 'application/json' } }, 8000);
    const d = await safeJson(r);
    const results = (d.hits?.hits || []).slice(0,20).map(hit => {
      const src = hit._source || {};
      const name = src.entity_name || src.company_name || '';
      if (!name) return null;
      return { name: name.trim(), source: 'sec_edgar', signals: { raised_funding: true }, jobTitle: 'Form D filing — recently raised' };
    }).filter(Boolean);
    console.log(`SEC EDGAR: ${results.length}`);
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
  const queries = [
    'company hires "VP of Marketing" OR "CMO" OR "Head of Marketing" 2026',
    'startup raises "Series A" OR "Series B" funding 2026',
  ];
  for (const q of queries) {
    try {
      const r = await fetchT(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`, {}, 8000);
      const xml = await safeText(r);
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      items.slice(0,8).forEach(item => {
        const title = (item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/) || item.match(/<title>([^<]+)<\/title>/))?.[1] || '';
        const isFunding = /raises|Series [AB]|funded|closes/i.test(title);
        const isHire = /hires|appoints|CMO|VP marketing|head of marketing/i.test(title);
        if (!isFunding && !isHire) return;
        const m = title.match(/^([A-Z][A-Za-z0-9\s&\.]+?)(?:\s+(?:Raises|Hires|Appoints|Closes|Names|Secures))/);
        if (m && m[1].length > 2 && m[1].length < 50) {
          results.push({ name: m[1].trim(), source: isFunding?'news_funding':'news_hire', jobTitle: title.slice(0,80), signals: { raised_funding: isFunding, hiring_marketing: isHire } });
        }
      });
    } catch(e) { /* silent */ }
  }
  console.log(`Google News: ${results.length}`);
  return results;
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
    const r = await fetchT('https://www.prnewswire.com/rss/news-releases-list.rss', {}, 8000);
    const xml = await safeText(r);
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
app.post('/api/discover', async (req, res) => {
  const { keywords, keys } = req.body;
  const { adzunaId, adzunaKey } = keys || {};

  console.log('\n=== DISCOVERY START ===');
  console.log('Keywords:', keywords);
  console.log('Adzuna keys present:', !!(adzunaId && adzunaKey));

  try {
    // ALL 7 sources fire simultaneously
    const [adzunaRes, secRes, clutchRes, newsRes, redditRes, phRes, prRes] = await Promise.allSettled([
      searchAdzuna(adzunaId, adzunaKey),
      searchSECEdgar(),
      scrapeClutchRSS(),
      scrapeGoogleNews(),
      scrapeReddit(),
      scrapeProductHunt(),
      scrapePRNewswire(),
    ]);

    const allCompanies = [
      ...(adzunaRes.value || []),
      ...(secRes.value || []),
      ...(clutchRes.value || []),
      ...(newsRes.value || []),
      ...(redditRes.value || []),
      ...(phRes.value || []),
      ...(prRes.value || []),
    ];

    console.log('Raw total:', allCompanies.length);

    // Deduplicate
    const seen = new Set();
    const unique = allCompanies.filter(c => {
      const key = (c.name||'').toLowerCase().trim();
      if (!key || key.length < 2 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Score — full 100 point scale
    // Discovery signals give a pre-research score
    // Higher signals = more confident ICP match
    const WEIGHTS = {
      // Stage 4 signals — hottest, in market NOW
      agency_review: 45,        // Just fired/reviewing agency — hottest possible
      social_pain_signal: 35,   // Founder venting publicly right now
      founder_venting: 10,      // Additional venting bonus
      // Stage 3-4 signals — actively in motion
      hiring_marketing: 30,     // Posting marketing role = active pain
      salary_high: 20,          // High salary = real budget
      raised_funding: 25,       // Has money, needs to deploy on growth
      // Stage 3 signals — aware, researching
      ai_replacement_signal: 25, // Ops hire = AI replacement opportunity
      hiring_ops: 10,
      tool_frustration: 20,     // Switching marketing software
      // Stage 5 signals — just launched
      recently_launched: 15,
      needs_marketing: 10,
      expanding: 12,
      // Salary modifiers
      salary_mid: 10,
      salary_low: 5,
      salary_unknown: 5,
    };

    const scored = unique
      .map(c => {
        const raw = Object.entries(c.signals||{}).reduce((t,[k,v])=>v?t+(WEIGHTS[k]||0):t, 0);
        const icpScore = Math.min(Math.round(raw), 85); // cap at 85 before research adds final 15
        return { ...c, icpScore };
      })
      .sort((a,b) => b.icpScore - a.icpScore)
      .slice(0, 50);

    // Breakdown by source
    const breakdown = {};
    scored.forEach(c => { breakdown[c.source] = (breakdown[c.source]||0)+1; });

    console.log('Unique:', unique.length, '| Returning:', scored.length);
    console.log('Breakdown:', breakdown);
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

const checkPageSpeed = async (url) => {
  try {
    const r = await fetchT(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`, {}, 12000);
    const d = await safeJson(r);
    const score = d.lighthouseResult?.categories?.performance?.score;
    return { mobileScore: score ? Math.round(score*100) : null, lcp: d.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue||null, confirmed: !!score };
  } catch { return { mobileScore: null, confirmed: false }; }
};

const checkBuiltWith = async (domain) => {
  try {
    const clean = domain.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','');
    const r = await fetchT(`https://builtwith.com/${clean}`, {}, 8000);
    const html = await safeText(r);
    return {
      hasCRM: /hubspot|salesforce|marketo|pipedrive|zoho crm/i.test(html),
      hasEmailMarketing: /mailchimp|klaviyo|activecampaign|constant contact/i.test(html),
      hasPixel: /facebook pixel|google analytics|gtag|hotjar|mixpanel/i.test(html),
      hasVideo: /wistia|vimeo|youtube/i.test(html),
      hasChat: /intercom|drift|crisp|zendesk/i.test(html),
      confirmed: true,
    };
  } catch { return { hasCRM:false, hasEmailMarketing:false, hasPixel:false, hasVideo:false, hasChat:false, confirmed:false }; }
};

const checkGoogleAds = async (domain) => {
  try {
    const clean = domain.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','');
    const r = await fetchT(`https://adstransparency.google.com/advertiser?domain=${clean}&region=US`, {}, 8000);
    const html = await safeText(r);
    return { hasGoogleAds: html.length > 50000 || html.includes('ad-card'), confirmed: true };
  } catch { return { hasGoogleAds: false, confirmed: false }; }
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
  const { company, website, keys } = req.body;
  const { firecrawlKey, hunterKey, fbToken } = keys || {};
  if (!company) return res.status(400).json({ error: 'Company name required' });

  const domain = website ? website.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','') : '';
  console.log(`Research: ${company} | ${website||'no website'}`);

  try {
    // All signals fire simultaneously
    const [homepageRes, emailRes, googleAdsRes, fbAdsRes, pageSpeedRes, builtWithRes] = await Promise.allSettled([
      website && firecrawlKey
        ? fetchT('https://api.firecrawl.dev/v1/scrape', { method:'POST', headers:{'Authorization':`Bearer ${firecrawlKey}`,'Content-Type':'application/json'}, body: JSON.stringify({url:website,formats:['markdown'],onlyMainContent:true}) }, 12000).then(r=>r.json()).catch(()=>({data:{markdown:''}}))
        : Promise.resolve({data:{markdown:''}}),
      domain && hunterKey ? getFounderEmail(domain, hunterKey) : Promise.resolve({email:'',founderName:''}),
      domain ? checkGoogleAds(domain) : Promise.resolve({hasGoogleAds:false}),
      fbToken ? checkFacebookAds(company, fbToken) : Promise.resolve({hasAds:false,ads:[]}),
      website ? checkPageSpeed(website) : Promise.resolve({mobileScore:null}),
      domain ? checkBuiltWith(domain) : Promise.resolve({hasCRM:false}),
    ]);

    const content = homepageRes.value?.data?.markdown || homepageRes.value?.markdown || '';
    const email = emailRes.value || {};
    const googleAds = googleAdsRes.value || {};
    const fbAds = fbAdsRes.value || {};
    const pageSpeed = pageSpeedRes.value || {};
    const builtWith = builtWithRes.value || {};

    // Homepage analysis
    const hasCTA = /call|contact|get started|book|schedule|buy|request|demo|try|sign up|free trial/i.test(content.slice(0,3000));
    const hasWeakHeadline = /^welcome to|we are a|we provide|we help businesses|we offer/i.test(content.slice(0,300));
    const hasTestimonials = /testimonial|review|client said|case study|trusted by|customers say/i.test(content);
    const hasPricing = /pricing|plans|per month|subscription|\$/i.test(content);
    const hasVideo = /video|youtube|vimeo|wistia/i.test(content);
    const hasAgency = /powered by|designed by|marketing by/i.test(content);

    // Dunford positioning score
    const positioningScore = (() => {
      let s = 0;
      if (!hasWeakHeadline) s+=2;
      if (content.slice(0,1000).match(/for\s+\w+\s+(who|that|with)/i)) s+=2;
      if (hasTestimonials) s+=2;
      if (content.match(/unlike|instead of|compared to|vs\./i)) s+=2;
      if (hasPricing) s+=1;
      if (hasVideo) s+=1;
      return Math.min(s, 10);
    })();

    // 4 Buckets
    const buckets = {
      ACQUISITION: {
        googleAds: googleAds.hasGoogleAds ? 'Running Google Ads — confirmed' : 'No Google Ads detected',
        facebookAds: fbAds.hasAds ? `${fbAds.ads.length} active Facebook ads` : 'No Facebook ads running',
        fbAdAge: fbAds.ads?.length > 0 ? `Longest running: ${Math.max(...fbAds.ads.map(a=>a.runningDays))} days` : '',
        staleFbAds: fbAds.ads?.some(a=>a.runningDays>180) ? 'Warning: ads running 6+ months without refresh' : '',
      },
      CONVERSION: {
        hasCTA: hasCTA ? 'CTA present above fold' : 'No clear CTA detected above fold',
        headline: hasWeakHeadline ? 'Generic headline detected — no differentiation' : 'Headline appears specific',
        socialProof: hasTestimonials ? 'Testimonials/case studies present' : 'No social proof detected',
        pricing: hasPricing ? 'Pricing visible' : 'No pricing shown — creates friction',
        mobileScore: pageSpeed.mobileScore ? `${pageSpeed.mobileScore}/100 mobile score` : 'Mobile score unavailable',
        lcp: pageSpeed.lcp ? `Load time: ${pageSpeed.lcp}` : '',
        positioningScore: `Dunford positioning: ${positioningScore}/10`,
      },
      AUTHORITY: {
        agencyFooter: hasAgency ? 'Agency relationship detected in footer' : 'No agency footer detected',
        video: hasVideo ? 'Video content present' : 'No video content detected',
        linkedinNote: 'Check LinkedIn manually for CMO presence and last post date',
      },
      INFRASTRUCTURE: {
        crm: builtWith.hasCRM ? 'CRM detected' : 'No CRM detected',
        emailMarketing: builtWith.hasEmailMarketing ? 'Email marketing tool active' : 'No email marketing detected',
        trackingPixel: builtWith.hasPixel ? 'Analytics/pixel present' : 'No tracking pixel detected',
        chat: builtWith.hasChat ? 'Live chat present' : 'No live chat detected',
        video: builtWith.hasVideo ? 'Video hosting detected' : '',
      },
    };

    // Flaws
    const flaws = [];
    if (!hasCTA) flaws.push('no_cta');
    if (hasWeakHeadline) flaws.push('weak_hero');
    if (!hasTestimonials) flaws.push('no_social_proof');
    if (!builtWith.hasCRM) flaws.push('no_crm');
    if (!builtWith.hasPixel) flaws.push('no_tracking');
    if (!googleAds.hasGoogleAds) flaws.push('no_google_ads');
    if (!fbAds.hasAds) flaws.push('no_fb_ads');
    else if (fbAds.ads?.some(a=>a.runningDays>180)) flaws.push('stale_fb_ads');
    if (pageSpeed.mobileScore && pageSpeed.mobileScore < 50) flaws.push('slow_mobile');
    if (positioningScore < 5) flaws.push('weak_positioning');

    // Top pain
    const painMap = [
      { id:'no_cta', pain:'No CTA above fold — visitors arrive and have nowhere to go', opportunity:'Landing page or homepage rebuild', product:'Website Rebuild', price:'$10k–$25k' },
      { id:'weak_positioning', pain:`Positioning ${positioningScore}/10 — generic messaging any competitor could use`, opportunity:'Brand positioning + website rewrite', product:'Website Rebuild', price:'$15k–$40k' },
      { id:'stale_fb_ads', pain:'Same Facebook ads running 6+ months — creative fatigue killing performance', opportunity:'Ad creative refresh + landing page', product:'Landing Page + Ads', price:'$10k–$20k' },
      { id:'no_crm', pain:'No CRM detected — leads are falling through the cracks with no system to catch them', opportunity:'CRM + marketing automation setup', product:'Growth Retainer', price:'$8k–$15k/month' },
      { id:'no_tracking', pain:'No tracking pixel — spending on marketing with no way to measure what works', opportunity:'Analytics + tracking infrastructure', product:'Growth Retainer', price:'$8k–$15k/month' },
      { id:'slow_mobile', pain:`Mobile score ${pageSpeed.mobileScore}/100 — majority of traffic leaves before seeing the offer`, opportunity:'Site speed + mobile rebuild', product:'Website Rebuild', price:'$10k–$25k' },
      { id:'no_google_ads', pain:'No Google Ads — competitors are capturing demand this company cannot see', opportunity:'Paid search + landing pages', product:'Growth Retainer', price:'$8k–$20k/month' },
      { id:'no_social_proof', pain:'No testimonials or case studies — buyers cannot verify claims before buying', opportunity:'Social proof system', product:'Website Rebuild', price:'$8k–$20k' },
      { id:'weak_hero', pain:'Homepage headline does not differentiate from a single competitor', opportunity:'Positioning + homepage rewrite', product:'Website Rebuild', price:'$10k–$30k' },
    ];
    const topPain = painMap.find(p => flaws.includes(p.id));

    // Recommended product
    const getRecommendedProduct = () => {
      const hasAdSpend = googleAds.hasGoogleAds || fbAds.hasAds;
      const hasInfra = builtWith.hasCRM || builtWith.hasPixel;
      // Already spending + missing infrastructure = retainer
      if (hasAdSpend && !hasInfra) return { product:'Growth Retainer', price:'$8k–$35k/month', reason:'Already spending on ads but missing the infrastructure to track, nurture and convert — revenue is leaking', flag:'⚠ Needs CEO retainer proof points in Settings' };
      // No marketing tech at all + complex site = AI Brain
      if (!builtWith.hasCRM && !builtWith.hasPixel && !builtWith.hasEmailMarketing && content.length > 2000) return { product:'AI Brain', price:'$40k–$70k', reason:'Digital presence has no intelligence layer — disconnected systems, no automation, no tracking', flag:'⚠ Needs CEO AI Brain examples in Settings' };
      // Bad website = website rebuild
      if (flaws.includes('no_cta') || positioningScore < 5 || (pageSpeed.mobileScore && pageSpeed.mobileScore < 40)) return { product:'Website Rebuild', price:'$10k–$25k', reason:'Homepage has critical conversion failures — fastest win and opens the door to bigger work', flag:'' };
      // Running ads with no landing page = landing page
      if (hasAdSpend && flaws.includes('no_cta')) return { product:'Landing Page', price:'$5k–$15k', reason:'Running ads with no dedicated landing page — immediate ROI fix', flag:'' };
      // Default
      return { product:'Website / Landing Page', price:'$5k–$25k', reason:'Homepage conversion gaps identified — start here then expand', flag:'' };
    };

    const recommendedProduct = getRecommendedProduct();

    console.log(`Research complete: ${company} | ${flaws.length} flaws | ${recommendedProduct.product}`);

    res.json({
      email: email.email||'',
      founderName: email.founderName||'',
      founderTitle: email.title||'',
      buckets, flaws, topPain, positioningScore, recommendedProduct,
      signals: { no_cta:!hasCTA, weak_positioning:positioningScore<5, no_crm:!builtWith.hasCRM, no_tracking:!builtWith.hasPixel },
      homepageContent: content.slice(0,3000),
      richData: {
        googleAds: buckets.ACQUISITION.googleAds,
        fbAds: buckets.ACQUISITION.facebookAds,
        mobileScore: buckets.CONVERSION.mobileScore,
        hasCRM: buckets.INFRASTRUCTURE.crm,
        hasPixel: buckets.INFRASTRUCTURE.trackingPixel,
        positioningScore: buckets.CONVERSION.positioningScore,
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
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${adzunaId}&app_key=${adzunaKey}&results_per_page=3&what=marketing+manager&sort_by=date`;
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

  // Test Clutch RSS
  try {
    const r = await fetchT('https://clutch.co/feed', {}, 6000);
    const xml = await safeText(r);
    const items = (xml.match(/<item>/g)||[]).length;
    results.clutch_rss = { ok: items > 0, count: items };
  } catch(e) { results.clutch_rss = { ok: false, error: e.message }; }

  // Test Google News RSS
  try {
    const r = await fetchT('https://news.google.com/rss/search?q=company+hires+CMO&hl=en-US&gl=US&ceid=US:en', {}, 6000);
    const xml = await safeText(r);
    const items = (xml.match(/<item>/g)||[]).length;
    results.google_news = { ok: items > 0, count: items };
  } catch(e) { results.google_news = { ok: false, error: e.message }; }

  // Test Reddit
  try {
    const r = await fetchT('https://www.reddit.com/r/entrepreneur/search.json?q=marketing+agency&sort=new&limit=5&restrict_sr=1', { headers: { 'User-Agent': 'CROJungle/1.0' } }, 6000);
    const d = await safeJson(r);
    const count = d?.data?.children?.length || 0;
    results.reddit = { ok: count > 0, count };
  } catch(e) { results.reddit = { ok: false, error: e.message }; }

  // Test Product Hunt RSS
  try {
    const r = await fetchT('https://www.producthunt.com/feed', {}, 6000);
    const xml = await safeText(r);
    const items = (xml.match(/<item>/g)||[]).length;
    results.product_hunt = { ok: items > 0, count: items };
  } catch(e) { results.product_hunt = { ok: false, error: e.message }; }

  // Test Hunter.io
  if (hunterKey) {
    try {
      const r = await fetchT(`https://api.hunter.io/v2/account?api_key=${hunterKey}`, {}, 6000);
      const d = await safeJson(r);
      results.hunter = { ok: !!d.data, requests_remaining: d.data?.requests?.searches?.available || 0, error: d.errors?.[0]?.details || null };
    } catch(e) { results.hunter = { ok: false, error: e.message }; }
  } else { results.hunter = { ok: false, error: 'No key provided' }; }

  // Test Crunchbase
  if (crunchbaseKey) {
    try {
      const r = await fetchT(`https://api.crunchbase.com/api/v4/entities/organizations/apple?card_ids=fields&field_ids=short_description&user_key=${crunchbaseKey}`, {}, 6000);
      results.crunchbase = { ok: r.ok, status: r.status, error: r.ok ? null : 'Invalid key or no access' };
    } catch(e) { results.crunchbase = { ok: false, error: e.message }; }
  } else { results.crunchbase = { ok: false, error: 'No key provided' }; }

  // Test PR Newswire RSS
  try {
    const r = await fetchT('https://www.prnewswire.com/rss/news-releases-list.rss', {}, 6000);
    const xml = await safeText(r);
    const items = (xml.match(/<item>/g)||[]).length;
    results.pr_newswire = { ok: items > 0, count: items };
  } catch(e) { results.pr_newswire = { ok: false, error: e.message }; }

  // Test backend itself
  results.backend = { ok: true, version: 'v6' };

  res.json(results);
});
