import PDFParse from 'pdf-parse';

async function test() {
    try {
        console.log('Testing STABLE PDFParse extraction...');
        const buffer = Buffer.from('JVBERi0xLjcKCjEgMCBvYmogICUKPDwKDS9UeXBlIC9DYXRhbG9nCg0vUGFnZXMgMiAwIFIKDS9PdXRsaW5lcyA0IDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKDS9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCg0vQ291bnQgMQovUmVzb3VyY2VzIDw8Ci9Qcm9jU2V0IDUgMCBSCg0vRm9udCA8PCAKCS9GMSA2IDAgUgoJPj4KCj4+Ci9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCj4+CmVuZG9iagoKMyAwIG9iago8PAoNL1R5cGUgL1BhZ2UKDS9QYXJlbnQgMiAwIFIKDS9Db250ZW50cyA3IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKDS9UeXBlIC9PdXRsaW5lcwoNL0NvdW50IDAKPj4KZW5kb2JqCgo1IDAgb2JqClsvUERGIC9UZXh0XQplbmRvYmoKCjYgMCBvYmoKPDwKDS9UeXBlIC9Gb250Cg0vU3VidHlwZSAvVHlwZTEDL05hbWUgL0YxCi9CYXNlRm9udCAvSGVsdmV0aWNhCg0vRW5jb2RpbmcgL01hY1JvbWFuRW5jb2RpbmcKPj4KZW5kb2JqCgo3IDAgb2JqCjw8Ci9MZW5ndGggOAo+PgpzdHJlYW0KQlQKCgkxMDAgMTAwIFRECiAgL0YxIDEyIFRmCgkoSGVsbG8gV29ybGQhKSBTagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgOAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTggMDAwMDAgbiAKMDAwMDAwMDA4MyAwMDAwMCBuIAowMDAwMDAwMjAyIDAwMDAwIG4gCjAwMDAwMDAyNjcgMDAwMDAgbiAKMDAwMDAwMDMzNCAwMDAwMCBuIAowMDAwMDAwMzY4IDAwMDAwIG4gCjAwMDAwMDA0ODQgMDAwMDAgbiAKdHJhaWxlcgo8PAoNL1NpemUgOAoNL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjU3NQolJUVPRgo=', 'base64');
        
        console.log('Calling PDFParse(buffer)...');
        const data = await PDFParse(buffer);
        console.log('Successfully extracted text:', data.text);
    } catch (err) {
        console.error('Extraction Error:', err.message);
        if (err.stack) console.error(err.stack);
    }
}

test();
