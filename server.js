<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>CROJungle — Outreach Hub</title>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0a0f;--s:#111118;--s2:#1a1a24;--b:rgba(255,255,255,0.07);--b2:rgba(255,255,255,0.12);--p:#7c3aed;--a:#a3e635;--t:#f0f0f5;--m:#6b7280;--m2:#9ca3af;--r:#ef4444;--am:#f59e0b;--g:#22c55e}
html,body{height:100%;background:var(--bg);color:var(--t);font-family:'Inter',sans-serif}
#root{height:100%}
.app{display:flex;height:100vh;overflow:hidden}
.sidebar{width:220px;min-width:220px;background:var(--s);border-right:1px solid var(--b);display:flex;flex-direction:column;padding:24px 0}
.logo{padding:0 20px 28px;font-family:'Syne',sans-serif;font-weight:800;font-size:18px}
.logo span{color:var(--a)}
.nl{padding:0 20px 8px;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--m)}
.ni{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;font-size:13px;font-weight:500;color:var(--m2);border-left:2px solid transparent;transition:all .15s}
.ni:hover{color:var(--t);background:rgba(255,255,255,.03)}
.ni.active{color:var(--t);background:rgba(124,58,237,.12);border-left-color:var(--p)}
.nb{margin-left:auto;background:var(--r);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:20px}
.nb.g{background:var(--g)}
.sb{padding:16px 20px;border-top:1px solid var(--b);font-size:11px;color:var(--m)}
.sb strong{color:var(--a)}
.main{flex:1;overflow-y:auto;display:flex;flex-direction:column}
.tb{position:sticky;top:0;z-index:10;background:rgba(10,10,15,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--b);padding:16px 32px;display:flex;align-items:center;justify-content:space-between}
.tt{font-family:'Syne',sans-serif;font-weight:700;font-size:20px}
.ts{font-size:12px;color:var(--m);margin-top:2px}
.content{padding:32px;flex:1}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;border:none;font-family:'Inter',sans-serif}
.btn-p{background:var(--p);color:#fff}.btn-p:hover{filter:brightness(1.1)}
.btn-p:disabled{opacity:.5;cursor:not-allowed}
.btn-a{background:var(--a);color:#0a0a0f}.btn-a:hover{filter:brightness(1.1)}
.btn-a:disabled{opacity:.5;cursor:not-allowed}
.btn-g{background:transparent;color:var(--m2);border:1px solid var(--b2)}.btn-g:hover{color:var(--t)}
.btn-sm{padding:7px 14px;font-size:12px}
.card{background:var(--s);border:1px solid var(--b);border-radius:14px;padding:24px}
.input{width:100%;background:var(--s2);border:1px solid var(--b2);border-radius:10px;padding:12px 16px;color:var(--t);font-size:13px;font-family:'Inter',sans-serif;outline:none}
.input:focus{border-color:var(--p)}
.input::placeholder{color:var(--m)}
.lbl{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--m);margin-bottom:8px;display:block}
.tag{display:inline-flex;align-items:center;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:20px}
.tp{background:rgba(124,58,237,.15);color:#a78bfa;border:1px solid rgba(124,58,237,.3)}
.ta{background:rgba(163,230,53,.1);color:var(--a);border:1px solid rgba(163,230,53,.2)}
.tr{background:rgba(239,68,68,.1);color:#fca5a5;border:1px solid rgba(239,68,68,.2)}
.tam{background:rgba(245,158,11,.1);color:#fcd34d;border:1px solid rgba(245,158,11,.2)}
.empty{text-align:center;padding:64px 32px;color:var(--m)}
.empty h3{font-family:'Syne',sans-serif;font-size:18px;color:var(--m2);margin-bottom:8px}
.spinner{width:20px;height:20px;border:2px solid rgba(255,255,255,.1);border-top-color:var(--p);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.divider{height:1px;background:var(--b);margin:20px 0}
.pb{background:var(--s2);border:1px solid var(--b2);border-radius:12px;padding:18px;font-size:13px;line-height:1.7;color:var(--m2);white-space:pre-line}
.ci{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--s2);border:1px solid var(--b);border-radius:8px;cursor:pointer}
.ci.ck{border-color:var(--r)}
.cb{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--b2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px}
.ci.ck .cb{background:var(--r);border-color:var(--r);color:#fff}
.rl{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--s2);border:1px solid var(--b);border-radius:8px;cursor:pointer;text-decoration:none;color:var(--t);transition:all .15s}
.rl:hover{border-color:var(--p)}
textarea.input{min-height:140px;resize:vertical}
.toast{position:fixed;bottom:24px;right:24px;z-index:1000;background:var(--s2);border:1px solid var(--b2);border-radius:12px;padding:14px 20px;display:flex;align-items:center;gap:10px;font-size:13px;animation:su .3s ease}
@keyframes su{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
</style>
</head>
<body>
<div id="root"></div>
<script>

// ═══ SUPABASE — persistent cloud storage ═══════════════════════════════════
// All writes go to BOTH localStorage (instant, offline) AND Supabase (persistent).
// On load, Supabase wins if it has data — so switching devices/domains is safe.
const SB_URL = 'https://rxkjgevunvpchcydxsft.supabase.co';
const SB_KEY = 'sb_publishable_Od9pkGnOkO_kLxjbjBJVLg_RanMHlAI';

const sbFetch = async (path, options = {}) => {
  try {
    const r = await fetch(SB_URL + '/rest/v1' + path, {
      ...options,
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=minimal',
        ...(options.headers || {})
      }
    });
    if (!r.ok) { const t = await r.text(); console.warn('Supabase error:', r.status, t); return null; }
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  } catch(e) { console.warn('Supabase fetch failed:', e.message); return null; }
};

// Convert a lead object to a Supabase row
const leadToRow = (l) => ({
  id: l.id,
  name: l.name || '',
  website: l.website || '',
  email: l.email || '',
  founder_name: l.founderName || '',
  icp_score: l.icpScore || 0,
  reachability: l.reachability || 0,
  source: l.source || '',
  discovery_source: l.discoverySource || '',
  discovery_reason: l.discoveryReason || '',
  status: l.status || 'new',
  signals: l.signals || {},
  buckets: l.buckets || null,
  top_pain: l.topPain || null,
  brain_audit: l.brainAudit || null,
  recommended_product: l.recommendedProduct || null,
  top_three_products: l.topThreeProducts || [],
  stack_combo: l.stackCombo || null,
  pitch: l.pitch || '',
  subject: l.subject || '',
  opens: l.opens || 0,
  page_visits: l.pageVisits || 0,
  sent_at: l.sentAt || null,
  notes: l.notes || '',
  stacked: !!l.stacked,
  source_count: l.sourceCount || 1,
  manual_role_count: l.manualRoleCount || 0,
  location: l.location || '',
  listing_url: l.listingUrl || '',
  job_title: l.jobTitle || '',
  job_snippet: l.jobSnippet || '',
  reach_plan: l.reachPlan || null,
  savings_estimate: (l.brainAudit && l.brainAudit.savingsEstimate) || null,
  updated_at: new Date().toISOString()
});

// Convert a Supabase row back to a lead object
const rowToLead = (r) => ({
  id: r.id, name: r.name, website: r.website, email: r.email,
  founderName: r.founder_name, icpScore: r.icp_score, reachability: r.reachability,
  source: r.source, discoverySource: r.discovery_source, discoveryReason: r.discovery_reason,
  status: r.status, signals: r.signals || {}, buckets: r.buckets, topPain: r.top_pain,
  brainAudit: r.brain_audit, recommendedProduct: r.recommended_product,
  topThreeProducts: r.top_three_products || [], stackCombo: r.stack_combo,
  pitch: r.pitch, subject: r.subject, opens: r.opens || 0, pageVisits: r.page_visits || 0,
  sentAt: r.sent_at, notes: r.notes || '', stacked: r.stacked, sourceCount: r.source_count,
  manualRoleCount: r.manual_role_count, location: r.location, listingUrl: r.listing_url,
  jobTitle: r.job_title, jobSnippet: r.job_snippet, reachPlan: r.reach_plan,
  followUps: [], flaws: [], richData: {}, homepageContent: '', screenshotUrl: null,
  visualAnalysis: null, positioningScore: null, researchBonus: 0, preResearchScore: 0,
});

// Upsert a single lead to Supabase (fire and forget — localStorage is primary)
const sbSaveLead = async (lead) => {
  await sbFetch('/leads?on_conflict=id', {
    method: 'POST',
    prefer: 'return=minimal,resolution=merge-duplicates',
    body: JSON.stringify(leadToRow(lead))
  });
};

// Load all leads from Supabase (called once on app init)
const sbLoadLeads = async () => {
  const rows = await sbFetch('/leads?order=updated_at.desc&limit=500', { headers: { 'Prefer': 'return=representation' } });
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null;
  return rows.map(rowToLead);
};

// Delete a lead from Supabase
const sbDeleteLead = async (id) => {
  await sbFetch('/leads?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
};


const {
  useState,
  useEffect
} = React;
const BACKEND = 'https://crojungle-outreach-backend.onrender.com';
const CF_PROXY = 'https://silent-credit-94eb.vindesil2.workers.dev/?url=';
const proxyFetch = async url => {
  const r = await fetch(CF_PROXY + encodeURIComponent(url));
  return r.text();
};
const LK = 'cj_leads_v3';
const SK = 'cj_settings_v3';
const getLeads = () => {
  try {
    const raw = localStorage.getItem(LK);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Handle case where stored value is a string (double-encoded)
    if (typeof parsed === 'string') return JSON.parse(parsed) || [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const saveLeads = l => {
  localStorage.setItem(LK, JSON.stringify(l));
  // Always push to Supabase — no gate, fire and forget
  l.forEach(lead => {
    fetch(SB_URL + '/rest/v1/leads?on_conflict=id', {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=merge-duplicates'
      },
      body: JSON.stringify(leadToRow(lead))
    }).catch(() => {});
  });
};
const getSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(SK) || '{}');
  } catch {
    return {};
  }
};
const saveSettings = s => localStorage.setItem(SK, JSON.stringify(s));
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().split('T')[0];
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().split('T')[0]; };
const daysFrom = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const daysDiff = s => Math.ceil((new Date(s) - new Date(today())) / 86400000);
const buildMailto = (to, sub, body) => 'mailto:' + (to || '') + '?subject=' + encodeURIComponent(sub || '') + '&body=' + encodeURIComponent(body || '');
const FLAWS = [{
  id: 'no_google_ads',
  label: 'Not running Google Ads'
}, {
  id: 'bad_google_ads',
  label: 'Running ads but weak copy / no offer'
}, {
  id: 'no_fb_ads',
  label: 'No Facebook / Meta ads'
}, {
  id: 'bad_fb_ads',
  label: 'Running FB ads but poor creative'
}, {
  id: 'no_seo',
  label: 'Near-zero SEO traffic'
}, {
  id: 'no_cta',
  label: 'No clear CTA on homepage'
}, {
  id: 'weak_hero',
  label: 'Weak homepage headline / messaging'
}, {
  id: 'no_social_proof',
  label: 'No testimonials or case studies'
}, {
  id: 'no_tracking',
  label: 'No visible pixel / analytics'
}, {
  id: 'dead_linkedin',
  label: 'LinkedIn inactive 60+ days'
}, {
  id: 'mobile_bad',
  label: 'Poor mobile experience'
}];
const RLINKS = (name, website) => {
  const domain = (website || name).replace(/https?:\/\//, '').replace(/\/.*/, '');
  const q = encodeURIComponent(name);
  const dq = encodeURIComponent(domain);
  return [{
    label: 'Their Homepage',
    icon: '🌐',
    url: website || 'https://' + domain
  }, {
    label: 'Facebook Ad Library',
    icon: '📘',
    url: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&search_type=keyword_search&q=' + q
  }, {
    label: 'Google Ads Transparency',
    icon: '🔍',
    url: 'https://adstransparency.google.com/?region=anywhere&domain=' + dq
  }, {
    label: 'Google News',
    icon: '📰',
    url: 'https://news.google.com/search?q=' + q
  }, {
    label: 'PageSpeed Test',
    icon: '⚡',
    url: 'https://pagespeed.web.dev/report?url=' + encodeURIComponent(website || 'https://' + domain)
  }];
};
const BRAIN = `CROJungle Master Principles:
- Target: $2M-$50M founder-led companies. Founder/CEO still personally involved in marketing or operations decisions.
- Caliber Rule: CEOs buy from peers. Never position as vendor. Always as expert.
- Zero Fabrication: Only state what research data confirms. Never invent metrics or assume stats.
- Pitch Architecture: 1. Verifiable observation 2. Revenue connection 3. Proof-of-work 4. $70k proof point 5. Soft CTA
- Banned words: optimize, synergy, revolutionary, leverage, seamless, cutting-edge, game-changer, streamline, empower, transform
- The Salesman Test: Would this pitch work face-to-face with a founder doing $5M-$50M?
- Chinese Dragon Method: Position as peer who noticed something, give value first, address fear before opportunity

⚠️ CEO FRAMEWORK NOT YET CONFIGURED — UPDATE IN SETTINGS BEFORE SENDING REAL PITCHES
This means voice, proof points, and case studies are generic until the CEO conversation is completed.

CROJungle Products — map research findings to the right product:

PRODUCT 1: WEBSITE / LANDING PAGE — $5k-$25k one-off
Signal: Outdated website, no CTA, poor mobile score, generic positioning, Wix/Squarespace/no CMS detected
Pitch angle: "Your website isn't converting. We rebuilt it — here's the preview."

PRODUCT 2: AI BRAIN — $40k-$70k one-off
Signal: No AI detected on site, disconnected digital presence, multiple separate tools not integrated, complex product with simple website
Pitch angle: "Your entire digital presence has no intelligence layer. We build an AI Brain that connects everything — your site, your leads, your customer interactions — into one system."
⚠️ NEEDS CEO INPUT: Specific examples of AI Brains built, what they integrate, client results

PRODUCT 3: SOFTWARE BUILD / AI REPLACEMENT — $25k-$75k one-off  
Signal: Hiring ops manager, customer service manager, data analyst, head of operations — roles that AI replaces
Signal: Large team in manual roles, outdated internal tools detected, 5+ disconnected SaaS tools
Pitch angle: "You're paying $70k/year for a role that costs $30k to automate once. We build the tool."
⚠️ NEEDS CEO INPUT: Specific software builds completed, what was replaced, cost savings delivered

PRODUCT 4: GROWTH RETAINER — $8k-$35k/month
Signal: Already spending on ads (Google/Facebook confirmed), has CRM but no optimization, revenue plateau visible, new funding with growth targets
Pitch angle: "You have budget and infrastructure. You're missing the system to make it compound. We become your growth department."
⚠️ NEEDS CEO INPUT: Retainer client results, specific KPIs hit, revenue growth examples

PRODUCT SELECTION LOGIC:
- Bad/outdated website → Product 1
- No AI layer + complex business → Product 2  
- Hiring ops/CS/data roles → Product 3
- Already spending on marketing, needs optimization → Product 4
- Multiple signals → pitch highest ticket item that fits confirmed data
- When unsure → pitch the proof-of-work page and let the call determine the product`;
async function callClaude(system, user, apiKey) {
  const r = await fetch(BACKEND + '/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      system,
      user,
      apiKey
    })
  });
  if (!r.ok) {
    const e = await r.json();
    throw new Error(e.error || 'API error');
  }
  const d = await r.json();
  return d.text;
}
function Toast({
  msg,
  onClose
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, []);
  return React.createElement('div', {
    className: 'toast'
  }, React.createElement('span', {
    style: {
      color: 'var(--a)'
    }
  }, '✓'), msg);
}

// ── PROGRESS TRACKER ─────────────────────────────────────
function ProgressTracker({
  steps,
  currentStep,
  title,
  subtitle
}) {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(t);
  }, []);
  return React.createElement('div', {
    style: {
      padding: '40px 32px',
      maxWidth: 520
    }
  },
  // Header
  React.createElement('div', {
    style: {
      marginBottom: 32
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8
    }
  }, React.createElement('div', {
    style: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'rgba(163,230,53,0.1)',
      border: '2px solid var(--a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, React.createElement('div', {
    className: 'spinner',
    style: {
      width: 16,
      height: 16,
      borderTopColor: 'var(--a)'
    }
  })), React.createElement('div', null, React.createElement('div', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 700,
      fontSize: 18
    }
  }, title), React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--m)',
      marginTop: 2
    }
  }, subtitle + dots)))),
  // Steps
  React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0
    }
  }, steps.map((step, i) => {
    const done = i < currentStep;
    const active = i === currentStep;
    const pending = i > currentStep;
    return React.createElement('div', {
      key: i,
      style: {
        display: 'flex',
        gap: 16,
        paddingBottom: i < steps.length - 1 ? 20 : 0
      }
    },
    // Line + circle
    React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0
      }
    }, React.createElement('div', {
      style: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
        transition: 'all .3s',
        background: done ? 'var(--a)' : active ? 'var(--p)' : 'var(--s2)',
        border: done ? '2px solid var(--a)' : active ? '2px solid var(--p)' : '2px solid var(--b2)',
        color: done ? '#0a0a0f' : active ? '#fff' : 'var(--m)',
        boxShadow: active ? '0 0 16px rgba(124,58,237,0.4)' : 'none'
      }
    }, done ? '✓' : active ? React.createElement('div', {
      className: 'spinner',
      style: {
        width: 12,
        height: 12,
        borderTopColor: '#fff'
      }
    }) : i + 1), i < steps.length - 1 && React.createElement('div', {
      style: {
        width: 2,
        flex: 1,
        marginTop: 4,
        background: done ? 'var(--a)' : 'var(--b)',
        minHeight: 16,
        transition: 'background .3s'
      }
    })),
    // Content
    React.createElement('div', {
      style: {
        paddingBottom: i < steps.length - 1 ? 4 : 0,
        paddingTop: 4
      }
    }, React.createElement('div', {
      style: {
        fontSize: 13,
        fontWeight: done ? 500 : active ? 700 : 400,
        color: done ? 'var(--a)' : active ? 'var(--t)' : 'var(--m)',
        transition: 'all .3s',
        marginBottom: 2
      }
    }, step.label), step.detail && React.createElement('div', {
      style: {
        fontSize: 11,
        color: 'var(--m)',
        lineHeight: 1.4
      }
    }, step.detail)));
  })));
}

