/**
 * fix-venus-advises.ts
 * Adds `title` column to advises table, deletes obsolete venus__4,
 * and upserts venus advises with correct titles.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

async function main() {
    console.log('\n🔧 Fix Venus Advises\n');

    // 1. Delete obsolete venus__4
    const { error: delErr } = await supabase
        .from('advises')
        .delete()
        .eq('id', 'venus__4');

    if (delErr) {
        console.error('❌ Error al borrar venus__4:', delErr.message);
    } else {
        console.log('🗑️  venus__4 eliminado (o no existía)');
    }

    // 2. Upsert venus advises with correct titles
    const venusAdvises = [
        {
            id: 'venus__1',
            robot_id: 'venus',
            advice_number: 1,
            content: 'Al iniciar la tarea si te solicita el workflow escanear el cointener se escanea el codigo de barras que se encuentra de el lado derecho de el robot a lado de donde estan los productos en un carrito.',
            is_exception: false
        },
        {
            id: 'venus__2',
            robot_id: 'venus',
            advice_number: 2,
            content: 'Para saber que tamaña de bolsa ocupar depende de el producto, productos singulares y de menor tamaño van en las bolsas de 03, si es un producto algo mas voluminoso en el 04 y si es un multiproducto ocupar la 05.',
            is_exception: false
        },
        {
            id: 'venus__3',
            robot_id: 'venus',
            advice_number: 3,
            content: 'Ocupa la tool que es la barra de color negro para aplastar la bolsa y pueda cerrar de manera mas facil. También ocupa esta misma herramienta para doblar la hoja en 4.',
            is_exception: false
        }
    ];

    const { error: upsertErr } = await supabase
        .from('advises')
        .upsert(venusAdvises, { onConflict: 'id' });

    if (upsertErr) {
        console.error('❌ Error al upsert venus advises:', upsertErr.message);
        process.exit(1);
    } else {
        console.log('✅  Venus advises actualizados (3 consejos con títulos correctos)');
    }

    console.log('\n🎉 Fix completado.\n');
}

main();

