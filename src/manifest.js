// ═══ THE LOAD ORDER — src/ is an org chart, and this is the order the departments are read ═══
// Goal: after reading this file, Claude can name the order build.js joins the source files
// into server.js, and knows that moving an entry is a code change, never a tidy-up.
//
// Folders under src/ are departments (plain-English names: front-desk, finding-businesses,
// reading-people, the-audit, the-email, inspection, ...). Each file in them is one job with a
// Goal line. This list is the ONLY thing that decides the order those files are joined:
// build.js reads them top to bottom, turns each file's LF into CRLF, and concatenates them
// with no separator, so the built server.js is one module scope in exactly this order.
//
// Reordering is a code change. Boot checks assert orderings across the built file (ACCESS
// CHECK: the JSON body parser must be registered before serverKeyGate); tdz.js refuses any
// `const` read before its declaration on the same execution path; a `const` read only inside
// functions (the harm-ladder table, HARM_LADDER) passes tdz.js and instead throws at boot when
// a check calls into it before the line that declares it; and a function cut into numbered
// parts does not parse unless its parts are adjacent and in sequence. Swap two lines here and
// the program changes; the gates go red; that is the point.
//
// Until Round 129 cuts the program into departments, the whole program is one file: all.js.
// Every .js file on disk under src/ (except this manifest) must appear here exactly once;
// build.js refuses a stray file, a duplicate, and an entry that does not exist.
module.exports = ['all.js'];
