import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Cliente de Supabase del lado del servidor que prefiere usar la Service Key para evadir RLS
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  console.log('[Telemetry Route POST] Received request');
  try {
    const body = await req.json();
    console.log('[Telemetry Route POST] Body parsed:', body);
    const { query, matches_count, selected_option, time_spent_seconds, status, source, operator_name, ai_response, user_feedback } = body;

    const cookieStore = await cookies();
    const finalOperatorName = operator_name || cookieStore.get('operator_name')?.value || 'Operador Desconocido';

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Insert record in Supabase 'voice_telemetry' table
    const { data, error } = await supabaseServer
      .from('voice_telemetry')
      .insert([
        {
          query,
          matches_count: matches_count || 0,
          selected_option: selected_option || null,
          time_spent_seconds: time_spent_seconds || 0,
          status: status || 'no_matches',
          source: source || 'speech_agent',
          operator_name: finalOperatorName,
          ai_response: ai_response || null,
          user_feedback: user_feedback !== undefined ? user_feedback : null,
          timestamp: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('[Telemetry API] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Telemetry API] Request error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  console.log('[Telemetry Route PATCH] Received request');
  try {
    const body = await req.json();
    const { id, user_feedback } = body;

    if (!id || user_feedback === undefined) {
      return NextResponse.json({ error: 'ID and user_feedback are required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('voice_telemetry')
      .update({ user_feedback })
      .eq('id', id)
      .select();

    if (error) {
      console.error('[Telemetry API PATCH] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Telemetry API PATCH] Request error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // A simple GET endpoint to fetch telemetry. We will use it in the Admin Dashboard.
  try {
    const { data, error } = await supabaseServer
      .from('voice_telemetry')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[Telemetry API GET] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('[Telemetry API GET] Request error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('voice_telemetry')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Telemetry API DELETE] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Telemetry API DELETE] Request error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
