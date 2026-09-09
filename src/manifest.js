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
// Reordering is a code change. Three boot checks assert byte order across the built file
// (the body parser before serverKeyGate, the harm-ladder table before the rank harms, and
// every `const` before its first use — tdz.js), and a function cut into numbered parts does
// not parse unless its parts are adjacent and in sequence. Swap two lines here and the
// program changes; the gates go red; that is the point.
//
// Until Round 129 cuts the program into departments, the whole program is one file: all.js.
// Every .js file on disk under src/ (except this manifest) must appear here exactly once;
// build.js refuses a stray file, a duplicate, and an entry that does not exist.
module.exports = ['all.js'];
