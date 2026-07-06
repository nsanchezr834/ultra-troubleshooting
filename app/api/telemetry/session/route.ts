import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, startTime, endTime, durationSeconds } = body;

    const cookieStore = await cookies();
    const operatorName = cookieStore.get('operator_name')?.value || 'Usuario Anónimo';

    if (!section || durationSeconds == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('user_telemetry')
      .insert([
        {
          full_name: operatorName,
          section: section,
          start_time: startTime || new Date().toISOString(),
          end_time: endTime || new Date().toISOString(),
          duration_seconds: Math.round(durationSeconds)
        }
      ]);

    if (error) {
      console.error('Error inserting telemetry:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling telemetry POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
