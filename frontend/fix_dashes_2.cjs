const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace('Notification permission denied — enable it in browser settings', 'Notification permission denied. Enable it in browser settings');
app = app.replace('Your session expired — please log in again.', 'Your session expired. Please log in again.');
app = app.replace('FastNet — Stockist', 'FastNet: Stockist');

app = app.replace(
  'Their account will be released rather than deleted — their history is kept',
  'Their account will be released rather than deleted. Their history is kept'
);

app = app.replace(
  'It will be marked inactive — those stockists keep their supplier',
  'It will be marked inactive. Those stockists keep their supplier'
);

// Demo list replacements
app = app.replace('Amit Sen — Customer Garia', 'Amit Sen: Customer Garia')
       .replace('Radha Roy — Customer Bishnupur', 'Radha Roy: Customer Bishnupur')
       .replace('Madan Shaw — Stockist Garia', 'Madan Shaw: Stockist Garia')
       .replace('Soumik Banerjee — Stockist Garia', 'Soumik Banerjee: Stockist Garia')
       .replace('Prabhat Sarkar — Stockist Bishnupur', 'Prabhat Sarkar: Stockist Bishnupur');

// 5362 translation misses
app = app.replace(
  `'डिलीवरी का पता (वैकल्पिक — आप इसे चेकआउट पर जोड़ सकते हैं)'`,
  `'डिलीवरी का पता (वैकल्पिक, आप इसे चेकआउट पर जोड़ सकते हैं)'`
).replace(
  `'ডেলিভারি ঠিকানা (ঐচ্ছিক — আপনি চেকআউটে এটি যোগ করতে পারেন)'`,
  `'ডেলিভারি ঠিকানা (ঐচ্ছিক, আপনি চেকআউটে এটি যোগ করতে পারেন)'`
);

// 5460 translation miss with পঞ্চাশ
app = app.replace(
  `'অনুগ্রহ করে এই বিবরণগুলি সাবধানে লিখুন। আপনি পরে নিজে এগুলি পরিবর্তন করতে পারবেন পঞ্চাশ — কোনো বিবরণ সংশোধন করতে FastNet সহায়তার সাথে যোগাযোগ করতে হবে।'`,
  `'অনুগ্রহ করে এই বিবরণগুলি সাবধানে লিখুন। আপনি পরে নিজে এগুলি পরিবর্তন করতে পারবেন না। কোনো বিবরণ সংশোধন করতে FastNet সহায়তার সাথে যোগাযোগ করতে হবে।'`
);

fs.writeFileSync('src/App.jsx', app);
