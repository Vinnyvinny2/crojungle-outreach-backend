// The lift the whole round's evidence runs on: it pulls REAL declarations out
// of src/all.js by name and evaluates them, so every file beside this one
// executes the shipped code rather than a copy of it that can rot.
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', '..', '..', 'src', 'all.js');
const lines = fs.readFileSync(SRC, 'utf8').split('\n');
const isTop = (l) => /^(const|let|var|function|async function|class|\/\/|\/\*)/.test(l);
const one = (name) => {
  const re = new RegExp('^(?:const|let|var|function|async function) ' + name + '\\b');
  let s = -1;
  for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) { s = i; break; }
  if (s < 0) throw new Error('not found in src/all.js: ' + name);
  let e = s + 1;
  while (e < lines.length && !isTop(lines[e])) e++;
  return lines.slice(s, e).join('\n');
};
module.exports = (names, ret) => new Function(names.map(one).join('\n') + '\nreturn {' + ret.join(',') + '};')();
