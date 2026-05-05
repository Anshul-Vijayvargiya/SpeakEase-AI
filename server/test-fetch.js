async function test() {
    try {
        const r = await fetch("http://localhost:5002/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "t1", email: "t1@t.com", password: "123" })
        });
        const data = await r.json().catch(() => ({}));
        require('fs').writeFileSync('req.log', JSON.stringify({ status: r.status, data }, null, 2));
    } catch (e) {
        require('fs').writeFileSync('req.log', e.stack);
    }
}
test();
