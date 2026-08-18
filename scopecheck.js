// ── AN IDENTIFIER THAT RESOLVES TO NOTHING ───────────────────────────────────
// index.html has now produced this failure three separate times, and each one
// reached a user:
//
//   l.fullPageUrl      in ResearchView  — crashed the whole audit view, so the
//                                         lead LOOKED deleted and only a reload
//                                         recovered it
//   lead.brainAudit    in SendView      — threw AFTER Hunter had accepted the
//                                         mail, so nothing was marked sent, the
//                                         operator was told the send FAILED, and
//                                         clicking again emailed the owner twice
//   setResearchError   in GenerateView  — the fact-check refusal path calls a
//                                         function that does not exist there
//
// Every one is the same shape: a name copied from a scope where it existed into
// a scope where it does not. `node --check` cannot see it, because it is valid
// syntax. It only fails when that exact branch runs, which is why two of the
// three sat live for weeks — and why the SendView one only appeared when a send
// actually succeeded.
//
// This walks the real scope chain: every function, block, catch clause, class,
// and every binding form (params, destructuring, defaults, rest, for-of heads,
// function declarations). An identifier that is READ and resolves to no binding
// and is not a known global is reported.
//
//   node scopecheck.js index.html
//
// It is a GATE, not a report — exit 1 on any hit. See the note at the bottom of
// dupkeys.js for why that matters here.
const acorn = require('acorn'), fs = require('fs');

const file = process.argv[2] || 'index.html';
let src = fs.readFileSync(file, 'utf8');
if (file.endsWith('.html')) {
  src = [...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');
}
const ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'script', locations: true });

// Anything the browser, React, or the standard library provides. A name missing
// from here shows up as a false positive, which is worse than useless — so this
// list is deliberately generous. The bugs it must catch are LOCAL names, never
// globals.
const GLOBALS = new Set(`
React ReactDOM window document navigator location history localStorage sessionStorage
console setTimeout clearTimeout setInterval clearInterval requestAnimationFrame
cancelAnimationFrame fetch Headers Request Response FormData URL URLSearchParams
AbortController Blob File FileReader Image Audio Event CustomEvent MutationObserver
DOMException DOMParser Node Element HTMLElement Text Range Selection Notification
performance screen frames parent top self origin isSecureContext caches indexedDB
IntersectionObserver ResizeObserver WebSocket XMLHttpRequest crypto btoa atob
alert confirm prompt structuredClone queueMicrotask reportError getComputedStyle
matchMedia scrollTo scrollBy open close print
Object Array String Number Boolean Symbol BigInt Math JSON Date RegExp Error
TypeError RangeError SyntaxError ReferenceError EvalError URIError AggregateError
Map Set WeakMap WeakSet Promise Proxy Reflect Intl
parseInt parseFloat isNaN isFinite encodeURIComponent decodeURIComponent
encodeURI decodeURI globalThis undefined NaN Infinity eval
Uint8Array Int8Array Uint16Array Int16Array Uint32Array Int32Array
Float32Array Float64Array ArrayBuffer DataView TextEncoder TextDecoder
process require module exports __dirname __filename Buffer global
arguments this super
`.trim().split(/\s+/));

const FN = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
const problems = [];

// Collect every name a binding pattern introduces: plain, array, object, rest,
// default, and nested combinations. Missing any of these produces false
// positives on modern code, which is how a checker gets switched off.
function bind(node, add) {
  if (!node) return;
  switch (node.type) {
    case 'Identifier': add(node.name); break;
    case 'ObjectPattern': node.properties.forEach(p =>
      bind(p.type === 'RestElement' ? p.argument : p.value, add)); break;
    case 'ArrayPattern': node.elements.forEach(e => bind(e, add)); break;
    case 'AssignmentPattern': bind(node.left, add); break;
    case 'RestElement': bind(node.argument, add); break;
    case 'Property': bind(node.value, add); break;
    default: break;
  }
}

