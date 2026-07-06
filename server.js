require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '10mb' }));

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'CROJungle Backend Running', version: '2.0.0' }));

// ── HELPERS ───────────────────────────────────────────────
const safeJson = async (response) => {
  try { return await response.json(); } catch { return {}; }
};

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
const fetchWithTimeout = (url, opts = {}, ms = 10000) => Promise.race([fetch(url, opts), timeout(ms)]);

// ── ANTHROPIC PROXY ───────────────────────────────────────
app.post('/api/claude', async (req, res) => {
  try {
    const { system, user, apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API key required' });
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 6000, system, messages: [{ role: 'user', content: user }] }),
    });
    const data = await safeJson(response);
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
    res.json({ text: data.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── FIRECRAWL PROXY ───────────────────────────────────────
app.post('/api/scrape', async (req, res) => {
  try {
    const { url, firecrawlKey } = req.body;
    if (!url || !firecrawlKey) return res.status(400).json({ error: 'URL and key required' });
    const response = await fetchWithTimeout('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
    }, 15000);
    const data = await safeJson(response);
    res.json({ markdown: (data.data?.markdown || '').slice(0, 5000) });
  } catch (error) {
    res.json({ markdown: '' });
  }
});

// ── HUNTER.IO PROXY ───────────────────────────────────────
app.get('/api/email', async (req, res) => {
  try {
    const { domain, hunterKey } = req.query;
    if (!domain || !hunterKey) return res.status(400).json({ error: 'Domain and key required' });
    const clean = domain.replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '');
    const response = await fetchWithTimeout(`https://api.hunter.io/v2/domain-search?domain=${clean}&type=personal&limit=5&api_key=${hunterKey}`);
    const data = await safeJson(response);
    const emails = data.data?.emails || [];
    const priority = ['ceo','founder','co-founder','owner','president','cmo'];
    const sorted = emails.sort((a, b) => {
      const aS = priority.findIndex(p => (a.position||'').toLowerCase().includes(p));
      const bS = priority.findIndex(p => (b.position||'').toLowerCase().includes(p));
      return (aS === -1 ? 99 : aS) - (bS === -1 ? 99 : bS);
    });
    const best = sorted[0];
    res.json({
      email: best?.value || '',
      founderName: `${best?.first_name||''} ${best?.last_name||''}`.trim(),
      title: best?.position || '',
      all: sorted.slice(0,3).map(e => ({ email: e.value, name: `${e.first_name} ${e.last_name}`.trim(), title: e.position })),
    });
  } catch (error) {
    res.json({ email: '', founderName: '', title: '' });
  }
});

// ── SPYFU SCRAPE ──────────────────────────────────────────
const scrapeSpyFu = async (domain) => {
  try {
    const clean = domain.replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.','');
    // SpyFu public domain overview page
    const url = `https://www.spyfu.com/overview/domain?query=${clean}`;
    const response = await fetchWithTimeout(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    }, 8000);
    const html = await response.text();

    // Extract key metrics from SpyFu HTML
    const adBudgetMatch = html.match(/\$[\d,]+(?:\s*\/\s*mo)?(?=.*(?:ad budget|monthly budget|paid budget))/i);
    const paidClicksMatch = html.match(/([\d,]+)\s*(?:paid clicks|monthly paid)/i);
    const organicClicksMatch = html.match(/([\d,]+)\s*(?:organic clicks|monthly organic)/i);
    const paidKeywordsMatch = html.match(/([\d,]+)\s*(?:paid keywords|keywords they buy)/i);

    return {
      adBudget: adBudgetMatch ? adBudgetMatch[0] : null,
      paidClicks: paidClicksMatch ? paidClicksMatch[1] : null,
      organicClicks: organicClicksMatch ? organicClicksMatch[1] : null,
      paidKeywords: paidKeywordsMatch ? paidKeywordsMatch[1] : null,
      runningAds: html.includes('paid') && (adBudgetMatch || paidKeywordsMatch),
      url,
    };
  } catch { return { runningAds: false, error: 'SpyFu unavailable' }; }
};