// ── SCANNING OVERLAY ──────────────────────────────────────
function ScanningOverlay({
  company,
  step
}) {
  // REAL-TIME steps — driven by actual backend progress, not a fake timer.
  // Each step lights up when the backend actually reaches that point.
  // step: 'firecrawl' | 'facebook' | 'fingerprint' | 'brain' | 'critique' | 'email' | 'pagespeed' | 'done'
  const STEPS = [
    { id: 'firecrawl', icon: '🌐', label: 'Homepage Firecrawl', desc: 'Scraping & screenshotting homepage' },
    { id: 'facebook', icon: '📘', label: 'Facebook Ad Library', desc: 'Checking active ad campaigns' },
    { id: 'fingerprint', icon: '🔧', label: 'Site Fingerprint', desc: 'Detecting CRM, pixel, tech stack' },
    { id: 'pagespeed', icon: '⚡', label: 'PageSpeed Insights', desc: 'Mobile performance check' },
    { id: 'email', icon: '📧', label: 'Hunter.io Email', desc: 'Finding founder email' },
    { id: 'brain', icon: '🧠', label: 'Claude Audit (Pass 1)', desc: 'Analyzing all signals, building audit' },
    { id: 'critique', icon: '🔬', label: 'Self-Critique (Pass 2)', desc: 'Verifying every claim against evidence' },
  ];
  const ORDER = STEPS.map(s => s.id);
  const currentIdx = step ? ORDER.indexOf(step) : -1;
  return React.createElement('div', {
    style: { padding: '32px' }
  }, React.createElement('div', { style: { marginBottom: 24 } },
    React.createElement('div', { style: { fontFamily: 'Syne', fontWeight: 700, fontSize: 18, marginBottom: 4 } }, 'Researching ' + company),
    React.createElement('div', { style: { fontSize: 12, color: 'var(--m)' } }, 'Running full-business audit — acquisition, conversion, operations, growth & value')
  ), React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } },
    STEPS.map((s, i) => {
      const done = currentIdx > i;
      const active = currentIdx === i;
      return React.createElement('div', {
        key: s.id,
        style: {
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
          border: '1px solid ' + (done ? 'rgba(163,230,53,0.3)' : active ? 'rgba(124,58,237,0.4)' : 'var(--b)'),
          background: done ? 'rgba(163,230,53,0.05)' : active ? 'rgba(124,58,237,0.08)' : 'var(--s2)',
          transition: 'all .4s'
        }
      },
      React.createElement('div', { style: { fontSize: 16, flexShrink: 0 } }, s.icon),
      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
        React.createElement('div', { style: { fontSize: 12, fontWeight: 600, color: done ? 'var(--a)' : active ? 'var(--t)' : 'var(--m)' } }, s.label),
        active && React.createElement('div', { style: { fontSize: 10, color: 'var(--m)', marginTop: 1 } }, s.desc)
      ),
      done ? React.createElement('span', { style: { color: 'var(--a)', fontSize: 12, fontWeight: 700 } }, '✓')
           : active ? React.createElement('div', { className: 'spinner', style: { width: 12, height: 12, flexShrink: 0 } })
           : React.createElement('div', { style: { width: 12, height: 12, borderRadius: '50%', background: 'var(--b2)', flexShrink: 0 } })
      );
    })
  ));
}
function FindLoader() {
  const [pct, setPct] = React.useState(0);
  const phases = [
    'Scanning job boards for AI-replaceable hiring',
    'Checking SEC filings for recent funding',
    'Reading trigger events from the news',
    'Finding owners preparing to sell',
    'Verifying company size and reachability',
    'Scoring and ranking your best leads'
  ];
  const [phase, setPhase] = React.useState(0);
  React.useEffect(() => {
    // Ease toward 95% over ~18s; the real completion snaps it to 100.
    let raf;
    const start = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const target = Math.min(95, 100 * (1 - Math.exp(-elapsed / 7)));
      setPct(target);
      setPhase(Math.min(phases.length - 1, Math.floor(elapsed / 3)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 28 }
  },
    // Big number counter
    React.createElement('div', {
      style: { fontFamily: 'Syne', fontWeight: 800, fontSize: 72, lineHeight: 1, color: 'var(--t)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }
    }, Math.round(pct)),
    // Thin progress bar
    React.createElement('div', {
      style: { width: 280, height: 3, background: 'var(--b2)', borderRadius: 3, overflow: 'hidden' }
    }, React.createElement('div', {
      style: { width: pct + '%', height: '100%', background: 'var(--a)', borderRadius: 3, transition: 'width 0.3s ease-out' }
    })),
    // Current phase label
    React.createElement('div', {
      style: { fontSize: 13, color: 'var(--m2)', fontWeight: 500, minHeight: 18, transition: 'opacity 0.3s' }
    }, phases[phase])
  );
}

function FindView({
  onCreate,
  settings
}) {
  const [mode, setMode] = useState('discover');
  const [keywords] = useState(settings.autoKeywords || 'SaaS, e-commerce, B2B software, professional services');
  const [discovered, setDiscovered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [researchStep, setResearchStep] = useState('');
  const [researching, setResearching] = useState('');
  const [findStep, setFindStep] = useState('firecrawl');
  const [expandedLead, setExpandedLead] = useState(null);
  const [error, setError] = useState('');
  const [lastRun, setLastRun] = useState(localStorage.getItem('cj_last_discover') || null);
  const [form, setForm] = useState({
    name: '',
    website: '',
    email: '',
    founderName: '',
    industry: '',
    revenue: '',
    employees: '',
    location: ''
  });
  const DB_KEY = 'cj_discovered_v1';
  const existingLeads = getLeads();
  const loadDiscovered = () => {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    } catch {
      return [];
    }
  };
  const saveDiscovered = arr => localStorage.setItem(DB_KEY, JSON.stringify(arr));
  const makeFollowUps = () => [{
    day: 3,
    label: 'Follow up 1',
    done: false,
    dueDate: daysFrom(3)
  }, {
    day: 7,
    label: 'Follow up 2',
    done: false,
    dueDate: daysFrom(7)
  }, {
    day: 14,
    label: 'Follow up 3',
    done: false,
    dueDate: daysFrom(14)
  }];
  useEffect(() => {
    const existing = loadDiscovered().sort((a,b) => (b.icpScore||0) - (a.icpScore||0));
    setDiscovered(existing);
    const shouldRun = !lastRun || Date.now() - new Date(lastRun) > 7 * 24 * 60 * 60 * 1000;
    if (shouldRun) runDiscover();
  }, []);
  const runDiscover = async () => {
    setLoading(true);
    setError('');
    try {
      const kwList = keywords.split(',').map(k => k.trim()).filter(Boolean);
      // 30 industry keywords — each returns ~50 companies from Adzuna = 1,500 per run
      const defaultKw = kwList.length > 0 ? kwList : ['SaaS', 'e-commerce', 'B2B software', 'professional services', 'fintech', 'healthtech', 'legaltech', 'proptech', 'edtech', 'logistics', 'manufacturing', 'retail', 'construction', 'insurance', 'real estate', 'hospitality', 'food and beverage', 'fitness', 'beauty', 'marketing agency', 'consulting', 'staffing', 'accounting', 'law firm', 'dental', 'veterinary', 'home services', 'automotive', 'travel', 'media', 'publishing'];

      // ── BROWSER-SIDE scraping ─────────────────────────────
      // Note: Reddit, Clutch, Product Hunt all block server IPs via bot protection
      // Adzuna + Google News + SEC EDGAR + PR Newswire provide solid volume
      const browserCompanies = [];
      console.log('Browser sources: skipped (bot protection on all targets)');

      // ── BACKEND sources (need API keys or server-side) ────
      const r = await fetch(BACKEND + '/api/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords: defaultKw,
          keys: {
            adzunaId: settings.adzunaId,
            adzunaKey: settings.adzunaKey,
            fbToken: settings.fbToken,
            firecrawlKey: settings.firecrawlKey,
            companiesApiKey: settings.companiesApiKey
          }
        })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      const backendCompanies = d.companies || [];
      console.log('Backend companies:', backendCompanies.length);
      if (d.breakdown) console.log('Breakdown:', JSON.stringify(d.breakdown));

      // ── MERGE all sources ─────────────────────────────────
      const allIncoming = [...browserCompanies, ...backendCompanies];

      // Score browser companies
      const WEIGHTS = {
        hiring_marketing: 30,
        raised_funding: 25,
        agency_review: 45,
        tool_frustration: 20,
        ai_replacement_signal: 25,
        hiring_ops: 15,
        recently_launched: 15,
        needs_marketing: 10,
        social_pain_signal: 35,
        founder_venting: 10,
        salary_high: 20,
        salary_mid: 10,
        salary_low: 5,
        salary_unknown: 5
      };
      const scored = allIncoming.map(c => {
        if (c.icpScore) return c; // already scored by backend
        const score = Math.min(Object.entries(c.signals || {}).reduce((t, [k, v]) => v ? t + (WEIGHTS[k] || 0) : t, 0), 85);
        return {
          ...c,
          icpScore: score
        };
      }).sort((a, b) => b.icpScore - a.icpScore);

      // Dedup + merge with existing queue
      const existing = loadDiscovered();
      const existingNames = new Set([...existing.map(c => (c.name || '').toLowerCase()), ...existingLeads.map(l => (l.name || '').toLowerCase())]);
      const newOnes = scored.filter(c => !existingNames.has((c.name || '').toLowerCase()));
      const merged = [...newOnes, ...existing].slice(0, 200);
      saveDiscovered(merged);
      setDiscovered(merged);
      const now = new Date().toISOString();
      setLastRun(now);
      localStorage.setItem('cj_last_discover', now);

      // Source breakdown
      const breakdown = {};
      scored.forEach(c => {
        breakdown[c.source] = (breakdown[c.source] || 0) + 1;
      });
      console.log('Total new:', newOnes.length, '| Sources:', JSON.stringify(breakdown));
      if (scored.length === 0) setError('No results. Check Adzuna keys in Settings.');
    } catch (e) {
      setError(e.message || 'Discovery failed — backend may be sleeping, try again in 30 seconds.');
    }
    setLoading(false);
  };
  const findWebsite = async name => {
    try {
      const r = await fetch(BACKEND + '/api/find-website?company=' + encodeURIComponent(name));
      const d = await r.json();
      return d.website || '';
    } catch {
      return '';
    }
  };
  const addAndResearch = async company => {
    // Immediately add to pipeline + navigate to Research — research continues there
    const id = uid();
    const lead = {
      id, createdAt: today(), name: company.name,
      website: company.website || '', email: company.email || '',
      founderName: company.founderName || '', location: company.location || '',
      jobTitle: company.jobTitle || '', jobSnippet: company.jobSnippet || '',
      source: company.source || 'find', flaws: [], richData: {},
      signals: company.signals || {}, stackCombo: company.stackCombo || null,
      buckets: null, topPain: null, positioningScore: null,
      homepageContent: '', icpScore: company.icpScore || 0,
      status: 'new', brainFailed: false, brainFailReason: '',
      discoverySource: company.source || '',
      discoveryReason: company.discoveryReason || company.jobTitle || '',
      discoverySourceUrl: company.jobUrl || company.link || '',
      listingUrl: company.listingUrl || '',
      manualRoleCount: company.manualRoleCount || 0,
      reachability: company.reachability || 0,
      reachabilityReasons: company.reachabilityReasons || [],
      stacked: company.stacked || false, sourceCount: company.sourceCount || 1,
      pitch: '', subject: '', previewPageHtml: '',
      opens: 0, pageVisits: 0, sentAt: null,
      followUps: [
        {day:3,label:'Follow up 1',done:false,dueDate:daysFromNow(3)},
        {day:7,label:'Follow up 2',done:false,dueDate:daysFromNow(7)},
        {day:14,label:'Follow up 3',done:false,dueDate:daysFromNow(14)},
      ],
      notes: '', icpProfile: company.icpProfile || '',
      preResearchScore: company.icpScore || 0,
    };
    const existing = getLeads();
    if (!existing.some(l => l.name.toLowerCase() === company.name.toLowerCase())) {
      saveLeads([...existing, lead]);
    }
    const newQ = loadDiscovered().filter(c => c.name.toLowerCase() !== company.name.toLowerCase());
    saveDiscovered(newQ); setDiscovered(newQ);
    if (onCreate) onCreate(id);
    return; // Research happens in ResearchView
    setResearching(company.name);
    setFindStep('firecrawl');
    const ft1 = setTimeout(() => setFindStep('facebook'), 2000);
    const ft2 = setTimeout(() => setFindStep('fingerprint'), 4000);
    const ft3 = setTimeout(() => setFindStep('email'), 8000);
    const ft4 = setTimeout(() => setFindStep('brain'), 13000);
    const ft5 = setTimeout(() => setFindStep('critique'), 35000);
    try {
      let website = company.website || '';

      // Step 1: Find website if missing
      if (!website) website = await findWebsite(company.name);

      // Step 2: If still no website, add to pipeline as unresearched
      // Don't run research blind — wrong website = wasted API call
      if (!website) {
        const lead = {
          id: uid(),
          createdAt: today(),
          name: company.name,
          website: '',
          email: company.email || '',
          founderName: company.founderName || '',
          industry: company.industry || '',
          revenue: company.revenue || '',
          employees: company.employees || '',
          location: company.location || '',
          jobTitle: company.jobTitle || '',
          salary: company.salary || '',
          jobSnippet: company.jobSnippet || '',
          source: company.source || 'manual',
          flaws: [],
          richData: {},
          signals: {
            ...(company.signals || {})
          },
          stackCombo: company.stackCombo || null,
          buckets: null,
          topPain: null,
          positioningScore: null,
          homepageContent: '',
          icpScore: company.icpScore || 0,
          status: 'needs_website',
          brainFailed: true,
          brainFailReason: 'Could not find website — enter URL manually then run Research',
          discoverySource: company.source || '',
          discoveryReason: company.jobTitle || company.newsHeadline || '',
          discoverySourceUrl: company.jobUrl || company.link || '',
          listingUrl: company.listingUrl || '',
          location: company.location || '',
          pitch: '',
          subject: '',
          previewPageHtml: '',
          opens: 0,
          pageVisits: 0,
          sentAt: null,
          followUps: makeFollowUps(),
          notes: '',
          icpProfile: company.icpProfile || ''
        };
        const leads = getLeads();
        if (!leads.find(l => l.name.toLowerCase() === lead.name.toLowerCase())) {
          leads.unshift(lead);
          saveLeads(leads);
        }
        const newQueue = loadDiscovered().filter(c => c.name.toLowerCase() !== company.name.toLowerCase());
        saveDiscovered(newQueue);
        setDiscovered(newQueue);
        onCreate(lead.id);
        return;
      }

      // Step 3: Run research — Brain must succeed or we show failure state
      const r = await fetch(BACKEND + '/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company: company.name,
          website,
          keys: {
            firecrawlKey: settings.firecrawlKey,
            hunterKey: settings.hunterKey,
            fbToken: settings.fbToken,
            ninjaPearKey: settings.ninjaPearKey,
            companiesApiKey: settings.companiesApiKey
          },
          apiKey: settings.apiKey,
          discoverySignals: company.signals || {},
          discoverySource: company.source || '',
          discoveryReason: company.jobTitle || company.newsHeadline || '',
          manualRoleCount: company.manualRoleCount || 0,
          manualCategories: company.manualCategories || 0,
          icpProfile: company.icpProfile || '',
          stackCombo: company.stackCombo || null
        })
      });
      const researchData = await r.json();

      // Step 4: Check if Brain failed
      const brainFailed = researchData.brainFailed || r.status === 422;
      const brainFailReason = researchData.reason || '';
      const lead = {
        id: uid(),
        createdAt: today(),
        name: company.name,
        website,
        email: researchData.email || researchData.partialData?.email || company.email || '',
        founderName: researchData.founderName || researchData.partialData?.founderName || company.founderName || '',
        industry: company.industry || '',
        revenue: company.revenue || '',
        employees: company.employees || '',
        location: company.location || '',
        jobTitle: company.jobTitle || '',
        salary: company.salary || '',
        jobSnippet: company.jobSnippet || '',
        source: company.source || 'manual',
        flaws: researchData.flaws || [],
        richData: researchData.richData || {},
        signals: {
          ...(company.signals || {}),
          ...(researchData.signals || {})
        },
        buckets: researchData.buckets || null,
        topPain: researchData.topPain || null,
        recommendedProduct: researchData.recommendedProduct || null,
        positioningScore: researchData.positioningScore || null,
        homepageContent: researchData.homepageContent || '',
        screenshotUrl: researchData.screenshotUrl || null,
        visualAnalysis: researchData.visualAnalysis || null,
        icpScore: company.icpScore || 0,
        status: brainFailed ? 'brain_failed' : 'researched',
        brainFailed,
        brainFailReason,
        pitch: '',
        subject: '',
        previewPageHtml: '',
        opens: 0,
        pageVisits: 0,
        sentAt: null,
        followUps: makeFollowUps(),
        notes: '',
        icpProfile: company.icpProfile || ''
      };

      // Update ICP score if research succeeded
      if (!brainFailed && researchData.researchBonus) {
        lead.preResearchScore = lead.icpScore;
        lead.icpScore = Math.min(lead.icpScore + researchData.researchBonus, 100);
        lead.researchBonus = researchData.researchBonus;
      }
      const leads = getLeads();
      if (!leads.find(l => l.name.toLowerCase() === lead.name.toLowerCase())) {
        leads.unshift(lead);
        saveLeads(leads);
      }
      const newQueue = loadDiscovered().filter(c => c.name.toLowerCase() !== company.name.toLowerCase());
      saveDiscovered(newQueue);
      setDiscovered(newQueue);
      onCreate(lead.id);
    } catch (e) {
      setError('Research failed: ' + e.message);
    }
    clearTimeout(ft1); clearTimeout(ft2); clearTimeout(ft3); clearTimeout(ft4); clearTimeout(ft5);
    setFindStep('firecrawl');
    setResearching('');
  };
  const skipLead = company => {
    const newQ = loadDiscovered().filter(c => c.name.toLowerCase() !== company.name.toLowerCase());
    saveDiscovered(newQ);
    setDiscovered(newQ);
  };
  const saveForLater = company => {
    // Add to saved leads list, remove from discovery queue
    const SAVED_KEY = 'cj_saved_v1';
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch {}
    if (!saved.some(s => s.name.toLowerCase() === company.name.toLowerCase())) {
      saved.push({ ...company, savedAt: new Date().toISOString().slice(0,10) });
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    }
    const newQ = loadDiscovered().filter(c => c.name.toLowerCase() !== company.name.toLowerCase());
    saveDiscovered(newQ);
    setDiscovered(newQ);
  };
  const addManual = async () => {
    if (!form.name.trim()) return;
    await addAndResearch({
      ...form,
      source: 'manual'
    });
    setForm({
      name: '',
      website: '',
      email: '',
      founderName: '',
      industry: '',
      revenue: '',
      employees: '',
      location: ''
    });
  };
  const sc = s => s >= 60 ? 'var(--a)' : s >= 35 ? 'var(--am)' : 'var(--m)';
  const sl = s => s >= 60 ? 'Strong ICP' : s >= 35 ? 'Moderate' : 'Watch List';
  const profileLabel = co => {
    if (co.icpProfile === 'ecommerce') return {
      label: 'E-commerce',
      color: '#f59e0b'
    };
    if (co.icpProfile === 'saas') return {
      label: 'SaaS',
      color: '#7c3aed'
    };
    if (co.icpProfile === 'local') return {
      label: 'Local Business',
      color: '#22c55e'
    };
    if (co.icpProfile === 'ai_ops') return {
      label: 'AI Opportunity',
      color: '#a3e635'
    };
    if (co.signals?.preparing_for_exit) return {
      label: 'Exit Prep',
      color: '#ef4444'
    };
    if (co.signals?.raised_funding) return {
      label: 'Just Funded',
      color: '#7c3aed'
    };
    if (co.signals?.rebranding) return {
      label: 'Rebranding',
      color: '#f59e0b'
    };
    if (co.signals?.recently_acquired) return {
      label: 'Post-Acquisition',
      color: '#ef4444'
    };
    if (co.signals?.running_fb_ads) return {
      label: 'Running Ads',
      color: '#3b82f6'
    };
    return null;
  };
  const whyFlagged = co => {
    if (co.signals?.agency_review) return 'Left agency review — frustrated with current agency';
    if (co.signals?.preparing_for_exit) return 'Listed for sale — owner wants to maximize revenue before exit';
    if (co.signals?.running_fb_ads && co.signals?.stale_ads) return 'Running Facebook Ads for 90+ days — stale creative, wasted budget';
    if (co.signals?.running_fb_ads) return 'Confirmed running Facebook Ads — has budget, needs optimization';
    if (co.signals?.hiring_marketing) return 'Hiring ' + (co.jobTitle || 'marketing role') + (co.salary ? ' at ' + co.salary : '');
    if (co.signals?.ai_replacement_heavy) return 'Hiring ' + (co.manualRoleCount||'multiple') + ' manual roles across ' + (co.manualCategories||'multiple') + ' functions — heavy AI automation opportunity';
    if (co.signals?.ai_replacement_multi) return 'Hiring ' + (co.manualRoleCount||'multiple') + ' manual roles — AI-replaceable labor spend';
    if (co.signals?.ai_replacement_signal) return (co.jobTitle || 'Hiring manual role — AI replacement opportunity');
    if (co.signals?.raised_funding) return 'Recently raised funding — needs growth infrastructure';
    if (co.signals?.rebranding) return 'Rebranding — needs full marketing rebuild';
    if (co.signals?.recently_acquired) return 'Just acquired — new owners need marketing reset';
    if (co.signals?.social_pain_signal) return 'Founder describing marketing pain publicly right now';
    if (co.signals?.recently_launched) return 'Just launched — needs marketing infrastructure';
    if (co.signals?.expanding) return 'Expanding — growth signals';
    if (co.newsHeadline) return co.newsHeadline.slice(0, 80);
    return 'Matched ICP criteria';
  };
  const alreadyAdded = name => existingLeads.some(l => l.name.toLowerCase() === name.toLowerCase());
  return React.createElement('div', null, React.createElement('div', {
    className: 'tb'
  }, React.createElement('div', null, React.createElement('div', {
    className: 'tt'
  }, 'Find Leads'), React.createElement('div', {
    className: 'ts'
  }, '4 signal sources · AI-replacement · trigger events · exit prep · funded · auto-scans weekly')), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, discovered.length > 0 && React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--a)',
      fontWeight: 600
    }
  }, discovered.length + ' in queue'), React.createElement('div', {
    style: {
      display: 'flex',
      background: 'var(--s2)',
      border: '1px solid var(--b2)',
      borderRadius: 10,
      padding: 3,
      gap: 2
    }
  }, [{
    id: 'discover',
    label: 'Auto'
  }, {
    id: 'manual',
    label: 'Manual'
  }].map(m => React.createElement('button', {
    key: m.id,
    onClick: () => setMode(m.id),
    className: 'btn btn-sm',
    style: {
      background: mode === m.id ? 'var(--p)' : 'transparent',
      color: mode === m.id ? '#fff' : 'var(--m2)',
      border: 'none',
      borderRadius: 7
    }
  }, m.label))), React.createElement('button', {
    className: 'btn btn-g btn-sm',
    onClick: runDiscover,
    disabled: loading
  }, 'Refresh'))), React.createElement('div', {
    className: 'content'
  }, error && React.createElement('div', {
    style: {
      padding: '12px 16px',
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 10,
      marginBottom: 16,
      fontSize: 13,
      color: '#fca5a5'
    }
  }, 'Warning: ' + error), mode === 'discover' && React.createElement('div', {
    style: {
      maxWidth: 920
    }
  }, loading && React.createElement(FindLoader), !loading && discovered.length === 0 && React.createElement('div', {
    style: {
      textAlign: 'center',
      padding: '48px 0',
      color: 'var(--m)'
    }
  }, React.createElement('div', {
    style: {
      fontSize: 40,
      marginBottom: 12
    }
  }, 'Scanning...'), React.createElement('div', {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--m2)',
      marginBottom: 6
    }
  }, 'No leads in queue yet'), React.createElement('div', {
    style: {
      fontSize: 12,
      marginBottom: 20
    }
  }, 'SEC EDGAR, Clutch, and Google News work with zero API keys. Add Adzuna keys for high volume.'), React.createElement('button', {
    className: 'btn btn-a',
    onClick: runDiscover
  }, 'Run Discovery Now')), !loading && discovered.length > 0 && React.createElement('div', null, React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14
    }
  }, React.createElement('div', null, React.createElement('span', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 700,
      fontSize: 15
    }
  }, discovered.length), React.createElement('span', {
    style: {
      fontSize: 13,
      color: 'var(--m2)'
    }
  }, ' companies in queue')), lastRun && React.createElement('div', {
    style: {
      fontSize: 11,
      color: 'var(--m)'
    }
  }, 'Last scan: ' + new Date(lastRun).toLocaleDateString())), React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, researching && React.createElement(ScanningOverlay, {
    company: researching,
    step: findStep
  }), !researching && React.createElement(React.Fragment, null,
    (() => {
      const SOURCE_CAT = {'adzuna_ai':'Hiring — AI Replacement Opportunity','sec_edgar':'Recently Funded','bizbuysell':'Businesses for Sale','news_hire':'Trigger Events','news_funding':'Trigger Events','news_rebrand':'Trigger Events','news_acquisition':'Trigger Events','news_expansion':'Trigger Events','news_agency_pain':'Trigger Events','news_launch':'Trigger Events'};
      const catOf = c => (c.stackCombo && c.stackCombo.tier !== 'B') ? 'STACKED SIGNALS - HIGHEST CONFIDENCE' : (SOURCE_CAT[c.source] || 'Other Signals');
      const sorted = [...discovered].sort((a,b) => (b.icpScore||0) - (a.icpScore||0));
      const cats = [...new Set(sorted.map(catOf))];
      const catCounts = {};
      sorted.forEach(c => { const k = catOf(c); catCounts[k] = (catCounts[k]||0)+1; });
      return React.createElement(React.Fragment, null, ...cats.map((cat,ci) => React.createElement('div', {key:'hdr'+ci, style:{display:'flex',alignItems:'center',gap:10,padding:'14px 20px 4px',marginTop:ci?4:0}}, React.createElement('div',{style:{fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--m)',whiteSpace:'nowrap'}},cat+' ('+catCounts[cat]+')'),React.createElement('div',{style:{flex:1,height:1,background:'var(--b)'}}))));
    })()
  ), !researching && [...discovered].sort((a,b) => (b.icpScore||0) - (a.icpScore||0)).map((co, i) => {
    const added = alreadyAdded(co.name);
    const isExpanded = expandedLead === co.name;
    return React.createElement('div', {
      key: i,
      className: 'card',
      onClick: () => setExpandedLead(isExpanded ? null : co.name),
      style: {
        display: 'flex', cursor: 'pointer',
        alignItems: 'center',
        gap: 14,
        borderColor: co.icpScore >= 60 ? 'rgba(163,230,53,0.25)' : co.icpScore >= 35 ? 'rgba(245,158,11,0.2)' : 'var(--b)',
        opacity: added ? 0.6 : 1
      }
    }, React.createElement('div', {
      style: {
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: '2px solid ' + sc(co.icpScore),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: sc(co.icpScore) + '18'
      }
    }, React.createElement('div', {
      style: {
        fontFamily: 'Syne',
        fontWeight: 800,
        fontSize: 13,
        color: sc(co.icpScore),
        lineHeight: 1
      }
    }, co.icpScore || '?'), React.createElement('div', {
      style: {
        fontSize: 8,
        color: 'var(--m)'
      }
    }, '/100')), React.createElement('div', {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 3,
        flexWrap: 'wrap'
      }
    }, React.createElement('div', {
      style: {
        fontFamily: 'Syne',
        fontWeight: 700,
        fontSize: 14
      }
    }, co.name), React.createElement('span', {
      style: {
        fontSize: 10,
        padding: '2px 7px',
        borderRadius: 20,
        background: sc(co.icpScore) + '22',
        border: '1px solid ' + sc(co.icpScore) + '44',
        color: sc(co.icpScore)
      }
    }, sl(co.icpScore)), React.createElement('span', {
      style: {
        fontSize: 10,
        padding: '2px 6px',
        borderRadius: 20,
        background: 'rgba(124,58,237,0.1)',
        border: '1px solid rgba(124,58,237,0.2)',
        color: '#a78bfa',
        display: 'none'
      }
    }, (co.source || '').replace(/_/g, ' ')), (() => {
      return null;
    })(), co.stackCombo && React.createElement('span', {
      style: {
        fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
        background: co.stackCombo.tier === 'S' ? 'rgba(239,68,68,0.15)' : co.stackCombo.tier === 'A' ? 'rgba(251,146,60,0.15)' : 'rgba(124,58,237,0.12)',
        border: '1px solid ' + (co.stackCombo.tier === 'S' ? 'rgba(239,68,68,0.4)' : co.stackCombo.tier === 'A' ? 'rgba(251,146,60,0.35)' : 'rgba(124,58,237,0.3)'),
        color: co.stackCombo.tier === 'S' ? '#f87171' : co.stackCombo.tier === 'A' ? '#fb923c' : '#a78bfa'
      },
      title: co.stackCombo.whyHot
    }, co.stackCombo.label),
      !co.stackCombo && React.createElement('span', {
        style:{fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:500,background:'var(--s2)',border:'1px solid var(--b2)',color:'var(--m)'}
      }, ({adzuna_ai:'AI Opportunity',sec_edgar:'Just Funded',bizbuysell:'Exit Prep',news_hire:'CMO Hired',news_funding:'Just Funded',news_rebrand:'Rebranding',news_acquisition:'Acquired',news_expansion:'Expanding',news_agency_pain:'Agency Pain'})[co.source]||'Signal'),
      co.reachability != null && React.createElement('span', {
        style:{fontSize:10,color:co.reachability>=18?'#22c55e':co.reachability>=8?'#f59e0b':'#ef4444',fontWeight:600,display:'flex',alignItems:'center',gap:3},
        title:(co.reachabilityReasons||[]).join(' · ')},
        React.createElement('span',{style:{width:5,height:5,borderRadius:'50%',background:co.reachability>=18?'#22c55e':co.reachability>=8?'#f59e0b':'#ef4444',flexShrink:0,display:'inline-block'}}),
        co.reachability>=18?'Reachable':co.reachability>=8?'Likely':'Hard to reach'),
      added && React.createElement('span',{style:{fontSize:10,color:'var(--g)',fontWeight:600}},'✓ Pipeline'),
      co.verifiedEmployees && React.createElement('span',{style:{fontSize:10,color:'var(--m)',fontWeight:500}}, co.verifiedEmployees + ' emp'),
      co.verifiedCEO && React.createElement('span',{style:{fontSize:10,color:'#a3e635',fontWeight:600}}, '👤 ' + co.verifiedCEO),
      co.publicPainSignals && co.publicPainSignals.length > 0 && React.createElement('span',{style:{fontSize:10,color:'#f87171',fontWeight:600}}, '🔥 ' + co.publicPainSignals.length + ' pain signals'),
      co.sizeWarning && !co.verifiedEmployees && React.createElement('span',{style:{fontSize:10,color:'#f59e0b',fontWeight:500}}, '⚠ size unverified')), React.createElement('div', {
      style: {
        fontSize: 12,
        color: 'var(--a)',
        marginBottom: 4,
        fontWeight: 500
      }
    }, 'Why flagged: ' + whyFlagged(co)), React.createElement('div', {
      style: {
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        fontSize: 11,
        color: 'var(--m)'
      }
    }, co.website && React.createElement('span', null, co.website.replace(/https?:\/\//, '').split('/')[0]), co.location && React.createElement('span', null, co.location), co.employees && React.createElement('span', null, co.employees + ' employees')), co.jobSnippet && React.createElement('div', {
      style: {
        fontSize: 11,
        color: 'var(--m2)',
        marginTop: 3,
        fontStyle: 'italic'
      }
    }, '"' + co.jobSnippet.slice(0, 100) + '..."')), React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        flexShrink: 0
      }
    }, !added && React.createElement('button', {
      className: 'btn btn-p btn-sm',
      onClick: e => { e.stopPropagation(); addAndResearch(co); },
      disabled: !!researching
    }, researching === co.name ? 'Adding...' : 'Add to Pipeline'), added && React.createElement('span', {
      style: {
        fontSize: 11,
        color: 'var(--g)',
        fontWeight: 600
      }
    }, '✓ In Pipeline'), !added && React.createElement('button', {
      className: 'btn btn-g btn-sm',
      onClick: e => { e.stopPropagation(); saveForLater(co); },
      disabled: !!researching
    }, '☆ Save for Later'), !added && React.createElement('button', {
      className: 'btn btn-g btn-sm',
      onClick: e => { e.stopPropagation(); skipLead(co); },
      disabled: !!researching,
      style: { opacity: 0.6 }
    }, 'Skip'), isExpanded && React.createElement('div', {
      style:{gridColumn:'1/-1',marginTop:12,paddingTop:12,borderTop:'1px solid var(--b2)'}
    },
      React.createElement('div', { style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 16px',marginBottom:10} }, [
        ['Source',({adzuna_ai:'Adzuna job board',sec_edgar:'SEC EDGAR filing',bizbuysell:'BizBuySell listing',news_hire:'CMO hire signal',news_funding:'Funding round',news_rebrand:'Rebrand',news_acquisition:'Acquisition',news_expansion:'Expansion',news_agency_pain:'Agency pain'})[co.source]||co.source||'—'],
        ['Location',co.location||'—'],
        ['Headcount', co.verifiedEmployees ? co.verifiedEmployees.toLocaleString() + ' employees (verified via Google)' : 'Not verified'],
        co.verifiedCEO && ['Decision-maker', co.verifiedCEO + ' — ' + (co.verifiedCEOTitle || 'CEO')],
        co.verifiedRevenue && ['Revenue', co.verifiedRevenue],
        ['Score',(co.icpScore||0)+'/100'],
        ['Reachability',(co.reachability||0)+'/30'],
        co.manualRoleCount>0&&['Manual roles',co.manualRoleCount+' confirmed job postings'],
        co.stackCombo&&['Why hot',co.stackCombo.whyHot],
      ].filter(Boolean).map(([k,v],idx)=>React.createElement('div',{key:idx},
        React.createElement('div',{style:{fontSize:9,color:'var(--m)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:1}},k),
        React.createElement('div',{style:{fontSize:11,color:'var(--m2)'}},v)
      ))),
      co.publicPainSignals && co.publicPainSignals.length > 0 && React.createElement('div', { style: { marginBottom: 10, padding: 10, background: 'rgba(239,68,68,0.06)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)' } },
        React.createElement('div', { style: { fontSize: 9, color: '#f87171', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, fontWeight: 700 } }, '🔥 Public Pain Signals (from search)'),
        co.publicPainSignals.map((p, idx) => React.createElement('div', { key: idx, style: { fontSize: 11, color: 'var(--m2)', marginBottom: 4, fontStyle: 'italic' } }, '"' + p + '"'))
      ),
      // Direct link to where the lead was found
      (co.jobUrl || co.listingUrl || co.discoverySourceUrl) && React.createElement('a', {
        href: co.jobUrl || co.listingUrl || co.discoverySourceUrl,
        target: '_blank', rel: 'noopener',
        onClick: e => e.stopPropagation(),
        style: { display: 'inline-block', fontSize: 11, color: 'var(--a)', fontWeight: 600, marginTop: 4 }
      }, '↗ View the ' + (co.source === 'bizbuysell' ? 'BizBuySell listing' : co.source && co.source.startsWith('news') ? 'news article' : 'job posting') + ' where we found them')
    )));
  })))), mode === 'manual' && React.createElement('div', {
    style: {
      maxWidth: 640
    }
  }, React.createElement('div', {
    className: 'card'
  }, React.createElement('div', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 700,
      fontSize: 14,
      marginBottom: 6
    }
  }, 'Manual Add'), React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--m2)',
      marginBottom: 14
    }
  }, 'Website is optional — app auto-finds it and runs full research automatically.'), React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement('div', {
    style: {
      gridColumn: '1/-1'
    }
  }, React.createElement('label', {
    className: 'lbl'
  }, 'Company Name *'), React.createElement('input', {
    className: 'input',
    value: form.name,
    onChange: e => setForm(p => ({
      ...p,
      name: e.target.value
    })),
    placeholder: 'e.g. Acme Corp'
  })), React.createElement('div', null, React.createElement('label', {
    className: 'lbl'
  }, 'Website (optional)'), React.createElement('input', {
    className: 'input',
    value: form.website,
    onChange: e => setForm(p => ({
      ...p,
      website: e.target.value
    })),
    placeholder: 'https://acme.com'
  })), React.createElement('div', null, React.createElement('label', {
    className: 'lbl'
  }, 'Industry'), React.createElement('input', {
    className: 'input',
    value: form.industry,
    onChange: e => setForm(p => ({
      ...p,
      industry: e.target.value
    })),
    placeholder: 'e.g. SaaS'
  })), React.createElement('div', null, React.createElement('label', {
    className: 'lbl'
  }, 'Founder Name'), React.createElement('input', {
    className: 'input',
    value: form.founderName,
    onChange: e => setForm(p => ({
      ...p,
      founderName: e.target.value
    })),
    placeholder: 'e.g. John Smith'
  })), React.createElement('div', null, React.createElement('label', {
    className: 'lbl'
  }, 'Email'), React.createElement('input', {
    className: 'input',
    value: form.email,
    onChange: e => setForm(p => ({
      ...p,
      email: e.target.value
    })),
    placeholder: 'founder@acme.com'
  })), React.createElement('div', null, React.createElement('label', {
    className: 'lbl'
  }, 'Revenue'), React.createElement('input', {
    className: 'input',
    value: form.revenue,
    onChange: e => setForm(p => ({
      ...p,
      revenue: e.target.value
    })),
    placeholder: 'e.g. $20M'
  }))), React.createElement('div', {
    className: 'divider'
  }), React.createElement('button', {
    className: 'btn btn-a',
    onClick: addManual,
    disabled: !form.name.trim() || !!researching,
    style: {
      width: '100%',
      justifyContent: 'center'
    }
  }, researching ? 'Researching...' : 'Research + Add to Pipeline')))));
}
function ResearchView({
  leadId,
  onNext,
  onSelectLead,
  settings
}) {
  const [lead, setLead] = useState(null);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [researchStep, setResearchStep] = useState('');
  const [saved, setSaved] = useState(false);
  const [diveMode, setDiveMode] = useState('quick');
  const [notes, setNotes] = useState('');
  const [websiteOverride, setWebsiteOverride] = useState('');
  const [flagging, setFlagging] = useState(false);
  const [flagged, setFlagged] = useState({});
  const [websiteModal, setWebsiteModal] = useState(null); // null | { website, source, onConfirm }
  const [researchError, setResearchError] = useState('');
  const [rerunConfirm, setRerunConfirm] = useState(false);
  useEffect(() => {
    // Reload all leads from storage every time leadId changes — highest score first
    const leads = getLeads().sort((a,b) => (b.icpScore||0) - (a.icpScore||0));
    setAllLeads(leads);
    const l = leads.find(x => x.id === leadId);
    if (l) {
      setLead(l);
      setNotes(l.notes || '');
      setWebsiteOverride(l.website || '');
      setFlagged({});
      setFlagging(false);
    }
  }, [leadId]);

  // Refresh allLeads on mount + whenever storage changes (new lead added from Find tab)
  useEffect(() => {
    const sync = () => setAllLeads(getLeads().sort((a,b) => (b.icpScore||0) - (a.icpScore||0)));
    window.addEventListener('storage', sync);
    sync(); // fire immediately on mount
    return () => window.removeEventListener('storage', sync);
  }, []);

  // Always save lead to DB immediately when added
  const ensureSaved = l => {
    const leads = getLeads();
    const idx = leads.findIndex(x => x.id === l.id);
    if (idx >= 0) {
      leads[idx] = {
        ...leads[idx],
        ...l
      };
    } else {
      leads.unshift(l);
    }
    saveLeads(leads);
  };
  // Don't early-return when no lead — fall through to full layout so sidebar always shows.
  // The main panel shows a prompt to select a lead from the sidebar.
  // Step 1: Find website and show confirmation modal before running research
  const handleRunResearch = async () => {
    let website = websiteOverride || lead.website || '';
    // If we already have a confirmed website, skip lookup and go straight to modal
    if (!website || website.includes('company.com') || website.includes('support.google')) {
      // Try Clearbit autocomplete first
      let source = 'manual';
      try {
        const r = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(lead.name)}`);
        const d = await r.json();
        if (Array.isArray(d) && d.length > 0 && d[0].domain) {
          website = `https://${d[0].domain}`;
          source = 'Clearbit';
          console.log('Clearbit found:', website);
        }
      } catch (e) { console.log('Clearbit:', e.message); }
      // If still nothing, try backend find-website
      if (!website) {
        try {
          const r = await fetch(BACKEND + '/api/find-website?company=' + encodeURIComponent(lead.name));
          const d = await r.json();
          if (d.website) {
            website = d.website;
            source = d.confident ? 'Clearbit' : 'search (low confidence)';
          }
        } catch (e) { console.log('find-website:', e.message); }
      }
    } else {
      // We have a website already — still show modal so user can verify before spending credits
    }
    // Always show the modal — confirm before spending API credits
    // Show a clear warning when confidence is low or domain looks suspicious.
    const domainSuspicious = website && /-(dallas|houston|chicago|miami|nyc|la|atlanta|seattle|denver|phoenix|austin|boston|dc|sf|ny|tx|ca|fl|ga|il|nc|oh|az|co|wa)(\.|\/|$)/i.test(website);
    let modalSource = 'Not found — paste the correct URL below';
    let modalWarning = '';
    if (!website) {
      modalWarning = 'We could not find their website automatically. Search "[company name] official site" in Google and paste the URL below.';
    } else if (domainSuspicious) {
      modalWarning = 'WARNING: This looks like a regional subdomain, not the main company site. Please verify — wrong site means the entire audit is worthless.';
    } else {
      modalWarning = '';
    }
    if (website && !domainSuspicious) modalSource = 'Found automatically — verify before running';
    else if (website) modalSource = 'Found but needs verification';
    setWebsiteModal({
      website: website || '',
      source: modalSource,
      warning: modalWarning,
      onConfirm: (confirmedUrl) => {
        setWebsiteModal(null);
        setWebsiteOverride(confirmedUrl);
        runResearch(confirmedUrl);
      }
    });
  };

  const runResearch = async (confirmedWebsite) => {
    setLoading(true);
    setResearchError('');
    setResearchStep('firecrawl'); // set immediately with loading so overlay renders
    let t1, t2, t3, t4, t5, t6;
    try {
      let website = confirmedWebsite || websiteOverride || lead.website || '';

      // ── STEP 1: WEBSITE ALREADY CONFIRMED VIA MODAL ──
      // Clearbit lookup already happened in handleRunResearch above.

      // ── STEP 2: BROWSER-DIRECT API CALLS (no Render blocking) ──
      const domain = website ? website.replace(/https?:\/\//, '').replace(/\/.*/, '').replace('www.', '') : '';

      // PageSpeed — Google free API, works from browser
      let pageSpeed = {};
      if (website) {
        try {
          const r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(website)}&strategy=mobile`);
          const d = await r.json();
          const score = d.lighthouseResult?.categories?.performance?.score;
          pageSpeed = {
            mobileScore: score ? Math.round(score * 100) : null,
            lcp: d.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue || null,
            fcp: d.lighthouseResult?.audits?.['first-contentful-paint']?.displayValue || null
          };
          console.log('PageSpeed:', pageSpeed.mobileScore);
        } catch (e) {
          console.log('PageSpeed:', e.message);
        }
      }

      // Hunter.io — from browser
      let emailData = {
        email: '',
        founderName: ''
      };
      if (domain && settings.hunterKey) {
        try {
          const r = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&type=personal&limit=5&api_key=${settings.hunterKey}`);
          const d = await r.json();
          const emails = d.data?.emails || [];
          const priority = ['ceo', 'founder', 'co-founder', 'owner', 'president', 'cmo'];
          const sorted = emails.sort((a, b) => {
            const aS = priority.findIndex(p => (a.position || '').toLowerCase().includes(p));
            const bS = priority.findIndex(p => (b.position || '').toLowerCase().includes(p));
            return (aS === -1 ? 99 : aS) - (bS === -1 ? 99 : bS);
          });
          const best = sorted[0];
          if (best) emailData = {
            email: best.value || '',
            founderName: `${best.first_name || ''} ${best.last_name || ''}`.trim(),
            title: best.position || ''
          };
          console.log('Hunter email:', emailData.email);
        } catch (e) {
          console.log('Hunter:', e.message);
        }
      }

      // Clearbit company enrichment — from browser
      let companyData = {};
      if (domain) {
        try {
          const r = await fetch(`https://company.clearbit.com/v1/domains/find?domain=${domain}`, {
            headers: {
              'Accept': 'application/json'
            }
          });
          if (r.ok) {
            const d = await r.json();
            companyData = {
              name: d.name || '',
              industry: d.category?.industry || '',
              employees: d.metrics?.employees || '',
              revenue: d.metrics?.estimatedAnnualRevenue || '',
              description: d.description || ''
            };
            console.log('Clearbit company:', companyData.name);
          }
        } catch (e) {/* silent */}
      }

      // ── STEP 3: BACKEND CALLS (Firecrawl + Claude vision only) ──
      // Advance loading steps to match real backend timing
      // Parallel batch (firecrawl + facebook + fingerprint + pagespeed): ~0-12s
      t1 = setTimeout(() => setResearchStep('facebook'), 2000);
      t2 = setTimeout(() => setResearchStep('fingerprint'), 4000);
      t3 = setTimeout(() => setResearchStep('pagespeed'), 6000);
      t4 = setTimeout(() => setResearchStep('email'), 10000);
      t5 = setTimeout(() => setResearchStep('brain'), 14000);
      t6 = setTimeout(() => setResearchStep('critique'), 36000);
      const r = await fetch(BACKEND + '/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company: lead.name,
          website,
          apiKey: settings.apiKey,
          keys: {
            firecrawlKey: settings.firecrawlKey,
            fbToken: settings.fbToken,
            hunterKey: settings.hunterKey,
            ninjaPearKey: settings.ninjaPearKey
          },
          stackCombo: lead.stackCombo || null,
          discoverySignals: lead.signals || {},
          discoverySource: lead.source || '',
          discoveryReason: lead.jobTitle || lead.newsHeadline || '',
          manualRoleCount: lead.manualRoleCount || 0,
          manualCategories: lead.manualCategories || 0,
          icpProfile: lead.icpProfile || '',
          verifiedEmployees: lead.verifiedEmployees || null,
          verifiedCEO: lead.verifiedCEO || null,
          verifiedCEOTitle: lead.verifiedCEOTitle || null,
          publicPainSignals: lead.publicPainSignals || [],
          browserData: {
            pageSpeed,
            emailData,
            companyData
          }
        })
      });
      const data = await r.json();

      // ── STEP 4: MERGE ALL DATA ──
      const leads = getLeads();
      const idx = leads.findIndex(x => x.id === leadId);
      if (idx >= 0) {
        if (website) leads[idx].website = website;

        // Brain failed — update status, show reason, don't wipe existing good data
        if (data.brainFailed || r.status === 422) {
          leads[idx].brainFailed = true;
          leads[idx].brainFailReason = data.reason || 'Brain audit failed';
          leads[idx].status = 'brain_failed';
          // Still save email if we got it from Hunter
          if (emailData.email) leads[idx].email = emailData.email;
          if (emailData.founderName) leads[idx].founderName = emailData.founderName;
          // Save screenshot if available so user can verify website
          if (data.screenshotUrl) leads[idx].screenshotUrl = data.screenshotUrl;
          saveLeads(leads);
          setLead({
            ...leads[idx]
          });
          return;
        }

        // Brain succeeded — update everything
        leads[idx].brainFailed = false;
        leads[idx].brainFailReason = '';
        leads[idx].email = emailData.email || data.email || leads[idx].email || '';
        leads[idx].founderName = emailData.founderName || data.founderName || leads[idx].founderName || '';
        if (companyData.industry) leads[idx].industry = companyData.industry;
        if (companyData.employees) leads[idx].employees = String(companyData.employees);
        leads[idx].flaws = data.flaws || [];
        leads[idx].researchBonus = data.researchBonus || 0;
        const discoveryScore = leads[idx].icpScore || 0;
        leads[idx].icpScore = Math.min(discoveryScore + (data.researchBonus || 0), 100);
        leads[idx].preResearchScore = discoveryScore;
        leads[idx].richData = {
          ...(data.richData || {}),
          mobileScore: pageSpeed.mobileScore ? `${pageSpeed.mobileScore}/100 mobile score` : 'Not checked',
          loadTime: pageSpeed.lcp || ''
        };
        leads[idx].signals = {
          ...(leads[idx].signals || {}),
          ...(data.signals || {})
        };
        leads[idx].buckets = data.buckets || null;
        leads[idx].topPain = data.topPain || null;
        leads[idx].recommendedProduct = data.recommendedProduct || null;
        leads[idx].brainAudit = data.brainAudit || null;
        leads[idx].topThreeProducts = (data.brainAudit && data.brainAudit.topThreeProducts) || [];
        leads[idx].positioningScore = data.positioningScore || null;
        leads[idx].homepageContent = data.homepageContent || '';
        leads[idx].screenshotUrl = data.screenshotUrl || null;
        leads[idx].visualAnalysis = data.visualAnalysis || null;
        // Reachability was ESTIMATED at discovery — now VERIFY with Hunter result.
        // Found an owner/CEO email = confirmed reachable. No email = downgrade.
        const foundEmail = data.email || leads[idx].email;
        const foundTitle = (data.founderTitle || '').toLowerCase();
        const isOwnerContact = foundEmail && /ceo|founder|owner|president|principal/i.test(foundTitle);
        if (isOwnerContact) {
          leads[idx].reachability = Math.max(leads[idx].reachability || 0, 25);
          leads[idx].reachabilityReasons = ['VERIFIED: found ' + (data.founderTitle || 'owner') + ' email — ' + foundEmail];
          leads[idx].reachabilityVerified = true;
        } else if (foundEmail) {
          leads[idx].reachabilityReasons = [...(leads[idx].reachabilityReasons || []), 'Email found but not owner-level (' + (data.founderTitle || 'unknown title') + ')'];
        } else {
          leads[idx].reachability = Math.min(leads[idx].reachability || 0, 7);
          leads[idx].reachabilityReasons = ['No contact email found — reachability downgraded'];
        }
        leads[idx].status = 'researched';
        saveLeads(leads);
        setLead({
          ...leads[idx]
        });
      }
    } catch (e) {
      console.error('Research error:', e);
      // SURFACE the error — silent failures made debugging impossible.
      // Common causes: Render sleeping (cold start ~30s), mid-deploy, network.
      setResearchError(
        (e.message || 'Unknown error') +
        ' — If the backend was sleeping (free tier), wait 30 seconds and retry.'
      );
    }
    clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
    setResearchStep('done');
    setLoading(false);
  };
  const save = () => {
    const leads = getLeads();
    const idx = leads.findIndex(x => x.id === leadId);
    if (idx >= 0) {
      leads[idx].notes = notes;
      saveLeads(leads);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  const links = lead ? RLINKS(lead.name, lead.website) : [];
  const hasResearch = !!(lead && (lead.buckets || lead.flaws && lead.flaws.length > 0));
  const BucketCard = ({
    title,
    emoji,
    data,
    borderColor
  }) => {
    if (!data) return null;
    const entries = Object.entries(data).filter(([k, v]) => v && typeof v === 'string' && !k.match(/Weak$|onfirmed$|Detail$|Note$/));
    return React.createElement('div', {
      style: {
        background: borderColor + '08',
        border: '1px solid ' + borderColor + '30',
        borderRadius: 12,
        padding: '14px 16px'
      }
    }, React.createElement('div', {
      style: {
        fontWeight: 700,
        fontSize: 13,
        marginBottom: 10
      }
    }, emoji + ' ' + title), React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 5
      }
    }, entries.map(([k, v]) => {
      const bad = /No |None|unavailable|Generic|Weak|not detected|0\//i.test(v);
      return React.createElement('div', {
        key: k,
        style: {
          display: 'flex',
          gap: 8,
          fontSize: 11,
          alignItems: 'flex-start'
        }
      }, React.createElement('span', {
        style: {
          color: bad ? 'var(--r)' : 'var(--a)',
          flexShrink: 0
        }
      }, bad ? 'x' : 'ok'), React.createElement('span', {
        style: {
          color: 'var(--m2)'
        }
      }, v));
    })));
  };
  return React.createElement('div', {
    style: { display: 'flex', height: '100%', position: 'relative' }
  },
  // ── RE-RUN RESEARCH CONFIRM MODAL ─────────────────────────────────────────
  rerunConfirm && React.createElement('div', {
    style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    onClick: () => setRerunConfirm(false)
  }, React.createElement('div', {
    style: { background: 'var(--s)', border: '1px solid var(--b2)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw' },
    onClick: e => e.stopPropagation()
  }, React.createElement('div', {
    style: { fontFamily: 'Syne', fontWeight: 700, fontSize: 16, marginBottom: 8 }
  }, 'Re-run research?'),
  React.createElement('div', {
    style: { fontSize: 13, color: 'var(--m2)', marginBottom: 18, lineHeight: 1.5 }
  }, 'This lead was already researched. Running again overwrites the current audit and uses API credits.'),
  React.createElement('div', { style: { display: 'flex', gap: 8 } },
    React.createElement('button', {
      className: 'btn btn-a',
      style: { flex: 1 },
      onClick: () => { setRerunConfirm(false); handleRunResearch(); }
    }, 'Yes, re-run'),
    React.createElement('button', {
      className: 'btn btn-g',
      onClick: () => setRerunConfirm(false)
    }, 'Cancel')
  ))),
  // ── WEBSITE CONFIRMATION MODAL ────────────────────────────────────────────
  websiteModal && React.createElement((() => {
    // Self-contained modal with live URL verification
    const [verifying, setVerifying] = React.useState(false);
    const [verifyResult, setVerifyResult] = React.useState(null);
    const [modalUrl, setModalUrl] = React.useState(websiteModal.website);
    const verify = async (url) => {
      if (!url || !url.startsWith('http')) { setVerifyResult({ ok: false, verdict: 'invalid', error: 'Enter a valid URL starting with https://' }); return; }
      setVerifying(true); setVerifyResult(null);
      try {
        const r = await fetch(BACKEND + '/api/verify-website?url=' + encodeURIComponent(url) + '&company=' + encodeURIComponent(lead ? lead.name : ''));
        const d = await r.json();
        setVerifyResult(d);
      } catch(e) { setVerifyResult({ ok: false, verdict: 'unreachable', error: e.message }); }
      setVerifying(false);
    };
    React.useEffect(() => { if (modalUrl) verify(modalUrl); }, []);
    const verdictColor = verifyResult?.ok ? '#22c55e' : verifyResult?.verdict === 'unreachable' ? '#f59e0b' : '#ef4444';
    const verdictText = !verifyResult ? null : verifyResult.ok ? '✓ Verified — site loads and mentions the company' : verifyResult.verdict === 'dead' ? '✗ 404 — this URL is dead, find the correct one' : verifyResult.verdict === 'wrong_site' ? '✗ Site does not mention the company — likely wrong domain' : verifyResult.verdict === 'invalid' ? '✗ ' + verifyResult.error : '⚠ Could not reach site — may be blocking our server, proceed with caution';
    return React.createElement('div', {
      style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
      onClick: () => setWebsiteModal(null)
    }, React.createElement('div', {
      style: { background: 'var(--s)', border: '1px solid var(--b2)', borderRadius: 14, padding: 28, width: 460, maxWidth: '92vw' },
      onClick: e => e.stopPropagation()
    }, React.createElement('div', { style: { fontFamily: 'Syne', fontWeight: 700, fontSize: 16, marginBottom: 4 } }, 'Confirm Website Before Audit'),
    React.createElement('div', { style: { fontSize: 11, color: 'var(--m)', marginBottom: 12 } }, 'We verify this URL loads and mentions the company before spending credits.'),
    websiteModal.warning && React.createElement('div', { style: { fontSize: 12, color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, lineHeight: 1.5 } }, '⚠ ' + websiteModal.warning),
    React.createElement('input', {
      className: 'inp',
      style: { width: '100%', fontFamily: 'monospace', fontSize: 13, marginBottom: 8 },
      value: modalUrl,
      placeholder: 'https://company.com',
      autoFocus: true,
      onChange: e => { setModalUrl(e.target.value); setVerifyResult(null); },
      onKeyDown: e => { if (e.key === 'Enter') verify(modalUrl); }
    }),
    verifying && React.createElement('div', { style: { fontSize: 11, color: 'var(--m)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 } }, React.createElement('div', { className: 'spinner', style: { width: 10, height: 10 } }), 'Verifying URL...'),
    verdictText && React.createElement('div', { style: { fontSize: 12, color: verdictColor, marginBottom: 12, lineHeight: 1.4, fontWeight: verifyResult?.ok ? 600 : 400 } }, verdictText),
    !verifyResult && !verifying && React.createElement('div', { style: { fontSize: 11, color: 'var(--m)', marginBottom: 12 } }, 'Enter URL and press Enter to verify, or click Verify below.'),
    React.createElement('div', { style: { display: 'flex', gap: 8 } },
      React.createElement('button', { className: 'btn btn-g', style: { flexShrink: 0 }, onClick: () => verify(modalUrl), disabled: verifying }, 'Verify'),
      React.createElement('button', {
        className: 'btn btn-a', style: { flex: 1 },
        disabled: !verifyResult || (!verifyResult.ok && verifyResult.verdict !== 'unreachable') || verifying,
        onClick: () => websiteModal.onConfirm(modalUrl)
      }, verifyResult?.ok ? 'Confirmed — Run Audit' : verifyResult?.verdict === 'unreachable' ? 'Run Anyway (unverified)' : 'Fix URL First'),
      React.createElement('button', { className: 'btn btn-g', onClick: () => setWebsiteModal(null) }, 'Cancel')
    )));
  }), null),
  // ── LEAD LIST SIDEBAR ──────────────────────────────────
  React.createElement('div', {
    style: {
      width: 220,
      minWidth: 220,
      borderRight: '1px solid var(--b)',
      overflowY: 'auto',
      background: 'var(--s)'
    }
  }, React.createElement('div', {
    style: {
      padding: '12px 14px',
      borderBottom: '1px solid var(--b)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--m)'
    }
  }, allLeads.length + ' in pipeline'), allLeads.filter(l => !l.website || !l.website.includes('bizbuysell.com')).map(l => React.createElement('div', {
    key: l.id,
    onClick: () => onSelectLead(l.id),
    style: {
      padding: '10px 14px',
      cursor: 'pointer',
      borderLeft: '2px solid ' + (l.id === leadId ? 'var(--p)' : 'transparent'),
      background: l.id === leadId ? 'rgba(124,58,237,0.08)' : 'transparent',
      borderBottom: '1px solid var(--b)'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 4
    }
  }, React.createElement('div', {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: l.id === leadId ? 'var(--t)' : 'var(--m2)',
      marginBottom: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      flex: 1,
      minWidth: 0
    }
  }, l.name), React.createElement('button', {
    onClick: e => {
      e.stopPropagation();
      if (!confirm('Remove ' + l.name + ' from pipeline?')) return;
      const updated = getLeads().filter(x => x.id !== l.id);
      saveLeads(updated);
      setAllLeads(updated);
      if (l.id === leadId) onSelectLead(updated[0]?.id || null);
    },
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--m)',
      cursor: 'pointer',
      fontSize: 14,
      padding: '0 2px',
      lineHeight: 1,
      flexShrink: 0,
      opacity: 0.5
    },
    title: 'Remove from pipeline'
  }, '×')), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, React.createElement('span', {
    style: {
      fontSize: 9,
      padding: '1px 5px',
      borderRadius: 10,
      background: l.status === 'researched' ? 'rgba(163,230,53,0.1)' : l.status === 'generated' ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.05)',
      color: l.status === 'researched' ? 'var(--a)' : l.status === 'generated' ? '#a78bfa' : 'var(--m)'
    }
  }, {researched:'✓',generated:'⚡',sent:'📤',needs_website:'⚠',brain_failed:'✗',new:'·'}[l.status]||'·'), l.icpScore > 0 && React.createElement('span', {
    style: {
      fontSize: 9,
      color: 'var(--m)'
    }
  }, l.icpScore + '/100'))))),
  // ── MAIN RESEARCH PANEL ───────────────────────────────
  !lead ? React.createElement('div', {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--m)',
      gap: 12
    }
  }, React.createElement('div', { style: { fontSize: 32 } }, '🔬'),
    React.createElement('div', { style: { fontSize: 15, fontWeight: 600, color: 'var(--m2)' } }, 'Select a lead from the sidebar'),
    React.createElement('div', { style: { fontSize: 12 } }, allLeads.length === 0 ? 'No leads in pipeline yet — go to Find first' : allLeads.length + ' lead' + (allLeads.length === 1 ? '' : 's') + ' ready to research')
  ) : React.createElement('div', {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, React.createElement('div', {
    className: 'tb'
  }, React.createElement('div', null, React.createElement('div', {
    className: 'tt'
  }, lead.name), React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 4
    }
  }, React.createElement('input', {
    style: {
      fontSize: 12,
      padding: '4px 10px',
      background: 'var(--s2)',
      border: '1px solid var(--b2)',
      borderRadius: 8,
      color: 'var(--t)',
      width: 260,
      fontFamily: 'monospace'
    },
    value: websiteOverride,
    onChange: e => setWebsiteOverride(e.target.value),
    placeholder: 'https://company.com'
  }))), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, hasResearch && !flagging && React.createElement('div', {
    style: {
      display: 'flex',
      background: 'var(--s2)',
      border: '1px solid var(--b2)',
      borderRadius: 10,
      padding: 3,
      gap: 2
    }
  }, [{
    id: 'quick',
    label: 'Quick'
  }, {
    id: 'deep',
    label: 'Deep'
  }].map(m => React.createElement('button', {
    key: m.id,
    onClick: () => setDiveMode(m.id),
    className: 'btn btn-sm',
    style: {
      background: diveMode === m.id ? 'var(--p)' : 'transparent',
      color: diveMode === m.id ? '#fff' : 'var(--m2)',
      border: 'none',
      borderRadius: 7
    }
  }, m.label))), React.createElement('button', {
    className: 'btn btn-a',
    onClick: () => {
      if (lead.status === 'researched' || lead.status === 'generated') {
        setRerunConfirm(true);
        return;
      }
      handleRunResearch();
    },
    disabled: loading
  }, loading ? React.createElement('span', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, React.createElement('div', {
    className: 'spinner'
  }), 'Auditing...') : '⚡ Run Research'),
  // Confirm + Flag buttons — only show after research
  hasResearch && !loading && React.createElement('button', {
    className: 'btn btn-p',
    onClick: () => {
      save();
      onNext();
    },
    style: {
      background: 'var(--a)',
      color: '#0a0a0f'
    }
  }, '✓ Looks Right → Generate'), hasResearch && !loading && React.createElement('button', {
    className: 'btn btn-g',
    onClick: () => setFlagging(!flagging),
    style: {
      borderColor: flagging ? 'var(--r)' : 'var(--b2)',
      color: flagging ? 'var(--r)' : 'var(--m2)'
    }
  }, flagging ? '✕ Cancel Flag' : '⚑ Flag Issues'))), React.createElement('div', {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 24
    }
  }, loading && React.createElement(ScanningOverlay, {
    company: lead.name,
    step: researchStep
  }), !loading && React.createElement('div', {
    style: {
      maxWidth: 800
    }
  },
  // Flagging mode — select which findings are wrong
  flagging && React.createElement('div', {
    style: {
      padding: '16px',
      background: 'rgba(239,68,68,0.07)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 12,
      marginBottom: 16
    }
  }, React.createElement('div', {
    style: {
      fontWeight: 700,
      fontSize: 14,
      marginBottom: 8,
      color: 'var(--r)'
    }
  }, 'Select findings that look wrong:'), React.createElement('div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12
    }
  }, [{
    k: 'website',
    label: 'Wrong website'
  }, {
    k: 'googleAds',
    label: 'Google Ads result wrong'
  }, {
    k: 'fbAds',
    label: 'Facebook Ads wrong'
  }, {
    k: 'cta',
    label: 'CTA detection wrong'
  }, {
    k: 'mobile',
    label: 'Mobile score wrong'
  }, {
    k: 'crm',
    label: 'CRM detection wrong'
  }, {
    k: 'positioning',
    label: 'Positioning score wrong'
  }, {
    k: 'email',
    label: 'Wrong email found'
  }, {
    k: 'topPain',
    label: 'Wrong pain point identified'
  }].map(item => React.createElement('button', {
    key: item.k,
    onClick: () => setFlagged(p => ({
      ...p,
      [item.k]: !p[item.k]
    })),
    style: {
      padding: '6px 12px',
      borderRadius: 20,
      fontSize: 12,
      cursor: 'pointer',
      border: '1px solid',
      background: flagged[item.k] ? 'rgba(239,68,68,0.15)' : 'var(--s2)',
      borderColor: flagged[item.k] ? 'var(--r)' : 'var(--b2)',
      color: flagged[item.k] ? 'var(--r)' : 'var(--m2)'
    }
  }, flagged[item.k] ? '✓ ' + item.label : item.label))), Object.values(flagged).some(Boolean) && React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--m2)'
    }
  }, 'Flagged: ' + Object.entries(flagged).filter(([, v]) => v).map(([k]) => k).join(', ') + ' — noted. Re-run Research or correct manually.')),
  // ICP BLOCKER WARNING — critique flagged this company as outside ICP
  lead.brainAudit && lead.brainAudit.icpBlocked && React.createElement('div', {
    style: {
      padding: '12px 16px',
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid var(--r)',
      borderRadius: 10,
      marginBottom: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, React.createElement('div', {
    style: { fontSize: 11, fontWeight: 700, color: 'var(--r)', textTransform: 'uppercase', letterSpacing: '.06em' }
  }, 'Outside ICP'), React.createElement('div', {
    style: { fontSize: 12, color: 'var(--t)' }
  }, lead.brainAudit.icpBlockerReason || 'This company is too large — the owner likely is not reachable by cold email.')),
  // RECENT NEWS TRIGGERS — verified events about this company
  lead.companyTriggers && lead.companyTriggers.length > 0 && React.createElement('div', {
    style: {
      padding: '14px 16px',
      background: 'var(--s)',
      border: '1px solid var(--b)',
      borderLeft: '2px solid var(--a)',
      borderRadius: 10,
      marginBottom: 12
    }
  }, React.createElement('div', {
    style: { fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--m)', marginBottom: 8 }
  }, 'Recent News — Verified Triggers'),
  lead.companyTriggers.map((t, i) => React.createElement('div', {
    key: i,
    style: { fontSize: 12, color: 'var(--m2)', marginBottom: 6, display: 'flex', gap: 8, alignItems: 'baseline' }
  },
    React.createElement('span', { style: { fontSize: 9, color: 'var(--a)', textTransform: 'uppercase', fontWeight: 700, flexShrink: 0, minWidth: 60 } }, t.type),
    React.createElement('span', null, t.headline + (t.ageDays != null ? ' (' + t.ageDays + 'd ago)' : ''))
  ))),
  // Why selected
  React.createElement('div', {
    style: {
      padding: '12px 16px',
      background: 'rgba(124,58,237,0.07)',
      border: '1px solid rgba(124,58,237,0.2)',
      borderRadius: 12,
      marginBottom: 14
    }
  }, React.createElement('div', {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: '#a78bfa',
      marginBottom: 4
    }
  }, 'Why Selected'), lead.stackCombo && React.createElement('div', {
    style: {
      display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, marginBottom: 8,
      background: lead.stackCombo.tier === 'S' ? 'rgba(239,68,68,0.15)' : 'rgba(251,146,60,0.15)',
      border: '1px solid ' + (lead.stackCombo.tier === 'S' ? 'rgba(239,68,68,0.4)' : 'rgba(251,146,60,0.35)'),
      color: lead.stackCombo.tier === 'S' ? '#f87171' : '#fb923c'
    },
    title: lead.stackCombo.whyHot
  }, lead.stackCombo.label + ' - ' + lead.stackCombo.whyHot), React.createElement('div', {
    style: {
      fontSize: 13,
      color: 'var(--t)'
    }
  }, lead.jobTitle ? (lead.jobTitle.match(/^Hiring/i) ? lead.jobTitle : 'Hiring ' + lead.jobTitle) + (lead.salary ? ' at ' + lead.salary : '') : lead.signals?.raised_funding ? 'Recently raised funding' : lead.signals?.agency_review ? 'Left agency review on Clutch' : 'Matched ICP criteria'), lead.jobSnippet && React.createElement('div', {
    style: {
      fontSize: 11,
      color: 'var(--m)',
      fontStyle: 'italic',
      marginTop: 4
    }
  }, '"' + lead.jobSnippet + '"')),
  // Recommended product
  // ── HOW TO REACH — who, channel, timing, opener ──
  lead.brainAudit && lead.brainAudit.reachPlan && React.createElement('div', {
    style: { background: 'var(--s)', border: '1px solid var(--b)', borderLeft: '2px solid #3b82f6', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }
  }, React.createElement('div', {
    style: { fontSize: 10, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 8 }
  }, 'How to Reach the Decision-Maker'),
  React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12 } },
    React.createElement('div', null, React.createElement('span', { style: { color: 'var(--m)' } }, 'Who: '), React.createElement('span', { style: { color: 'var(--t)', fontWeight: 600 } }, lead.brainAudit.reachPlan.who)),
    React.createElement('div', null, React.createElement('span', { style: { color: 'var(--m)' } }, 'Channel: '), React.createElement('span', { style: { color: 'var(--t)' } }, lead.brainAudit.reachPlan.channel || '\u2014')),
    React.createElement('div', null, React.createElement('span', { style: { color: 'var(--m)' } }, 'Timing: '), React.createElement('span', { style: { color: (lead.brainAudit.reachWindow && lead.brainAudit.reachWindow.urgency === 'high') ? '#f87171' : 'var(--t)', fontWeight: 600 } }, lead.brainAudit.reachPlan.timing)),
    React.createElement('div', null, React.createElement('span', { style: { color: 'var(--m)' } }, 'Email grade: '), React.createElement('span', { style: { color: (lead.brainAudit.emailGrade||'').startsWith('A') ? 'var(--a)' : (lead.brainAudit.emailGrade||'').startsWith('D') ? '#f87171' : 'var(--t)' } }, lead.brainAudit.emailGrade || 'none'))
  ),
  lead.brainAudit.reachPlan.opener && React.createElement('div', {
    style: { fontSize: 11, color: 'var(--m2)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--b)' }
  }, React.createElement('span', { style: { color: 'var(--m)', fontWeight: 600 } }, 'How to open: '), lead.brainAudit.reachPlan.opener),
  lead.brainAudit.contactIntel && (lead.brainAudit.contactIntel.emails.length || lead.brainAudit.contactIntel.phones.length || lead.brainAudit.contactIntel.linkedin.length) ? React.createElement('div', {
    style: { fontSize: 11, color: 'var(--m2)', marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }
  },
    lead.brainAudit.contactIntel.emails.slice(0,2).map((e,i) => React.createElement('a', { key: 'e'+i, href: 'mailto:'+e, style: { color: '#60a5fa' } }, '\u2709 ' + e)),
    lead.brainAudit.contactIntel.phones.slice(0,2).map((p,i) => React.createElement('a', { key: 'p'+i, href: 'tel:'+p, style: { color: '#60a5fa' } }, '\u260e ' + p)),
    lead.brainAudit.contactIntel.linkedin.slice(0,1).map((l,i) => React.createElement('a', { key: 'l'+i, href: l, target: '_blank', rel: 'noopener', style: { color: '#60a5fa' } }, 'LinkedIn \u2192'))
  ) : null),
  // ── SAVINGS ESTIMATE HERO — the money number, with its receipts ──
  lead.brainAudit && lead.brainAudit.savingsEstimate && React.createElement('div', {
    style: { background: 'var(--s)', border: '1px solid var(--b)', borderLeft: '2px solid var(--a)', borderRadius: 10, padding: '16px 18px', marginBottom: 14 }
  }, React.createElement('div', {
    style: { fontSize: 10, color: 'var(--a)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 6 }
  }, 'Estimated Money on the Table'),
  React.createElement('div', {
    style: { display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }
  }, React.createElement('div', null,
    React.createElement('div', { style: { fontSize: 10, color: 'var(--m)', marginBottom: 2 } }, 'PER MONTH'),
    React.createElement('div', { style: { fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--a)' } }, '$' + (lead.brainAudit.savingsEstimate.monthlyLow/1000).toFixed(0) + 'k–$' + (lead.brainAudit.savingsEstimate.monthlyHigh/1000).toFixed(0) + 'k')
  ), React.createElement('div', null,
    React.createElement('div', { style: { fontSize: 10, color: 'var(--m)', marginBottom: 2 } }, 'PER YEAR'),
    React.createElement('div', { style: { fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--a)' } }, '$' + (lead.brainAudit.savingsEstimate.annualLow/1000).toFixed(0) + 'k–$' + (lead.brainAudit.savingsEstimate.annualHigh/1000).toFixed(0) + 'k')
  )),
  React.createElement('div', {
    style: { fontSize: 11, color: 'var(--m2)', marginBottom: 6, paddingTop: 10, borderTop: '1px solid var(--b)' }
  }, React.createElement('span', { style: { color: 'var(--m)', fontWeight: 600 } }, 'How we got here: '), lead.brainAudit.savingsEstimate.basis),
  lead.brainAudit.savingsEstimate.execution && React.createElement('div', {
    style: { fontSize: 11, color: 'var(--m2)' }
  }, React.createElement('span', { style: { color: 'var(--m)', fontWeight: 600 } }, 'What we sell them: '), lead.brainAudit.savingsEstimate.execution)),
  lead.recommendedProduct && React.createElement('div', {
    style: {
      padding: '14px 16px',
      background: 'var(--s)',
      border: '1px solid var(--b)',
      borderLeft: '2px solid var(--a)',
      borderRadius: 10,
      marginBottom: 14,
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, React.createElement('div', {
    style: {
      fontSize: 18
    }
  }, '💰'), React.createElement('div', {
    style: {
      flex: 1
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2
    }
  }, React.createElement('div', {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--a)'
    }
  }, 'Recommended Product'), lead.preResearchScore && lead.researchBonus > 0 && React.createElement('div', {
    style: {
      fontSize: 11,
      color: 'var(--a)',
      fontWeight: 600
    }
  }, lead.preResearchScore + ' → ' + lead.icpScore + '/100 after research (+' + lead.researchBonus + ')')), React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 700,
      fontSize: 15
    }
  }, lead.recommendedProduct.product), React.createElement('div', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 700,
      fontSize: 13,
      color: 'var(--a)'
    }
  }, lead.recommendedProduct.price)), React.createElement('div', {
    style: {
      fontSize: 11,
      color: 'var(--m2)',
      marginTop: 2
    }
  }, lead.recommendedProduct.reason), lead.recommendedProduct.flag && React.createElement('div', {
    style: {
      fontSize: 10,
      color: 'var(--am)',
      marginTop: 4
    }
  }, lead.recommendedProduct.flag))),
  // Top 3 product fit — secondary options ranked
  lead.topThreeProducts && lead.topThreeProducts.length > 1 && React.createElement('div', {
    style: { padding: '10px 16px', marginBottom: 14 }
  }, React.createElement('div', {
    style: { fontSize: 10, color: 'var(--m)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }
  }, 'Also a fit (ranked)'), lead.topThreeProducts.slice(1).map((p, i) => React.createElement('div', {
    key: i,
    style: { display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6, fontSize: 12 }
  }, React.createElement('span', {
    style: { color: 'var(--m2)', fontWeight: 600, minWidth: 16 }
  }, '#' + (i + 2)), React.createElement('span', {
    style: { color: 'var(--t)', fontWeight: 600 }
  }, p.product), React.createElement('span', {
    style: { color: 'var(--a)', fontSize: 11 }
  }, p.price), React.createElement('span', {
    style: { color: 'var(--m)', fontSize: 11 }
  }, '— ' + (p.why || ''))))),
  // Top pain
  lead.topPain && React.createElement('div', {
    style: {
      padding: '14px 16px',
      background: 'var(--s)',
      border: '1px solid var(--b)',
      borderLeft: '2px solid var(--r)',
      borderRadius: 10,
      marginBottom: 12
    }
  }, React.createElement('div', {
    style: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--m)',
      marginBottom: 6
    }
  }, 'Sharpest Pain'), React.createElement('div', {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--t)',
      marginBottom: 2
    }
  }, lead.topPain.pain), lead.topPain.pitchAngle && React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--a)',
      marginBottom: 4,
      fontStyle: 'italic'
    }
  }, 'Pitch angle: ' + lead.topPain.pitchAngle), React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--m2)'
    }
  }, 'Opportunity: ' + lead.topPain.opportunity)),
  // Brain audit — real intelligence
  lead.brainAudit && React.createElement('div', {
    style: {
      padding: '12px 16px',
      background: 'rgba(124,58,237,0.07)',
      border: '1px solid rgba(124,58,237,0.25)',
      borderRadius: 12,
      marginBottom: 14
    }
  }, React.createElement('div', {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: '#a78bfa',
      marginBottom: 8
    }
  }, 'Business Intelligence'), lead.brainAudit.realPain && React.createElement('div', {
    style: {
      marginBottom: 8
    }
  }, React.createElement('div', {
    style: {
      fontSize: 10,
      color: 'var(--m)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      marginBottom: 2
    }
  }, 'Confirmed Pain'), React.createElement('div', {
    style: {
      fontSize: 13,
      color: 'var(--t)',
      fontWeight: 500
    }
  }, lead.brainAudit.realPain)), lead.brainAudit.embarrassingFinding && React.createElement('div', {
    style: {
      marginBottom: 8,
      padding: '8px 10px',
      background: 'rgba(239,68,68,0.08)',
      borderRadius: 8,
      border: '1px solid rgba(239,68,68,0.2)'
    }
  }, React.createElement('div', {
    style: {
      fontSize: 10,
      color: '#fca5a5',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      marginBottom: 2
    }
  }, 'The Finding They\'d Be Embarrassed By'), React.createElement('div', {
    style: {
      fontSize: 13,
      color: 'var(--t)',
      fontWeight: 500
    }
  }, lead.brainAudit.embarrassingFinding)), lead.brainAudit.pitchAngle && React.createElement('div', null, React.createElement('div', {
    style: {
      fontSize: 10,
      color: 'var(--m)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      marginBottom: 2
    }
  }, 'Suggested Pitch Angle'), React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--a)',
      fontStyle: 'italic'
    }
  }, '"' + lead.brainAudit.pitchAngle + '"'))),
  // ── SOURCE-VERIFIED QUOTES BADGE ─────────────────────────
  lead.brainAudit && lead.brainAudit.quoteVerification && lead.brainAudit.quoteVerification.checked && React.createElement('div', {
    style: { display: 'flex', alignItems: 'center', gap: 8, background: (lead.brainAudit.quoteVerification.suppressed && lead.brainAudit.quoteVerification.suppressed.length) ? 'rgba(245,158,11,0.08)' : 'rgba(163,230,53,0.06)', border: '1px solid ' + ((lead.brainAudit.quoteVerification.suppressed && lead.brainAudit.quoteVerification.suppressed.length) ? 'rgba(245,158,11,0.25)' : 'rgba(163,230,53,0.2)'), borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 11 }
  }, React.createElement('span', null, (lead.brainAudit.quoteVerification.suppressed && lead.brainAudit.quoteVerification.suppressed.length) ? '⚠' : '✓'),
  React.createElement('span', { style: { color: 'var(--m2)' } },
    (lead.brainAudit.quoteVerification.suppressed && lead.brainAudit.quoteVerification.suppressed.length)
      ? (lead.brainAudit.quoteVerification.suppressed.length + ' quote(s) could not be matched to page source and were removed')
      : 'All quoted headlines & CTAs verified against live page source'
  )),
  // ── SELF-CRITIQUE RESULTS — collapsed to confidence score only ────────
  lead.brainAudit && lead.brainAudit.critique && React.createElement('div', {
    style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--b2)' }
  },
    React.createElement('div', { style: { fontSize: 10, color: 'var(--m)', flex: 1 } }, 'Audit confidence'),
    React.createElement('div', {
      style: {
        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
        background: lead.brainAudit.critique.confidenceScore >= 8 ? 'rgba(163,230,53,0.15)' : lead.brainAudit.critique.confidenceScore >= 6 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
        color: lead.brainAudit.critique.confidenceScore >= 8 ? 'var(--a)' : lead.brainAudit.critique.confidenceScore >= 6 ? '#f59e0b' : '#ef4444'
      }
    }, lead.brainAudit.critique.confidenceScore + '/10'),
    lead.brainAudit.critique.critiqueNote && React.createElement('div', { style: { fontSize: 11, color: 'var(--m)', fontStyle: 'italic', flex: 2 } }, lead.brainAudit.critique.critiqueNote.slice(0, 80) + (lead.brainAudit.critique.critiqueNote.length > 80 ? '…' : ''))),
  lead.brainAudit && lead.brainAudit.operationsOpportunity && lead.brainAudit.operationsOpportunity !== 'null' && React.createElement('div', {
    style: { borderLeft: '2px solid #06b6d4', paddingLeft: 10, marginBottom: 10 }
  }, React.createElement('div', { style: { fontSize: 9, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3, fontWeight: 700 } }, 'Ops / AI Opportunity'),
  React.createElement('div', { style: { fontSize: 12, color: 'var(--m2)', lineHeight: 1.5 } }, lead.brainAudit.operationsOpportunity)),
  lead.brainAudit && lead.brainAudit.exitValueAngle && lead.brainAudit.exitValueAngle !== 'null' && React.createElement('div', {
    style: { borderLeft: '2px solid #22c55e', paddingLeft: 10, marginBottom: 10 }
  }, React.createElement('div', { style: { fontSize: 9, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3, fontWeight: 700 } }, 'Exit / Valuation Angle'),
  React.createElement('div', { style: { fontSize: 12, color: 'var(--m2)', lineHeight: 1.5 } }, lead.brainAudit.exitValueAngle)),
  // Quick dive — 8-point grid
  diveMode === 'quick' && hasResearch && React.createElement('div', {
    style: {
      marginBottom: 16
    }
  }, lead.screenshotUrl && React.createElement('div', {
    style: {
      marginBottom: 12,
      borderRadius: 10,
      overflow: 'hidden',
      border: '1px solid var(--b2)'
    }
  }, React.createElement('div', {
    style: {
      background: 'var(--s2)',
      padding: '5px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 10,
      color: 'var(--m)'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      gap: 3
    }
  }, ['#ef4444', '#f59e0b', '#22c55e'].map(c => React.createElement('div', {
    key: c,
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: c
    }
  }))), lead.website), React.createElement('img', {
    src: lead.screenshotUrl,
    style: {
      width: '100%',
      display: 'block',
      maxHeight: 260,
      objectFit: 'cover',
      objectPosition: 'top'
    },
    alt: 'Screenshot'
  })), lead.visualAnalysis && React.createElement('div', {
    style: {
      padding: '10px 14px',
      background: 'rgba(124,58,237,0.06)',
      border: '1px solid rgba(124,58,237,0.2)',
      borderRadius: 10,
      marginBottom: 12,
      fontSize: 12
    }
  }, React.createElement('span', {
    style: {
      color: '#a78bfa',
      fontWeight: 700
    }
  }, 'Claude saw: '), lead.visualAnalysis.biggestVisualIssue || 'Visual analysis complete', React.createElement('span', {
    style: {
      marginLeft: 12,
      color: 'var(--m)'
    }
  }, 'Design: '), React.createElement('span', {
    style: {
      color: lead.visualAnalysis.designQuality === 'professional' ? 'var(--a)' : '#fca5a5',
      fontWeight: 600
    }
  }, lead.visualAnalysis.designQuality || '?'), React.createElement('span', {
    style: {
      marginLeft: 12,
      color: 'var(--m)'
    }
  }, 'Conversion: '), React.createElement('span', {
    style: {
      color: lead.visualAnalysis.overallConversionRating === 'strong' ? 'var(--a)' : lead.visualAnalysis.overallConversionRating === 'moderate' ? 'var(--am)' : '#fca5a5',
      fontWeight: 600
    }
  }, lead.visualAnalysis.overallConversionRating || '?')), React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, [{
    label: 'Google Ads',
    val: lead.buckets?.ACQUISITION?.googleAds,
    icon: '🔍'
  }, {
    label: 'Facebook Ads',
    val: lead.buckets?.ACQUISITION?.facebookAds,
    icon: '📘'
  }, {
    label: 'CTA Above Fold',
    val: lead.buckets?.CONVERSION?.hasCTA,
    icon: '🎯'
  }, {
    label: 'Social Proof',
    val: lead.buckets?.CONVERSION?.socialProof,
    icon: '⭐'
  }, {
    label: 'CRM',
    val: lead.buckets?.INFRASTRUCTURE?.crm,
    icon: '🔧'
  }, {
    label: 'Tracking',
    val: lead.buckets?.INFRASTRUCTURE?.trackingPixel,
    icon: '📡'
  }, {
    label: 'Mobile Score',
    val: lead.richData?.mobileScore || lead.buckets?.CONVERSION?.mobileScore,
    icon: '📱'
  }, {
    label: 'Positioning',
    val: lead.buckets?.CONVERSION?.positioningScore,
    icon: '💬'
  }].map(item => {
    const bad = item.val && /No |None|unavailable|Generic|Weak|not detected|0\//i.test(item.val);
    const good = item.val && !bad;
    return React.createElement('div', {
      key: item.label,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: 'var(--s)',
        borderRadius: 8,
        border: '1px solid var(--b)'
      }
    }, React.createElement('div', {
      style: {
        flex: 1
      }
    }, React.createElement('div', {
      style: {
        fontSize: 10,
        color: 'var(--m)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '.06em'
      }
    }, item.label), React.createElement('div', {
      style: {
        fontSize: 12,
        color: bad ? '#fca5a5' : good ? 'var(--a)' : 'var(--m2)',
        marginTop: 1
      }
    }, item.val || 'Not checked')), item.val && React.createElement('span', {
      style: {
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: bad ? 'var(--r)' : 'var(--a)'
      }
    }));
  })), lead.flaws && lead.flaws.length > 0 && React.createElement('div', {
    style: {
      marginTop: 10
    }
  }, React.createElement('div', {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--m)',
      marginBottom: 6
    }
  }, 'Issues Auto-Detected'), React.createElement('div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, lead.flaws.map(f => {
    const flaw = FLAWS.find(x => x.id === f);
    return React.createElement('span', {
      key: f,
      style: {
        fontSize: 11,
        padding: '4px 10px',
        borderRadius: 20,
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
        color: '#fca5a5'
      }
    }, flaw ? flaw.label : f.replace(/_/g, ' '));
  })))),
  // Deep dive — full 4 buckets + links
  diveMode === 'deep' && React.createElement('div', {
    style: {
      marginBottom: 16
    }
  },
  // HIGH-LEVEL OVERVIEW — context before the detail
  React.createElement('div', {
    style: { background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 }
  },
    React.createElement('div', { style: { fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 10 } }, 'Overview'),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' } },
      [
        ['Company', lead.name + (lead.location ? ' · ' + lead.location : '')],
        ['Why we flagged them', lead.discoveryReason || (lead.stackCombo && lead.stackCombo.whyHot) || lead.jobTitle || lead.discoverySource || '—'],
        ['Sharpest pain', (lead.brainAudit && lead.brainAudit.realPain) || (lead.topPain && lead.topPain.pain) || '—'],
        ['Best-fit product', (lead.recommendedProduct && lead.recommendedProduct.product) || '—'],
        lead.brainAudit && lead.brainAudit.savingsEstimate && lead.brainAudit.savingsEstimate.annualLow ? ['Estimated annual opportunity', '$' + Math.round(lead.brainAudit.savingsEstimate.annualLow/1000) + 'k–$' + Math.round(lead.brainAudit.savingsEstimate.annualHigh/1000) + 'k'] : null,
        ['How to reach them', (lead.reachPlan && lead.reachPlan.who) ? (lead.reachPlan.who + (lead.reachPlan.channel ? ' via ' + lead.reachPlan.channel : '')) : (lead.email || 'No contact found yet')],
      ].filter(Boolean).map(([k,v],idx) => React.createElement('div', { key: idx, style: idx < 2 ? { gridColumn: '1/-1' } : {} },
        React.createElement('div', { style: { fontSize: 9, color: 'var(--m)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 } }, k),
        React.createElement('div', { style: { fontSize: 12, color: 'var(--m2)', lineHeight: 1.4 } }, v)
      ))
    )
  ),
  lead.buckets ? React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 16
    }
  }, [{
    key: 'ACQUISITION',
    label: 'Acquisition',
    emoji: '📡',
    color: '#7c3aed'
  }, {
    key: 'CONVERSION',
    label: 'Conversion',
    emoji: '🎯',
    color: '#ef4444'
  }, {
    key: 'OPERATIONS',
    label: 'Operations (AI/Software)',
    emoji: 'GEAR',
    color: '#06b6d4'
  }, {
    key: 'GROWTH',
    label: 'Growth & Value',
    emoji: 'CHART',
    color: '#22c55e'
  }, {
    key: 'AUTHORITY',
    label: 'Authority',
    emoji: '⭐',
    color: '#f59e0b'
  }, {
    key: 'INFRASTRUCTURE',
    label: 'Infrastructure',
    emoji: '🔧',
    color: '#a3e635'
  }].map(b => React.createElement('div', {
    key: b.key,
    style: {
      background: b.color + '08',
      border: '1px solid ' + b.color + '25',
      borderRadius: 12,
      padding: '12px 14px'
    }
  }, React.createElement('div', {
    style: {
      fontWeight: 700,
      fontSize: 12,
      marginBottom: 8
    }
  }, b.emoji + ' ' + b.label), React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, Object.entries(lead.buckets[b.key] || {}).filter(([k, v]) => v && typeof v === 'string' && !k.match(/Weak$|onfirmed$|Detail$|Note$|lyzed$/)).map(([k, v]) => {
    const bad = /No |None|unavailable|Generic|Weak|not detected|0\//i.test(v);
    return React.createElement('div', {
      key: k,
      style: {
        display: 'flex',
        gap: 6,
        fontSize: 11
      }
    }, React.createElement('span', {
      style: {
        color: bad ? 'var(--r)' : 'var(--a)',
        flexShrink: 0
      }
    }, bad ? '✗' : '✓'), React.createElement('span', {
      style: {
        color: 'var(--m2)'
      }
    }, v));
  }))))) : React.createElement('div', {
    style: {
      padding: '20px',
      background: 'var(--s2)',
      borderRadius: 12,
      textAlign: 'center',
      color: 'var(--m)',
      fontSize: 13
    }
  }, 'Run Research first to see full audit'), React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5,1fr)',
      gap: 8
    }
  }, RLINKS(lead.name, lead.website).map(link => React.createElement('a', {
    key: link.label,
    href: link.url,
    target: '_blank',
    rel: 'noopener noreferrer',
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      padding: '10px 6px',
      background: 'var(--s2)',
      borderRadius: 10,
      border: '1px solid var(--b)',
      textDecoration: 'none',
      color: 'var(--t)'
    }
  }, React.createElement('span', {
    style: {
      fontSize: 18
    }
  }, link.icon), React.createElement('span', {
    style: {
      fontSize: 9,
      textAlign: 'center',
      color: 'var(--m2)'
    }
  }, link.label))))),
  // No research yet
  // Brain failed state — show clearly, don't show fake data
  lead.brainFailed && React.createElement('div', {
    style: {
      padding: '20px',
      background: 'rgba(239,68,68,0.07)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 12,
      marginTop: 8
    }
  }, React.createElement('div', {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: '#fca5a5',
      marginBottom: 6
    }
  }, '⚠ Brain Audit Failed — No Results Shown'), React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--m2)',
      marginBottom: 14
    }
  }, lead.brainFailReason || 'Research could not complete.'), lead.status === 'needs_website' && React.createElement('div', {
    style: { marginBottom: 12 }
  }, (lead.discoverySource || lead.discoveryReason) && React.createElement('div', {
    style: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--b)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12 }
  }, React.createElement('div', { style: { color: 'var(--m)', marginBottom: 4, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' } }, 'Where this lead came from'),
  React.createElement('div', { style: { color: 'var(--m2)', fontWeight: 600, marginBottom: 2 } }, ({ adzuna_ai: 'Adzuna — job board (AI-replacement signal)', sec_edgar: 'SEC EDGAR — Form D filing', bizbuysell: 'BizBuySell — for sale listing', news_hire: 'Google News — CMO hire', news_funding: 'Google News — funding round', news_rebrand: 'Google News — rebrand', news_acquisition: 'Google News — acquisition' })[lead.discoverySource] || lead.discoverySource || 'Discovery signal'),
  lead.discoveryReason && React.createElement('div', { style: { color: 'var(--m)', fontSize: 11, marginBottom: 4 } }, lead.discoveryReason),
  lead.location && React.createElement('div', { style: { color: 'var(--m)', fontSize: 11, marginBottom: 4 } }, 'Location: ' + lead.location),
  lead.listingUrl && React.createElement('a', { href: lead.listingUrl, target: '_blank', rel: 'noopener', style: { color: 'var(--a)', fontSize: 11, display: 'block', marginBottom: 4 } }, 'View BizBuySell listing →'),
  lead.discoverySourceUrl && !lead.listingUrl && React.createElement('a', { href: lead.discoverySourceUrl, target: '_blank', rel: 'noopener', style: { color: 'var(--a)', fontSize: 11, display: 'block', marginBottom: 4 } }, 'View original source →'),
  React.createElement('div', {
    style: { marginTop: 6, padding: '6px 10px', background: 'rgba(163,230,53,0.06)', borderRadius: 6, fontSize: 11, color: 'var(--m)' }
  }, 'Tip: Google "' + lead.name + (lead.location ? ' ' + lead.location.split(',')[0] : '') + '" to find their website')),
  React.createElement('div', { style: { fontSize: 11, color: 'var(--m)', marginBottom: 6 } }, 'Enter the correct website URL to run research:'), React.createElement('input', {
    className: 'input',
    style: {
      marginBottom: 8
    },
    placeholder: 'https://example.com',
    defaultValue: lead.website,
    onBlur: e => {
      const leads = getLeads();
      const idx = leads.findIndex(l => l.id === lead.id);
      if (idx >= 0) {
        leads[idx].website = e.target.value;
        saveLeads(leads);
      }
    }
  })), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 8
    }
  }, React.createElement('button', {
    className: 'btn btn-a',
    onClick: () => (websiteOverride || lead.website) ? runResearch(websiteOverride || lead.website) : handleRunResearch()
  }, '⚡ Retry Research'), React.createElement('a', {
    href: lead.website,
    target: '_blank',
    rel: 'noopener',
    className: 'btn btn-g',
    style: {
      fontSize: 12,
      display: lead.website ? 'block' : 'none'
    }
  }, 'Verify Website ↗'))), !lead.brainFailed && !hasResearch && !loading && React.createElement('div', {
    style: {
      padding: '24px',
      background: 'var(--s2)',
      borderRadius: 12,
      border: '1px solid var(--b)',
      textAlign: 'center',
      marginTop: 8
    }
  }, researchError && React.createElement('div', {
    style: {
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 14,
      fontSize: 12,
      color: '#fca5a5',
      textAlign: 'left'
    }
  }, 'Research failed: ' + researchError), React.createElement('div', {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--m2)',
      marginBottom: 6
    }
  }, 'Research not run yet'), React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--m)',
      marginBottom: 14
    }
  }, 'Hit Run Research — Firecrawl screenshots the homepage, Claude analyzes what visitors see, Brain identifies the sharpest pain point. Takes 15-25 seconds.'), React.createElement('button', {
    className: 'btn btn-a',
    onClick: () => (websiteOverride || lead.website) ? runResearch(websiteOverride || lead.website) : handleRunResearch(),
    style: {
      margin: '0 auto'
    }
  }, '⚡ Run Full Audit')),
  // Notes
  React.createElement('div', {
    style: {
      marginTop: 14
    }
  }, React.createElement('label', {
    className: 'lbl'
  }, 'Notes'), React.createElement('textarea', {
    className: 'input',
    style: {
      minHeight: 70,
      resize: 'vertical'
    },
    placeholder: 'Anything to remember...',
    value: notes,
    onChange: e => setNotes(e.target.value)
  }), React.createElement('button', {
    className: 'btn btn-g btn-sm',
    style: {
      marginTop: 6
    },
    onClick: save
  }, saved ? '✓ Saved' : 'Save Notes'))))));
}
function GenerateView({
  leadId,
  onDone,
  settings
}) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [researchStep, setResearchStep] = useState('');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [variant, setVariant] = useState('A');
  const [genLeads, setGenLeads] = useState([]);
  const [activeGenId, setActiveGenId] = useState(leadId);
  useEffect(() => {
    // ALL researched + generated leads, highest score first — nothing disappears
    const all = getLeads().filter(x => x.status === 'researched' || x.status === 'generated' || x.status === 'sent')
      .sort((a,b) => (b.icpScore||0) - (a.icpScore||0));
    setGenLeads(all);
    const target = all.find(x => x.id === (activeGenId || leadId)) || all[0];
    if (target) {
      setLead(target);
      setActiveGenId(target.id);
      setResult(target.generatedResult || null);
    } else {
      setLead(null);
    }
  }, [leadId, activeGenId]);
  const GenSidebar = () => React.createElement('div', {
    style: { width: 230, borderRight: '1px solid var(--b)', overflowY: 'auto', flexShrink: 0 }
  }, React.createElement('div', {
    style: { padding: '14px 16px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--m)' }
  }, genLeads.length + ' ready'), genLeads.map(l => React.createElement('div', {
    key: l.id,
    onClick: () => { setActiveGenId(l.id); setVariant('A'); },
    style: {
      padding: '10px 16px', cursor: 'pointer',
      background: l.id === activeGenId ? 'rgba(124,58,237,0.08)' : 'transparent',
      borderLeft: l.id === activeGenId ? '2px solid var(--p)' : '2px solid transparent'
    }
  }, React.createElement('div', {
    style: { fontSize: 12, fontWeight: 600, color: l.id === activeGenId ? 'var(--t)' : 'var(--m2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
  }, l.name), React.createElement('div', {
    style: { display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }
  }, React.createElement('span', {
    style: { fontSize: 9, padding: '1px 5px', borderRadius: 10,
      background: l.status === 'generated' ? 'rgba(124,58,237,0.1)' : l.status === 'sent' ? 'rgba(34,197,94,0.1)' : 'rgba(163,230,53,0.1)',
      color: l.status === 'generated' ? '#a78bfa' : l.status === 'sent' ? '#22c55e' : 'var(--a)' }
  }, l.status), React.createElement('span', { style: { fontSize: 9, color: 'var(--m)' } }, (l.icpScore||0) + '/100')))));
  if (!lead) return React.createElement('div', {
    style: { display: 'flex', height: '100%' }
  }, React.createElement(GenSidebar), React.createElement('div', {
    style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--m)' }
  }, React.createElement('div', { style: { fontSize: 32 } }, '⚡'),
    React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: 'var(--m2)' } }, 'No researched leads yet'),
    React.createElement('div', { style: { fontSize: 12 } }, 'Complete Research first — leads appear here automatically')));
  const flawLabels = FLAWS.filter(f => (lead.flaws || []).includes(f.id)).map(f => f.label);
  const rdObj = lead.richData || {};
  const isHot = (lead.icpScore || 0) >= 80;
  const slug = lead.name.toLowerCase().replace(/\s+/g, '-');
  const steps = ['Scraping homepage', 'Loading Brain modules', 'Analyzing signals', 'Writing A/B variants'];
  const generate = async () => {
    if (!settings.apiKey) {
      setError('Add Anthropic API key in Settings first.');
      return;
    }
    setLoading(true);
    setError('');
    setStep(0);
    try {
      setStep(0);
      let scraped = null;
      if (lead.website && settings.firecrawlKey) {
        try {
          const r = await fetch(BACKEND + '/api/scrape', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: lead.website,
              firecrawlKey: settings.firecrawlKey
            })
          });
          const d = await r.json();
          scraped = d.markdown || null;
        } catch {}
      }
      setStep(1);
      const ceoFw = settings.promptFramework || '';
      const system = BRAIN + (ceoFw ? '\n\nCEO FRAMEWORK:\n' + ceoFw : '') + '\n\nReturn ONLY valid JSON with these keys: {"observation":"verifiable fact from data","crisisCategory":"A/B/C/D reason","icpScore":75,"deliverable":"what we built","variantA":{"subject":"max 8 words","pitch":"4-5 sentences peer tone zero fabrication"},"variantB":{"subject":"max 8 words different","pitch":"4-5 sentences different angle"},"previewPageHtml":"complete HTML under 1500 chars dark design CROJungle.com badge"}';
      setStep(2);
      const rdStr = Object.entries(rdObj).filter(([, v]) => v).map(([k, v]) => k + ': ' + v).join('\n');
      const signals = Object.entries(lead.signals || {}).filter(([, v]) => v).map(([k]) => k.replace(/_/g, ' ')).join(', ');

      // Format 4 buckets for Claude
      const bucketStr = lead.buckets ? Object.entries(lead.buckets).map(([bucket, data]) => bucket + ':\n' + Object.entries(data).filter(([k, v]) => v && typeof v === 'string' && !k.includes('onfirmed')).map(([k, v]) => '  ' + v).join('\n')).join('\n\n') : '';
      const topPainStr = lead.topPain ? 'SHARPEST PAIN POINT: ' + lead.topPain.pain + '\nBEST OPPORTUNITY: ' + lead.topPain.opportunity : '';
      const opsStr = lead.brainAudit && lead.brainAudit.operationsOpportunity && lead.brainAudit.operationsOpportunity !== 'null' ? 'OPERATIONS OPPORTUNITY (AI software): ' + lead.brainAudit.operationsOpportunity : '';
      const exitStr = lead.brainAudit && lead.brainAudit.exitValueAngle && lead.brainAudit.exitValueAngle !== 'null' ? 'EXIT/VALUATION ANGLE (Wall Street partner): ' + lead.brainAudit.exitValueAngle : '';
      const reachStr = lead.reachabilityReasons && lead.reachabilityReasons.length ? 'REACHABILITY CONTEXT: ' + lead.reachabilityReasons.join(' | ') : '';
      const user = ['Company: ' + lead.name, 'Website: ' + (lead.website || 'None'), 'Founder: ' + (lead.founderName || 'Unknown'), 'Industry: ' + (lead.industry || 'Unknown'), 'Employees: ' + (lead.employees || 'Unknown'), 'Revenue: ' + (lead.revenue || 'Unknown'), '', topPainStr, opsStr, exitStr, reachStr, '', 'RESEARCH BUCKETS (confirmed data):', bucketStr || rdStr || 'No research data available', '', 'CONFIRMED SIGNALS: ' + (signals || 'none'), '', 'ISSUES DETECTED:', flawLabels.length > 0 ? flawLabels.map(f => '- ' + f).join('\n') : '- General marketing underperformance', '', 'HOMEPAGE CONTENT:', scraped || lead.homepageContent || 'Not available', '', 'Build pitch around the sharpest pain point only. Zero fabrication. Only confirmed facts.'].join('\n');
      setStep(3);
      const raw = await callClaude(system, user, settings.apiKey);
      const clean = raw.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim();
      const parsed = JSON.parse(clean);
      const leads = getLeads();
      const idx = leads.findIndex(x => x.id === leadId);
      if (idx >= 0) {
        leads[idx].generatedResult = parsed;
        leads[idx].pitch = parsed.variantA && parsed.variantA.pitch;
        leads[idx].subject = parsed.variantA && parsed.variantA.subject;
        // Do NOT overwrite icpScore — it's the discovery+research score.
        // The pitch-writer's guess must never corrupt the real pipeline score.
        leads[idx].status = 'generated';
        saveLeads(leads);
      }
      setResult(parsed);
      setVariant('A');
      onDone();
    } catch (e) {
      setError(e.message || 'Generation failed.');
    }
    setLoading(false);
  };
  const pickV = v => {
    setVariant(v);
    const leads = getLeads();
    const idx = leads.findIndex(x => x.id === leadId);
    if (idx >= 0) {
      const vd = v === 'A' ? result.variantA : result.variantB;
      leads[idx].pitch = vd && vd.pitch;
      leads[idx].subject = vd && vd.subject;
      saveLeads(leads);
    }
  };
  const brief = () => {
    if (!result) return;
    const lines = ['=== CEO BRIEF ===', 'Company: ' + lead.name, 'ICP Score: ' + (result.icpScore || 0) + '/100', 'Founder: ' + (lead.founderName || '?'), 'Email: ' + (lead.email || '?'), '', 'OBSERVATION:', result.observation || '', '', 'PREVIEW: https://audits.CROJungle.com/' + slug, '', 'VARIANT A: ' + (result.variantA && result.variantA.subject || ''), 'VARIANT B: ' + (result.variantB && result.variantB.subject || ''), '', 'PROOF POINT: $70k profit in one month.', 'Approach as peer. Lead with preview page.'];
    navigator.clipboard.writeText(lines.join('\n'));
  };
  const score = result && result.icpScore;
  const scoreColor = score >= 80 ? 'var(--r)' : score >= 60 ? 'var(--a)' : 'var(--am)';
  const cv = variant === 'A' ? result && result.variantA : result && result.variantB;
  return React.createElement('div', {
    style: { display: 'flex', height: '100%' }
  }, React.createElement(GenSidebar), React.createElement('div', {
    style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }
  }, React.createElement('div', {
    className: 'tb'
  }, React.createElement('div', null, React.createElement('div', {
    className: 'tt'
  }, 'Generate — ' + lead.name), React.createElement('div', {
    className: 'ts'
  }, 'Zero fabrication · Observable facts only · A/B variants')), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 8
    }
  }, result && isHot && React.createElement('button', {
    className: 'btn btn-a',
    onClick: brief
  }, '🔥 CEO Brief'), result && React.createElement('button', {
    className: 'btn btn-g',
    onClick: generate,
    disabled: loading
  }, '↺ Regenerate'), !result && React.createElement('button', {
    className: 'btn btn-a',
    onClick: generate,
    disabled: loading
  }, loading ? React.createElement('span', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, React.createElement('div', {
    className: 'spinner'
  }), 'Generating...') : '⚡ Generate Now'))), React.createElement('div', {
    className: 'content'
  }, isHot && React.createElement('div', {
    style: {
      padding: '12px 16px',
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 10,
      marginBottom: 16,
      fontSize: 13,
      color: 'var(--r)'
    }
  }, '🔥 Hot Lead — ICP Score ' + (lead.icpScore || 0) + '/100 · CEO personal outreach recommended'), error && React.createElement('div', {
    style: {
      padding: '12px 16px',
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 10,
      marginBottom: 16,
      fontSize: 13,
      color: '#fca5a5'
    }
  }, '⚠ ' + error), !result && !loading && React.createElement('div', {
    className: 'card',
    style: {
      maxWidth: 520
    }
  }, React.createElement('div', {
    style: {
      fontWeight: 600,
      fontSize: 14,
      marginBottom: 12
    }
  }, 'Ready to generate for ' + lead.name), flawLabels.length > 0 && React.createElement('div', {
    style: {
      marginBottom: 12
    }
  }, flawLabels.map(f => React.createElement('span', {
    key: f,
    style: {
      display: 'inline-block',
      fontSize: 11,
      padding: '3px 8px',
      borderRadius: 20,
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.2)',
      color: '#fca5a5',
      margin: 3
    }
  }, '✗ ' + f))), React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--m2)',
      lineHeight: 1.6
    }
  }, 'Claude identifies one verifiable observation, generates two A/B email variants, builds a preview page.')), loading && React.createElement(ProgressTracker, {
    title: 'Generating pitch for ' + lead.name,
    subtitle: 'AI analysis in progress',
    currentStep: step,
    steps: [{
      label: 'Scraping homepage',
      detail: 'Firecrawl reading their site — CTA, headline, trust signals, tech stack'
    }, {
      label: 'Loading Brain modules',
      detail: 'Selecting relevant frameworks from Hopkins, Halbert, Hormozi, Schwartz'
    }, {
      label: 'Analyzing revenue signals',
      detail: '4-bucket analysis — Acquisition, Conversion, Authority, Infrastructure'
    }, {
      label: 'Writing A/B variants + preview page',
      detail: 'Zero fabrication — only confirmed facts in the pitch'
    }]
  }), result && React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      maxWidth: 860
    }
  }, result.observation && React.createElement('div', {
    style: {
      padding: '14px 18px',
      background: 'rgba(124,58,237,0.07)',
      border: '1px solid rgba(124,58,237,0.2)',
      borderRadius: 12
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6
    }
  }, React.createElement('div', {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: '#a78bfa'
    }
  }, 'Verified Observation'), score && React.createElement('div', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 800,
      fontSize: 22,
      color: scoreColor,
      lineHeight: 1
    }
  }, score, React.createElement('span', {
    style: {
      fontSize: 11,
      color: 'var(--m)',
      fontFamily: 'Inter',
      fontWeight: 400
    }
  }, ' / 100'))), React.createElement('div', {
    style: {
      fontSize: 14,
      fontWeight: 500,
      marginBottom: 4
    }
  }, result.observation), result.deliverable && React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--m)'
    }
  }, 'Proof-of-work: ', React.createElement('span', {
    style: {
      color: 'var(--a)'
    }
  }, result.deliverable))), React.createElement('div', {
    className: 'card'
  }, React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 700,
      fontSize: 14
    }
  }, 'A/B Email Variants'), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 6
    }
  }, ['A', 'B'].map(v => React.createElement('button', {
    key: v,
    className: 'btn btn-sm ' + (variant === v ? 'btn-p' : 'btn-g'),
    onClick: () => pickV(v)
  }, 'Variant ' + v + (variant === v ? ' ←' : ''))))), React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, ['A', 'B'].map(v => {
    const vd = v === 'A' ? result.variantA : result.variantB;
    const active = variant === v;
    return React.createElement('div', {
      key: v,
      style: {
        border: '1px solid ' + (active ? 'var(--p)' : 'var(--b)'),
        borderRadius: 10,
        padding: 14,
        background: active ? 'rgba(124,58,237,0.05)' : 'var(--s2)'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8
      }
    }, React.createElement('span', {
      className: 'tag ' + (active ? 'tp' : '')
    }, 'Variant ' + v), React.createElement('button', {
      className: 'btn btn-g btn-sm',
      onClick: () => navigator.clipboard.writeText('Subject: ' + (vd && vd.subject || '') + '\n\n' + (vd && vd.pitch || ''))
    }, 'Copy')), React.createElement('div', {
      style: {
        fontSize: 11,
        color: 'var(--m)',
        marginBottom: 3
      }
    }, 'SUBJECT'), React.createElement('div', {
      style: {
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 8,
        color: active ? 'var(--t)' : 'var(--m2)'
      }
    }, vd && vd.subject), React.createElement('div', {
      style: {
        fontSize: 11,
        color: 'var(--m)',
        marginBottom: 3
      }
    }, 'BODY'), React.createElement('div', {
      style: {
        fontSize: 12,
        color: 'var(--m2)',
        lineHeight: 1.6,
        whiteSpace: 'pre-line'
      }
    }, vd && vd.pitch));
  }))), result.previewPageHtml && React.createElement('div', {
    className: 'card'
  }, React.createElement('div', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 700,
      fontSize: 14,
      marginBottom: 12
    }
  }, 'Preview Page — ', React.createElement('span', {
    style: {
      color: 'var(--a)',
      fontSize: 12
    }
  }, 'audits.CROJungle.com/' + slug)), React.createElement('div', {
    style: {
      borderRadius: 10,
      overflow: 'hidden',
      border: '1px solid var(--b2)'
    }
  }, React.createElement('div', {
    style: {
      background: 'var(--s2)',
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      gap: 4
    }
  }, ['#ef4444', '#f59e0b', '#22c55e'].map(c => React.createElement('div', {
    key: c,
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: c
    }
  }))), React.createElement('div', {
    style: {
      flex: 1,
      background: 'var(--bg)',
      borderRadius: 4,
      padding: '4px 10px',
      fontSize: 11,
      color: 'var(--m)',
      fontFamily: 'monospace'
    }
  }, 'audits.CROJungle.com/' + slug)), React.createElement('iframe', {
    srcDoc: result.previewPageHtml,
    style: {
      width: '100%',
      height: 380,
      border: 'none'
    },
    title: 'Preview',
    sandbox: 'allow-same-origin'
  })))))));
}
function SendView({
  leadId
}) {
  const [lead, setLead] = useState(null);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    const l = getLeads().find(x => x.id === leadId);
    if (l) setLead(l);
  }, [leadId]);
  if (!lead) return React.createElement('div', null, React.createElement('div', {
    className: 'tb'
  }, React.createElement('div', null, React.createElement('div', {
    className: 'tt'
  }, 'Send'))), React.createElement('div', {
    className: 'content'
  }, React.createElement('div', {
    className: 'empty'
  }, React.createElement('h3', null, 'No lead selected'))));
  if (!lead.pitch) return React.createElement('div', null, React.createElement('div', {
    className: 'tb'
  }, React.createElement('div', null, React.createElement('div', {
    className: 'tt'
  }, 'Send'))), React.createElement('div', {
    className: 'content'
  }, React.createElement('div', {
    className: 'empty'
  }, React.createElement('h3', null, 'Generate pitch first'))));
  const slug = lead.name.toLowerCase().replace(/\s+/g, '-');
  const previewUrl = 'https://audits.CROJungle.com/' + slug;
  const body = (lead.pitch || '') + '\n\n—\nPreview page we built for you: ' + previewUrl + '\n\nCROJungle.com\n\nTo unsubscribe reply "unsubscribe".';
  const link = buildMailto(lead.email, lead.subject, body);
  const markSent = () => {
    const leads = getLeads();
    const idx = leads.findIndex(x => x.id === leadId);
    if (idx >= 0) {
      leads[idx].status = 'sent';
      leads[idx].sentAt = today();
      saveLeads(leads);
    }
    setSent(true);
  };
  const Field = (label, value) => React.createElement('div', null, React.createElement('div', {
    className: 'lbl'
  }, label), React.createElement('div', {
    style: {
      fontSize: 13,
      padding: '10px 14px',
      background: 'var(--s2)',
      borderRadius: 8,
      border: '1px solid var(--b2)',
      fontWeight: label === 'Subject' ? 500 : 400
    }
  }, value || '—'));
  return React.createElement('div', null, React.createElement('div', {
    className: 'tb'
  }, React.createElement('div', null, React.createElement('div', {
    className: 'tt'
  }, 'Send — ' + lead.name), React.createElement('div', {
    className: 'ts'
  }, 'Review and fire'))), React.createElement('div', {
    className: 'content'
  }, React.createElement('div', {
    style: {
      maxWidth: 620
    }
  }, sent && React.createElement('div', {
    style: {
      padding: '12px 16px',
      background: 'rgba(34,197,94,0.1)',
      border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: 10,
      marginBottom: 16,
      fontSize: 13,
      color: '#86efac'
    }
  }, '✓ Marked as sent. Follow-up sequence active.'), React.createElement('div', {
    className: 'card'
  }, React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, Field('To', lead.email || '(no email — add in Find tab)'), lead.ccEmails && Field('CC', lead.ccEmails), Field('Subject', lead.subject), React.createElement('div', null, React.createElement('div', {
    className: 'lbl'
  }, 'Body'), React.createElement('div', {
    className: 'pb'
  }, body))), React.createElement('div', {
    className: 'divider'
  }), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 8
    }
  }, React.createElement('a', {
    href: link,
    className: 'btn btn-a',
    style: {
      textDecoration: 'none',
      flex: 1,
      justifyContent: 'center'
    },
    onClick: markSent
  }, '📧 Open in Email Client'), !sent && React.createElement('button', {
    className: 'btn btn-g',
    onClick: markSent
  }, 'Mark Sent'))))));
}
function TrackView() {
  const [leads, setLeads] = useState([]);
  useEffect(() => {
    setLeads(getLeads().filter(l => l.status !== 'new'));
  }, []);
  const bump = (id, field) => {
    const all = getLeads();
    const idx = all.findIndex(x => x.id === id);
    if (idx >= 0) {
      all[idx][field] = (all[idx][field] || 0) + 1;
      saveLeads(all);
      setLeads(all.filter(l => l.status !== 'new'));
    }
  };
  const hot = leads.filter(l => l.pageVisits >= 3);
  const visited = leads.filter(l => l.pageVisits > 0 && l.pageVisits < 3);
  const opened = leads.filter(l => l.opens > 0 && !l.pageVisits);
  const sent = leads.filter(l => l.status === 'sent' && !l.opens);
  const Card = ({
    lead
  }) => React.createElement('div', {
    className: 'card',
    style: {
      marginBottom: 10,
      borderColor: lead.pageVisits >= 3 ? 'rgba(239,68,68,0.3)' : 'var(--b)'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, React.createElement('div', null, React.createElement('div', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 700,
      fontSize: 14
    }
  }, lead.name), React.createElement('div', {
    style: {
      fontSize: 11,
      color: 'var(--m)',
      marginTop: 4
    }
  }, lead.email + (lead.sentAt ? ' · Sent ' + lead.sentAt : '')), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 8
    }
  }, React.createElement('span', {
    style: {
      fontSize: 12
    }
  }, 'Opens: ', React.createElement('strong', {
    style: {
      color: lead.opens > 0 ? 'var(--am)' : 'var(--m2)'
    }
  }, lead.opens || 0)), React.createElement('span', {
    style: {
      fontSize: 12
    }
  }, 'Visits: ', React.createElement('strong', {
    style: {
      color: lead.pageVisits >= 3 ? 'var(--r)' : lead.pageVisits > 0 ? 'var(--a)' : 'var(--m2)'
    }
  }, lead.pageVisits || 0)))), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 6
    }
  }, React.createElement('button', {
    className: 'btn btn-g btn-sm',
    onClick: () => bump(lead.id, 'opens')
  }, '+Open'), React.createElement('button', {
    className: 'btn btn-g btn-sm',
    onClick: () => bump(lead.id, 'pageVisits')
  }, '+Visit'))));
  const Section = ({
    title,
    color,
    items
  }) => items.length === 0 ? null : React.createElement('div', {
    style: {
      marginBottom: 20
    }
  }, React.createElement('div', {
    className: 'lbl',
    style: {
      color: color || 'var(--m)',
      marginBottom: 10
    }
  }, title), items.map(l => React.createElement(Card, {
    key: l.id,
    lead: l
  })));
  return React.createElement('div', null, React.createElement('div', {
    className: 'tb'
  }, React.createElement('div', null, React.createElement('div', {
    className: 'tt'
  }, 'Track'), React.createElement('div', {
    className: 'ts'
  }, 'Opens · Visits · Hot leads'))), React.createElement('div', {
    className: 'content'
  }, React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14,
      marginBottom: 24
    }
  }, [{
    l: 'Total Sent',
    v: leads.filter(l => l.status === 'sent').length,
    c: 'purple'
  }, {
    l: 'Opens',
    v: leads.filter(l => l.opens > 0).length,
    c: 'acid'
  }, {
    l: 'Page Visits',
    v: leads.filter(l => l.pageVisits > 0).length,
    c: ''
  }, {
    l: '🔥 Hot',
    v: hot.length,
    c: 'red'
  }].map(s => React.createElement('div', {
    key: s.l,
    className: 'card'
  }, React.createElement('div', {
    style: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--m)',
      marginBottom: 8
    }
  }, s.l), React.createElement('div', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 800,
      fontSize: 28,
      color: s.c === 'purple' ? 'var(--p)' : s.c === 'acid' ? 'var(--a)' : s.c === 'red' ? 'var(--r)' : 'var(--t)'
    }
  }, s.v)))), leads.length === 0 && React.createElement('div', {
    className: 'empty'
  }, React.createElement('div', {
    style: {
      fontSize: 40,
      marginBottom: 16
    }
  }, '📡'), React.createElement('h3', null, 'No leads tracked'), React.createElement('p', null, 'Send your first email.')), React.createElement(Section, {
    title: '🔥 Hot — Follow up NOW',
    color: 'var(--r)',
    items: hot
  }), React.createElement(Section, {
    title: '👀 Page Visited',
    color: 'var(--a)',
    items: visited
  }), React.createElement(Section, {
    title: '📧 Email Opened',
    color: 'var(--am)',
    items: opened
  }), React.createElement(Section, {
    title: '📬 Sent',
    items: sent
  })));
}
function FollowUpView({
  leadId
}) {
  const [leads, setLeads] = useState([]);
  useEffect(() => {
    setLeads(getLeads().filter(l => l.status === 'sent' || l.opens > 0 || l.pageVisits > 0));
  }, [leadId]);
  const ctx = lead => {
    if (lead.pageVisits >= 3) return 'hot';
    if (lead.pageVisits > 0) return 'visited';
    if (lead.opens > 0) return 'opened';
    return 'cold';
  };
  const getScript = (lead, fIdx) => {
    const c = ctx(lead);
    const name = lead.founderName || 'there';
    const url = 'https://audits.CROJungle.com/' + lead.name.toLowerCase().replace(/\s+/g, '-');
    const flaw = (lead.flaws || []).slice(0, 1).map(f => FLAWS.find(x => x.id === f) && FLAWS.find(x => x.id === f).label || f).join('') || 'your homepage conversion';
    if (fIdx === 0) {
      if (c === 'hot') return name + ' — you\'ve looked at the preview page a few times. I\'ll take that as a sign it\'s resonating.\n\nWorth 15 minutes? Happy to show you what we\'d do first.\n\nCROJungle.com';
      if (c === 'visited') return name + ' — saw you checked out the preview. Curious what you thought.\n\nHappy to walk through it — 15 minutes.\n\nCROJungle.com';
      if (c === 'opened') return name + ' — making sure this didn\'t get buried:\n\n' + url + '\n\nWe rebuilt your homepage hero. Worth 30 seconds.';
      return name + ' — wanted to make sure this didn\'t get lost:\n\n' + url + '\n\nWe built that in 10 minutes. Imagine what we\'d do with 30 days.';
    }
    if (fIdx === 1) return name + ' — one thing I\'d fix first at ' + lead.name + ':\n\n' + flaw + '.\n\nFixed this for a client — $70k profit in one month.\n\nWorth a conversation?';
    return name + ' — last note.\n\nMost $15M–$50M companies we talk to have the same problem: spending on marketing, not seeing ROI.\n\nWe fix that. CROJungle.com\n\nTo unsubscribe reply "unsubscribe".';
  };
  const adjDate = (lead, fu, i) => {
    const c = ctx(lead);
    if (c === 'hot' && i === 0) return today();
    if (c === 'visited' && i === 0) return daysFrom(1);
    return fu.dueDate;
  };
  const markDone = (leadId, fIdx) => {
    const all = getLeads();
    const idx = all.findIndex(x => x.id === leadId);
    if (idx >= 0 && all[idx].followUps) {
      all[idx].followUps[fIdx].done = true;
      saveLeads(all);
      setLeads(all.filter(l => l.status === 'sent' || l.opens > 0 || l.pageVisits > 0));
    }
  };
  const upcoming = [];
  leads.forEach(lead => {
    (lead.followUps || []).forEach((fu, i) => {
      if (!fu.done) {
        const adj = adjDate(lead, fu, i);
        upcoming.push({
          lead,
          fu,
          fIdx: i,
          daysLeft: daysDiff(adj),
          context: ctx(lead)
        });
      }
    });
  });
  upcoming.sort((a, b) => a.daysLeft - b.daysLeft);
  const overdue = upcoming.filter(x => x.daysLeft < 0);
  const dueToday = upcoming.filter(x => x.daysLeft === 0);
  const soon = upcoming.filter(x => x.daysLeft > 0);
  const FUCard = ({
    item
  }) => {
    const [exp, setExp] = useState(false);
    const {
      lead,
      fu,
      fIdx,
      daysLeft,
      context
    } = item;
    const s = getScript(lead, fIdx);
    const link = buildMailto(lead.email, 'Re: ' + (lead.subject || lead.name), s);
    const ctxLabel = {
      hot: '🔥 Hot',
      visited: '👀 Visited',
      opened: '📧 Opened',
      cold: '📬 Sent'
    }[context] || '';
    const dLabel = daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Today' : 'in ' + daysLeft + 'd';
    return React.createElement('div', {
      className: 'card',
      style: {
        marginBottom: 10,
        borderColor: context === 'hot' ? 'rgba(239,68,68,0.3)' : context === 'visited' ? 'rgba(163,230,53,0.2)' : 'var(--b)'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, React.createElement('div', {
      style: {
        fontFamily: 'Syne',
        fontWeight: 800,
        fontSize: 20,
        color: 'var(--a)',
        minWidth: 20
      }
    }, fIdx + 1), React.createElement('div', null, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 3
      }
    }, React.createElement('div', {
      style: {
        fontSize: 13,
        fontWeight: 600
      }
    }, lead.name + ' — ' + fu.label), React.createElement('span', {
      className: 'tag ' + (context === 'hot' ? 'tr' : context === 'visited' ? 'ta' : context === 'opened' ? 'tam' : 'tp')
    }, ctxLabel)), React.createElement('div', {
      style: {
        fontSize: 11,
        color: daysLeft < 0 ? 'var(--r)' : 'var(--m)'
      }
    }, 'Due ' + dLabel + ' · ' + (lead.opens > 0 ? lead.opens + ' open' + (lead.opens > 1 ? 's' : '') : 'no opens') + ' · ' + (lead.pageVisits > 0 ? lead.pageVisits + ' visit' + (lead.pageVisits > 1 ? 's' : '') : 'no visits')))), React.createElement('div', {
      style: {
        display: 'flex',
        gap: 6
      }
    }, React.createElement('button', {
      className: 'btn btn-g btn-sm',
      onClick: () => setExp(!exp)
    }, exp ? 'Hide' : 'Script'), React.createElement('a', {
      href: link,
      className: 'btn btn-p btn-sm',
      style: {
        textDecoration: 'none'
      },
      onClick: () => markDone(lead.id, fIdx)
    }, '📧 Send'), React.createElement('button', {
      className: 'btn btn-g btn-sm',
      onClick: () => markDone(lead.id, fIdx)
    }, '✓ Done'))), exp && React.createElement('div', {
      className: 'pb',
      style: {
        marginTop: 12
      }
    }, s));
  };
  const Section = ({
    title,
    color,
    items
  }) => items.length === 0 ? null : React.createElement('div', {
    style: {
      marginBottom: 24
    }
  }, React.createElement('div', {
    className: 'lbl',
    style: {
      color: color || 'var(--m)',
      marginBottom: 10
    }
  }, title), items.map((item, i) => React.createElement(FUCard, {
    key: item.lead.id + item.fIdx + i,
    item
  })));
  return React.createElement('div', null, React.createElement('div', {
    className: 'tb'
  }, React.createElement('div', null, React.createElement('div', {
    className: 'tt'
  }, 'Follow Up'), React.createElement('div', {
    className: 'ts'
  }, overdue.length > 0 ? '⚠ ' + overdue.length + ' overdue' : upcoming.length + ' scheduled'))), React.createElement('div', {
    className: 'content'
  }, upcoming.length === 0 && React.createElement('div', {
    className: 'empty'
  }, React.createElement('div', {
    style: {
      fontSize: 40,
      marginBottom: 16
    }
  }, '✅'), React.createElement('h3', null, 'All caught up'), React.createElement('p', null, 'No follow-ups scheduled.')), React.createElement(Section, {
    title: '⚠ Overdue',
    color: 'var(--r)',
    items: overdue
  }), React.createElement(Section, {
    title: 'Today',
    color: 'var(--a)',
    items: dueToday
  }), React.createElement(Section, {
    title: 'Upcoming',
    items: soon
  })));
}
function SettingsView({
  settings,
  onSave
}) {
  const [form, setForm] = useState({
    ...settings
  });
  const [diagResults, setDiagResults] = useState(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const runDiagnostics = async () => {
    setDiagLoading(true);
    setDiagResults(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      const r = await fetch(BACKEND + '/api/diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keys: form
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const d = await r.json();
      setDiagResults(d);
    } catch (e) {
      if (e.name === 'AbortError') {
        setDiagResults({
          backend: {
            ok: false,
            error: 'Timed out — Render may be waking up (free tier). Wait 60 seconds and try again.'
          }
        });
      } else {
        setDiagResults({
          backend: {
            ok: false,
            error: e.message
          }
        });
      }
    }
    setDiagLoading(false);
  };
  const Fld = ({
    label,
    k,
    type,
    hint,
    ph
  }) => React.createElement('div', {
    style: {
      marginBottom: 14
    }
  }, React.createElement('label', {
    className: 'lbl'
  }, label), React.createElement('input', {
    className: 'input',
    type: type || 'text',
    placeholder: ph || '',
    value: form[k] || '',
    onChange: e => setForm(p => ({
      ...p,
      [k]: e.target.value
    }))
  }), hint && React.createElement('div', {
    style: {
      marginTop: 5,
      fontSize: 11,
      color: 'var(--m)'
    }
  }, hint));
  const Card = ({
    title,
    children
  }) => React.createElement('div', {
    className: 'card',
    style: {
      marginBottom: 16
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 700,
      fontSize: 14,
      marginBottom: 14
    }
  }, title), children);
  return React.createElement('div', null, React.createElement('div', {
    className: 'tb'
  }, React.createElement('div', null, React.createElement('div', {
    className: 'tt'
  }, 'Settings'), React.createElement('div', {
    className: 'ts'
  }, 'API keys · Email framework · Sending domain')), React.createElement('button', {
    className: 'btn btn-a',
    onClick: () => {
      saveSettings(form);
      onSave(form);
    }
  }, 'Save Settings')), React.createElement('div', {
    className: 'content'
  }, React.createElement('div', {
    style: {
      maxWidth: 600
    }
  }, React.createElement(Card, {
    title: 'Core API Keys'
  }, React.createElement(Fld, {
    label: 'Anthropic API Key',
    k: 'apiKey',
    type: 'password',
    ph: 'sk-ant-...',
    hint: 'console.anthropic.com · Powers all pitch generation'
  }), React.createElement(Fld, {
    label: 'Firecrawl API Key',
    k: 'firecrawlKey',
    type: 'password',
    ph: 'fc-...',
    hint: 'firecrawl.dev · Auto-scrapes homepages · Free: 500/month'
  }), React.createElement(Fld, {
    label: 'The Companies API Key',
    k: 'companiesApiKey',
    type: 'password',
    ph: 'Company enrichment token',
    hint: 'thecompaniesapi.com · Real headcount + industry from domain · Free: 500 credits, simplified mode free. The size-gate backbone.'
  }), React.createElement(Fld, {
    label: 'Hunter.io API Key',
    k: 'hunterKey',
    type: 'password',
    ph: 'Hunter key',
    hint: 'hunter.io · Finds verified founder emails · Free: 25/month'
  })), React.createElement(Card, {
    title: 'Discovery API Keys'
  }, React.createElement(Fld, {
    label: 'NinjaPear API Key',
    k: 'ninjaPearKey',
    type: 'password',
    ph: 'Optional — company size + executives',
    hint: 'nubela.co (by ex-Proxycurl team) — real-time headcount + decision-makers from public web, NOT LinkedIn scraping. Pay-per-use, dramatically sharpens reachability. Leave blank to skip.'
  }), React.createElement(Fld, {
    label: 'Facebook Ad Library Token',
    k: 'fbToken',
    type: 'password',
    ph: 'Facebook token',
    hint: 'developers.facebook.com · Finds companies running Facebook ads'
  }), React.createElement(Fld, {
    label: 'Adzuna App ID',
    k: 'adzunaId',
    type: 'password',
    ph: 'Adzuna App ID',
    hint: 'developer.adzuna.com - FREE - powers the AI-replacement hiring signals (primary source)'
  }), React.createElement(Fld, {
    label: 'Adzuna App Key',
    k: 'adzunaKey',
    type: 'password',
    ph: 'Adzuna App Key',
    hint: 'Same account as App ID - REQUIRED or Adzuna returns 0 results'
  }), React.createElement('div', {
    style: {padding:'12px 16px', background:'rgba(163,230,53,0.05)', border:'1px solid rgba(163,230,53,0.15)', borderRadius:10, fontSize:12, color:'var(--m2)', marginTop:8}
  }, '✓ Discovery sources: Adzuna (AI-replacement signals) · SEC EDGAR · Google News · BizBuySell · Facebook Ads (add token above)')), React.createElement(Card, {
    title: 'CEO Prompt Framework'
  }, React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--m2)',
      marginBottom: 10,
      lineHeight: 1.6
    }
  }, 'This is your CEO\'s voice. Claude uses this for every pitch. The more specific, the better output.'), React.createElement('textarea', {
    className: 'input',
    placeholder: 'Example: CROJungle builds revenue infrastructure. We generate measurable growth through software, ads, and conversion systems. Proof: $70k profit for a client in one month. Tone: blunt, peer-level, never salesy...',
    value: form.promptFramework || '',
    onChange: e => setForm(p => ({
      ...p,
      promptFramework: e.target.value
    }))
  })), React.createElement(Card, {
    title: 'Sending Domain'
  }, React.createElement(Fld, {
    label: 'Warmed Sending Email',
    k: 'sendingDomain',
    ph: 'vinny@crojungleteam.com',
    hint: 'Your crojungleteam.com domain is warming now — ready in 3-4 weeks.'
  }), React.createElement('div', {
    style: {
      padding: '10px 12px',
      background: 'rgba(245,158,11,0.06)',
      borderRadius: 8,
      border: '1px solid rgba(245,158,11,0.15)',
      fontSize: 12,
      color: '#fcd34d'
    }
  }, '⚠ Never cold email from CROJungle.com — use crojungleteam.com only.')), React.createElement('div', {
    className: 'card',
    style: { marginBottom: 12 }
  }, React.createElement('div', { style: { fontFamily: 'Syne', fontWeight: 700, fontSize: 14, marginBottom: 10 } }, '💾 Data Backup & Restore'),
  React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 8 } },
    React.createElement('button', {
      className: 'btn btn-g', style: { flex: 1 },
      onClick: () => {
        const data = localStorage.getItem('cj_leads_v3') || '[]';
        const a = document.createElement('a');
        a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(data);
        a.download = 'crojungle_leads_backup.txt';
        a.click();
      }
    }, '⬇ Export Leads'),
    React.createElement('button', {
      className: 'btn btn-g', style: { flex: 1 },
      onClick: () => {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = '.txt,.json';
        inp.onchange = e => {
          const r = new FileReader();
          r.onload = ev => {
            try {
              const data = ev.target.result;
              const parsed = JSON.parse(data);
              // Handle full backup (object with leads/discovered/settings keys)
              if (parsed.leads) {
                localStorage.setItem('cj_leads_v3', parsed.leads);
                if (parsed.discovered) localStorage.setItem('cj_discovered_v1', parsed.discovered);
                if (parsed.settings) localStorage.setItem('cj_settings_v3', parsed.settings);
              } else {
                // Handle leads-only backup (raw array)
                localStorage.setItem('cj_leads_v3', data);
              }
              alert('✓ Data imported! Reloading now...');
              location.reload();
            } catch(err) { alert('Invalid file — use a leads backup .txt file'); }
          };
          r.readAsText(e.target.files[0]);
        };
        inp.click();
      }
    }, '⬆ Import Leads')),
  React.createElement('button', {
    className: 'btn btn-a', style: { width: '100%', marginTop: 8 },
    onClick: async () => {
      const leads = getLeads();
      if (!leads.length) { alert('No leads to sync'); return; }
      let ok = 0, fail = 0, firstError = '';
      for (const lead of leads) {
        try {
          const res = await fetch(SB_URL + '/rest/v1/leads?on_conflict=id', {
            method: 'POST',
            headers: {
              'apikey': SB_KEY,
              'Authorization': 'Bearer ' + SB_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal,resolution=merge-duplicates'
            },
            body: JSON.stringify(leadToRow(lead))
          });
          if (res.ok) { ok++; }
          else { fail++; if (!firstError) firstError = 'HTTP ' + res.status + ': ' + (await res.text()).slice(0, 200); }
        } catch(e) { fail++; if (!firstError) firstError = e.message; }
      }
      if (fail === 0) alert('✓ All ' + ok + ' leads synced to cloud!');
      else alert('Synced ' + ok + ', failed ' + fail + '.\n\nError: ' + firstError);
    }
  }, '☁ Force Sync All to Cloud Now'),
  React.createElement('div', { style: { fontSize: 11, color: 'var(--m)', marginTop: 8 } }, 'Always export before switching domains. Import restores from any backup file. Force Sync pushes everything to Supabase.')), React.createElement('div', {
    className: 'card',
    style: {
      marginBottom: 16
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    }
  }, React.createElement('div', null, React.createElement('div', {
    style: {
      fontFamily: 'Syne',
      fontWeight: 700,
      fontSize: 14,
      marginBottom: 4
    }
  }, 'System Diagnostics'), React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--m)'
    }
  }, 'Tests every signal source. Run after adding keys.')), React.createElement('button', {
    className: 'btn btn-a',
    onClick: runDiagnostics,
    disabled: diagLoading
  }, diagLoading ? React.createElement('span', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, React.createElement('div', {
    className: 'spinner'
  }), 'Testing... (may take 30-60s if server is waking up)') : '⚡ Run Diagnostics')), diagResults && React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, Object.entries(diagResults).filter(([k]) => k !== 'error').map(([source, result]) => {
    const ok = result.ok;
    const labels = {
      adzuna_ai: 'Adzuna — AI-replacement signals',
      sec_edgar: 'SEC EDGAR — Form D funding filings',
      news_hire: 'Google News — CMO / VP Marketing hires',
      news_funding: 'Google News — Series A/B raises',
      news_rebrand: 'Google News — rebrands',
      news_expansion: 'Google News — new location openings',
      news_acquisition: 'Google News — acquisitions',
      news_agency_pain: 'Google News — agency frustration',
      news_growth: 'Google News — growth funding',
      news_launch: 'Google News — product launches',
      bizbuysell: 'BizBuySell — businesses for sale',
      facebook_ads: 'Facebook Ad Library — companies running ads',
      hunter: 'Hunter.io — founder email finder',
      backend: 'Backend server'
    };
    return React.createElement('div', {
      key: source,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 10,
        background: ok ? 'rgba(163,230,53,0.05)' : 'rgba(239,68,68,0.05)',
        border: '1px solid ' + (ok ? 'rgba(163,230,53,0.2)' : 'rgba(239,68,68,0.2)')
      }
    }, React.createElement('span', {
      style: {
        fontSize: 16,
        flexShrink: 0
      }
    }, ok ? '✅' : '❌'), React.createElement('div', {
      style: {
        flex: 1
      }
    }, React.createElement('div', {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: ok ? 'var(--a)' : '#fca5a5'
      }
    }, labels[source] || source), React.createElement('div', {
      style: {
        fontSize: 11,
        color: 'var(--m)',
        marginTop: 1
      }
    }, ok ? (result.count != null ? result.count + ' results' + (result.total ? ' of ' + result.total.toLocaleString() + ' total' : '') : 'Connected') + (result.requests_remaining != null ? ' · ' + result.requests_remaining + ' searches remaining' : '') : result.error || 'Not connected')));
  })), !diagResults && !diagLoading && React.createElement('div', {
    style: {
      fontSize: 12,
      color: 'var(--m)',
      padding: '12px 0'
    }
  }, 'Save your keys first, then run diagnostics to see exactly which sources are working.')))));
}
function SavedView({ onCreate, settings }) {
  const SAVED_KEY = 'cj_saved_v1';
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; }
  });
  const [researching, setResearching] = useState('');

  const removeSaved = name => {
    const next = saved.filter(s => s.name.toLowerCase() !== name.toLowerCase());
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setSaved(next);
  };

  const moveToPipeline = async company => {
    setResearching(company.name);
    const leads = getLeads();
    const id = Math.random().toString(36).slice(2, 10);
    const newLead = { ...company, id, status: 'new', createdAt: new Date().toISOString().slice(0,10),
      followUps: [{day:3,label:'Follow up 1',done:false},{day:7,label:'Follow up 2',done:false},{day:14,label:'Follow up 3',done:false}] };
    saveLeads([...leads, newLead]);
    removeSaved(company.name);
    setResearching('');
    if (onCreate) onCreate(id);
  };

  return React.createElement('div', { style: { padding: '32px 40px', maxWidth: 1100, margin: '0 auto' } },
    React.createElement('div', { style: { fontFamily: 'Syne', fontWeight: 800, fontSize: 22, marginBottom: 4 } }, 'Saved Leads'),
    React.createElement('div', { style: { fontSize: 13, color: 'var(--m)', marginBottom: 24 } }, saved.length + ' leads saved for later — review and move to pipeline when ready'),
    saved.length === 0
      ? React.createElement('div', { style: { textAlign: 'center', padding: '60px 20px', color: 'var(--m)' } },
          React.createElement('div', { style: { fontSize: 40, marginBottom: 12, opacity: 0.3 } }, '☆'),
          React.createElement('div', { style: { fontSize: 14 } }, 'No saved leads yet.'),
          React.createElement('div', { style: { fontSize: 12, marginTop: 4 } }, 'Hit "Save for Later" on any lead in Find to park it here.'))
      : saved.sort((a,b) => (b.icpScore||0)-(a.icpScore||0)).map((co, i) => React.createElement('div', {
          key: i, className: 'card',
          style: { display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 8, padding: 16 }
        },
          React.createElement('div', {
            style: { width: 46, height: 46, borderRadius: '50%', border: '2px solid ' + ((co.icpScore||0) >= 70 ? '#a3e635' : (co.icpScore||0) >= 50 ? '#f59e0b' : 'var(--b2)'),
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
          }, React.createElement('div', { style: { fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: (co.icpScore||0) >= 70 ? '#a3e635' : 'var(--m2)' } }, co.icpScore||0),
             React.createElement('div', { style: { fontSize: 7, color: 'var(--m)' } }, '/100')),
          React.createElement('div', { style: { flex: 1, minWidth: 0 } },
            React.createElement('div', { style: { fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 2 } }, co.name),
            React.createElement('div', { style: { fontSize: 12, color: 'var(--a)', marginBottom: 3 } }, co.discoveryReason || (co.jobTitle||'')),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--m)' } }, (co.location || '—') + ' · saved ' + (co.savedAt || ''))),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
            React.createElement('button', { className: 'btn btn-p btn-sm', disabled: !!researching, onClick: () => moveToPipeline(co) },
              researching === co.name ? 'Adding...' : 'Add to Pipeline'),
            React.createElement('button', { className: 'btn btn-g btn-sm', onClick: () => removeSaved(co.name) }, 'Remove'))
        ))
  );
}

