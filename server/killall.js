const { execSync } = require('child_process');
['5000', '5001', '5002', '5003'].forEach(port => {
    try {
        const output = execSync('netstat -ano').toString();
        const lines = output.split('\n');
        const line = lines.find(l => l.includes(':' + port) && l.includes('LISTENING'));
        if (line) {
            const pid = line.trim().split(/\s+/).pop();
            console.log("Killing PID " + pid + " on port " + port);
            execSync('taskkill /PID ' + pid + ' /F');
        }
    } catch (e) { }
});