// ── FACEBOOK AD LIBRARY ───────────────────────────────────
const checkFacebookAds = async (companyName, fbToken) => {
  if (!fbToken) return { ads: [], hasAds: false, error: 'No Facebook token' };
  try {
    const url = `https://graph.facebook.com/v19.0/ads_archive?access_token=${fbToken}&ad_reached_countries=US&ad_active_status=ACTIVE&search_terms=${encodeURIComponent(companyName)}&fields=page_name,ad_creative_body,ad_delivery_start_time&limit=10`;
    const response = await fetchWithTimeout(url, {}, 8000);
    const data = await safeJson(response);
    if (data.error) return { ads: [], hasAds: false, error: data.error.message };
    const ads = (data.data || []).map(ad => ({
      pageName: ad.page_name,
      copy: ad.ad_creative_body || '',
      runningDays: ad.ad_delivery_start_time
        ? Math.floor((Date.now() - new Date(ad.ad_delivery_start_time)) / 86400000)
        : 0,
    }));
    return { ads, hasAds: ads.length > 0 };
  } catch { return { ads: [], hasAds: false, error: 'Facebook API error' }; }
};

// ── INDEED JOBS SEARCH ────────────────────────────────────
const searchIndeedJobs = async (keyword, indeedKey) => {
  if (!indeedKey) return { jobs: [], error: 'No Indeed key' };
  try {
    const q = encodeURIComponent(`marketing manager ${keyword}`);
    const url = `https://api.indeed.com/ads/apisearch?publisher=${indeedKey}&q=${q}&sort=date&limit=20&fromage=30&co=us&userip=1.2.3.4&useragent=Mozilla&v=2&format=json`;
    const response = await fetchWithTimeout(url, {}, 8000);
    const data = await safeJson(response);
    return {
      jobs: (data.results || []).map(job => {
        const salaryMatch = (job.snippet || '').match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/i);
        return {
          company: job.company || '',
          website: (() => { try { return new URL(job.url).hostname.replace('www.',''); } catch { return ''; } })(),
          location: `${job.city||''}, ${job.state||''}`,
          title: job.jobtitle || '',
          salary: salaryMatch ? salaryMatch[0] : '',
          datePosted: job.date || '',
        };
      }),
    };
  } catch { return { jobs: [], error: 'Indeed API error' }; }
};

// ── CRUNCHBASE SEARCH ─────────────────────────────────────
const searchCrunchbase = async (keyword, cbKey) => {
  if (!cbKey) return { companies: [], error: 'No Crunchbase key' };
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0];
    const response = await fetchWithTimeout('https://api.crunchbase.com/api/v4/searches/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-cb-user-key': cbKey },
      body: JSON.stringify({
        field_ids: ['name','website_url','short_description','num_employees_enum','founded_on','last_funding_type'],
        query: [
          { type: 'predicate', field_id: 'facet_ids', operator_id: 'includes', values: ['company'] },
          { type: 'predicate', field_id: 'short_description', operator_id: 'contains', values: [keyword] },
          { type: 'predicate', field_id: 'last_funding_at', operator_id: 'gte', values: [ninetyDaysAgo] },
        ],
        order: [{ field_id: 'last_funding_at', sort_dir: 'desc' }],
        limit: 10,
      }),
    }, 8000);
    const data = await safeJson(response);
    return {
      companies: (data.entities || []).map(e => ({
        name: e.properties?.name || '',
        website: e.properties?.website_url || '',
        description: e.properties?.short_description || '',
        employees: e.properties?.num_employees_enum || '',
        founded: e.properties?.founded_on?.value || '',
        fundingType: e.properties?.last_funding_type || '',
        signals: { raised_funding: true },
      })),
    };
  } catch { return { companies: [], error: 'Crunchbase error' }; }
};

// ── CLEARBIT ENRICHMENT ───────────────────────────────────
const enrichClearbit = async (domain, clearbitKey) => {
  if (!domain || !clearbitKey) return {};
  try {
    const clean = domain.replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.','');
    const response = await fetchWithTimeout(`https://company.clearbit.com/v2/companies/find?domain=${clean}`, {
      headers: { 'Authorization': `Bearer ${clearbitKey}` },
    }, 8000);
    if (!response.ok) return {};
    const data = await safeJson(response);
    return {
      employees: data.metrics?.employees || 0,
      estimatedRevenue: data.metrics?.estimatedAnnualRevenue || '',
      industry: data.category?.industry || '',
      founded: data.foundedYear || '',
      location: data.location || '',
      description: data.description || '',
      tech: (data.tech || []).slice(0, 10),
      hasCRM: (data.tech || []).some(t => ['hubspot','salesforce','marketo','pipedrive'].includes(t.toLowerCase())),
    };
  } catch { return {}; }
};

