import fs from 'fs';

fetch("http://localhost:5002/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "test", email: "test1@test.com", password: "123" }) })
    .then(res => res.json().then(data => ({ status: res.status, data })))
    .then(data => fs.writeFileSync('test-out.log', JSON.stringify(data, null, 2)))
    .catch(err => fs.writeFileSync('test-out.log', String(err)));
