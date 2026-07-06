require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '10mb' }));

// ── HELPERS ───────────────────────────────────────────────
const safeJson = async (r) => { try { return await r.json(); } catch { return {}; } };
const fetchT = (url, opts={}, ms=12000) => Promise.race([fetch(url, opts), new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);

// ── HEALTH ────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'CROJungle Backend v3', endpoints: ['/api/claude','/api/scrape','/api/email','/api/research','/api/discover'] }));

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

// ── SIGNAL SCRAPERS ───────────────────────────────────────

// Google Ads Transparency
const scrapeGoogleAds = async (domain) => {
  try {
    const clean = domain.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','');
    const r = await fetchT(`https://adstransparency.google.com/advertiser?domain=${clean}&region=US`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    }, 8000);
    const html = await r.text();
    const hasAds = html.includes('ad-card') || html.includes('advertiser') || html.length > 50000;
    const adCount = (html.match(/ad-card/g)||[]).length;
    return { hasGoogleAds: hasAds, adCount, confirmed: true, source: 'Google Ads Transparency' };
  } catch { return { hasGoogleAds: false, adCount: 0, confirmed: false }; }
};

// Facebook Ad Library
const scrapeFacebookAds = async (companyName, fbToken) => {
  if (!fbToken) return { hasAds: false, ads: [], confirmed: false, note: 'No Facebook token' };
  try {
    const url = `https://graph.facebook.com/v19.0/ads_archive?access_token=${fbToken}&ad_reached_countries=US&ad_active_status=ACTIVE&search_terms=${encodeURIComponent(companyName)}&fields=page_name,ad_creative_body,ad_delivery_start_time&limit=10`;
    const r = await fetchT(url, {}, 8000);
    const d = await safeJson(r);
    if (d.error) return { hasAds: false, ads: [], confirmed: false };
    const ads = (d.data||[]).map(ad => ({
      copy: (ad.ad_creative_body||'').slice(0,200),
      runningDays: ad.ad_delivery_start_time ? Math.floor((Date.now()-new Date(ad.ad_delivery_start_time))/86400000) : 0,
    }));
    return { hasAds: ads.length>0, ads, confirmed: true, source: 'Facebook Ad Library' };
  } catch { return { hasAds: false, ads: [], confirmed: false }; }
};