// ── BUILTWITH SCRAPE ──────────────────────────────────────
const checkBuiltWith = async (domain) => {
  try {
    const clean = domain.replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.','');
    const response = await fetchWithTimeout(`https://builtwith.com/${clean}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    }, 8000);
    const html = await response.text();
    const hasCRM = /hubspot|salesforce|marketo|pipedrive|zoho/i.test(html);
    const hasPixel = /facebook pixel|google analytics|gtag|hotjar|mixpanel/i.test(html);
    const hasChat = /intercom|drift|crisp|zendesk chat|tidio/i.test(html);
    const hasMarketing = /mailchimp|klaviyo|activecampaign|constant contact/i.test(html);
    return { hasCRM, hasPixel, hasChat, hasMarketing };
  } catch { return { hasCRM: false, hasPixel: false, hasChat: false, hasMarketing: false }; }
};

// ── MASTER AUTO-RESEARCH ORCHESTRATOR ────────────────────
// This is the core endpoint — fires all signals simultaneously
app.post('/api/research', async (req, res) => {
  const { company, website, keys } = req.body;
  const { firecrawlKey, hunterKey, fbToken, indeedKey, clearbitKey } = keys || {};

  if (!company) return res.status(400).json({ error: 'Company name required' });

  const domain = website ? website.replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.','') : '';

  try {
    // Fire ALL signals simultaneously
    const [
      homepageData,
      emailData,
      spyfuData,
      fbAdsData,
      builtWithData,
      clearbitData,
    ] = await Promise.allSettled([
      website ? fetch(`${req.protocol}://${req.get('host')}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: website, firecrawlKey }),
      }).then(r => r.json()).catch(() => ({ markdown: '' })) : Promise.resolve({ markdown: '' }),

      domain && hunterKey ? fetch(`${req.protocol}://${req.get('host')}/api/email?domain=${domain}&hunterKey=${hunterKey}`)
        .then(r => r.json()).catch(() => ({})) : Promise.resolve({}),

      domain ? scrapeSpyFu(domain) : Promise.resolve({}),
      checkFacebookAds(company, fbToken),
      domain ? checkBuiltWith(domain) : Promise.resolve({}),
      domain && clearbitKey ? enrichClearbit(domain, clearbitKey) : Promise.resolve({}),
    ]);

    const homepage = homepageData.value || {};
    const email = emailData.value || {};
    const spyfu = spyfuData.value || {};
    const fbAds = fbAdsData.value || {};
    const builtWith = builtWithData.value || {};
    const clearbit = clearbitData.value || {};

    // Detect signals from all data
    const signals = {
      running_google_ads: spyfu.runningAds || false,
      no_fb_ads: !fbAds.hasAds,
      running_fb_ads: fbAds.hasAds || false,
      has_website: !!website,
      no_cta: homepage.markdown ? !/call|contact|get|start|book|schedule|buy|request|demo|try|sign/i.test(homepage.markdown.slice(0,2000)) : false,
      weak_hero: homepage.markdown ? /welcome to|home page|we are|we provide/i.test(homepage.markdown.slice(0,500)) : false,
      no_social_proof: homepage.markdown ? !/testimonial|review|client|customer|case study|trusted|rating/i.test(homepage.markdown) : false,
      no_tracking: !builtWith.hasPixel,
      has_crm: builtWith.hasCRM || clearbit.hasCRM || false,
      agency_in_footer: homepage.markdown ? /powered by|marketing by|designed by|built by/i.test(homepage.markdown) : false,
      no_cmo_detected: true, // default — LinkedIn check is manual
      revenue_in_range: clearbit.estimatedRevenue ? true : false,
      fifty_to_500_emp: clearbit.employees >= 50 && clearbit.employees <= 500,
      five_plus_years: clearbit.founded ? (new Date().getFullYear() - parseInt(clearbit.founded)) >= 5 : false,
    };

    // Identify specific flaws
    const flaws = [];
    if (signals.running_google_ads && !spyfu.adBudget) flaws.push('bad_google_ads');
    if (!signals.running_fb_ads) flaws.push('no_fb_ads');
    if (signals.no_cta) flaws.push('no_cta');
    if (signals.weak_hero) flaws.push('weak_hero');
    if (signals.no_social_proof) flaws.push('no_social_proof');
    if (signals.no_tracking) flaws.push('no_tracking');

    // Build rich data summary
    const richData = {
      adSpend: spyfu.adBudget ? `$${spyfu.adBudget}/month Google Ads` : (spyfu.runningAds ? 'Running Google Ads — budget unclear' : 'No Google Ads detected'),
      seoTraffic: spyfu.organicClicks ? `${spyfu.organicClicks} monthly organic clicks` : 'Unknown',
      fbAds: fbAds.hasAds ? `${fbAds.ads.length} active Facebook ads` : 'No Facebook ads running',
      fbAdDetail: fbAds.ads.length > 0 ? fbAds.ads.map(a => `"${a.copy.slice(0,100)}" (running ${a.runningDays} days)`).join(' | ') : '',
      techStack: builtWith.hasCRM ? 'Has CRM' : 'No CRM detected',
      hasPixel: builtWith.hasPixel ? 'Has tracking pixel' : 'No tracking pixel detected',
      homepageNote: homepage.markdown ? 'Homepage auto-scraped' : 'Homepage unavailable',
      employees: clearbit.employees || '',
      revenue: clearbit.estimatedRevenue || '',
      industry: clearbit.industry || '',
      founded: clearbit.founded || '',
    };

    res.json({
      email: email.email || '',
      founderName: email.founderName || '',
      founderTitle: email.title || '',
      signals,
      flaws,
      richData,
      homepageContent: homepage.markdown || '',
      spyfu,
      fbAds,
      builtWith,
      clearbit,
      completedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Research orchestrator error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── COMPANY DISCOVERY ─────────────────────────────────────
app.post('/api/discover', async (req, res) => {
  const { keywords, keys } = req.body;
  const { indeedKey, fbToken, crunchbaseKey } = keys || {};

  if (!keywords || !keywords.length) return res.status(400).json({ error: 'Keywords required' });

  try {
    const allCompanies = [];

    // Run all discovery sources in parallel
    const discoveries = await Promise.allSettled(
      keywords.slice(0,3).map(async (keyword) => {
        const [indeedResult, fbResult, cbResult] = await Promise.allSettled([
          searchIndeedJobs(keyword, indeedKey),
          checkFacebookAds(keyword, fbToken),
          searchCrunchbase(keyword, crunchbaseKey),
        ]);

        const companies = [];

        // From Indeed — companies hiring marketing
        if (indeedResult.value?.jobs) {
          indeedResult.value.jobs.forEach(job => {
            if (job.company) companies.push({
              name: job.company,
              website: job.website ? `https://${job.website}` : '',
              location: job.location,
              source: 'indeed_hiring',
              jobTitle: job.title,
              salaryText: job.salary,
              signals: {
                hiring_marketing: true,
                salary_high: job.salary && parseInt(job.salary.replace(/[$,]/g,'')) >= 90000,
                salary_mid: job.salary && parseInt(job.salary.replace(/[$,]/g,'')) >= 60000 && parseInt(job.salary.replace(/[$,]/g,'')) < 90000,
                salary_low: job.salary && parseInt(job.salary.replace(/[$,]/g,'')) < 60000,
                salary_unknown: !job.salary,
              },
            });
          });
        }

        // From Facebook Ads — companies actively running ads
        if (fbResult.value?.ads) {
          fbResult.value.ads.forEach(ad => {
            if (ad.pageName) companies.push({
              name: ad.pageName,
              source: 'facebook_ads',
              signals: {
                running_fb_ads: true,
                stale_creative: ad.runningDays > 180,
              },
            });
          });
        }

        // From Crunchbase — recently funded
        if (cbResult.value?.companies) {
          cbResult.value.companies.forEach(co => {
            companies.push({ ...co, source: 'crunchbase_funding' });
          });
        }

        return companies;
      })
    );

    discoveries.forEach(d => { if (d.value) allCompanies.push(...d.value); });

    // Deduplicate by company name
    const seen = new Set();
    const unique = allCompanies.filter(c => {
      const key = c.name.toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({ companies: unique, total: unique.length });

  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── FACEBOOK AD LIBRARY PROXY ─────────────────────────────
app.get('/api/ads/facebook', async (req, res) => {
  try {
    const { keyword, fbToken } = req.query;
    const result = await checkFacebookAds(keyword, fbToken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── INDEED PROXY ──────────────────────────────────────────
app.get('/api/jobs/indeed', async (req, res) => {
  try {
    const { keyword, indeedKey } = req.query;
    const result = await searchIndeedJobs(keyword, indeedKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── CRUNCHBASE PROXY ──────────────────────────────────────
app.post('/api/companies/crunchbase', async (req, res) => {
  try {
    const { keyword, crunchbaseKey } = req.body;
    const result = await searchCrunchbase(keyword, crunchbaseKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`CROJungle backend v2 running on port ${PORT}`));
