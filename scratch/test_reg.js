async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/participant/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'test', password: 'test' })
    });
    console.log('Status:', res.status);
    const body = await res.json().catch(() => 'No JSON');
    console.log('Body:', body);
  } catch (e) {
    console.log('Error:', e.message);
  }
}
test();
