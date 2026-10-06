const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const regex = /                  \)}\n                <\/div>\n              \)}\n\n\n            <\/div>\n          <\/div>\n        <\/div>\n      <\/div>\n    \);\n  \};/g;

if (regex.test(code)) {
  code = code.replace(regex, `                  )}
                </div>
              )}

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };`);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log("Fixed unclosed div!");
} else {
  console.log("Could not find the target string!");
}
