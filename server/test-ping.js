import axios from 'axios';

async function testGenerate() {
  try {
    console.log('Testing /api/interview/generate...');
    const response = await axios.post('http://localhost:5001/api/interview/generate', {
      role: 'Frontend Developer',
      experienceLevel: 'Junior',
      interviewType: 'technical',
      company: 'Google',
      language: 'JavaScript'
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // This will fail auth, but we want to see if the route is hit
        'Content-Type': 'application/json'
      }
    });
    console.log('Response:', response.data);
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
}

// Since I don't have a valid token, I'll just check if the server is responding at all
async function testPing() {
    try {
      const res = await axios.get('http://localhost:5001/api/test');
      console.log('Ping:', res.data);
    } catch (err) {
      console.error('Ping failed:', err.message);
    }
}

testPing();
