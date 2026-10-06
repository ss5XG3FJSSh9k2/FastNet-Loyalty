const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetLines = [
  "                </div>",
  "              )}",
  "",
  "",
  "            </div>",
  "          </div>",
  "        </div>",
  "      </div>",
  "    );",
  "  };"
];

const replacementLines = [
  "                </div>",
  "              )}",
  "",
  "              </div>",
  "            </div>",
  "          </div>",
  "        </div>",
  "      </div>",
  "    );",
  "  };"
];

const target = targetLines.join('\r\n');
const replacement = replacementLines.join('\r\n');

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log("Fixed unclosed div!");
} else {
  console.log("Could not find the target string!");
}
