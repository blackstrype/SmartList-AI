const fs = require('fs');

function updateFile(filename) {
    let content = fs.readFileSync(filename, 'utf-8');

    // Add import
    if (!content.includes('import { getCurrentAppTime, setGlobalTimeShift, getGlobalTimeShift } from \'./utils/timeProvider\';')) {
        content = content.replace("import Footer from './components/Footer';", "import Footer from './components/Footer';\nimport { getCurrentAppTime, setGlobalTimeShift, getGlobalTimeShift } from './utils/timeProvider';");
    }

    // Replace timeShiftDays state with uiTimeShift
    content = content.replace("const [timeShiftDays, setTimeShiftDays] = useState(0); // Simulated time engine days elapsed", "const [uiTimeShift, setUiTimeShift] = useState(0); // Simulated time engine days elapsed (UI only)");

    // Update handleTimeTravel
    content = content.replace(/const handleTimeTravel = \(days\) => \{\n\s*const newShift = timeShiftDays \+ days;\n\s*setTimeShiftDays\(newShift\);\n\n\s*const batch = writeBatch\(db\);\n\s*let updatedCount = 0;\n\n\s*items.forEach\(item => \{\n\s*if \(item.intervalDays > 0\) \{\n\s*const msSinceLast = Date.now\(\) \+ \(newShift \* 24 \* 60 \* 60 \* 1000\) - item.lastAdded;\n\s*const daysSinceLast = msSinceLast \/ \(24 \* 60 \* 60 \* 1000\);\n\n\s*if \(daysSinceLast >= item.intervalDays && item.checked\) \{\n\s*updatedCount\+\+;\n\s*const docRef = doc\(db, "items", item.id\);\n\s*batch.update\(docRef, \{\n\s*checked: false, \/\/ Automatically put back in action\n\s*lastAdded: Date.now\(\) \+ \(newShift \* 24 \* 60 \* 60 \* 1000\), \/\/ Reset clock\n\s*autoAdded: true, \/\/ Tag it visually\n\s*frequencyCount: item.frequencyCount \+ 1\n\s*\}\);\n\s*\}\n\s*\}\n\s*\}\);/g, `const handleTimeTravel = (days) => {
    const current = getGlobalTimeShift();
    setGlobalTimeShift(current + days);
    setUiTimeShift(getGlobalTimeShift());

    const batch = writeBatch(db);
    let updatedCount = 0;

    items.forEach(item => {
      if (item.intervalDays > 0) {
        const msSinceLast = getCurrentAppTime() - item.lastAdded;
        const daysSinceLast = msSinceLast / (24 * 60 * 60 * 1000);

        if (daysSinceLast >= item.intervalDays && item.checked) {
          updatedCount++;
          const docRef = doc(db, "items", item.id);
          batch.update(docRef, {
            checked: false, // Automatically put back in action
            lastAdded: getCurrentAppTime(), // Reset clock
            autoAdded: true, // Tag it visually
            frequencyCount: item.frequencyCount + 1
          });
        }
      }
    });`);

    // Update JSX references to timeShiftDays to uiTimeShift
    content = content.replace(/timeShiftDays=\{timeShiftDays\}/g, "uiTimeShift={uiTimeShift}");
    content = content.replace(/setTimeShiftDays=\{setTimeShiftDays\}/g, "setUiTimeShift={setUiTimeShift}");

    fs.writeFileSync(filename, content);
}

updateFile('src/App-smart.jsx');

// fix date math on app-smart as well
let content = fs.readFileSync('src/App-smart.jsx', 'utf-8');
content = content.replace(/Date\.now\(\) \- \(6 \* 24 \* 60 \* 60 \* 1000\)/g, "getCurrentAppTime() - (6 * 24 * 60 * 60 * 1000)");
content = content.replace(/Date\.now\(\) \- \(4 \* 24 \* 60 \* 60 \* 1000\)/g, "getCurrentAppTime() - (4 * 24 * 60 * 60 * 1000)");
content = content.replace(/Date\.now\(\) \- \(3 \* 24 \* 60 \* 60 \* 1000\)/g, "getCurrentAppTime() - (3 * 24 * 60 * 60 * 1000)");
content = content.replace(/Date\.now\(\) \- \(2 \* 24 \* 60 \* 60 \* 1000\)/g, "getCurrentAppTime() - (2 * 24 * 60 * 60 * 1000)");
content = content.replace(/Date\.now\(\) \- \(15 \* 24 \* 60 \* 60 \* 1000\)/g, "getCurrentAppTime() - (15 * 24 * 60 * 60 * 1000)");
content = content.replace(/lastAdded: Date\.now\(\)/g, "lastAdded: getCurrentAppTime()");

// addItemDirectly
content = content.replace(/lastAdded: Date\.now\(\) \+ \(timeShiftDays \* 24 \* 60 \* 60 \* 1000\)/g, "lastAdded: getCurrentAppTime()");
content = content.replace(/lastAdded: Date\.now\(\) \+ \(uiTimeShift \* 24 \* 60 \* 60 \* 1000\)/g, "lastAdded: getCurrentAppTime()");
content = content.replace(/createdAt: Date\.now\(\)/g, "createdAt: getCurrentAppTime()");

// toggleItem
content = content.replace(/lastAdded: isChecking \? Date\.now\(\) \+ \(timeShiftDays \* 24 \* 60 \* 60 \* 1000\) : item\.lastAdded/g, "lastAdded: isChecking ? getCurrentAppTime() : item.lastAdded");
content = content.replace(/lastAdded: isChecking \? Date\.now\(\) \+ \(uiTimeShift \* 24 \* 60 \* 60 \* 1000\) : item\.lastAdded/g, "lastAdded: isChecking ? getCurrentAppTime() : item.lastAdded");

// addNotification
content = content.replace(/const id = `\$\{Date\.now\(\)\}-\$\{Math\.random\(\)\.toString\(36\)\.slice\(2, 11\)\}`;/g, "const id = `${getCurrentAppTime()}-${Math.random().toString(36).slice(2, 11)}`;");
content = content.replace(/id: Date.now\(\).toString\(\),/g, "id: getCurrentAppTime().toString(),");
fs.writeFileSync('src/App-smart.jsx', content);

console.log("Done");
