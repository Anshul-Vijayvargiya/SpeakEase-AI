import fs from 'fs';

try {
    await import('./index.js');
} catch (e) {
    fs.writeFileSync('init-error.txt', e.stack || e.toString());
}
