const fs = require('fs');
const path = require('path');

const synopsisFile = 'g:\\\\idleditor\\\\src\\\\core\\\\humor\\\\synopsis.ts';
const coversDir = 'g:\\\\idleditor\\\\public\\\\covers';

if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

// Read synopsis.ts
const text = fs.readFileSync(synopsisFile, 'utf8');

// Extract titles from CURATED_SYNOPSES
const startIndex = text.indexOf('const CURATED_SYNOPSES');
const endIndex = text.indexOf('}', startIndex);
const curatedText = text.substring(startIndex, endIndex);

const regex = /^\s*'([^']+)'\s*:/gm;
let match;
const titles = [];

while ((match = regex.exec(curatedText)) !== null) {
  titles.push(match[1]);
}

console.log(`Found ${titles.length} titles in CURATED_SYNOPSES.`);

let createdCount = 0;

for (const title of titles) {
  const safeTitle = title.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
  
  const svgPath = path.join(coversDir, safeTitle + '.svg');
  const pngPath = path.join(coversDir, safeTitle + '.png');
  const jpgPath = path.join(coversDir, safeTitle + '.jpg');
  
  if (fs.existsSync(svgPath) || fs.existsSync(pngPath) || fs.existsSync(jpgPath)) {
    continue;
  }
  
  const hues = [0, 30, 60, 120, 210, 260, 300, 330];
  const hue = hues[Math.floor(Math.random() * hues.length)];
  const color1 = 'hsl(' + hue + ', 30%, 20%)';
  const color2 = 'hsl(' + ((hue + 40) % 360) + ', 40%, 10%)';
  
  let formattedTitle = '';
  if (safeTitle.length > 10) {
      const mid = Math.floor(safeTitle.length / 2);
      formattedTitle = '<tspan x="50%" dy="-15">' + safeTitle.substring(0, mid) + '</tspan>\n<tspan x="50%" dy="35">' + safeTitle.substring(mid) + '</tspan>';
  } else {
      formattedTitle = '<tspan x="50%" dy="0">' + safeTitle + '</tspan>';
  }
  
  const bgId = 'bg_' + safeTitle.replace(/\s/g, '_');
  
  const svgContent = '<?xml version="1.0" encoding="utf-8"?>\n' +
'<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">\n' +
'  <defs>\n' +
'    <linearGradient id="' + bgId + '" x1="0%" y1="0%" x2="100%" y2="100%">\n' +
'      <stop offset="0%" stop-color="' + color1 + '"/>\n' +
'      <stop offset="100%" stop-color="' + color2 + '"/>\n' +
'    </linearGradient>\n' +
'  </defs>\n' +
'  <rect width="100%" height="100%" fill="url(#' + bgId + ')"/>\n' +
'  <rect width="90%" height="94%" x="5%" y="3%" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>\n' +
'  <text x="50%" y="45%" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#e0e0e0" text-anchor="middle" dominant-baseline="middle" font-weight="bold" letter-spacing="2">\n' +
'    ' + formattedTitle + '\n' +
'  </text>\n' +
'  <text x="50%" y="90%" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="rgba(255,255,255,0.5)" text-anchor="middle" letter-spacing="4">\n' +
'    永夜出版社\n' +
'  </text>\n' +
'</svg>';

  fs.writeFileSync(svgPath, svgContent, 'utf8');
  createdCount++;
}

console.log('Generated ' + createdCount + ' missing SVG placeholders.');
