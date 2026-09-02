# The contact-list CSV columns

Derived on 2026-09-02 from `index.html`'s own `FIND_CSV_COLUMNS` and `FIND_CSV_ESSENTIAL` tables (commit b01d952), so this file cannot disagree with the app; if they change, regenerate this. The Google Sheet export uses the SAME column choice ([§92](../../../docs/history/round-092.md)). **Default export = the 13 lean columns**, in the order below; the full 33 are one tick box away ([§95](../../../docs/history/round-095.md)).

| # | key | heading in the file | lean (default)? |
|---|---|---|---|
| 1 | `icp` | ICP score out of 100 (our fit score, not a Google position) | **yes** |
| 2 | `icpWhy` | What that score was measured on |  |
| 3 | `company` | Company | **yes** |
| 4 | `owner` | Decision-maker | **yes** |
| 5 | `ownerTitle` | Their title | **yes** |
| 6 | `ownerHowSure` | How sure we are it is him, and what to ask | **yes** |
| 7 | `ownerCanBuy` | Can they authorise a purchase |  |
| 8 | `ownerFrom` | Where we found them |  |
| 9 | `email` | Email | **yes** |
| 10 | `emailConfidence` | How confident we are in that address | **yes** |
| 11 | `emailSafeToSend` | Safe to send |  |
| 12 | `emailWhyUnconfirmed` | If it is unconfirmed, why |  |
| 13 | `emailGoesTo` | Who opens it |  |
| 14 | `phone` | Phone | **yes** |
| 15 | `phoneOnSite` | Does their own site print this number |  |
| 16 | `callWindow` | When to call | **yes** |
| 17 | `exported` | Already exported (when, and where) | **yes** |
| 18 | `affordTier` | What they can afford |  |
| 19 | `payingForAds` | Already paying for ads | **yes** |
| 20 | `adsWhy` | What we saw on their site |  |
| 21 | `teamSize` | People on their team page (a floor, not a headcount) |  |
| 22 | `hiringMarketing` | Hiring for marketing | **yes** |
| 23 | `hiringRoles` | Roles they are hiring for |  |
| 24 | `hiringPosted` | When that role was posted | **yes** |
| 25 | `website` | Website |  |
| 26 | `location` | Location |  |
| 27 | `reviews` | Google reviews |  |
| 28 | `rating` | Google rating |  |
| 29 | `readVia` | How their site was read |  |
| 30 | `notFit` | Not a fit, and why |  |
| 31 | `demotedWhy` | Why this lead was marked down |  |
| 32 | `independence` | Independent, or a branch of something bigger |  |
| 33 | `notes` | What we could not do |  |

How to read the two "how sure" columns ([§101](../../../docs/history/round-101.md)): `ownerHowSure` is one of **confirmed** (two independent sources agree), **stated** (their own site says so, one source), **inferred** (the business is named after him and nothing else names an owner), **unconfirmed** (the name was held back by the buying-authority floor — usually because no TITLE was found, not because the name is wrong); it carries the pivot sentence to open with. `emailConfidence` is read from the address TIER, never from prose: tier 1 published on their site, tier 2 mailbox confirmed by SMTP, tier 3 matches the company's learned pattern, tier 4 an inferred pattern (not sendable), tier 5 none — plus the states "role mailbox", "catch-all domain" (delivers, but may not be his box) and "the verifier was down" (our outage, not a fault of the address). Every cell is neutralised against spreadsheet formula injection ([§89](../../../docs/history/round-089.md)).
