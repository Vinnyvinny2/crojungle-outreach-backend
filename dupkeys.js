// Duplicate keys in an object literal are silent: the later one wins, no error,
// no warning. This class has cost this codebase more sessions than any other —
// five times in rowToLead, and once more in _harmInputs during the session that
// added this file. AST, not regex, so it cannot be fooled by strings or comments.
const acorn = require('acorn'), fs = require('fs');
const file = process.argv[2];
let src = fs.readFileSync(file,'utf8');
if(file.endsWith('.html')){
  const blocks=[...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  src = blocks.join('\n;\n');
}
const ast = acorn.parse(src,{ecmaVersion:2022, sourceType:'script', locations:true});
const hits=[];
(function walk(n){
  if(!n||typeof n!=='object')return;
  if(n.type==='ObjectExpression'){
    const seen=new Map();
    n.properties.forEach(p=>{
      if(p.type!=='Property'||p.computed)return;
      const k = p.key.type==='Identifier'?p.key.name:(p.key.type==='Literal'?String(p.key.value):null);
      if(k===null)return;
      if(seen.has(k)) hits.push(`  "${k}" first at line ${seen.get(k)}, overwritten at line ${p.key.loc.start.line}`);
      else seen.set(k,p.key.loc.start.line);
    });
  }
  for(const k in n){const v=n[k];if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v.type==='string')walk(v);}
})(ast);
console.log(hits.length ? `✗ ${file}: ${hits.length} duplicate key(s) — the later value silently wins:\n`+hits.join('\n')
                        : `✓ ${file}: no duplicate keys in any object literal`);
// Exit non-zero, so this is a GATE and not a status report. It printed a red ✗
// and exited 0 for its whole life, which is how "baseline 3" and "baseline 9"
// became numbers to match rather than bugs to fix — and four live collisions
// sat inside that accepted baseline, blanking restored data on every app load.
// A check that cannot fail teaches you to read past it. Baseline is 0 now.
process.exit(hits.length ? 1 : 0);