// PageSpeed Insights
const checkPageSpeed = async (url) => {
  try {
    const r = await fetchT(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`, {}, 15000);
    const d = await safeJson(r);
    const score = d.lighthouseResult?.categories?.performance?.score;
    const lcp = d.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue;
    const fid = d.lighthouseResult?.audits?.['first-input-delay']?.displayValue;
    return {
      mobileScore: score ? Math.round(score*100) : null,
      lcp: lcp||null,
      fid: fid||null,
      confirmed: !!score,
      source: 'Google PageSpeed API',
    };
  } catch { return { mobileScore: null, confirmed: false }; }
};

// BuiltWith tech stack
const checkBuiltWith = async (domain) => {
  try {
    const clean = domain.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','');
    const r = await fetchT(`https://builtwith.com/${clean}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    }, 8000);
    const html = await r.text();
    return {
      hasCRM: /hubspot|salesforce|marketo|pipedrive|zoho crm/i.test(html),
      hasEmailMarketing: /mailchimp|klaviyo|activecampaign|constant contact|sendgrid/i.test(html),
      hasPixel: /facebook pixel|google analytics|gtag|hotjar|mixpanel|segment/i.test(html),
      hasChat: /intercom|drift|crisp|zendesk chat|tidio/i.test(html),
      hasVideo: /wistia|vimeo|youtube/i.test(html),
      confirmed: true,
      source: 'BuiltWith',
    };
  } catch { return { hasCRM:false, hasEmailMarketing:false, hasPixel:false, hasChat:false, hasVideo:false, confirmed:false }; }
};

// SpyFu SEO data
const checkSpyFu = async (domain) => {
  try {
    const clean = domain.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','');
    const r = await fetchT(`https://www.spyfu.com/overview/domain?query=${clean}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    }, 8000);
    const html = await r.text();
    const organicMatch = html.match(/([\d,]+)\s*(?:organic clicks|monthly organic)/i);
    const paidMatch = html.match(/\$[\d,]+(?:\s*\/\s*mo)?/i);
    return {
      organicClicks: organicMatch ? organicMatch[1] : null,
      estimatedAdSpend: paidMatch ? paidMatch[0] : null,
      confirmed: !!(organicMatch || paidMatch),
      source: 'SpyFu',
    };
  } catch { return { confirmed: false }; }
};

// Google Reviews
const checkGoogleReviews = async (companyName) => {
  try {
    const q = encodeURIComponent(companyName + ' reviews site:google.com');
    const r = await fetchT(`https://www.google.com/search?q=${q}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    }, 8000);
    const html = await r.text();
    const ratingMatch = html.match(/(\d\.\d)\s*(?:stars?|out of 5)/i);
    const countMatch = html.match(/([\d,]+)\s*(?:reviews?|ratings?)/i);
    return {
      rating: ratingMatch ? ratingMatch[1] : null,
      count: countMatch ? countMatch[1] : null,
      confirmed: !!(ratingMatch || countMatch),
      source: 'Google Reviews',
    };
  } catch { return { confirmed: false }; }
};

// Hunter email
const getFounderEmail = async (domain, hunterKey) => {
  if (!hunterKey) return { email:'', founderName:'' };
  try {
    const clean = domain.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','');
    const r = await fetchT(`https://api.hunter.io/v2/domain-search?domain=${clean}&type=personal&limit=5&api_key=${hunterKey}`);
    const d = await safeJson(r);
    const emails = d.data?.emails||[];
    const priority = ['ceo','founder','co-founder','owner','president','cmo'];
    const sorted = emails.sort((a,b)=>{
      const aS=priority.findIndex(p=>(a.position||'').toLowerCase().includes(p));
      const bS=priority.findIndex(p=>(b.position||'').toLowerCase().includes(p));
      return (aS===-1?99:aS)-(bS===-1?99:bS);
    });
    const best = sorted[0];
    return { email:best?.value||'', founderName:`${best?.first_name||''} ${best?.last_name||''}`.trim(), title:best?.position||'' };
  } catch { return { email:'', founderName:'' }; }
};

// Crunchbase
const searchCrunchbase = async (keyword, cbKey) => {
  if (!cbKey) return { companies:[] };
  try {
    const ninetyDaysAgo = new Date(Date.now()-90*24*60*60*1000).toISOString().split('T')[0];
    const r = await fetchT('https://api.crunchbase.com/api/v4/searches/organizations', {
      method: 'POST',
      headers: { 'Content-Type':'application/json','X-cb-user-key':cbKey },
      body: JSON.stringify({
        field_ids: ['name','website_url','short_description','num_employees_enum','founded_on','last_funding_type','last_funding_total','last_funding_at'],
        query: [
          { type:'predicate', field_id:'facet_ids', operator_id:'includes', values:['company'] },
          { type:'predicate', field_id:'short_description', operator_id:'contains', values:[keyword] },
          { type:'predicate', field_id:'last_funding_at', operator_id:'gte', values:[ninetyDaysAgo] },
        ],
        order: [{ field_id:'last_funding_at', sort_dir:'desc' }],
        limit: 15,
      }),
    }, 10000);
    const d = await safeJson(r);
    return {
      companies: (d.entities||[]).map(e => ({
        name: e.properties?.name||'',
        website: e.properties?.website_url||'',
        description: e.properties?.short_description||'',
        employees: e.properties?.num_employees_enum||'',
        founded: e.properties?.founded_on?.value||'',
        fundingType: e.properties?.last_funding_type||'',
        fundingAmount: e.properties?.last_funding_total?.value_usd||0,
        fundingDate: e.properties?.last_funding_at||'',
        signals: { raised_funding: true },
        source: 'crunchbase_funding',
      })),
    };
  } catch { return { companies:[] }; }
};

// Indeed jobs
const searchIndeed = async (keyword, indeedKey) => {
  if (!indeedKey) return { jobs:[] };
  try {
    const q = encodeURIComponent(`marketing manager ${keyword}`);
    const url = `https://api.indeed.com/ads/apisearch?publisher=${indeedKey}&q=${q}&sort=date&limit=20&fromage=30&co=us&userip=1.2.3.4&useragent=Mozilla&v=2&format=json`;
    const r = await fetchT(url, {}, 8000);
    const d = await safeJson(r);
    return {
      jobs: (d.results||[]).map(job => {
        const salaryMatch = (job.snippet||'').match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/i);
        const salary = salaryMatch ? salaryMatch[0] : '';
        return {
          company: job.company||'',
          website: (()=>{ try { return new URL(job.url).hostname.replace('www.',''); } catch { return ''; } })(),
          location: `${job.city||''}, ${job.state||''}`,
          title: job.jobtitle||'',
          salary,
          snippet: (job.snippet||'').slice(0,300),
          datePosted: job.date||'',
          signals: {
            hiring_marketing: true,
            salary_high: salary && parseInt(salary.replace(/[$,]/g,''))>=90000,
            salary_mid: salary && parseInt(salary.replace(/[$,]/g,''))>=60000 && parseInt(salary.replace(/[$,]/g,''))<90000,
            salary_low: salary && parseInt(salary.replace(/[$,]/g,''))<60000,
            salary_unknown: !salary,
          },
          source: 'indeed_hiring',
        };
      }),
    };
  } catch { return { jobs:[] }; }
};

// Google Jobs scrape
const searchGoogleJobs = async (keyword) => {
  try {
    const titles = ['marketing+manager','vp+marketing','head+of+marketing','digital+marketing+director','cmo'];
    const q = encodeURIComponent(`${titles[0]} ${keyword} job`);
    const r = await fetchT(`https://www.google.com/search?q=${q}&ibp=htl;jobs&sa=X`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    }, 10000);
    const html = await r.text();
    const jobs = [];
    // Extract company names from job listings
    const companyMatches = html.match(/"hiringOrganization":\{"@type":"Organization","name":"([^"]+)"/g)||[];
    const titleMatches = html.match(/"title":"([^"]+Marketing[^"]+)"/gi)||[];
    const locationMatches = html.match(/"addressLocality":"([^"]+)"/g)||[];
    const salaryMatches = html.match(/"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*\/\s*(?:yr|year|mo|month))?"/g)||[];

    companyMatches.slice(0,15).forEach((m,i) => {
      const company = m.match(/"name":"([^"]+)"/)?.[1]||'';
      const title = titleMatches[i]?.match(/"title":"([^"]+)"/)?.[1]||'Marketing Manager';
      const location = locationMatches[i]?.match(/"addressLocality":"([^"]+)"/)?.[1]||'';
      const salary = salaryMatches[i]?.replace(/"/g,'')||'';
      if (company) jobs.push({
        company, location, title, salary,
        signals: { hiring_marketing:true, salary_unknown:!salary },
        source: 'google_jobs',
      });
    });
    return { jobs };
  } catch { return { jobs:[] }; }
};

