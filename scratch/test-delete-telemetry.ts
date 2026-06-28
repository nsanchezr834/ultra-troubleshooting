async function run() {
  const targetId = 'ce5e2824-eb4f-41f1-965f-fb7ee208c6df';
  console.log('Sending DELETE request for ID:', targetId);
  try {
    const res = await fetch(`http://localhost:3000/api/telemetry?id=${targetId}`, {
      method: 'DELETE'
    });
    console.log('Response status:', res.status);
    console.log('Response body:', await res.json());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
