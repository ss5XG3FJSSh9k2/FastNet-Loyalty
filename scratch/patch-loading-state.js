const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Patch the getting started checklist:
const checklistTarget = `                const allComplete = step1Done && step2Done && step3Done && step4Done;
                if (allComplete) return null;`;
const checklistReplacement = `                if (!dbState) return null;
                const allComplete = step1Done && step2Done && step3Done && step4Done;
                if (allComplete) return null;`;

// Patch the stockist list empty check:
const listTarget = `                          if (filteredList.length === 0) {
                            return (
                              <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                  {adminStockistSearchField === 'KYC_ID' ? (
                                    "No stockist found with that ID number."
                                  ) : (
                                    adminIncludeInactiveStockists ? (
                                      "No stockists match your search."
                                    ) : (
                                      <span>
                                        No approved stockists match. Try <button className="btn-link" style={{ padding: 0, border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setAdminIncludeInactiveStockists(true)}>Show Inactive</button>, or check <button className="btn-link" style={{ padding: 0, border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setAdminTab('blacklist')}>Blacklisted & Rejected</button>.
                                      </span>
                                    )
                                  )}
                                </td>
                              </tr>
                            );
                          }`;

const listReplacement = `                          if (!dbState) {
                            return (
                              <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                  Loading stockists...
                                </td>
                              </tr>
                            );
                          }
                          if (filteredList.length === 0) {
                            return (
                              <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                  {adminStockistSearchField === 'KYC_ID' ? (
                                    "No stockist found with that ID number."
                                  ) : (
                                    adminIncludeInactiveStockists ? (
                                      "No stockists match your search."
                                    ) : (
                                      <span>
                                        No approved stockists match. Try <button className="btn-link" style={{ padding: 0, border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setAdminIncludeInactiveStockists(true)}>Show Inactive</button>, or check <button className="btn-link" style={{ padding: 0, border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setAdminTab('blacklist')}>Blacklisted & Rejected</button>.
                                      </span>
                                    )
                                  )}
                                </td>
                              </tr>
                            );
                          }`;

let updated = false;

// Apply checklist patch
if (code.includes(checklistTarget)) {
  code = code.replace(checklistTarget, checklistReplacement);
  updated = true;
} else if (code.includes(checklistTarget.replace(/\n/g, '\r\n'))) {
  code = code.replace(checklistTarget.replace(/\n/g, '\r\n'), checklistReplacement.replace(/\n/g, '\r\n'));
  updated = true;
} else {
  console.log("Could not find checklist block");
}

// Apply list patch
if (code.includes(listTarget)) {
  code = code.replace(listTarget, listReplacement);
  updated = true;
} else if (code.includes(listTarget.replace(/\n/g, '\r\n'))) {
  code = code.replace(listTarget.replace(/\n/g, '\r\n'), listReplacement.replace(/\n/g, '\r\n'));
  updated = true;
} else {
  console.log("Could not find list block");
}

if (updated) {
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log("Updated loading states successfully!");
}
