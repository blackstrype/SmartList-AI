const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf-8');
content = content.replace(/lastAdded: getCurrentAppTime\(\) \+ \(timeShiftDays \* 24 \* 60 \* 60 \* 1000\),/g, "lastAdded: getCurrentAppTime(),");
fs.writeFileSync('src/App.jsx', content);

let content2 = fs.readFileSync('src/App-smart.jsx', 'utf-8');
content2 = content2.replace(/lastAdded: getCurrentAppTime\(\) \+ \(timeShiftDays \* 24 \* 60 \* 60 \* 1000\),/g, "lastAdded: getCurrentAppTime(),");
content2 = content2.replace(/const newShift = timeShiftDays \+ days;/g, "const current = getGlobalTimeShift();\n    const newShift = current + days;");
content2 = content2.replace(/\{timeShiftDays\}/g, "{uiTimeShift}");
fs.writeFileSync('src/App-smart.jsx', content2);
