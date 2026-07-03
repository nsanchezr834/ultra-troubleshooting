import * as fs from 'fs';
import * as path from 'path';

// Parse robots-db (rough extraction since we don't want to run full TS compiler just for this)
const dbContent = fs.readFileSync(path.join(__dirname, '../config/robots-db.ts'), 'utf8');

// We'll extract advises manually using regex for simplicity
const robotMatches = [...dbContent.matchAll(/name:\s*'([^']+)',[\s\S]*?advises:\s*\[([\s\S]*?)\]/g)];

const newAdvises = [];

robotMatches.forEach(match => {
    const robotName = match[1];
    const advisesContent = match[2];
    
    const adviseMatches = [...advisesContent.matchAll(/id:\s*'([^']+)',[\s\S]*?content:\s*'([^']+)'/g)];
    
    adviseMatches.forEach(adv => {
        const id = adv[1];
        const content = adv[2].replace(/\\n/g, '\n').replace(/\\'/g, "'");
        
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

fs.writeFileSync(path.join(__dirname, 'extracted_advises.json'), JSON.stringify(newAdvises, null, 2));
console.log(`Extracted ${newAdvises.length} advises.`);
