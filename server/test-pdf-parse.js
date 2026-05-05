const { PDFParse } = require('pdf-parse');

async function test() {
    try {
        console.log('Testing PDFParse v2.4.5...');
        // We need a valid PDF header at least, or it might throw InvalidPDFException
        // A minimal PDF header is %PDF-1.0
        const buffer = Buffer.from('%PDF-1.0\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 20 >>\nstream\nBT /F1 12 Tf 0 0 Td (Hello World) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000060 00000 n\n0000000116 00000 n\n0000000220 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n290\n%%EOF');
        
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        
        console.log('Successfully parsed PDF!');
        console.log('Extracted text:', result.text);
    } catch (err) {
        console.error('Error during test:', err.message);
        if (err.stack) console.error(err.stack);
    }
}

test();
