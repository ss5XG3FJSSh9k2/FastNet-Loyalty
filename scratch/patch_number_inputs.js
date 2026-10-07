const fs = require('fs');
const path = require('path');
const file = path.join('x:/app/frontend/src/App.jsx');
let content = fs.readFileSync(file, 'utf8');

const onKeyInt = `onKeyDown={e => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}`;
const onKeyFloat = `onKeyDown={e => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}`;

const replacements = [
  // 1. pkgFaceValue
  {
    search: '<input type="number" inputMode="decimal" className="text-input" value={pkgFaceValue}',
    replace: `<input type="number" inputMode="numeric" min="1" max="100000" step="1" ${onKeyInt} className="text-input" value={pkgFaceValue}`
  },
  // 2. pkgCostToPartner
  {
    search: '<input type="number" inputMode="decimal" className="text-input" value={pkgCostToPartner}',
    replace: `<input type="number" inputMode="numeric" min="0" max="100000" step="1" ${onKeyInt} className="text-input" value={pkgCostToPartner}`
  },
  // 3. pkgPointCost
  {
    search: '<input type="number" inputMode="decimal" className="text-input" value={pkgPointCost}',
    replace: `<input type="number" inputMode="numeric" min="1" max="100000" step="1" ${onKeyInt} className="text-input" value={pkgPointCost}`
  },
  // 4. pkgDurationDays
  {
    search: '<input\n                        type="number"\n                        className="text-input"\n                        style={{ width: \'90px\' }}\n                        min="1" max="3650"',
    replace: `<input\n                        type="number"\n                        className="text-input"\n                        style={{ width: '90px' }}\n                        min="1" max="3650" step="1" ${onKeyInt}`
  },
  // 5. newProdPrice
  {
    search: '<input type="number" inputMode="decimal" className="text-input" \nvalue={newProdPrice}',
    replace: `<input type="number" inputMode="numeric" min="1" max="100000" step="1" ${onKeyInt} className="text-input" \nvalue={newProdPrice}`
  },
  // 6. newProdCostPrice
  {
    search: '<input type="number" inputMode="decimal" className="text-input" \nvalue={newProdCostPrice}',
    replace: `<input type="number" inputMode="numeric" min="0" max="100000" step="1" ${onKeyInt} className="text-input" \nvalue={newProdCostPrice}`
  },
  // 7. newProdInitialStock
  {
    search: '<input type="number" inputMode="decimal" className="text-input" \nvalue={newProdInitialStock}',
    replace: `<input type="number" inputMode="numeric" min="0" max="100000" step="1" ${onKeyInt} className="text-input" \nvalue={newProdInitialStock}`
  },
  // 8. editProdPrice
  {
    search: '<input type="number" inputMode="decimal" className="text-input" \nvalue={editProdPrice}',
    replace: `<input type="number" inputMode="numeric" min="1" max="100000" step="1" ${onKeyInt} className="text-input" \nvalue={editProdPrice}`
  },
  // 9. editProdCostPrice
  {
    search: '<input type="number" inputMode="decimal" className="text-input" \nvalue={editProdCostPrice}',
    replace: `<input type="number" inputMode="numeric" min="0" max="100000" step="1" ${onKeyInt} className="text-input" \nvalue={editProdCostPrice}`
  },
  // 10. reward_point_cost
  {
    search: 'type="number" \n                        id="reward_point_cost"\n                        className="text-input" \n                        name="point_cost" \n                        inputMode="numeric"\n                        min="1"\n                        step="1"\n                        defaultValue={editingGenericReward?.point_cost}',
    replace: `type="number" \n                        id="reward_point_cost"\n                        className="text-input" \n                        name="point_cost" \n                        inputMode="numeric"\n                        min="1"\n                        max="100000"\n                        step="1"\n                        ${onKeyInt}\n                        defaultValue={editingGenericReward?.point_cost}`
  },
  // 11. reward_value_rupees
  {
    search: 'type="number" \n                        id="reward_value_rupees"\n                        className="text-input" \n                        name="value_rupees" \n                        inputMode="decimal"\n                        min="0"\n                        step="0.01"\n                        defaultValue={editingGenericReward?.value_rupees}',
    replace: `type="number" \n                        id="reward_value_rupees"\n                        className="text-input" \n                        name="value_rupees" \n                        inputMode="decimal"\n                        min="0"\n                        max="100000"\n                        step="0.01"\n                        ${onKeyFloat}\n                        defaultValue={editingGenericReward?.value_rupees}`
  },
  // 12. reward_min_order_value
  {
    search: 'type="number" \n                        id="reward_min_order_value"\n                        name="min_order_value"\n                        className="text-input"\n                        style={{ paddingLeft: \'1.8rem\' }}\n                        defaultValue={editingGenericReward ? editingGenericReward.min_order_value : \'\'}\n                        step="1"\n                        min="0"',
    replace: `type="number" \n                        id="reward_min_order_value"\n                        name="min_order_value"\n                        className="text-input"\n                        style={{ paddingLeft: '1.8rem' }}\n                        defaultValue={editingGenericReward ? editingGenericReward.min_order_value : ''}\n                        step="1"\n                        min="0"\n                        max="100000"\n                        ${onKeyInt}`
  },
  // 13. reward_cooldown_days
  {
    search: '<input\n                          type="number"\n                          className="text-input"\n                          style={{ width: \'90px\' }}\n                          min="1" max="3650"',
    replace: `<input\n                          type="number"\n                          className="text-input"\n                          style={{ width: '90px' }}\n                          min="1" max="3650" step="1" ${onKeyInt}`
  },
  // 14. regionDeliveryFee
  {
    search: 'type="number"\n                  min="0"\n                  step="0.01"\n                  inputMode="decimal"\n                  className="text-input"\n                  placeholder="e.g. 40, leave empty if disabled"\n                  value={regionDeliveryFee}',
    replace: `type="number"\n                  min="0"\n                  max="500"\n                  step="0.01"\n                  inputMode="decimal"\n                  ${onKeyFloat}\n                  className="text-input"\n                  placeholder="e.g. 40, leave empty if disabled"\n                  value={regionDeliveryFee}`
  },
  // 15. pointsCreditAmount
  {
    search: '<input type="number" inputMode="decimal" className="text-input" placeholder="100" value={pointsCreditAmount}',
    replace: `<input type="number" inputMode="numeric" min="1" max="1000" step="1" ${onKeyInt} className="text-input" placeholder="100" value={pointsCreditAmount}`
  }
];

let ok = true;
for (const r of replacements) {
  // normalize newlines for search
  const normalizedSearch = r.search.replace(/\\r\\n/g, '\\n');
  const normalizedContent = content.replace(/\\r\\n/g, '\\n');
  if (normalizedContent.includes(normalizedSearch)) {
    content = normalizedContent.replace(normalizedSearch, r.replace);
  } else {
    console.log("NOT FOUND:", r.search);
    ok = false;
  }
}

if (ok) {
  fs.writeFileSync(file, content);
  console.log("Replaced 15 number inputs");
}
