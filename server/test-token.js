const axios = require('axios');

async function testToken() {
    try {
        console.log("Sending POST to /api/interview/generate...");
        const response = await axios.post('http://localhost:5001/api/interview/generate',
            { role: "Swe", experienceLevel: "Junior" },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer INVALID_OR_DUMMY_TOKEN`
                }
            }
        );
        console.log("Response Data:", response.data);
    } catch (e) {
        console.error("Axios Error:", e.response ? e.response.data : e.message);
    }
}

testToken();
