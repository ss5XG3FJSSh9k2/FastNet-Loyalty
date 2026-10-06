const fs = require('fs');

let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Add adminContentRef
if (!code.includes('const adminContentRef = useRef(null);')) {
  code = code.replace(
    /const isFirstOrderLoad = useRef\(true\);/,
    "const isFirstOrderLoad = useRef(true);\n  const adminContentRef = useRef(null);"
  );
}

// 2. Add goToAdminTab
if (!code.includes('const goToAdminTab = ')) {
  const insertIndex = code.indexOf('const handleSetAdminTab = (tab) => {');
  const goToAdminTabCode = `const goToAdminTab = (tab, onOpen) => {
    const advancedTabs = ['vendors', 'regions', 'anomalies', 'audit_log', 'health'];
    if (advancedTabs.includes(tab) && typeof setShowAdvanced === 'function') {
      setShowAdvanced(true);
    }
    
    handleSetAdminTab(tab);
    if (onOpen) onOpen();
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (adminContentRef.current) {
          const rect = adminContentRef.current.getBoundingClientRect();
          if (rect.top < 0 || rect.top > window.innerHeight) {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            adminContentRef.current.scrollIntoView({
              behavior: prefersReducedMotion ? 'auto' : 'smooth',
              block: 'start'
            });
          }
        }
      }, 50);
    });
  };

  `;
  code = code.slice(0, insertIndex) + goToAdminTabCode + code.slice(insertIndex);
}

// 3. Wrap tab contents
if (!code.includes('id="admin-tab-content"')) {
  const startTarget = "{adminTab === 'analytics' && (";
  const startIdx = code.indexOf(startTarget);
  if (startIdx !== -1) {
    code = code.slice(0, startIdx) + '<div ref={adminContentRef} id="admin-tab-content">\n              ' + code.slice(startIdx);
  }
  
  // Find where renderAdminView ends. It ends at `return ( ... ); };` followed by `// 5. SYSTEM INSPECTOR`
  const systemInspectorIdx = code.indexOf('// 5. SYSTEM INSPECTOR');
  if (systemInspectorIdx !== -1) {
    const renderAdminEndIdx = code.lastIndexOf('  };', systemInspectorIdx);
    if (renderAdminEndIdx !== -1) {
      // Find the last </div> before it. Actually it's `</div></div></div></div>);`
      const retIdx = code.lastIndexOf(');', renderAdminEndIdx);
      if (retIdx !== -1) {
          const closeDivsIdx = code.lastIndexOf('</div>', retIdx);
          // Wait, there are 4 closing divs.
          // Let's just insert '</div>' exactly before `            </div>\n          </div>\n        </div>\n      </div>\n    );\n  };`
          const targetStr = "            </div>\n          </div>\n        </div>\n      </div>\n    );\n  };";
          if (code.includes(targetStr)) {
             code = code.replace(targetStr, "              </div>\n" + targetStr);
          } else {
             // Fallback
             const fallbackTarget = "  };\n\n  // ----------------------------------------------------\n  // 5. SYSTEM INSPECTOR";
             const endIdx = code.indexOf(fallbackTarget);
             // We need to inject </div> inside the return.
             // Actually, let's just search for the exact end of transactions block.
             const transactionsEnd = `                  )}
                </div>
              )}


            </div>`;
             if (code.includes(transactionsEnd)) {
                code = code.replace(transactionsEnd, transactionsEnd.replace('            </div>', '              </div>\n            </div>'));
             }
          }
      }
    }
  }
}

// 4. Update Sidebar and Checklist
// 11516
code = code.replace("onClick={() => setAdminTab('home')}", "onClick={() => goToAdminTab('home')}");
code = code.replace("onClick={() => setAdminTab('kyc')}", "onClick={() => goToAdminTab('kyc')}");
code = code.replace("onClick={() => setAdminTab('customers')}", "onClick={() => goToAdminTab('customers')}");
code = code.replace("onClick={() => setAdminTab('stockists')}", "onClick={() => goToAdminTab('stockists')}");
code = code.replace("onClick={() => { setAdminTab('redemption_approvals'); fetchRedemptionApprovals(); }}", "onClick={() => goToAdminTab('redemption_approvals', fetchRedemptionApprovals)}");
code = code.replace("onClick={() => setAdminTab('transactions')}", "onClick={() => goToAdminTab('transactions')}");
code = code.replace("onClick={() => { setAdminTab('generic_rewards'); fetchAdminGenericRewards(); }}", "onClick={() => goToAdminTab('generic_rewards', fetchAdminGenericRewards)}");

