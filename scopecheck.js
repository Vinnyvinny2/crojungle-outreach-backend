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

// --selftest exercises the globals lists alone. It still needs A file to parse,
// because the lists are asserted below the parse; index.html is the harmless one.
const file = (process.argv[2] && process.argv[2] !== '--selftest') ? process.argv[2] : 'index.html';
let src = fs.readFileSync(file, 'utf8');
if (file.endsWith('.html')) {
  src = [...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');
}
const ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'script', locations: true });

// ══ ONE LIST WAS SERVING TWO DIFFERENT RUNTIMES ═════════════════════════════
// This was a single generous GLOBALS set covering the browser AND Node, used for
// both index.html and server.js. So every browser global was silently legal in
// server.js — and on 2026-08-21 that let `location` through as a shorthand
// property in the research route. It threw ReferenceError on every lead, inside
// the harm ladder's try, and killed all 43 rungs for the life of that build.
// The check written to catch exactly that class reported the file clean.
//
// CLAUDE.md records the same shape twice before ("deepPain is not defined",
// "reviewPainFound is not defined"), and it is the recorded two-hand-kept-copies
// disease inverted: not two copies of one truth, but ONE copy asked to be true
// of two runtimes that disagree.
//
// Three sets now, and the file decides. A name missing from the right set is a
// false positive, which is worse than useless because it gets the check switched
// off — so each set is still deliberately generous WITHIN its runtime.
const SHARED = `
console setTimeout clearTimeout setInterval clearInterval
fetch Headers Request Response FormData URL URLSearchParams
AbortController AbortSignal Blob File Event CustomEvent EventTarget
DOMException TextEncoder TextDecoder WebSocket crypto btoa atob performance
structuredClone queueMicrotask
Object Array String Number Boolean Symbol BigInt Math JSON Date RegExp Error
TypeError RangeError SyntaxError ReferenceError EvalError URIError AggregateError
Map Set WeakMap WeakSet WeakRef FinalizationRegistry Promise Proxy Reflect Intl
parseInt parseFloat isNaN isFinite encodeURIComponent decodeURIComponent
encodeURI decodeURI globalThis undefined NaN Infinity eval
Uint8Array Int8Array Uint16Array Int16Array Uint32Array Int32Array BigInt64Array
BigUint64Array Uint8ClampedArray Float32Array Float64Array ArrayBuffer
SharedArrayBuffer DataView Atomics
arguments this super
`;

// Only in a browser. Reading any of these in server.js is a ReferenceError at
// runtime, which is the whole point of separating them.
const BROWSER_ONLY = `
React ReactDOM window document navigator location history localStorage sessionStorage
requestAnimationFrame cancelAnimationFrame FileReader Image Audio MutationObserver
DOMParser Node Element HTMLElement Text Range Selection Notification
screen frames parent top self origin isSecureContext caches indexedDB
IntersectionObserver ResizeObserver XMLHttpRequest
alert confirm prompt reportError getComputedStyle
matchMedia scrollTo scrollBy open close print
`;

// Only in Node. Reading these in index.html is equally a ReferenceError, so the
// separation has to cut both ways or half the guard is missing.
const NODE_ONLY = `
process require module exports __dirname __filename Buffer global
setImmediate clearImmediate
`;

const words = (s) => s.trim().split(/\s+/).filter(Boolean);
// .html is browser code; anything else is Node. Stated here rather than inferred
// somewhere further down, because this one line is what the whole guard rests on.
const IS_BROWSER = file.endsWith('.html');
const GLOBALS = new Set(words(SHARED).concat(words(IS_BROWSER ? BROWSER_ONLY : NODE_ONLY)));
// The names deliberately withheld from THIS file, so a report can say which
// runtime a name belongs to rather than only that it is missing.
const WRONG_RUNTIME = new Set(words(IS_BROWSER ? NODE_ONLY : BROWSER_ONLY));

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
          problems.push(WRONG_RUNTIME.has(child.name)
            ? `${child.name}: read at line ${child.loc.start.line} — that is a ${IS_BROWSER ? 'Node' : 'BROWSER'} global and this file runs in ${IS_BROWSER ? 'the browser' : 'Node'}, so it is a ReferenceError at runtime. If it is meant to be a local, it resolves to no binding in any enclosing scope.`
            : `${child.name}: read at line ${child.loc.start.line}, resolves to no binding in any enclosing scope`);
        }
        return;
      }
      scan(child, scope);
    };

    if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v.type === 'string') visit(v);
  }
}

// ══ THE LIST ITSELF IS NOW LOAD-BEARING, SO IT IS CHECKED ═══════════════════
// Splitting one globals list into three moves the failure: a name accidentally
// left in SHARED is invisible in BOTH files, which is strictly worse than the
// bug this split fixes. So the split is asserted before the scan runs, and the
// one name that actually cost 43 rungs is asserted by name.
//
// Run `node scopecheck.js --selftest` to exercise it alone; it also runs on
// every normal invocation, because a guard nobody runs is not a guard.
{
  const inShared = new Set(words(SHARED));
  const bad = [];
  for (const n of words(BROWSER_ONLY)) if (inShared.has(n)) bad.push(`${n} is in BROWSER_ONLY and also in SHARED, so it is legal in server.js again`);
  for (const n of words(NODE_ONLY)) if (inShared.has(n)) bad.push(`${n} is in NODE_ONLY and also in SHARED, so it is legal in index.html again`);
  // The specific name that killed the harm ladder on every lead of the
  // 2026-08-21 run. Named explicitly: a regression here is not hypothetical.
  if (!words(BROWSER_ONLY).includes('location')) bad.push('"location" is no longer runtime-scoped — that exact name, used as a shorthand property in server.js, killed all 43 harm-ladder rungs on every lead and this file reported the build clean');
  if (!words(NODE_ONLY).includes('require')) bad.push('"require" is no longer Node-scoped, so index.html could reference it and this check would say nothing');
  if (!words(BROWSER_ONLY).length || !words(NODE_ONLY).length) bad.push('one of the runtime lists is empty, so the split is doing nothing');
  if (bad.length) {
    console.log(`✗ scopecheck: the globals lists are wrong, so this whole check is unreliable:\n` + bad.join('\n'));
    process.exit(1);
  }
}
if (process.argv[2] === '--selftest') {
  console.log(`✓ scopecheck selftest: SHARED / BROWSER_ONLY / NODE_ONLY are disjoint, both runtime lists are populated, and "location" is browser-scoped so it can never again resolve silently inside server.js.`);
  process.exit(0);
}

scan(ast, []);
const uniq = [...new Set(problems)];
console.log(uniq.length
  ? `✗ ${file}: ${uniq.length} identifier(s) resolve to nothing — each throws ReferenceError the moment its branch runs:\n` + uniq.join('\n')
  : `✓ ${file}: every identifier resolves to a real binding — no name copied out of a scope it belonged to`);
process.exit(uniq.length ? 1 : 0);
