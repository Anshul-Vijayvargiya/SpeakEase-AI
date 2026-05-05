const axios = require('axios');

async function testGenerate() {
    console.log('--- TEST SCRIPT START ---');
    try {
        console.log('Sending request to http://localhost:5001/api/interview/generate...');
        // Sending as JSON, which is what Axios does now that we removed the multipart boundary
        const response = await axios.post('http://localhost:5001/api/interview/generate', {
            role: 'Tester',
            experienceLevel: 'Junior'
        }, {
            headers: {
                'Authorization': `Bearer fake-token-for-testing`,
                'Content-Type': 'application/json'
            },
            timeout: 5000 // prevent hanging forever
        });

        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error('❌ Request Timed Out (Hanged)');
        } else {
            console.error('Error status:', error.response ? error.response.status : 'No response');
            console.error('Error data:', error.response ? error.response.data : error.message);
        }
    }
    console.log('--- TEST SCRIPT END ---');
}

testGenerate();
