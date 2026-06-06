import { execSync } from 'child_process';
try {
    const output = execSync('netstat -ano').toString();
    const lines = output.split('\n');
    const line = lines.find(l => l.includes(':5000') && l.includes('LISTENING'));
    if (line) {
        const pid = line.trim().split(/\s+/).pop();
        console.log("Killing PID: " + pid);
        execSync(`taskkill /PID ${pid} /F`);
    } else {
        console.log("Port 5000 is clear.");
    }
} catch (e) {
    console.log(e);
}
