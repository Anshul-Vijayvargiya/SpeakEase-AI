const fs = require('fs');
try {
    const pdfParse = require('pdf-parse');
    let output = 'Type of pdfParse: ' + typeof pdfParse + '\n';
    output += 'Keys of pdfParse: ' + Object.keys(pdfParse).join(', ') + '\n';

    if (pdfParse.PDFParse) {
        output += 'Type of pdfParse.PDFParse: ' + typeof pdfParse.PDFParse + '\n';
        output += 'Is pdfParse.PDFParse a constructor? ' + (pdfParse.PDFParse.prototype ? 'Yes' : 'No') + '\n';
    }

    fs.writeFileSync('pdf-parse-inspection.txt', output);
} catch (err) {
    fs.writeFileSync('pdf-parse-inspection.txt', 'Error: ' + err.message + '\n' + err.stack);
}
