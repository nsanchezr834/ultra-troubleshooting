const fs = require('fs');
const path = require('path');

const dbContent = fs.readFileSync(path.join(process.cwd(), '../config/robots-db.ts'), 'utf8');

const robotMatches = [...dbContent.matchAll(/name:\s*'([^']+)',[\s\S]*?advises:\s*\[([\s\S]*?)\]/g)];

const newAdvises = [];

robotMatches.forEach(match => {
    const robotName = match[1];
    const advisesContent = match[2];
    
    // Some content uses backticks, some use quotes
    const adviseMatches = [...advisesContent.matchAll(/id:\s*'([^']+)',[\s\S]*?content:\s*[`']([\s\S]*?)[`']/g)];
    
    adviseMatches.forEach(adv => {
        const id = adv[1];
        const content = adv[2].replace(/\\n/g, '\n').replace(/\\'/g, "'").trim();
        
        newAdvises.push({
            id: id,
            category: `Consejos de Robot: ${robotName}`,
            symptom: `Consejo Operativo para ${robotName}`,
            keywords: `${robotName.toLowerCase()} consejo tip recomendacion operativo`,
            resolution_protocol: content,
            sop_reference: `Robot: ${robotName}`
        });
    });
});

fs.writeFileSync(path.join(process.cwd(), 'extracted_advises.json'), JSON.stringify(newAdvises, null, 2));
console.log(`Extracted ${newAdvises.length} advises.`);
