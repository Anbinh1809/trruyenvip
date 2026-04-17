const fs = require('fs');

const testFile = 'src/app/layout.js';
const buffer = fs.readFileSync(testFile);
const content = buffer.toString('utf8');

console.log('Original (UTF-8 interpret):', content.substring(content.indexOf('title:') + 7, content.indexOf('",', content.indexOf('title:'))));

// Try to repair by re-interpreting
const repaired = Buffer.from(content, 'latin1').toString('utf8');
console.log('Repaired (Latin1 -> UTF-8):', repaired.substring(repaired.indexOf('title:') + 7, repaired.indexOf('",', repaired.indexOf('title:'))));
