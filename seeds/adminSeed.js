// seeds/adminSeed.js
// Run with: node seeds/adminSeed.js
// Creates a dummy admin user for testing document approval/rejection

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seedAdmin() {
  const client = await pool.connect();

  try {
    const email = 'admin@logistics.com';
    const plainPassword = 'Admin123!';

    // Check if admin already exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('Admin user already exists — skipping.');
      return;
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const result = await client.query(
      `INSERT INTO users (first_name, last_name, email, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role`,
      ['Admin', 'User', email, hashedPassword, 'admin']
    );

    console.log('Admin user created:');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${plainPassword}`);
    console.log(`  ID:       ${result.rows[0].id}`);
  } catch (error) {
    console.error('Seed error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedAdmin();
