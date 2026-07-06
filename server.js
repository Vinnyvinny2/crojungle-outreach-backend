require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(cors({
  origin: '*', // In production, set to your Netlify domain
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'CROJungle Backend Running', version: '1.0.0' });
});

// ── ANTHROPIC PROXY ───────────────────────────────────────
app.post('/api/claude', async (req, res) => {
  try {
    const { system, user, apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 6000,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
    }

    res.json({ text: data.content[0].text });
  } catch (error) {
    console.error('Claude proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── FIRECRAWL PROXY ───────────────────────────────────────
app.post('/api/scrape', async (req, res) => {
  try {
    const { url, firecrawlKey } = req.body;

    if (!url || !firecrawlKey) {
      return res.status(400).json({ error: 'URL and Firecrawl key required' });
    }

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Firecrawl error', details: data });
    }

    const markdown = data.data?.markdown || '';
    res.json({ markdown: markdown.slice(0, 4000) });
  } catch (error) {
    console.error('Firecrawl proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── HUNTER.IO PROXY ───────────────────────────────────────
app.get('/api/email', async (req, res) => {
  try {
    const { domain, hunterKey } = req.query;

    if (!domain || !hunterKey) {
      return res.status(400).json({ error: 'Domain and Hunter key required' });
    }

    const clean = domain.replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '');
    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${clean}&type=personal&limit=5&api_key=${hunterKey}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Hunter.io error' });
    }

    const emails = data.data?.emails || [];
    const priority = ['ceo', 'founder', 'co-founder', 'owner', 'president', 'cmo'];
    const sorted = emails.sort((a, b) => {
      const aScore = priority.findIndex(p => (a.position || '').toLowerCase().includes(p));
      const bScore = priority.findIndex(p => (b.position || '').toLowerCase().includes(p));
      return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
    });

    const best = sorted[0];
    res.json({
      email: best?.value || '',
      founderName: `${best?.first_name || ''} ${best?.last_name || ''}`.trim(),
      title: best?.position || '',
      all: sorted.slice(0, 3).map(e => ({ email: e.value, name: `${e.first_name} ${e.last_name}`.trim(), title: e.position })),
    });
  } catch (error) {
    console.error('Hunter proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── FACEBOOK AD LIBRARY PROXY ─────────────────────────────
app.get('/api/ads/facebook', async (req, res) => {
  try {
    const { keyword, fbToken } = req.query;

    if (!keyword || !fbToken) {
      return res.status(400).json({ error: 'Keyword and Facebook token required' });
    }

    const url = `https://graph.facebook.com/v19.0/ads_archive?access_token=${fbToken}&ad_reached_countries=US&ad_active_status=ACTIVE&search_terms=${encodeURIComponent(keyword)}&fields=page_name,ad_creative_body,ad_delivery_start_time,page_id&limit=20`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(400).json({ error: data.error?.message || 'Facebook API error' });
    }

    const ads = (data.data || []).map(ad => ({
      name: ad.page_name || '',
      adCopy: ad.ad_creative_body || '',
      runningDays: ad.ad_delivery_start_time
        ? Math.floor((Date.now() - new Date(ad.ad_delivery_start_time)) / 86400000)
        : 0,
    }));

    res.json({ ads });
  } catch (error) {
    console.error('Facebook ads proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── INDEED JOBS PROXY ─────────────────────────────────────
app.get('/api/jobs/indeed', async (req, res) => {
  try {
    const { keyword, indeedKey } = req.query;

    if (!keyword || !indeedKey) {
      return res.status(400).json({ error: 'Keyword and Indeed key required' });
    }

    const q = encodeURIComponent(`marketing manager ${keyword}`);
    const url = `https://api.indeed.com/ads/apisearch?publisher=${indeedKey}&q=${q}&l=&sort=date&radius=25&st=&jt=fulltime&start=0&limit=20&fromage=30&highlight=0&filter=1&latlong=1&co=us&chnl=&userip=1.2.3.4&useragent=Mozilla&v=2&format=json`;

    const response = await fetch(url);
    const data = await response.json();

    const jobs = (data.results || []).map(job => {
      const salaryMatch = (job.snippet || '').match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/i);
      return {
        company: job.company || '',
        website: job.url ? (() => { try { return new URL(job.url).hostname.replace('www.', ''); } catch { return ''; } })() : '',
        location: `${job.city || ''}, ${job.state || ''}`,
        title: job.jobtitle || '',
        salary: salaryMatch ? salaryMatch[0] : '',
        snippet: job.snippet || '',
      };
    });

    res.json({ jobs });
  } catch (error) {
    console.error('Indeed proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── CRUNCHBASE PROXY ──────────────────────────────────────
app.post('/api/companies/crunchbase', async (req, res) => {
  try {
    const { keyword, crunchbaseKey } = req.body;

    if (!keyword || !crunchbaseKey) {
      return res.status(400).json({ error: 'Keyword and Crunchbase key required' });
    }

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await fetch('https://api.crunchbase.com/api/v4/searches/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-cb-user-key': crunchbaseKey,
      },
      body: JSON.stringify({
        field_ids: ['short_description', 'name', 'website_url', 'num_employees_enum', 'founded_on', 'last_funding_type', 'last_funding_total'],
        query: [
          { type: 'predicate', field_id: 'facet_ids', operator_id: 'includes', values: ['company'] },
          { type: 'predicate', field_id: 'short_description', operator_id: 'contains', values: [keyword] },
          { type: 'predicate', field_id: 'last_funding_at', operator_id: 'gte', values: [ninetyDaysAgo] },
        ],
        order: [{ field_id: 'last_funding_at', sort_dir: 'desc' }],
        limit: 10,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Crunchbase error' });
    }

    const companies = (data.entities || []).map(e => ({
      name: e.properties?.name || '',
      website: e.properties?.website_url || '',
      description: e.properties?.short_description || '',
      employees: e.properties?.num_employees_enum || '',
      founded: e.properties?.founded_on?.value || '',
    }));

    res.json({ companies });
  } catch (error) {
    console.error('Crunchbase proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── START ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`CROJungle backend running on port ${PORT}`);
});
