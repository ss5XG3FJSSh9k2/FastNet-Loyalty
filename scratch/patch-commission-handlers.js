const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const target1 = `  const handlePreviewCommissionRate = async () => {
    if (!selectedStockistDetail || !newCommissionRate) return;`;
const replacement1 = `  const handlePreviewCommissionRate = async () => {
    if (!selectedStockistDetail || newCommissionRate === '' || newCommissionRate === null || newCommissionRate === undefined) return;`;

const target2 = `  const handleSubmitCommissionRate = async () => {
    if (!selectedStockistDetail || !newCommissionRate) return;`;
const replacement2 = `  const handleSubmitCommissionRate = async () => {
    if (!selectedStockistDetail || newCommissionRate === '' || newCommissionRate === null || newCommissionRate === undefined) return;`;

if(code.includes(target1) && code.includes(target2)) {
  code = code.replace(target1, replacement1);
  code = code.replace(target2, replacement2);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log("Updated handlers");
} else {
  // Try CRLF
  const t1 = target1.replace(/\n/g, '\r\n');
  const r1 = replacement1.replace(/\n/g, '\r\n');
  const t2 = target2.replace(/\n/g, '\r\n');
  const r2 = replacement2.replace(/\n/g, '\r\n');
  if(code.includes(t1) && code.includes(t2)) {
    code = code.replace(t1, r1);
    code = code.replace(t2, r2);
    fs.writeFileSync('frontend/src/App.jsx', code);
    console.log("Updated handlers (CRLF)");
  } else {
    console.log("Could not find handlers");
  }
}
