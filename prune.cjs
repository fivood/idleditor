const fs = require('fs');
let src = fs.readFileSync('src/store/actions/miscActions.ts', 'utf8');

const toRemove = ['resolveDecision', 'setPreferredGenre', 'removePreferredGenre', 'hostSalon'];

for (const key of toRemove) {
  const startRegex = new RegExp('^  ' + key + ':', 'm');
  const match = src.match(startRegex);
  if (!match) continue;
  const startIndex = match.index;
  let braces = 0;
  let inString = false;
  let stringChar = '';
  let i = startIndex;
  let started = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (!inString) {
      if (c === "'" || c === '"' || c === '`') {
        inString = true;
        stringChar = c;
      } else if (c === '{' || c === '[' || c === '(') {
        braces++;
        started = true;
      } else if (c === '}' || c === ']' || c === ')') {
        braces--;
      }
    } else {
      if (c === '\\') i++;
      else if (c === stringChar) inString = false;
    }
    if (started && braces === 0 && (c === ',' || c === '\n' || c === '\r')) {
      let j = i;
      while (j < src.length && src[j] !== '\n') j++;
      src = src.substring(0, startIndex) + src.substring(j + 1);
      break;
    }
  }
}

fs.writeFileSync('src/store/actions/miscActions.ts', src);
console.log("Pruned miscActions.ts");
