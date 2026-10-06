const fs = require('fs');
const lines = fs.readFileSync('frontend/src/App.jsx', 'utf8').split('\n');

const findFn = name => {
  const start = lines.findIndex(l => l.includes(`const ${name} = `));
  if (start === -1) return -1;
  const end = lines.findIndex((l, i) => i > start && l.startsWith('  };'));
  return { start, end };
};

console.log('handleDeleteStockist', findFn('handleDeleteStockist'));
console.log('handleToggleStockistDeactivate', findFn('handleToggleStockistDeactivate'));
console.log('handleToggleCustomerDeactivate', findFn('handleToggleCustomerDeactivate'));
console.log('handleDeleteAdminRegion', findFn('handleDeleteAdminRegion'));
console.log('handleRemoveVendor', findFn('handleRemoveVendor'));
console.log('handleRemoveStoreOverride', findFn('handleRemoveStoreOverride'));
