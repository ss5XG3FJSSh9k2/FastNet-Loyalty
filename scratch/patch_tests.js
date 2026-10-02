const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

const t = `  // Issue BF18-6b: Static route GET /api/kyc/documents/sample-aadhaar.jpg serves the file
  const docFileRes = await get('http://localhost:3001' + adminDocRes5.body.document_photo_url);
  assert(docFileRes.status === 200, 'GET /api/kyc/documents/sample-aadhaar.jpg returns 200');`;

const r = `  // Test #810: Setup sample file and fetch with signed URL token
  const testFilename = 'sample-aadhaar.jpg';
  const testFilepath = path.join(__dirname, '../uploads/kyc', testFilename);
  if (!fs.existsSync(path.dirname(testFilepath))) {
    fs.mkdirSync(path.dirname(testFilepath), { recursive: true });
  }
  fs.writeFileSync(testFilepath, 'fake-image-content');
  
  const tokenForTest = adminLoginRes.body.token; // admin token
  const docFileRes = await get('http://localhost:3001' + adminDocRes5.body.document_photo_url + '?token=' + tokenForTest);
  assert(docFileRes.status === 200, 'GET /api/kyc/documents/sample-aadhaar.jpg returns 200 with token (Test #810)');

  // Test #811: Fetch without signed token returns 401
  const docFileRes401 = await get('http://localhost:3001' + adminDocRes5.body.document_photo_url);
  assert(docFileRes401.status === 401, 'GET /api/kyc/documents/sample-aadhaar.jpg without token returns 401 (Test #811)');
`;

if (code.includes(t)) {
  fs.writeFileSync('backend/tests/regression.js', code.replace(t, r));
  console.log('PATCHED TESTS');
} else {
  console.log('NOT FOUND');
}
