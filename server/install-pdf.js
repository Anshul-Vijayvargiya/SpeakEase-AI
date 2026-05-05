const { execSync } = require('child_process');

try {
    console.log('Installing pdf2json...');
    execSync('npm install pdf2json', { stdio: 'inherit' });
    console.log('Successfully installed pdf2json!');
} catch (error) {
    console.error('Error installing pdf2json:', error.message);
}
