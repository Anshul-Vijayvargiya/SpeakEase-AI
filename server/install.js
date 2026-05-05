const { execSync } = require('child_process');
console.log('Installing pdf-parse...');
try {
    execSync('npm install pdf-parse --save', { stdio: 'inherit' });
    console.log('Installed successfully!');
} catch (e) {
    console.error('Error installing:', e.message);
}
