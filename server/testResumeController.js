import './env.js';
import { parseResume } from './controllers/resumeController.js';

const mockReq = {
  body: {
    resume: 'JVBERi0xLjcKCjEgMCBvYmogICUKPDwKDS9UeXBlIC9DYXRhbG9nCg0vUGFnZXMgMiAwIFIKDS9PdXRsaW5lcyA0IDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKDS9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCg0vQ291bnQgMQovUmVzb3VyY2VzIDw8Ci9Qcm9jU2V0IDUgMCBSCg0vRm9udCA8PCAKCS9GMSA2IDAgUgoJPj4KCj4+Ci9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCj4+CmVuZG9iagoKMyAwIG9iago8PAoNL1R5cGUgL1BhZ2UKDS9QYXJlbnQgMiAwIFIKDS9Db250ZW50cyA3IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKDS9UeXBlIC9PdXRsaW5lcwoNL0NvdW50IDAKPj4KZW5kb2JqCgo1IDAgb2JqClsvUERGIC9UZXh0XQplbmRvYmoKCjYgMCBvYmoKPDwKDS9UeXBlIC9Gb250Cg0vU3VidHlwZSAvVHlwZTEDL05hbWUgL0YxCi9CYXNlRm9udCAvSGVsdmV0aWNhCg0vRW5jb2RpbmcgL01hY1JvbWFuRW5jb2RpbmcKPj4KZW5kb2JqCgo3IDAgb2JqCjw8Ci9MZW5ndGggOAo+PgpzdHJlYW0KQlQKCgkxMDAgMTAwIFRECiAgL0YxIDEyIFRmCgkoSGVsbG8gV29ybGQhKSBTagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgOAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTggMDAwMDAgbiAKMDAwMDAwMDA4MyAwMDAwMCBuIAowMDAwMDAwMjAyIDAwMDAwIG4gCjAwMDAwMDAyNjcgMDAwMDAgbiAKMDAwMDAwMDMzNCAwMDAwMCBuIAowMDAwMDAwMzY4IDAwMDAwIG4gCjAwMDAwMDA0ODQgMDAwMDAgbiAKdHJhaWxlcgo8PAoNL1NpemUgOAoNL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjU3NQolJUVPRgo='
  },
  user: {
    _id: '60c72b2f9b1e8a001c8e4d2a'
  }
};

const mockRes = {
  status: (code) => {
    console.log('[Mock Res] Status Called:', code);
    return mockRes;
  },
  json: (data) => {
    console.log('[Mock Res] JSON Called:', data);
  }
};

async function test() {
  console.log('--- Testing parseResume ---');
  await parseResume(mockReq, mockRes);
  console.log('--- Test Complete ---');
  process.exit(0);
}

test();
