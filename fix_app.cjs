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
    content = content.replace(/const handleTimeTravel = async \(days\) => \{\n\s*const newShift = timeShiftDays \+ days;\n\s*setTimeShiftDays\(newShift\);\n\n\s*const batch = writeBatch\(db\);\n\s*let updatedCount = 0;\n\n\s*items.forEach\(item => \{\n\s*if \(item.intervalDays > 0\) \{\n\s*const msSinceLast = Date.now\(\) \+ \(newShift \* 24 \* 60 \* 60 \* 1000\) - item.lastAdded;\n\s*const daysSinceLast = msSinceLast \/ \(24 \* 60 \* 60 \* 1000\);\n\n\s*if \(daysSinceLast >= item.intervalDays && item.checked\) \{\n\s*updatedCount\+\+;\n\s*const docRef = doc\(db, "items", item.id\);\n\s*batch.update\(docRef, \{\n\s*checked: false, \/\/ Automatically put back in action\n\s*lastAdded: Date.now\(\) \+ \(newShift \* 24 \* 60 \* 60 \* 1000\), \/\/ Reset clock\n\s*autoAdded: true, \/\/ Tag it visually\n\s*frequencyCount: item.frequencyCount \+ 1\n\s*\}\);\n\s*\}\n\s*\}\n\s*\}\);/g, `const handleTimeTravel = async (days) => {
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

updateFile('src/App.jsx');
updateFile('src/App-smart.jsx');

let sandboxHeaderContent = fs.readFileSync('src/components/SandboxHeader.jsx', 'utf-8');
sandboxHeaderContent = sandboxHeaderContent.replace(/timeShiftDays/g, "uiTimeShift");
sandboxHeaderContent = sandboxHeaderContent.replace(/setTimeShiftDays/g, "setUiTimeShift");
// replace inner logic for setTimeShiftDays(0) -> setGlobalTimeShift(0); setUiTimeShift(0)
sandboxHeaderContent = sandboxHeaderContent.replace("onClick={() => setUiTimeShift(0)}", "onClick={() => {\n          import('../utils/timeProvider').then(m => {\n            m.setGlobalTimeShift(0);\n            setUiTimeShift(0);\n          });\n        }}");

fs.writeFileSync('src/components/SandboxHeader.jsx', sandboxHeaderContent);
