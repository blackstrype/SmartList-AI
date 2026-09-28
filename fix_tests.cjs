const fs = require('fs');

let content = fs.readFileSync('src/__tests__/App.test.jsx', 'utf-8');

// replace Date.now() with getCurrentAppTime() and import it
if (!content.includes('import { getCurrentAppTime } from \'../utils/timeProvider\';')) {
  content = content.replace("import App from '../App';", "import App from '../App';\nimport { getCurrentAppTime } from '../utils/timeProvider';");
}

content = content.replace(/createdAt: Date\.now\(\)/g, "createdAt: getCurrentAppTime()");

fs.writeFileSync('src/__tests__/App.test.jsx', content);
