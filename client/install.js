const { execSync } = require('child_process');
console.log('Installing react-hot-toast...');
try {
    execSync('npm install react-hot-toast --save', { stdio: 'inherit' });
    console.log('Installed successfully!');
} catch (e) {
    console.error('Error installing:', e.message);
}
