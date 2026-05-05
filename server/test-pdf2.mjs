import * as pdf from 'pdf-parse';
import fs from 'fs';

try {
  const keys = Object.keys(pdf);
  fs.writeFileSync('pdf-out.json', JSON.stringify(keys));
} catch(e) {
  fs.writeFileSync('pdf-out.json', JSON.stringify({ error: e.message }));
}
