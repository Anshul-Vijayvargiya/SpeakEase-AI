require('dotenv').config();
const { parseResume } = require('./controllers/resumeController');

async function testFallback() {
    console.log("Starting fallback test...");
    
    // Mock the Express req and res objects
    const req = {
        file: {
            buffer: Buffer.from('%PDF-1.0\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 20 >>\nstream\nBT /F1 12 Tf 0 0 Td (Software Engineer with Python and React skills.) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000060 00000 n\n0000000116 00000 n\n0000000220 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n341\n%%EOF')
        },
        user: { _id: 'testuser123' } // Optional, mock user
    };
    
    const res = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            console.log(`Response Status: ${this.statusCode}`);
            console.log("Response Data:", JSON.stringify(data, null, 2));
        }
    };
    
    // Execute the controller
    await parseResume(req, res);
}

// User mock override
const User = require('./models/User');
User.findByIdAndUpdate = async (id, data) => {
    console.log(`Mock DB Update for User ${id}:`, data);
};

testFallback();
