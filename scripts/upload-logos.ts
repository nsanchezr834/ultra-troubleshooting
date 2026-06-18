/**
 * UPLOAD LOGOS — Ultra Platform / Remotics
 * -----------------------------------------
 * Sube los logos desde /public/ al bucket "logos" de Supabase Storage
 * y actualiza logo_url en la tabla clients.
 *
 * USO:
 *   npx tsx scripts/upload-logos.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET = 'logos';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

// ── Mapa: archivo en /public → client_id en Supabase ─────────────────────────
const LOGO_MAP: Record<string, string> = {
    'highline_logo.png': 'highline-commerce',
    'manifest_logo.png': 'manifest.eco',
    'mountainy_logo.png': 'mountainy',
    'outerspace_logo.png': 'outerspace',
    'ultra_logo.png': 'internal',
};

async function uploadLogos() {
    console.log('\n🚀  Upload Logos — Ultra Platform\n');

    for (const [filename, clientId] of Object.entries(LOGO_MAP)) {
        const filePath = path.join(PUBLIC_DIR, filename);

        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️   No encontrado: ${filename} — saltando`);
            continue;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentType = ext === '.png' ? 'image/png'
            : ext === '.svg' ? 'image/svg+xml'
                : ext === '.webp' ? 'image/webp'
                    : 'image/jpeg';

        const storagePath = `${clientId}${ext}`;

        console.log(`⬆️   ${filename} → bucket/${storagePath}`);

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, fileBuffer, { contentType, upsert: true });

        if (uploadError) {
            console.error(`   ❌ Error subiendo ${filename}:`, uploadError.message);
            continue;
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(storagePath);

        const { error: updateError } = await supabase
            .from('clients')
            .update({ logo_url: urlData.publicUrl })
            .eq('id', clientId);

        if (updateError) {
            console.error(`   ❌ Error actualizando clients para ${clientId}:`, updateError.message);
        } else {
            console.log(`   ✅ ${clientId} → ${urlData.publicUrl}`);
        }
    }

    console.log('\n🎉  Upload de logos completado.\n');
}

uploadLogos().catch(err => {
    console.error('❌ Error inesperado:', err);
    process.exit(1);
});