export interface LogSearchParams {
  query: string;
  matches_count: number;
  selected_option?: string | null;
  time_spent_seconds?: number;
  status: 'resolved' | 'no_matches' | 'abandoned' | 'retried';
  source: 'text' | 'voice_inline' | 'speech_agent';
}

export function logSearch(params: LogSearchParams) {
  console.log('[Telemetry Client] Logging search:', params);
  
  // Fire-and-forget call to avoid blocking the user interface
  fetch('/api/telemetry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  .then(res => {
    console.log('[Telemetry Client] Server response status:', res.status);
  })
  .catch((err) => {
    console.error('[Telemetry Utility] Error logging search:', err);
  });
}
