const fs = require('fs');
let content = fs.readFileSync('src/App-smart.jsx', 'utf-8');
content = content.replace(/const msSinceLast = Date.now\(\) \+ \(newShift \* 24 \* 60 \* 60 \* 1000\) - item.lastAdded;/g, "const msSinceLast = getCurrentAppTime() - item.lastAdded;");
content = content.replace(/id: Date.now\(\).toString\(\),/g, "id: getCurrentAppTime().toString(),");
fs.writeFileSync('src/App-smart.jsx', content);