code = code.replace(
  "onClick={() => { \n                  setAdminTab('bills'); ", 
  "onClick={() => { \n                  goToAdminTab('bills'); "
);
code = code.replace("onClick={() => { handleSetAdminTab('bill_photos'); fetchAdminBillPhotos(); }}", "onClick={() => goToAdminTab('bill_photos', fetchAdminBillPhotos)}");
code = code.replace(
  "onClick={() => { \n                  setAdminTab('fraud_reports'); ", 
  "onClick={() => { \n                  goToAdminTab('fraud_reports'); "
);
code = code.replace(
  "onClick={() => { \n                  setAdminTab('blacklist'); \n                  fetchDbState();", 
  "onClick={() => { \n                  goToAdminTab('blacklist', fetchDbState); "
);
code = code.replace("onClick={() => { setAdminTab('partners'); setPartnerSubTab(unresolvedLeads.length > 0 ? 'leads' : 'onboarded'); fetchAdminPartners(); }}", "onClick={() => goToAdminTab('partners', () => { setPartnerSubTab(unresolvedLeads.length > 0 ? 'leads' : 'onboarded'); fetchAdminPartners(); })}");
code = code.replace("onClick={() => { setAdminTab('analytics'); fetchAnalytics(); localStorage.setItem('fastnet_admin_analytics_visited', 'true'); }}", "onClick={() => goToAdminTab('analytics', () => { fetchAnalytics(); localStorage.setItem('fastnet_admin_analytics_visited', 'true'); })}");
code = code.replace("onClick={() => setAdminTab('config')}", "onClick={() => goToAdminTab('config')}");
code = code.replace("onClick={() => handleSetAdminTab('feedback')}", "onClick={() => goToAdminTab('feedback')}");
code = code.replace("onClick={() => handleSetAdminTab('vendors')}", "onClick={() => goToAdminTab('vendors')}");
code = code.replace("onClick={() => { handleSetAdminTab('regions'); fetchAdminRegions(); }}", "onClick={() => goToAdminTab('regions', fetchAdminRegions)}");
code = code.replace("onClick={() => handleSetAdminTab('anomalies')}", "onClick={() => goToAdminTab('anomalies')}");
code = code.replace("onClick={() => handleSetAdminTab('audit_log')}", "onClick={() => goToAdminTab('audit_log')}");
code = code.replace("onClick={() => { handleSetAdminTab('health'); fetchHealthData(); }}", "onClick={() => goToAdminTab('health', fetchHealthData)}");

// Checklist
code = code.replace("onClick={() => { setAdminTab('regions'); fetchAdminRegions(); }}", "onClick={() => goToAdminTab('regions', fetchAdminRegions)}");
code = code.replace("onClick={step1Done ? () => setAdminTab('vendors') : undefined}", "onClick={step1Done ? () => goToAdminTab('vendors') : undefined}");
code = code.replace("onClick={step2Done ? () => { setAdminTab('kyc'); fetchDbState(); } : undefined}", "onClick={step2Done ? () => goToAdminTab('kyc', fetchDbState) : undefined}");
// Step 4 unlocking logic
if (code.includes('onClick={step3Done ? () => setAdminTab(\\\'customers\\\') : undefined}')) {
  code = code.replace("onClick={step3Done ? () => setAdminTab('customers') : undefined}", "onClick={step3Done ? () => goToAdminTab('customers') : undefined}");
} else {
  // Step 4 had no click action according to prompt: "Step 4 has no click action at all."
  // Prompt says: "Step 4: goToAdminTab('customers'). Show "Go →" when unlocked, "Locked" while step 3 isn't done."
  // Current step 4 rendering from my view_file output:
  /*
  11869:                       {/* Step 4 *\/}
  11870:                       <div 
  11871:                         style={{
  ...
  11890:                         <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
  11891:                           {step4Done ? 'Done' : (step3Done ? 'Pending' : 'Locked')}
  11892:                         </span>
  */
  // I'll regex replace step 4
  const step4Match = /{\/\* Step 4 \*\/}\s*<div\s*style={{/;
  code = code.replace(step4Match, "{/* Step 4 */}\n                      <div \n                        onClick={step3Done ? () => goToAdminTab('customers') : undefined}\n                        style={{");
  
  // replace the span text at the end of step 4
  code = code.replace(
    "<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>\n                          {step4Done ? 'Done' : (step3Done ? 'Pending' : 'Locked')}\n                        </span>",
    "<span style={{ fontSize: '0.75rem', color: step3Done ? 'var(--primary)' : 'var(--text-muted)' }}>\n                          {step4Done ? 'Done' : (step3Done ? 'Go →' : 'Locked')}\n                        </span>"
  );
  code = code.replace("opacity: step3Done ? 1 : 0.4", "opacity: step3Done ? 1 : 0.4,\n                          cursor: step3Done ? 'pointer' : 'not-allowed'");
}

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('App.jsx successfully updated');
