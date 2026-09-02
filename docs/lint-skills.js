// Lint for .claude/skills: frontmatter, goal line, size, referenced files, and every 'lines A-B' verbatim claim checked against the cited commit.
// Run: node docs/lint-skills.js   (exits non-zero on any failure)
// Throwaway lint for .claude/skills: format, size, goal line, referenced files, verbatim copies.
const fs = require('fs'), path = require('path');
const ROOT = '/home/user/crojungle-outreach-backend';
const SK = path.join(ROOT, '.claude', 'skills');
const orig = require('child_process').execSync('git -C ' + ROOT + ' show b01d952:CLAUDE.md', { maxBuffer: 1 << 26 }).toString('utf8').split('\n'); // the commit every verbatim claim cites
let fails = 0; const bad = m => { console.log('✗ ' + m); fails++; };
for (const name of fs.readdirSync(SK).sort()) {
  const dir = path.join(SK, name), file = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(file)) { bad(`${name}: no SKILL.md`); continue; }
  const t = fs.readFileSync(file, 'utf8');
  if (t.includes('\r')) bad(`${name}: CR byte`);
  const m = /^---\n([\s\S]*?)\n---\n/.exec(t); if (!m) { bad(`${name}: no frontmatter`); continue; }
  const fm = {}; for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  if (fm.name !== name) bad(`${name}: frontmatter name "${fm.name}" != folder`);
  let desc = fm.description || ''; try { if (desc.startsWith('"')) desc = JSON.parse(desc); } catch (e) { bad(`${name}: description is not valid quoted text`); }
  if (!desc) bad(`${name}: no description`);
  if (desc.length > 1536) bad(`${name}: description ${desc.length} chars > 1536`);
  const body = t.slice(m[0].length).split('\n');
  if (!/^# /.test(body[0])) bad(`${name}: body does not open with an H1`);
  if (!/^\*\*Goal:\*\* /.test(body[2] || '')) bad(`${name}: Goal is not the first line under the title (got: ${body[2]})`);
  const lines = t.split('\n').length; if (lines > 500) bad(`${name}: ${lines} lines > 500`);
  // referenced supporting files in the same folder
  for (const ref of (t.match(/`([a-z0-9-]+\.(md|sql|sh))`/g) || [])) { const f = ref.replace(/`/g, ''); if (f !== 'SKILL.md' && !/^(CLAUDE|INDEX|verify-split|ci-gates|server|index|clientcheck|map)\./.test(f) && !fs.existsSync(path.join(dir, f))) bad(`${name}: references ${f} which is not in its folder`); }
  if (/`map\.md`/.test(t) && !fs.existsSync(path.join(dir, 'map.md'))) bad(`${name}: map.md missing`);
  // verbatim copies: "lines A-B" claims in the intro must match the original byte for byte
  const claims = [...t.matchAll(/lines (\d+)-(\d+)/g)].map(x => [+x[1], +x[2]]);
  for (const [a, b] of claims) {
    const want = orig.slice(a - 1, b).join('\n');
    if (!t.includes(want)) bad(`${name}: claims lines ${a}-${b} verbatim but the text differs`);
    else console.log(`  ✓ ${name}: lines ${a}-${b} (${b - a + 1} lines) are a byte-exact copy`);
  }
  console.log(`✓ ${name}: ${lines} lines, description ${desc.length} chars, goal present`);
}
// ── --check-refs: the generated reference files must equal a fresh regeneration ──
if (process.argv.includes('--check-refs')) {
  const os = require('os'), cp = require('child_process');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'refs-'));
  cp.execSync(`node ${path.join(ROOT, 'docs', 'gen-refs.js')} ${tmp}`, { stdio: 'pipe' });
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  for (const f of walk(tmp)) {
    const rel = path.relative(tmp, f), live = path.join(SK, rel);
    if (!fs.existsSync(live)) { bad(`${rel}: generated reference file is missing from .claude/skills — run node docs/gen-refs.js`); continue; }
    if (fs.readFileSync(f, 'utf8') !== fs.readFileSync(live, 'utf8')) bad(`${rel}: differs from a fresh regeneration — the code changed; run node docs/gen-refs.js and commit`);
    else console.log(`  ✓ ${rel} matches a fresh regeneration`);
  }
  for (const f of walk(tmp)) if (/not found/.test(fs.readFileSync(f, 'utf8'))) bad(`${path.relative(tmp, f)}: a named constant/function was NOT FOUND in the code (renamed?)`);
  // every log label named in diagnose-log/log-vocabulary.md must exist in server.js (emoji stored as \u{...} escapes are decoded first)
  const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8').replace(/\\u\{([0-9a-fA-F]+)\}/g, (m, h) => String.fromCodePoint(parseInt(h, 16)));
  const vocab = fs.readFileSync(path.join(SK, 'diagnose-log', 'log-vocabulary.md'), 'utf8');
  let labels = 0, missing = [];
  for (const m of vocab.matchAll(/`([^`\n]+)`/g)) {
    const core = m[1].replace(/[^\x20-\x7E]/g, '').replace(/\s*\[.*$/, '').replace(/[/].*$/, '').trim();
    if (!/^[A-Z][A-Z0-9 -]{3,}$/.test(core)) continue;              // only shouting labels, not prose or paths
    labels++; if (!src.includes(core)) missing.push(core);
  }
  if (missing.length) bad(`log-vocabulary.md names ${missing.length} label(s) not found in server.js: ${missing.join(' | ')}`); else console.log(`  ✓ log-vocabulary.md: all ${labels} shouting labels exist in server.js`);
  // every docs/history/round-NNN.md pointer resolves
  let ptr = 0, dead = [];
  for (const name of fs.readdirSync(SK)) for (const f of fs.readdirSync(path.join(SK, name))) for (const m of fs.readFileSync(path.join(SK, name, f), 'utf8').matchAll(/round-(\d{3})\.md/g)) { ptr++; if (!fs.existsSync(path.join(ROOT, 'docs', 'history', `round-${m[1]}.md`))) dead.push(`${name}/${f} → round-${m[1]}`); }
  if (dead.length) bad(`${dead.length} round pointer(s) do not resolve: ${[...new Set(dead)].join(', ')}`); else console.log(`  ✓ all ${ptr} round pointers resolve`);
}
console.log(fails ? `LINT: RED (${fails})` : 'LINT: GREEN');
process.exit(fails ? 1 : 0);
