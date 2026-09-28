const fs = require('fs');

let content = fs.readFileSync('src/__tests__/App.test.jsx', 'utf-8');

// Mock auth inside vi.mock('../firebase')
content = content.replace("db: {},", "db: {},\n  auth: {},\n");

fs.writeFileSync('src/__tests__/App.test.jsx', content);

// Also need to mock onAuthStateChanged
let mockAuthImport = `vi.mock('firebase/auth', () => ({\n  onAuthStateChanged: vi.fn((auth, cb) => {\n    cb({ uid: 'test-user-id' });\n    return vi.fn();\n  })\n}));\n`;
if (!content.includes('vi.mock(\'firebase/auth\'')) {
    content = content.replace("describe('App', () => {", mockAuthImport + "\ndescribe('App', () => {");
    fs.writeFileSync('src/__tests__/App.test.jsx', content);
}