// Function and var declarations hoist to the nearest function scope, so they are
// gathered before the body is walked. Not doing this reports every mutually
// recursive helper as undefined.
function hoist(body, add) {
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'FunctionDeclaration' && n.id) { add(n.id.name); return; }
    if (n.type === 'VariableDeclaration' && n.kind === 'var') { n.declarations.forEach(d => bind(d.id, add)); }
    if (FN.has(n.type) || n.type === 'ClassDeclaration' || n.type === 'ClassExpression') return;
    for (const k in n) {
      if (k === 'loc' || k === 'start' || k === 'end') continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v.type === 'string') walk(v);
    }
  };
  (Array.isArray(body) ? body : [body]).forEach(walk);
}

function scan(node, scopes) {
  if (!node || typeof node !== 'object') return;

  let scope = scopes;
  const own = new Set();
  const add = (n) => own.add(n);

  if (FN.has(node.type)) {
    (node.params || []).forEach(p => bind(p, add));
    if (node.id) add(node.id.name);
    if (node.body && node.body.type === 'BlockStatement') hoist(node.body.body, add);
    scope = scopes.concat([own]);
  } else if (node.type === 'Program') {
    hoist(node.body, add);
    (node.body || []).forEach(st => {
      if (st.type === 'VariableDeclaration') st.declarations.forEach(d => bind(d.id, add));
      if (st.type === 'ClassDeclaration' && st.id) add(st.id.name);
    });
    scope = scopes.concat([own]);
  } else if (node.type === 'BlockStatement' || node.type === 'StaticBlock') {
    (node.body || []).forEach(st => {
      if (st.type === 'VariableDeclaration' && st.kind !== 'var') st.declarations.forEach(d => bind(d.id, add));
      if (st.type === 'FunctionDeclaration' && st.id) add(st.id.name);
      if (st.type === 'ClassDeclaration' && st.id) add(st.id.name);
    });
    scope = scopes.concat([own]);
  } else if (node.type === 'CatchClause') {
    bind(node.param, add);
    scope = scopes.concat([own]);
  } else if (node.type === 'ForStatement' || node.type === 'ForInStatement' || node.type === 'ForOfStatement') {
    const head = node.init || node.left;
    if (head && head.type === 'VariableDeclaration') head.declarations.forEach(d => bind(d.id, add));
    scope = scopes.concat([own]);
  }

  const resolved = (name) => GLOBALS.has(name) || scope.some(s => s.has(name));

  for (const k in node) {
    if (k === 'loc' || k === 'start' || k === 'end') continue;
    const v = node[k];

    // Positions that are NOT a variable read: property names, object keys,
    // labels, import/export specifiers, and the binding side of a declarator.
    // Counting these is what makes a scope checker unusable.
    const skip =
      (node.type === 'MemberExpression' && k === 'property' && !node.computed) ||
      (node.type === 'Property' && k === 'key' && !node.computed) ||
      (node.type === 'MethodDefinition' && k === 'key' && !node.computed) ||
      (node.type === 'PropertyDefinition' && k === 'key' && !node.computed) ||
      (node.type === 'VariableDeclarator' && k === 'id') ||
      (node.type === 'LabeledStatement' && k === 'label') ||
      (node.type === 'BreakStatement' || node.type === 'ContinueStatement') ||
      (FN.has(node.type) && (k === 'params' || k === 'id')) ||
      (node.type === 'CatchClause' && k === 'param') ||
      ((node.type === 'ClassDeclaration' || node.type === 'ClassExpression') && k === 'id');

    const visit = (child) => {
      if (!child || typeof child !== 'object') return;
      if (skip) return;
      if (child.type === 'Identifier') {
        if (!resolved(child.name)) {
          problems.push(`${child.name}: read at line ${child.loc.start.line}, resolves to no binding in any enclosing scope`);
        }
        return;
      }
      scan(child, scope);
    };

    if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v.type === 'string') visit(v);
  }
}

scan(ast, []);
const uniq = [...new Set(problems)];
console.log(uniq.length
  ? `✗ ${file}: ${uniq.length} identifier(s) resolve to nothing — each throws ReferenceError the moment its branch runs:\n` + uniq.join('\n')
  : `✓ ${file}: every identifier resolves to a real binding — no name copied out of a scope it belonged to`);
process.exit(uniq.length ? 1 : 0);
