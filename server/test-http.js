const http = require('http');
const fs = require('fs');

const data = JSON.stringify({ name: "t2", email: "t2@t.com", password: "123" });

const options = {
    hostname: 'localhost',
    port: 5002,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        fs.writeFileSync('req2.log', `Status: ${res.statusCode}\nBody: ${body}`);
    });
});

req.on('error', error => {
    fs.writeFileSync('req2.log', 'Error: ' + error.message);
});

req.write(data);
req.end();
