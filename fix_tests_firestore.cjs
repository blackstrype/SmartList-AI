const fs = require('fs');

let content = fs.readFileSync('src/__tests__/App.test.jsx', 'utf-8');

// Mock query and where
content = content.replace("writeBatch: vi.fn(),", "writeBatch: vi.fn(),\n  query: vi.fn(),\n  where: vi.fn(),");

fs.writeFileSync('src/__tests__/App.test.jsx', content);
