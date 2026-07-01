import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 1. Supabase Storage Estimation (500 MB Limit)
    // Fetch row counts from main tables
    const [{ count: voiceCount }, { count: kbCount }, { count: logsCount }] = await Promise.all([
      supabaseServer.from('voice_telemetry').select('*', { count: 'exact', head: true }),
      supabaseServer.from('troubleshooting_knowledge').select('*', { count: 'exact', head: true }),
      supabaseServer.from('assistant_logs').select('*', { count: 'exact', head: true })
    ]);

    // Very rough estimation: 1KB per row average. Vector embeddings take more space (~3KB).
    const estimatedKbRows = (kbCount || 0) * 3.5; 
    const estimatedOtherRows = ((voiceCount || 0) + (logsCount || 0)) * 0.8;
    const totalStorageKB = estimatedKbRows + estimatedOtherRows;
    const maxStorageKB = 500 * 1024; // 500MB Limit
    
    // 2. Gemini API Usage (Daily Limits: 1,500 RPD)
    // Get requests made today (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const { count: dailyRequestsCount } = await supabaseServer
      .from('voice_telemetry')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', today.toISOString());

    const maxDailyRequests = 1500;
    
    return NextResponse.json({
      success: true,
      data: {
        supabase: {
          used_kb: Math.round(totalStorageKB),
          max_kb: maxStorageKB,
          percentage: Number(((totalStorageKB / maxStorageKB) * 100).toFixed(4))
        },
        gemini: {
          requests_today: dailyRequestsCount || 0,
          max_daily_requests: maxDailyRequests,
          percentage: Number((((dailyRequestsCount || 0) / maxDailyRequests) * 100).toFixed(2))
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
