// 📁 server/db.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load .env from ./server/.env
dotenv.config({
  path: path.resolve(__dirname, './.env')
});

console.log('✅ Loaded DATABASE_URL from .env:', process.env.DATABASE_URL);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export default pool;
