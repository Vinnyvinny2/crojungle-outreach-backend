# §67 — The fix-everything sweep before bulk — 2026-08-25
Source: CLAUDE.md lines 5746-5851, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 67. The fix-everything sweep before bulk — 2026-08-25

Vin, with the second Conner's run (the first on a verified DataForSEO account
— the pack answered, #14 of 19 in the blue links, ~341 modeled visits):
"why cant we just fix all of this stuff one time then the logs be clean...
work slow and meticulously with insane attention to detail," plus the audit
read: the story came out thin, the grey text must go entirely, paid traffic
must be visible, and "are we ready to run 50 bulk leads — rank the system
honestly, no smoke."

### The thin story was a timeout with no second chance

`SITUATION READ: call failed — timeout. The audit continues without it.` The
story writer — the one call whose loss a reader sees as "the audit is thin" —
ran Sonnet at thinking-high toward ~3,000 output tokens against a 45-second
ceiling, and was the only call in its class with no timeout retry. One slow
minute deleted the best writing in the audit and the sheet shipped a one-line
story. 90 seconds now, plus the same single opt-in retry the critique and the
mine carry.

### The classifier was outrun again, so the miner now tags the kind

§57 widened the complaint-bucket regexes for Breck's phrasing; the very next
lead's phrasings — "Slow follow-up after initial estimate visit", "Delayed
warranty or defect repairs" — missed every bucket again, so the after-contact
stage read NO FAULT FOUND while the complaint sat under the funnel as
workmanship, and only two leaks were numbered. A hand-kept vocabulary chasing
a model's free-form labels loses forever. The miner READ the reviews, so it
now tags each pattern `contact | workmanship | other` (strict enum, invalid
values die to null), the tag rides beside the strings and wins at every
classification site, and the regex stays as the fallback for untagged data —
widened for both live misses. Signals also sort most-mentioned first: the live
run put a 2-mention pattern above a 3-mention one because emission order was
trusted as a ranking.

### The anchor floor, and a dead limb the falsification found

The depth rule alone would have made a 2-of-90 anecdote leak #1 (§61's exact
complaint through the new door). A review pattern below the email's own
three-mention floor can support at 2-3 and cannot anchor; when it is all a
lead has, it still leads — the email's own BLOCKED RUNG LEADS ANYWAY rule,
mirrored. The falsification run then proved the explicit last-resort fallback
UNREACHABLE (the numbering loop already hands rank 1 to the first sorted row)
and it was deleted: a mechanism no fixture can reach is the kind that rots.

### The rest of the sweep, each falsified alone

- **The owner's replies join the verify corpus** — a TRUE quote of his
  "Thanks so much Terry!" was stripped from the synthesis because the replies
  were handed to the model and never to the gate. Pages, reviews, replies:
  third instance of the category error.
- **"141 five-star reviews"** — the count fits the profile total so every
  figure gate passed it, and the qualifier is false (8 of 90 read sat at
  three stars or below). The count stripper now reads the measured low-star
  count; without that measurement it strips nothing.
- **Do-not-say noise, three shapes**: entries opening "VOICE:" are style
  notes (the old regex only knew "VOICE FAILURE"); an entry whose own text
  says "no email flag warranted... correctly sequestered" is the checker
  AGREEING and is cleared; and "claims what Google shows, from a scrape" is
  exempt when the rank order was TRUSTED — on a real-pack lead we did read
  what Google shows.
- **The ordering claim lives in one place.** "It gates everything below it"
  (the LEADS constraint) printed three lines under "The door first, then the
  traffic" on the live sheet. The constraint keeps its finding; fix-order is
  said once, by the walk.
- **Every scrape sheds its URL fragment at the one door** — "/contact#!" from
  their own sitemap bought a copy of the homepage twice across two runs.
- **The paid half of the traffic estimate is read** (paid.etv sat unread
  beside organic.etv), the walk names the blue-links position ("#14 of 19 —
  a separate ranking from the map itself", silent under six results), and the
  sheet says where the source split actually lives: his Analytics, on the
  call.
- **Log hygiene**: the time buckets stop lumping PageSpeed under "google
  places" (11 timed vs 4 billed read as a metering hole; the meter was
  right), DataForSEO gets its own row, a timed-out model call is named as
  billed-but-unmetered, the GBP category line names its remainder instead of
  counting seven and listing six, and the DFS probe now says it proves
  CREDENTIALS, not account verification — it printed "can actually run" on
  an instance where every paid call answered 40104.

### The screen and the sheet: no grey text, anywhere

Vin: "eliminate the grey text completely... it gets read right over cuz its
smaller font size and grey." Every grey TEXT token on both audit surfaces is
full-contrast now (borders and fills keep their hairlines — a border is not
text), nothing renders under 12px on the screen or 12.5px on the sheet, and
hierarchy lives in size and weight alone. Red still marks stops, the yellow
internal chip stays. Enforced both ways: the rendered export must carry no
grey text token and the briefing source must not use the app's grey vars —
the second scan is on lifted source, stated as such, because a recording stub
cannot see styles.

### What the falsification runs found in the checks themselves

Eighteen falsifications — twelve server, four client, two structural finds.
The owner-reply and google-shows needles were both written as a literal
joined to an EMPTY half — one contiguous string that found the check's own
source and stayed green through a real revert. Ninth and tenth recorded
instances of the self-matching needle, both mine, both caught by running the
falsification rather than trusting the green line.

**229 boot checks green.** `index.html` changed, so this needs a Netlify
deploy.

---

