const fs = require('fs');

const oldSrc = fs.readFileSync('temp_utf8_gameStore.ts', 'utf8');
const newSrc = fs.readFileSync('src/store/gameStore.ts', 'utf8');

const oldStoreMatch = oldSrc.match(/export const useGameStore = create<GameStore>\(\)\(immer\(\(set, get\) => \(\{[\r\n]+([\s\S]+?)\}\)\)\)/);
const newStoreMatch = newSrc.match(/export const useGameStore = create<GameStore>\(\)\(immer\(\(set, get\) => \(\{[\r\n]+([\s\S]+?)\}\)\)\)/);

const oldBody = oldStoreMatch ? oldStoreMatch[1] : '';
const newBody = newStoreMatch ? newStoreMatch[1] : '';

const keysOld = [...oldBody.matchAll(/^  ([a-zA-Z0-9_]+):/gm)].map(m => m[1]);
const keysNew = [...newBody.matchAll(/^  ([a-zA-Z0-9_]+):/gm)].map(m => m[1]);

const missingKeys = keysOld.filter(k => !keysNew.includes(k) && typeof k === 'string');
console.log("Missing keys count:", missingKeys.length);

function extractKeyBlock(src, key) {
  const startRegex = new RegExp('^  ' + key + ':', 'm');
  const match = src.match(startRegex);
  if (!match) return null;
  const startIndex = match.index;
  let braces = 0;
  let inString = false;
  let stringChar = '';
  let i = startIndex;
  let started = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (!inString) {
      if (c === "'" || c === '"' || c === '\') {
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
      // Find the end of the line
      let j = i;
      while (j < src.length && (src[j] !== '\n')) j++;
      return src.substring(startIndex, j + 1);
    }
  }
  return src.substring(startIndex, i); // fallback
}

let out = '';
for (const key of missingKeys) {
   const block = extractKeyBlock(oldBody, key);
   if (block) out += '\n  // --- ' + key + ' ---\n' + block.trim() + ',\n';
}

fs.writeFileSync('missing_actions.ts', out);
console.log("Done");
