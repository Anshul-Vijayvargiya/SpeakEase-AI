import fs from 'fs';
process.on('uncaughtException', err => {
    fs.writeFileSync('capture.log', 'UNCAUGHT: ' + err.stack);
    process.exit(1);
});
process.on('unhandledRejection', err => {
    fs.writeFileSync('capture.log', 'REJECTION: ' + err.stack);
    process.exit(1);
});
try {
    await import('./index.js');
} catch (e) {
    fs.writeFileSync('capture.log', 'SYNC: ' + e.stack);
}
