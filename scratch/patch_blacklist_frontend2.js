const fs = require('fs');
const file = 'x:/app/frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<tr key=\{u\.user_id \|\| u\.id\}>/g, "<tr key={`${u.source}-${u.user_id || u.id}`}>");

const restoreBtnStart = content.indexOf('<button className="btn btn-accent" style={{ padding: \\'0.25rem 0.5rem\\', fontSize: \\'0.75rem\\' }} onClick={() => {\\n                                      triggerConfirmModal(\\n                                        t(\\'Restore Account?\\'');

if (restoreBtnStart !== -1) {
    const endStr = '}}>\\n                                      Restore Account\\n                                    </button>';
    const restoreBtnEnd = content.indexOf(endStr, restoreBtnStart);
    if (restoreBtnEnd !== -1) {
        const replacement = '<button className="btn btn-accent" style={{ padding: \\'0.25rem 0.5rem\\', fontSize: \\'0.75rem\\' }} onClick={() => handleRestoreAccount(u)}>\\n                                      Restore Account\\n                                    </button>';
        content = content.substring(0, restoreBtnStart) + replacement + content.substring(restoreBtnEnd + endStr.length);
        console.log('Button replaced successfully');
    } else {
        console.log('Button end not found');
    }
} else {
    console.log('Button start not found');
}

fs.writeFileSync(file, content);
console.log('Script done');
