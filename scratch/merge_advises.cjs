const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), '../config/troubleshooting-db.ts');
let dbContent = fs.readFileSync(dbPath, 'utf8');

const extractedAdvises = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'extracted_advises.json'), 'utf8'));

// Find where the array ends (];)
const endMatch = dbContent.lastIndexOf('];');

if (endMatch !== -1) {
    let newItemsStr = extractedAdvises.map(adv => `  ${JSON.stringify(adv, null, 4).replace(/\\n/g, '\\n')}`).join(',\n');
    
    // Insert them
    dbContent = dbContent.slice(0, endMatch) + ',\n' + newItemsStr + '\n];';
    fs.writeFileSync(dbPath, dbContent);
    console.log('Appended to troubleshooting-db.ts');
}
