const fs = require('fs');
const src = fs.readFileSync('temp_utf8_gameStore.ts', 'utf8');

const startIndex = src.indexOf('  onCountSceneChoice: (choiceIndex: number) => {');
const endIndex = src.indexOf('  syncToCloud: async () => {');

if (startIndex === -1 || endIndex === -1) {
  console.log("Not found", startIndex, endIndex);
  process.exit(1);
}

const missingCode = src.substring(startIndex, endIndex);
fs.writeFileSync('missing_actions.ts', missingCode);
console.log("Extracted missing actions to missing_actions.ts");