// ZipRecruiter scrape
const searchZipRecruiter = async (keyword) => {
  try {
    const q = encodeURIComponent(`marketing manager ${keyword}`);
    const r = await fetchT(`https://www.ziprecruiter.com/candidate/search?search=${q}&location=United+States&days=30`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    }, 10000);
    const html = await r.text();
    const jobs = [];
    const jobMatches = html.match(/class="job_title"[^>]*>([^<]+)<\/[^>]+>[^<]*<[^>]+class="hiring_company_text"[^>]*>([^<]+)</g)||[];
    const altMatches = html.match(/"hiring_company":"([^"]+)","job_title":"([^"]+)","location":"([^"]+)"/g)||[];

    altMatches.slice(0,15).forEach(m => {
      const company = m.match(/"hiring_company":"([^"]+)"/)?.[1]||'';
      const title = m.match(/"job_title":"([^"]+)"/)?.[1]||'';
      const location = m.match(/"location":"([^"]+)"/)?.[1]||'';
      if (company) jobs.push({
        company, title, location,
        signals: { hiring_marketing: true, salary_unknown: true },
        source: 'ziprecruiter_hiring',
      });
    });
    return { jobs };
  } catch { return { jobs:[] }; }
};

// Clutch.co scrape — companies leaving agency reviews
const scrapeClutch = async (keyword) => {
  try {
    const q = encodeURIComponent(keyword);
    const r = await fetchT(`https://clutch.co/agencies?client_focus=${q}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    }, 10000);
    const html = await r.text();
    const companies = [];
    // Extract company names from reviews
    const reviewerMatches = html.match(/class="reviewer-company"[^>]*>([^<]+)</g)||[];
    const altMatches = html.match(/"reviewer_company":"([^"]+)"/g)||[];

    [...reviewerMatches, ...altMatches].slice(0,10).forEach(m => {
      const company = m.match(/>([^<]+)<|:"([^"]+)"/)?.[1]||m.match(/>([^<]+)<|:"([^"]+)"/)?.[2]||'';
      if (company && company.length > 2) companies.push({
        name: company.trim(),
        signals: { agency_review: true, hiring_marketing: false },
        source: 'clutch_review',
      });
    });
    return { companies };
  } catch { return { companies:[] }; }
};

// Google News — funding + marketing hire signals
const scrapeGoogleNews = async (keyword) => {
  try {
    const queries = [
      `${keyword} company raises funding 2026`,
      `${keyword} hires CMO VP marketing 2026`,
    ];
    const companies = [];
    for (const q of queries) {
      const r = await fetchT(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, 8000);
      const xml = await r.text();
      const titleMatches = xml.match(/<title>([^<]+)<\/title>/g)||[];
      titleMatches.slice(1,8).forEach(m => {
        const title = m.replace(/<\/?title>/g,'');
        const companyMatch = title.match(/^([A-Z][A-Za-z0-9\s&]+?)(?:\s+(?:raises|hires|appoints|names|announces|closes|secures))/);
        if (companyMatch) {
          const company = companyMatch[1].trim();
          const isFunding = /raises|closes|secures|funding/i.test(title);
          const isHire = /hires|appoints|names|CMO|VP marketing/i.test(title);
          companies.push({
            name: company,
            signals: {
              raised_funding: isFunding,
              hiring_marketing: isHire,
            },
            source: isFunding ? 'news_funding' : 'news_hire',
            newsHeadline: title.slice(0,120),
          });
        }
      });
    }
    return { companies };
  } catch { return { companies:[] }; }
};

// ── MASTER RESEARCH ENGINE ────────────────────────────────
app.post('/api/research', async (req, res) => {
  const { company, website, keys } = req.body;
  const { firecrawlKey, hunterKey, fbToken, clearbitKey, apiKey } = keys||{};

  if (!company) return res.status(400).json({ error: 'Company name required' });

  const domain = website ? website.replace(/https?:\/\//,'').replace(/\/.*/,'').replace('www.','') : '';

  try {
    // Fire ALL signals simultaneously
    const [
      homepageResult,
      emailResult,
      googleAdsResult,
      fbAdsResult,
      pageSpeedResult,
      builtWithResult,
      spyfuResult,
      reviewsResult,
    ] = await Promise.allSettled([
      website && firecrawlKey ? fetch(`http://localhost:${PORT}/api/scrape`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ url:website, firecrawlKey }),
      }).then(r=>r.json()).catch(()=>({markdown:''})) : Promise.resolve({markdown:''}),

      domain && hunterKey ? getFounderEmail(domain, hunterKey) : Promise.resolve({email:'',founderName:''}),
      domain ? scrapeGoogleAds(domain) : Promise.resolve({hasGoogleAds:false,confirmed:false}),
      fbToken ? scrapeFacebookAds(company, fbToken) : Promise.resolve({hasAds:false,ads:[],confirmed:false}),
      website ? checkPageSpeed(website) : Promise.resolve({mobileScore:null,confirmed:false}),
      domain ? checkBuiltWith(domain) : Promise.resolve({confirmed:false}),
      domain ? checkSpyFu(domain) : Promise.resolve({confirmed:false}),
      checkGoogleReviews(company),
    ]);

    const homepage = homepageResult.value||{};
    const email = emailResult.value||{};
    const googleAds = googleAdsResult.value||{};
    const fbAds = fbAdsResult.value||{};
    const pageSpeed = pageSpeedResult.value||{};
    const builtWith = builtWithResult.value||{};
    const spyfu = spyfuResult.value||{};
    const reviews = reviewsResult.value||{};
    const content = homepage.markdown||'';

    // Analyze homepage content
    const hasCTA = /call|contact|get started|book|schedule|buy|request|demo|try|sign up|free trial/i.test(content.slice(0,3000));
    const hasWeakHeadline = /welcome to|we are|we provide|we help|we offer|our company/i.test(content.slice(0,500));
    const hasTestimonials = /testimonial|review|client said|customer said|case study|trusted by/i.test(content);
    const hasPricing = /pricing|plans|per month|per year|subscription/i.test(content);
    const hasBlog = /blog|article|resource|insight|guide/i.test(content);
    const hasVideo = /video|watch|youtube|vimeo|wistia/i.test(content);
    const hasAgencyFooter = /powered by|marketing by|designed by|built by/i.test(content);

    // Dunford positioning analysis
    const positioningScore = (() => {
      let score = 0;
      if (content.slice(0,1000).match(/for\s+\w+\s+(who|that|with)/i)) score+=2; // named target
      if (!hasWeakHeadline) score+=2; // specific headline
      if (hasTestimonials) score+=2; // proof
      if (content.match(/unlike|instead of|compared to|vs\./i)) score+=2; // named alternative
      if (hasPricing) score+=1; // transparent pricing
      if (hasVideo) score+=1; // video proof
      return Math.min(score, 10);
    })();

    // Build 4 buckets
    const buckets = {
      ACQUISITION: {
        googleAds: googleAds.hasGoogleAds ? `Running Google Ads (${googleAds.adCount||'some'} detected)` : 'No Google Ads detected',
        googleAdsConfirmed: googleAds.confirmed,
        facebookAds: fbAds.hasAds ? `${fbAds.ads.length} active Facebook ads` : 'No Facebook ads running',
        facebookAdsConfirmed: fbAds.confirmed,
        fbAdDetail: fbAds.ads.length>0 ? fbAds.ads.map(a=>`"${a.copy.slice(0,80)}" (${a.runningDays}d)`).join(' | ') : '',
        staleFbAds: fbAds.ads.some(a=>a.runningDays>180),
        seoTraffic: spyfu.organicClicks ? `${spyfu.organicClicks} estimated monthly organic clicks` : 'SEO data unavailable',
        estimatedAdSpend: spyfu.estimatedAdSpend||'Unknown',
        hasBlog: hasBlog ? 'Blog/content present' : 'No blog or content detected',
      },
      CONVERSION: {
        hasCTA: hasCTA ? 'CTA present above fold' : 'No clear CTA detected above fold',
        weakHeadline: hasWeakHeadline ? 'Generic headline detected' : 'Headline appears specific',
        hasTestimonials: hasTestimonials ? 'Social proof present' : 'No testimonials or case studies detected',
        hasPricing: hasPricing ? 'Pricing visible' : 'No pricing shown — friction point',
        hasVideo: hasVideo ? 'Video content present' : 'No video content detected',
        mobileScore: pageSpeed.mobileScore ? `${pageSpeed.mobileScore}/100 mobile score` : 'Mobile score unavailable',
        loadTime: pageSpeed.lcp||'Unknown',
        positioningScore: `${positioningScore}/10 Dunford positioning score`,
        positioningWeak: positioningScore < 6,
      },
      AUTHORITY: {
        googleReviews: reviews.count ? `${reviews.count} Google reviews — ${reviews.rating} stars` : 'No Google reviews found',
        reviewsConfirmed: reviews.confirmed,
        hasAgencyFooter: hasAgencyFooter ? 'Agency relationship detected in footer' : '',
        linkedinActivity: 'Manual check required',
      },
      INFRASTRUCTURE: {
        hasCRM: builtWith.hasCRM ? 'CRM detected' : 'No CRM detected',
        hasEmailMarketing: builtWith.hasEmailMarketing ? 'Email marketing tool detected' : 'No email marketing detected',
        hasPixel: builtWith.hasPixel ? 'Tracking pixel present' : 'No tracking pixel detected',
        hasChat: builtWith.hasChat ? 'Live chat present' : 'No live chat detected',
        techConfirmed: builtWith.confirmed,
      },
    };

    // Detect specific flaws for pitch targeting
    const flaws = [];
    if (!googleAds.hasGoogleAds) flaws.push('no_google_ads');
    if (!fbAds.hasAds) flaws.push('no_fb_ads');
    else if (fbAds.ads.some(a=>a.runningDays>180)) flaws.push('stale_fb_ads');
    if (!hasCTA) flaws.push('no_cta');
    if (hasWeakHeadline) flaws.push('weak_hero');
    if (!hasTestimonials) flaws.push('no_social_proof');
    if (!builtWith.hasCRM) flaws.push('no_crm');
    if (!builtWith.hasPixel) flaws.push('no_tracking');
    if (pageSpeed.mobileScore && pageSpeed.mobileScore < 50) flaws.push('slow_mobile');
    if (positioningScore < 6) flaws.push('weak_positioning');

    // Identify the sharpest single pain point
    const painPriority = [
      { id:'no_cta', pain:'No CTA above fold — visitors arrive and have nowhere to go', opportunity:'Landing page or homepage rebuild' },
      { id:'weak_positioning', pain:`Positioning scores ${positioningScore}/10 — generic messaging that could apply to any competitor`, opportunity:'Brand positioning + website rewrite' },
      { id:'stale_fb_ads', pain:'Running same Facebook ads for 6+ months — creative fatigue killing performance', opportunity:'Ad creative refresh + landing page' },
      { id:'no_crm', pain:'No CRM detected — no way to track or nurture leads', opportunity:'CRM setup + marketing automation' },
      { id:'no_tracking', pain:'No tracking pixel — flying blind on what\'s working', opportunity:'Analytics + tracking setup' },
      { id:'slow_mobile', pain:`Mobile score ${pageSpeed.mobileScore}/100 — losing majority of traffic before they see the offer`, opportunity:'Site speed optimization' },
      { id:'no_google_ads', pain:'No Google Ads running — competitors capturing demand they can\'t see', opportunity:'Paid search setup + landing pages' },
      { id:'no_social_proof', pain:'No testimonials or case studies — buyers can\'t verify claims', opportunity:'Social proof system + case studies' },
      { id:'weak_hero', pain:'Generic homepage headline — doesn\'t differentiate from any competitor', opportunity:'Homepage messaging + positioning' },
    ];

    const topPain = painPriority.find(p=>flaws.includes(p.id));

    // ICP score
    const signals = {
      hiring_marketing: false, // set by find phase
      raised_funding: false,   // set by find phase
      no_cta: !hasCTA,
      weak_positioning: positioningScore < 6,
      no_crm: !builtWith.hasCRM,
      no_tracking: !builtWith.hasPixel,
      slow_mobile: pageSpeed.mobileScore && pageSpeed.mobileScore < 50,
      no_google_ads: !googleAds.hasGoogleAds,
      has_agency: hasAgencyFooter,
    };

    res.json({
      email: email.email||'',
      founderName: email.founderName||'',
      founderTitle: email.title||'',
      buckets,
      flaws,
      topPain,
      positioningScore,
      signals,
      homepageContent: content.slice(0,3000),
      richData: {
        adSpend: buckets.ACQUISITION.estimatedAdSpend,
        googleAds: buckets.ACQUISITION.googleAds,
        fbAds: buckets.ACQUISITION.facebookAds,
        seoTraffic: buckets.ACQUISITION.seoTraffic,
        mobileScore: buckets.CONVERSION.mobileScore,
        hasCRM: buckets.INFRASTRUCTURE.hasCRM,
        hasPixel: buckets.INFRASTRUCTURE.hasPixel,
        positioningScore: buckets.CONVERSION.positioningScore,
        googleReviews: buckets.AUTHORITY.googleReviews,
      },
      completedAt: new Date().toISOString(),
    });

  } catch(e) {
    console.error('Research error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ── DISCOVERY ENGINE ──────────────────────────────────────
app.post('/api/discover', async (req, res) => {
  const { keywords, keys } = req.body;
  const { indeedKey, crunchbaseKey } = keys||{};

  if (!keywords||!keywords.length) return res.status(400).json({ error: 'Keywords required' });

  try {
    const allCompanies = [];
    const kwList = keywords.slice(0,3);

    // Fire all sources simultaneously for each keyword
    const results = await Promise.allSettled(kwList.map(async (kw) => {
      const [indeedRes, cbRes, googleJobsRes, zipRes, clutchRes, newsRes] = await Promise.allSettled([
        searchIndeed(kw, indeedKey),
        searchCrunchbase(kw, crunchbaseKey),
        searchGoogleJobs(kw),
        searchZipRecruiter(kw),
        scrapeClutch(kw),
        scrapeGoogleNews(kw),
      ]);

      const companies = [];

      // Indeed jobs
      if (indeedRes.value?.jobs) {
        indeedRes.value.jobs.forEach(job => {
          if (job.company) companies.push({
            name: job.company,
            website: job.website ? `https://${job.website}` : '',
            location: job.location,
            jobTitle: job.title,
            salary: job.salary,
            jobSnippet: job.snippet,
            signals: job.signals,
            source: 'indeed_hiring',
          });
        });
      }

      // Google Jobs
      if (googleJobsRes.value?.jobs) {
        googleJobsRes.value.jobs.forEach(job => {
          if (job.company) companies.push({
            name: job.company,
            location: job.location,
            jobTitle: job.title,
            salary: job.salary,
            signals: job.signals,
            source: 'google_jobs',
          });
        });
      }

      // ZipRecruiter
      if (zipRes.value?.jobs) {
        zipRes.value.jobs.forEach(job => {
          if (job.company) companies.push({
            name: job.company,
            location: job.location,
            jobTitle: job.title,
            signals: job.signals,
            source: 'ziprecruiter_hiring',
          });
        });
      }

      // Crunchbase
      if (cbRes.value?.companies) {
        cbRes.value.companies.forEach(co => companies.push(co));
      }

      // Clutch
      if (clutchRes.value?.companies) {
        clutchRes.value.companies.forEach(co => {
          if (co.name) companies.push(co);
        });
      }

      // Google News
      if (newsRes.value?.companies) {
        newsRes.value.companies.forEach(co => {
          if (co.name) companies.push({
            ...co,
            jobTitle: co.newsHeadline,
          });
        });
      }

      return companies;
    }));

    results.forEach(r => { if (r.value) allCompanies.push(...r.value); });

    // Deduplicate by company name
    const seen = new Set();
    const unique = allCompanies.filter(c => {
      const key = (c.name||'').toLowerCase().trim();
      if (!key || key.length < 2 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Score and sort
    const WEIGHTS = {
      hiring_marketing:25, raised_funding:15, agency_review:20,
      salary_high:15, salary_mid:8, salary_low:5, salary_unknown:8,
    };
    const scored = unique.map(c => {
      const score = Math.min(Object.entries(c.signals||{}).reduce((t,[k,v])=>v?t+(WEIGHTS[k]||0):t,0), 60);
      return { ...c, icpScore: score };
    }).sort((a,b)=>b.icpScore-a.icpScore);

    res.json({ companies: scored, total: scored.length, sources: ['indeed','google_jobs','ziprecruiter','crunchbase','clutch','google_news'] });

  } catch(e) {
    console.error('Discovery error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`CROJungle Backend v3 running on port ${PORT}`));
