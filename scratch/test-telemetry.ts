async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'test post query',
        matches_count: 0,
        status: 'no_matches',
        source: 'text'
      })
    });
    console.log('Response status:', res.status);
    console.log('Response body:', await res.json());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
