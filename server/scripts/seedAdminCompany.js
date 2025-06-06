import bcrypt from 'bcryptjs';
import pool from '../db.js'; // dotenv already loaded inside
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const seedAdminCompany = async () => {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding company and admin user...');

    const rl = readline.createInterface({ input, output });

    const companyName = await rl.question('Company Name: ');
    const location = await rl.question('Company Location: ');
    const adminName = await rl.question('Admin Name: ');
    const adminEmail = await rl.question('Admin Email: ');
    const plainPassword = await rl.question('Admin Password: ');
    await rl.close();

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await client.query('BEGIN');

    const companyRes = await client.query(
      'INSERT INTO companies (name, location) VALUES ($1, $2) RETURNING id',
      [companyName, location]
    );
    const companyId = companyRes.rows[0].id;

    await client.query(
      `INSERT INTO users (name, email, password, company_id, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [adminName, adminEmail, hashedPassword, companyId, 'admin']
    );

    await client.query('COMMIT');
    console.log('✅ Seed successful!');
    console.log(`Company: ${companyName} | Admin: ${adminEmail} | Password: ${plainPassword}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error.message);
  } finally {
    client.release();
    process.exit();
  }
};

seedAdminCompany();
