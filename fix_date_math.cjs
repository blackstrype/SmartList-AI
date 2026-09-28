const fs = require('fs');

function updateFile(filename) {
    let content = fs.readFileSync(filename, 'utf-8');

    // INITIAL_ITEMS
    content = content.replace(/Date\.now\(\) \- \(6 \* 24 \* 60 \* 60 \* 1000\)/g, "getCurrentAppTime() - (6 * 24 * 60 * 60 * 1000)");
    content = content.replace(/Date\.now\(\) \- \(4 \* 24 \* 60 \* 60 \* 1000\)/g, "getCurrentAppTime() - (4 * 24 * 60 * 60 * 1000)");
    content = content.replace(/Date\.now\(\) \- \(3 \* 24 \* 60 \* 60 \* 1000\)/g, "getCurrentAppTime() - (3 * 24 * 60 * 60 * 1000)");
    content = content.replace(/Date\.now\(\) \- \(2 \* 24 \* 60 \* 60 \* 1000\)/g, "getCurrentAppTime() - (2 * 24 * 60 * 60 * 1000)");
    content = content.replace(/Date\.now\(\) \- \(15 \* 24 \* 60 \* 60 \* 1000\)/g, "getCurrentAppTime() - (15 * 24 * 60 * 60 * 1000)");
    content = content.replace(/lastAdded: Date\.now\(\)/g, "lastAdded: getCurrentAppTime()");

    // createdAt
    content = content.replace(/itemData\.createdAt = Date\.now\(\) \- \(6 \- parseInt\(id\)\) \* 1000;/g, "itemData.createdAt = getCurrentAppTime() - (6 - parseInt(id)) * 1000;");

    // addItemDirectly
    // replace `lastAdded: Date.now() + (timeShiftDays * 24 * 60 * 60 * 1000)` with `lastAdded: getCurrentAppTime()`
    content = content.replace(/lastAdded: Date\.now\(\) \+ \(timeShiftDays \* 24 \* 60 \* 60 \* 1000\)/g, "lastAdded: getCurrentAppTime()");
    content = content.replace(/lastAdded: Date\.now\(\) \+ \(uiTimeShift \* 24 \* 60 \* 60 \* 1000\)/g, "lastAdded: getCurrentAppTime()");

    content = content.replace(/createdAt: Date\.now\(\)/g, "createdAt: getCurrentAppTime()");

    // toggleItem
    // replace `lastAdded: isChecking ? Date.now() + (timeShiftDays * 24 * 60 * 60 * 1000) : item.lastAdded`
    content = content.replace(/lastAdded: isChecking \? Date\.now\(\) \+ \(timeShiftDays \* 24 \* 60 \* 60 \* 1000\) : item\.lastAdded/g, "lastAdded: isChecking ? getCurrentAppTime() : item.lastAdded");
    content = content.replace(/lastAdded: isChecking \? Date\.now\(\) \+ \(uiTimeShift \* 24 \* 60 \* 60 \* 1000\) : item\.lastAdded/g, "lastAdded: isChecking ? getCurrentAppTime() : item.lastAdded");

    // addNotification
    content = content.replace(/const id = `\$\{Date\.now\(\)\}-\$\{Math\.random\(\)\.toString\(36\)\.slice\(2, 11\)\}`;/g, "const id = `${getCurrentAppTime()}-${Math.random().toString(36).slice(2, 11)}`;");

    // any other Date.now() in file to getCurrentAppTime()
    // It's safer to just blind replace after checking everything
    // Let's do regex search for remaining Date.now()

    fs.writeFileSync(filename, content);
}

updateFile('src/App.jsx');
updateFile('src/App-smart.jsx');

console.log("Done");
