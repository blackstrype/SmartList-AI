const fs = require('fs');

let content = fs.readFileSync('src/components/SandboxHeader.jsx', 'utf-8');

if (!content.includes("import { setGlobalTimeShift } from '../utils/timeProvider';")) {
  content = content.replace("import { Play, Undo2 } from 'lucide-react';", "import { Play, Undo2 } from 'lucide-react';\nimport { setGlobalTimeShift } from '../utils/timeProvider';");
}

content = content.replace(/onClick=\{\(\) => \{\n          import\('\.\.\/utils\/timeProvider'\)\.then\(m => \{\n            m\.setGlobalTimeShift\(0\);\n            setUiTimeShift\(0\);\n          \}\);\n        \}\}/, "onClick={() => {\n          setGlobalTimeShift(0);\n          setUiTimeShift(0);\n        }}");

fs.writeFileSync('src/components/SandboxHeader.jsx', content);
