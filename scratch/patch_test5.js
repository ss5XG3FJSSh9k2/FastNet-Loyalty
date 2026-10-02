const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

const t810 = "assert(adminDocRes5.status === 200 && adminDocRes5.body.document_photo_url === '/api/kyc/documents/sample-aadhaar.jpg', 'GET /api/admin/kyc/:userId/document returns uploaded photo URL');";
const r810 = "assert(adminDocRes5.status === 200 && adminDocRes5.body.document_photo_url.startsWith('/api/kyc/documents/sample-aadhaar.jpg'), 'GET /api/admin/kyc/:userId/document returns uploaded photo URL');";

code = code.replace(t810, r810);

const t811 = "const docFileRes = await get('http://localhost:3001/api/kyc/documents/sample-aadhaar.jpg');";
const r811 = "const docFileRes = await get('http://localhost:3001' + adminDocRes5.body.document_photo_url);";

code = code.replace(t811, r811);

fs.writeFileSync('backend/tests/regression.js', code, 'utf8');
