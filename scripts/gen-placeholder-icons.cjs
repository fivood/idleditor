const fs = require('fs')
function svg(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><rect width="24" height="24" rx="4" fill="${color}" opacity="0.3"/><circle cx="12" cy="12" r="6" fill="${color}" opacity="0.8"/></svg>`
}
const icons = {
  'genre/sci-fi': svg('#4fc3f7'), 'genre/mystery': svg('#c9a84c'), 'genre/suspense': svg('#cf6679'),
  'genre/social-science': svg('#a5d6a7'), 'genre/hybrid': svg('#ce93d8'), 'genre/light-novel': svg('#f48fb1'),
  'stage/reviewing': svg('#4fc3f7'), 'stage/editing': svg('#f8bbd0'), 'stage/proofing': svg('#a5d6a7'),
  'stage/cover_select': svg('#ce93d8'), 'stage/publishing': svg('#c9a84c'),
  'dept/editing': svg('#4fc3f7'), 'dept/design': svg('#ce93d8'), 'dept/marketing': svg('#c9a84c'), 'dept/rights': svg('#a5d6a7'),
  'tier/idol': svg('#ffd700'), 'tier/known': svg('#ffd700'), 'tier/signed': svg('#c9a84c'), 'tier/new': svg('#a5d6a7'),
  'trait/decisive': svg('#4fc3f7'), 'trait/meticulous': svg('#a5d6a7'), 'trait/visionary': svg('#ce93d8'),
  'misc/book': svg('#c9a84c'), 'misc/statue': svg('#c9a84c'), 'misc/cloud': svg('#4fc3f7'),
  'misc/star': svg('#ffd700'), 'misc/heart': svg('#cf6679'), 'misc/diamond': svg('#4fc3f7'), 'misc/elite': svg('#4fc3f7'),
}
let c = 0
for (const [k, v] of Object.entries(icons)) {
  fs.mkdirSync('public/icons/' + k.split('/')[0], { recursive: true })
  fs.writeFileSync('public/icons/' + k + '.svg', v)
  c++
}
console.log(c + ' icons created')
