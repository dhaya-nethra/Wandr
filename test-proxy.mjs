import https from 'https';

const data = JSON.stringify({
  username: 'natpac_admin',
  password: 'NATPAC@Kerala2024',
  govKey: 'NATPAC-KERALA-GOV-2026-DEMO'
});

const req = https.request('https://localhost:8080/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  rejectUnauthorized: false
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
