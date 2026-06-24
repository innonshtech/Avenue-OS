require('dotenv').config();
const { Client } = require('pg');

async function test(url, name) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(name, 'Tables:', res.rows.length, 'Includes Token:', res.rows.some(r => r.table_name === 'PasswordResetToken'));
  } catch(e) {
    console.log(name, 'Error:', e.message);
  } finally {
    await client.end();
  }
}

test(process.env.DATABASE_URL, 'DATABASE_URL').then(() => test(process.env.DIRECT_URL, 'DIRECT_URL'));
