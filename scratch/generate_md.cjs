const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), '../config/troubleshooting-db.ts');
const dbContent = fs.readFileSync(dbPath, 'utf8');

// Use regex to parse the exported array
const match = dbContent.match(/export const TROUBLESHOOTING_DATABASE[\s\S]*?=\s*(\[[\s\S]*\]);/);
let mdContent = `# Base de Conocimientos Central (Troubleshooting)

Esta es la información de nuestra base de datos local que se usa para alimentar a la IA y que ahora servirá para el **Buscador de Respaldo (Fallback)**. Las palabras clave han sido optimizadas e incluyen ahora todos los consejos operativos por robot.

| ID | Síntoma (Symptom) | Palabras Clave (Keywords) |
|---|---|---|
`;

if (match) {
    // A bit hacky but works for this specific file format without running full TS compile
    // Convert to valid JSON by replacing single quotes (if any) and fixing keys if needed,
    // Actually, since it's printed via JSON.stringify, it might just parse if we use eval (it's safe here).
    
    // For safety, let's just use regex to extract id, symptom, keywords.
    const items = [...match[1].matchAll(/\{\s*"id":\s*"([^"]+)",[\s\S]*?"symptom":\s*"([^"]+)",[\s\S]*?"keywords":\s*"([^"]+)"/g)];
    
    items.forEach(item => {
        mdContent += `| ${item[1]} | ${item[2]} | ${item[3]} |\n`;
    });
}

fs.writeFileSync(path.join(process.cwd(), 'knowledge_base.md'), mdContent);
console.log('MD generated');
