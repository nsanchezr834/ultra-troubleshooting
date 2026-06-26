import { createClient } from '@supabase/supabase-js';
import { TROUBLESHOOTING_DATABASE } from '../config/troubleshooting-db';
import * as fs from 'fs';
import * as path from 'path';

// ── Cargar variables de entorno de .env.local ──
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    const parts = trimmedLine.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY no encontrada.');
  process.exit(1);
}

const catalogList = TROUBLESHOOTING_DATABASE.map(t => t.symptom);
const symptom = "no job available";

const prompt = `Actúas como un validador semántico determinista de fallas para celdas robóticas industriales.
Tu única tarea es recibir una frase de un operario y relacionarla con síntomas exactos del catálogo provisto.

REGLAS DE EMPAREJAMIENTO CRÍTICAS:
1. NO ALUCINES NI INFUTAS. Si el operario menciona un componente, pieza o acción que NO tiene una relación directa, causal y unívoca con los síntomas del catálogo, NO debes hacer match.
2. IGNORA PALABRAS GENÉRICAS. Frases que usen verbos como "funciona", "falla", "ayuda", "máquina" o "sistema" pero se refieran a objetos ajenos al catálogo (ej: "pedales", "perro", "silla") NO deben emparejarse con ninguna falla existente. Es preferible devolver un array vacío antes que un falso positivo.
3. El match debe basarse en la coincidencia del componente clave afectado (ej. Bagger, Etiqueta/Printer, Brazos/Robot, Gripper, Contenedor/Bin, Cámaras, Conectividad/Red/Latencia, Productos/Lotes/Trabajo). Si el síntoma del operario describe algo completamente fuera de esta lista, descártalo inmediatamente.
4. TRADUCCIÓN Y SINÓNIMOS LOGÍSTICOS: Identifica y traduce términos comunes de almacén en inglés o tecnicismos industriales (ej: "no job available" o "no active batch" equivalen semánticamente a "Falta de productos en la zona de alimentación (Out of Product)", "bag jam" equivale a "Bolsa atascada en Bagger", "bad seal" a "Bolsa arrugada, quemada o mal sellada") y realiza la coincidencia con el síntoma en español correspondiente.

EJEMPLOS DE ENTRENAMIENTO (FEW-SHOT):
- Operario: "mis pedales no funcionan" -> Catálogo contiene fallas de brazos, grippers, bagger, etc. Ninguno menciona pedales ni se relaciona con la operación de la celda. -> {"coincidencias": []}
- Operario: "no job available" -> Equivale a sin lote cargado en el sistema, lo cual corresponde a "Falta de productos en la zona de alimentación (Out of Product) - Global". -> {"coincidencias": ["Falta de productos en la zona de alimentación (Out of Product) - Global"]}
- Operario: "la impresora no saca la etiqueta" -> Coincidencia exacta de componente (etiqueta/impresora). -> {"coincidencias": ["Qué hacer en caso de que no imprima la etiqueta (Bagger / Impresora Integrada)", "Qué hacer en caso de que la impresora de etiquetas (pegado manual) no saque la etiqueta"]}
- Operario: "brazo congelado" -> Coincidencia directa de componente (brazos). -> {"coincidencias": ["Falla de brazos: Uno o ambos brazos del robot se quedan congelados, no responden a comandos o se mueven de forma errática."]}

Catálogo de fallas válidas (Títulos Exactos):
${JSON.stringify(catalogList, null, 2)}

Descripción del operario a analizar: "${symptom}"

INSTRUCCIÓN CRÍTICA DE FORMATO:
Responde única y exclusivamente en formato JSON estructurado sin formato markdown (sin bloques de código \`\`\`json) siguiendo este esquema exacto:
{
  "coincidencias": ["Título exacto 1", "Título exacto 2"]
}
Si no encuentras ninguna coincidencia estricta y segura, devuelve el array vacío: {"coincidencias": []}.`;

async function run() {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          contents: [{
              parts: [{ text: prompt }]
          }],
          generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.0
          }
      })
  });

  const resData = await response.json();
  const textResponse = resData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  console.log('Gemini raw output:', textResponse);
}

run();
