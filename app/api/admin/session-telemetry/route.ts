import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder'
);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_telemetry')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Error fetching session telemetry:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error handling session telemetry GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