function App() {
  const [view, setView] = useState('find');
  const [activeLead, setActiveLead] = useState(null);
  const [settings, setSettings] = useState(getSettings());
  const [toast, setToast] = useState(null);
  const [leads, setLeads] = useState(getLeads());
  const [sbStatus, setSbStatus] = useState('loading');

  React.useEffect(() => {
    (async () => {
      try {
        const cloudLeads = await sbLoadLeads();
        if (cloudLeads && cloudLeads.length > 0) {
          const local = getLeads();
          const cloudIds = new Set(cloudLeads.map(l => l.id));
          const localOnly = local.filter(l => !cloudIds.has(l.id));
          const merged = [...cloudLeads, ...localOnly];
          localStorage.setItem(LK, JSON.stringify(merged));
          console.log('Supabase: loaded ' + cloudLeads.length + ' cloud leads');
        }
        setSbStatus('synced');
        // ALWAYS push every local lead up on startup — guarantees cloud stays current
        const allLocal = getLeads();
        for (const lead of allLocal) {
          fetch(SB_URL + '/rest/v1/leads?on_conflict=id', {
            method: 'POST',
            headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal,resolution=merge-duplicates' },
            body: JSON.stringify(leadToRow(lead))
          }).catch(() => {});
        }
        window._sbSyncEnabled = true;
      } catch(e) {
        console.warn('Supabase offline:', e.message);
        setSbStatus('offline');
        window._sbSyncEnabled = false;
      }
    })();
  }, []);
  const refresh = () => setLeads(getLeads());
  const hot = leads.filter(l => l.pageVisits >= 3).length;
  const due = leads.filter(l => (l.followUps || []).some(fu => !fu.done && daysDiff(fu.dueDate) <= 0)).length;
  const NAV = [{
    id: 'find',
    label: 'Find',
    icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'
  }, {
    id: 'research',
    label: 'Research',
    icon: 'M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10'
  }, {
    id: 'generate',
    label: 'Generate',
    icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z'
  }, {
    id: 'send',
    label: 'Send',
    icon: 'M22 2L11 13 M22 2L15 22 8 13 2 9z'
  }, {
    id: 'track',
    label: 'Track',
    icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    badge: hot || null,
    bg: true
  }, {
    id: 'followup',
    label: 'Follow Up',
    icon: 'M12 2v20 M2 12h20',
    badge: due || null
  }, {
    id: 'saved',
    label: 'Saved',
    icon: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'
  }, {
    id: 'settings',
    label: 'Settings',
    icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
  }];
  const onCreate = id => {
    setActiveLead(id);
    refresh();
    setView('research');
    setToast('Lead added — click Run Research to audit');
  };
  const onGenDone = () => {
    refresh();
    setToast('Pitch generated');
  };
  const renderView = () => {
    if (view === 'find') return React.createElement(FindView, {
      onCreate,
      settings
    });
    if (view === 'saved') return React.createElement(SavedView, {
      onCreate,
      settings
    });
    if (view === 'research') return React.createElement(ResearchView, {
      leadId: activeLead,
      onNext: () => setView('generate'),
      onSelectLead: setActiveLead,
      settings
    });
    if (view === 'generate') return React.createElement(GenerateView, {
      leadId: activeLead,
      onDone: onGenDone,
      settings
    });
    if (view === 'send') return React.createElement(SendView, {
      leadId: activeLead
    });
    if (view === 'track') return React.createElement(TrackView);
    if (view === 'followup') return React.createElement(FollowUpView, {
      leadId: activeLead
    });
    if (view === 'settings') return React.createElement(SettingsView, {
      settings,
      onSave: s => {
        setSettings(s);
        setToast('Settings saved');
      }
    });
    return null;
  };
  return React.createElement('div', {
    className: 'app'
  }, React.createElement('div', {
    className: 'sidebar'
  }, React.createElement('div', {
    className: 'logo'
  }, 'CRO', React.createElement('span', null, 'jungle')), React.createElement('div', {
    className: 'nl'
  }, 'Pipeline'), NAV.map(item => React.createElement('div', {
    key: item.id,
    className: 'ni' + (view === item.id ? ' active' : ''),
    onClick: () => setView(item.id)
  }, React.createElement('svg', {
    width: 15,
    height: 15,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: {
      opacity: .7,
      flexShrink: 0
    }
  }, item.icon.split(' M').filter(Boolean).map((d, i) => React.createElement('path', {
    key: i,
    d: (i === 0 ? '' : ' M') + d
  }))), item.label, item.badge ? React.createElement('span', {
    className: 'nb' + (item.bg ? ' g' : '')
  }, item.badge) : null)), React.createElement('div', {
    className: 'sb'
  }, React.createElement('div', null, leads.length + ' in pipeline'), React.createElement('div', {
    style: {
      marginTop: 4
    }
  }, 'Cost: ', React.createElement('strong', null, '~$0.02/week')))), React.createElement('div', {
    className: 'main'
  }, renderView()), toast && React.createElement(Toast, {
    msg: toast,
    onClose: () => setToast(null)
  }));
}

