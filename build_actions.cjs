const fs = require('fs');

const missing = fs.readFileSync('missing_actions.ts', 'utf8');

// Helper to extract a function
function extractFn(src, key) {
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
      while (j < src.length && (src[j] !== '\n')) j++;
      return src.substring(startIndex, j + 1).trim() + ',';
    }
  }
  return src.substring(startIndex, i).trim() + ',';
}

function buildFile(name, imports, keys) {
  let content = imports + '\n\n';
  content += `export const create${name} = (set: any, get: any) => ({\n`;
  for (const key of keys) {
    const fn = extractFn(missing, key);
    if (fn) {
      // Indent properly
      const indented = fn.split('\n').map(line => '  ' + line).join('\n');
      content += indented + '\n\n';
    } else {
      console.log(`WARNING: function ${key} not found for ${name}`);
    }
  }
  content += `})\n`;
  fs.writeFileSync(`src/store/actions/${name.charAt(0).toLowerCase() + name.slice(1)}.ts`, content);
}

buildFile('AuthorActions', 
  `import { nanoid } from '@/utils/id'\nimport type { GameStore } from '../gameStore'`,
  ['signAuthor', 'terminateAuthor', 'buyAuthorMeal', 'sendAuthorGift', 'writeAuthorLetter', 'rushAuthorCooldown']
);

buildFile('DepartmentActions',
  `import { nanoid } from '@/utils/id'\nimport type { GameStore } from '../gameStore'\nimport type { Department } from '@/core/types'`,
  ['createDepartment', 'upgradeDepartment']
);

buildFile('ManuscriptActions',
  `import { nanoid } from '@/utils/id'\nimport type { GameStore } from '../gameStore'\nimport { createManuscript } from '@/core/factories/manuscriptFactory'`,
  ['startReview', 'rejectManuscript', 'shelveManuscript', 'meticulousEdit', 'confirmCover', 'getSubmittedManuscripts', 'getPublishedBooks', 'getInProgressManuscripts', 'reissueBook', 'generateEditorNote', 'updateCustomNote', 'generateLlmEditorNote', 'llmCommentary', 'generateBookReview', 'generateAuthorQuote', 'solicitFree', 'solicitTargeted', 'solicitRush']
);

buildFile('UiActions',
  `import { nanoid } from '@/utils/id'\nimport type { GameStore } from '../gameStore'\nimport { TALENTS, TALENT_UNLOCK_LEVELS } from '@/core/talents'\nimport type { CountScene } from '@/core/countStory'`,
  ['setPlayerName', 'setTrait', 'setActiveTab', 'dismissToast', 'addToast', 'setCloudSaveCode', 'upgradePublishingQuota', 'toggleAutoReview', 'toggleAutoCover', 'toggleAutoReject', 'hirePR', 'renovateReadingRoom', 'sponsorAward', 'setQualityThreshold', 'adoptCat', 'nameCat', 'petCat', 'makeCatImmortal', 'shooCat', 'onCountSceneChoice', 'onCountGenderChoice', 'dismissEnding', 'setPlayerGender', 'selectTalent', 'getTalentBonuses']
);

console.log("Built action modules");
