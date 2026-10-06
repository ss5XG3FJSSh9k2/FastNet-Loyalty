const fs = require('fs');
let code = fs.readFileSync('scratch/test_bf_error.js', 'utf8');
code = code.replace(/if \(loginText\.includes\('Enter your mobile number'\) \|\| loginText\.includes\('Continue with Phone'\)\)/, "if (loginText.includes('Customer Login') || loginText.includes('Login'))");
fs.writeFileSync('scratch/test_bf_error.js', code);
