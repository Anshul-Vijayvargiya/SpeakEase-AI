const fs = require('fs');

try {
    require('./index.js');
} catch (e) {
    fs.writeFileSync('init-error.txt', e.stack || e.toString());
}
