import fetch from 'node-fetch';
const res = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Bisakah kamu jelaskan ketentuan apa saja yang ada di ISAK 335?' })
});
console.log(await res.json());
