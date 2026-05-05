import { spawn } from 'child_process';
import fs from 'fs';

const child = spawn('node', ['index.js'], { stdio: 'pipe' });
child.stdout.on('data', d => fs.appendFileSync('boot.log', d));
child.stderr.on('data', d => fs.appendFileSync('boot.log', d));
child.on('close', code => fs.appendFileSync('boot.log', `\nEXIT CODE: ${code}`));
