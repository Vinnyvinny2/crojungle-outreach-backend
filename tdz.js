const acorn = require('acorn'), fs = require('fs');
const src = fs.readFileSync(process.argv[2] || 'server.js','utf8');
const ast = acorn.parse(src, {ecmaVersion:2022, sourceType:'script', locations:true});
const FN = new Set(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression']);
const problems = [];
// Three things that LOOK like a reference and are not:
//   obj.spine      — a property name, not the variable `spine`
//   { spine: ... } — an object key
//   function(spine)— a parameter binding
// Counting those is what produced 63 false positives and made the scan useless.
function scan(node, scopes, depth, skip){
  if(!node || typeof node!=='object') return;
  let scope = scopes, d = depth;
  if(FN.has(node.type)) d = depth + 1;
  if(node.type==='BlockStatement'||node.type==='Program'){
    const decls = new Map();
    (node.body||[]).forEach(st=>{
      if(st.type==='VariableDeclaration' && (st.kind==='let'||st.kind==='const')){
        st.declarations.forEach(dc=>{
          if(dc.id && dc.id.type==='Identifier') decls.set(dc.id.name, {line: dc.id.loc.start.line, depth: d});
        });
      }
    });
    scope = scopes.concat([decls]);
  }
  if(node.type==='Identifier' && node.loc && !skip){
    // Innermost declaration WINS. A name declared in an inner block shadows the
    // outer one, so checking every enclosing scope reports a variable as "used
    // before declaration" against a declaration it never resolves to. That
    // produced 10 false positives and buried the one real hit.
    for(let i=scope.length-1;i>=0;i--){
      const dl = scope[i].get(node.name);
      if(!dl) continue;
      if(node.loc.start.line < dl.line && dl.depth === d){
        problems.push(`${node.name}: read at line ${node.loc.start.line}, declared at line ${dl.line}`);
      }
      break;   // resolved here; outer scopes are shadowed
    }
  }
  for(const k in node){
    if(k==='loc'||k==='start'||k==='end') continue;
    const v = node[k];
    // property of a non-computed member expression, and non-computed object keys
    const isProp = (node.type==='MemberExpression' && k==='property' && !node.computed)
                || (node.type==='Property' && k==='key' && !node.computed)
                || (node.type==='MethodDefinition' && k==='key' && !node.computed)
                || (k==='params')
                || (node.type==='VariableDeclarator' && k==='id');
    if(Array.isArray(v)) v.forEach(c=>scan(c, scope, d, isProp));
    else if(v && typeof v.type==='string') scan(v, scope, d, isProp);
  }
}
scan(ast, [], 0, false);
const uniq=[...new Set(problems)];
console.log(uniq.length ? '✗ TDZ RISKS ('+uniq.length+'):\n'+uniq.join('\n') : '✓ TDZ scan clean — no block-scoped variable is read before its declaration in the same execution path');
// A gate, not a status report — see the note at the bottom of dupkeys.js.
process.exit(uniq.length ? 1 : 0);