// Error boundary — surfaces errors instead of black screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }
  static getDerivedStateFromError(e) {
    return {
      error: e
    };
  }
  render() {
    if (this.state.error) {
      return React.createElement('div', {
        style: {
          padding: 40,
          fontFamily: 'monospace',
          color: '#ef4444',
          background: '#0a0a0f',
          minHeight: '100vh'
        }
      }, React.createElement('div', {
        style: {
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 16
        }
      }, '⚠ CROJungle Error'), React.createElement('div', {
        style: {
          fontSize: 13,
          color: '#f0f0f5',
          marginBottom: 8
        }
      }, this.state.error.message), React.createElement('pre', {
        style: {
          fontSize: 11,
          color: '#6b7280',
          whiteSpace: 'pre-wrap'
        }
      }, this.state.error.stack), React.createElement('button', {
        style: {
          marginTop: 20,
          padding: '8px 16px',
          background: '#a3e635',
          color: '#000',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 600
        },
        onClick: () => window.location.reload()
      }, 'Reload'));
    }
    return this.props.children;
  }
}
try {
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ErrorBoundary, null, React.createElement(App)));
} catch (e) {
  document.getElementById('root').innerHTML = '<div style="padding:40px;color:#ef4444;font-family:monospace;background:#0a0a0f;min-height:100vh"><h2 style="margin-bottom:16px">⚠ Startup Error</h2><p style="color:#f0f0f5">' + e.message + '</p><pre style="color:#6b7280;font-size:11px;margin-top:12px">' + e.stack + '</pre><button onclick="localStorage.clear();location.reload()" style="margin-top:20px;padding:8px 16px;background:#a3e635;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600">Clear Storage & Reload</button></div>';
}

</script>
</body>
</html>
