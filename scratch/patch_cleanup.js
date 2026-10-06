const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace(/const \[showRemoveOverrideConfirmModal, setShowRemoveOverrideConfirmModal\] = useState\(false\);\n/g, '');
code = code.replace(/const \[overrideToDelete, setOverrideToDelete\] = useState\(null\);\n/g, '');
code = code.replace(/setOverrideToDelete\(null\);\n/g, '');
code = code.replace(/setShowRemoveOverrideConfirmModal\(false\);\n/g, '');

fs.writeFileSync('frontend/src/App.jsx', code);
