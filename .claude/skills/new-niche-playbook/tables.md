# Every niche-specific table in server.js (survey at commit b01d952, 2026-09-02)

Line numbers drift; `grep -n 'const NAME'` is the truth. "Check" is the boot check that asserts coverage; "—" means nothing refuses a gap there.

| Constant | Line | Meaning | Check |
|---|---|---|---|
| PRODUCT_FAMILY | 1437 | product family a diagnosis implies | GROWTH ARRIVAL CHECK |
| LSA_ELIGIBLE / LSA_TRADE_ALIASES | 5291 / 5329 | trades eligible for Local Services Ads, and aliases | LSA TRADE CHECK (own fixtures, not per category) |
| TRADE_WORD | 5453 | trade nouns a business name may end on | — |
| CATEGORY_TIER | 5579 | A/B/C: does the retainer maths work | TRADE TABLE COVERAGE CHECK |
| GP_CATEGORIES | 5686 | the ~55 Places queries + labels | TRADE TABLE COVERAGE, NICHE BRIEF COVERAGE |
| GP_FREE_BUILDER | 5681 | free site-builder domains | ICP FILTER CHECK |
| HIGH_VOLUME_LOW_TICKET / LOW_VOLUME_HIGH_TICKET | 5806 / 5828 | review-floor raise / lower sets | ICP FILTER CHECK (sets, not categories) |
| reviewFloorFor | 5835 | the trade-aware review floor | ICP FILTER CHECK |
| TRADE_CAPACITY_CLASS / SOLO_TRADE_RE | 5866 / 5901 | solo / mixed / crewed | TRADE TABLE COVERAGE CHECK |
| GP_CITY_COORDS / GP_CITIES | 6090 / 6132 | the searched metros and their coordinates | COVERAGE RADIUS CHECK (the two move together) |
| GP_FRANCHISE | 6152 | the only unconditional name-delete | ICP FILTER CHECK |
| PRACTICE_STAFF_RE | 12194 | practice staff titles that are not the owner | OWNER TRUTH CHECK |
| RECURRING_OFFER_RE / RECURRING_NORMAL_TRADES | 13838 / 13875 | plan offer text; trades where a plan is normal | RECURRING REVENUE, STEM MATCH, SIGNAL TRUTH |
| MONEY_PILLARS / REVENUE_BENCHMARKS | 14864 / 15130 | the seven loss buckets; cited segment figures | MONEY PILLAR CHECK |
| REFERRAL_TRADES / REFERRAL_ADJUST | 18662 / 18666 | referral-driven trades and the ladder adjust | REFERRAL CHECK |
| EMERGENCY_TRADES / CONSIDERED_TRADES / TRADE_URGENCY_MIXED / URGENCY_ADJUST | 18713 / 18738 / 18754 / 18773 | purchase urgency | URGENCY CHECK, TRADE TABLE COVERAGE, KNOWABILITY |
| OUR_PRICE_FIGURES / PRODUCT_PRICE_LINE | 23838 / 23843 | our licensed price figures | AUDIT MONEY CHECK |
| TRADE_JOB_VALUE | 23856 | ~58 "a job runs about" rows | TRADE TABLE COVERAGE, TRADE ANCHOR, LIVE EMAIL |
| NICHE_BRIEFS / BRIEF_MODEL_DISQUALIFIERS / NICHE_BRIEF_EXPECT / NICHE_BRIEF_LIVE_CASES | 24116 / 24485 / 24502 / 24587 | the brief library and its declarations | NICHE BRIEF CHECK, NICHE BRIEF COVERAGE CHECK |
| NICHE_MONEY_UNITS / TRADE_MONEY_UNITS / OUR_PRODUCT_WORDS / OUR_CATALOGUE_FIELD | 24690 / 24699 / 24718 / 24734 | money units and product words the gates license | NICHE BRIEF, AUDIT MONEY |
| TRADE_MONEY_EXEMPT | 25588 | trades with no honest single job value | TRADE TABLE COVERAGE CHECK |
| FINANCING_RE / BIG_TICKET_TRADE_RE | 25605 / 25626 | financing vendors; big-ticket trades | SIGNAL TRUTH, MONEY SIGNAL |
| ICP_STAFFING / ICP_INSTITUTION / ICP_SMALL_PRACTICE / ICP_BIG_HEALTH | 36830-36846 | the institution / scale / practice-escape lists | ICP FILTER, STEM MATCH |
| STEM_COMPLETE_WORDS | 36874 | every bare stem a list may end on | STEM MATCH CHECK |
| BLOCKED_COMPANIES / STAFFING_BRANDS / ENTERPRISE_BRANDS / NATIONAL_BRANDS | 36927-37054 | the four brand sets (whole-name match) | ICP FILTER CHECK |
| TRADE_WORDS / TRADE_MODIFIERS / TRADE_SYNONYM_GROUPS | 39078 / 39652 / 40082 | trade vocabulary for the rank search | TRADE PHRASE CHECK (modifiers); — |
| SLUG_PRODUCT_LINE | 40900 | product-line URL slugs | page checks |
| CHAIN_ROLE_RE / CHAIN_SELF_RE / CHAIN_DENIAL_RE | 75379-75382 | franchisee language on their own pages | CHAIN OUTLET CHECK |
| FIND_ICP_TERMS / FIND_ICP_MIN_TERMS | 75586 / 75753 | the contact-list fit score terms; floor of 3 | FIND ICP GATE CHECK |

## Company identity (for a full swap)

server.js: "CROJungle" 54 times (first at 1131, 1144, 1282, 3222, 4245 …); catalogue prose in `BRAIN_STATIC` 7816-7817 and the price rule at 7924; other price prose at 3230, 5559, 5571, 5747, 5823, 12138, 23834, 23847, 46331-46361, 46710, 47498; `$800k` at 5551, 5560, 5626, 5688, 5779, 5789, 38275, 42663, 75581, 76815; `$15M` at 14464, 16475, 71759, 75581, 76815; 200 employees at 4352, 36009, 37392, 37871; `crojungleteam.com` user agent at 4245; the Hunter sequence id comes from Settings (`req.body.sequenceId`, 77209), the `859908` literal is only in a check fixture.

index.html: "CROJungle" 12 times (6, 3984, 4123, 4166, 4361, 5022, 5085, 9675, 11271, 14110, 16692, 17311); the BRAIN prompt's product block 5022-5100 (`$50k+` rebuild at 5087, `$10k-$35k/month` at 5100); `PILLAR_PRODUCT` 2861, `LAYER_PLAIN` 2828; proof points and `audits.CROJungle.com` at 14110; the never-cold-email-from-CROJungle.com warning at 16692.
