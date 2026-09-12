
let HUNTER_AUTH_DEAD=false,HUNTER_EXHAUSTED=false,HUNTER_THROTTLED_UNTIL=0;
const hunterSerial=(fn)=>fn();
const fetchT=async()=>{ throw new Error("timeout after 10000ms"); };
const safeJson=async()=>({});
const hunterGuard=()=>false;
const hunterFindPersonEmail = async (domain, fullName, hunterKey) => {
  if (!domain || !fullName || !hunterKey) return null;
  // Already known spent or dead — do not spend a round trip to be told again, and
  // do not manufacture another null that reads as a fact about this business.
  // Three distinct unavailable states, and they must not be reported as one.
  // A rejected key, an empty balance and a 60-second throttle call for three
  // different actions: fix the key, top up, or simply wait.
  if (HUNTER_AUTH_DEAD) return { unavailable: true, reason: 'hunter_key_rejected' };
  if (HUNTER_EXHAUSTED) return { unavailable: true, reason: 'hunter_out_of_credits' };
  if (Date.now() < HUNTER_THROTTLED_UNTIL) {
    return { unavailable: true, reason: 'hunter_rate_limited',
             retryInSec: Math.ceil((HUNTER_THROTTLED_UNTIL - Date.now()) / 1000) };
  }
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  const first = parts[0], last = parts[parts.length - 1];
  try {
    const r = await hunterSerial(() => fetchT(
      `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(first)}&last_name=${encodeURIComponent(last)}&api_key=${hunterKey}`,
      {}, 10000));
    const d = await safeJson(r);
    // DISTINGUISH "we could not ask" FROM "there is no address". Returning a bare
    // null for both is what let an empty Hunter balance masquerade as an
    // unreachable prospect.
    if (hunterGuard(d, r.status, 'email-finder')) {
      return { unavailable: true,
               reason: HUNTER_AUTH_DEAD ? 'hunter_key_rejected'
                     : HUNTER_EXHAUSTED ? 'hunter_out_of_credits'
                     : 'hunter_rate_limited' };
    }
    const email = d?.data?.email;
    if (!email) return null;
    const score = typeof d.data.score === 'number' ? d.data.score : 0;
    const sourced = Array.isArray(d.data.sources) && d.data.sources.length > 0;
    console.log(`HUNTER FINDER [${domain}]: ${fullName} \u2192 ${email} (confidence ${score}${sourced ? ', found in a public source' : ', pattern-inferred'})`);
    return { email, score, sourced };
  } catch(e) { console.log('hunterFindPersonEmail failed:', e.message); return null; }
};
hunterFindPersonEmail("winnsplumbing.com","Chris Winn","key").then(hf=>{
  console.log("returned:",JSON.stringify(hf));
  if (hf && hf.unavailable) console.log("caller branch: COULD NOT CHECK  <- correct");
  else if (hf && hf.email)  console.log("caller branch: uses the address");
  else console.log("caller branch: the final else -> the row is told its index has no address for them, One credit spent, a fact about their record");
});
