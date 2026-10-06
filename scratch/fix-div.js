const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const target = `              )}


            </div>
          </div>
        </div>
      </div>
    );
  };`;

const replacement = `              )}

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log("Fixed unclosed div!");
} else {
  console.log("Could not find the target string!");
}
