import fs from 'fs';
console.log('ESM works');
fs.writeFileSync('output.txt', 'ESM works');
process.exit(0);
