import pool from '../db.js';               // Connects to PostgreSQL
import bcrypt from 'bcryptjs';            // For hashing and comparing passwords
import jwt from 'jsonwebtoken';           // For creating and verifying JWT tokens
import dotenv from 'dotenv';              // Loads environment variables
dotenv.config();                          // Initialize dotenv

// ===========================================
// 📝 REGISTER NEW USER
// ===========================================
export const registerUser = async (req, res) => {
  const { name, email, password, company_id, role } = req.body;

  if (!company_id || !role) {
    return res.status(400).json({ message: 'Company ID and role are required' });
  }

  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, company_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, company_id, role]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, company_id: user.company_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id
      }
    });

  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ===========================================
// 🔐 LOGIN EXISTING USER
// ===========================================
export const loginUser = async (req, res) => {
  const { email, password, company_id } = req.body;

  if (!email || !password || !company_id) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  try {
    const client = await pool.connect();
    const userRes = await client.query(
      `SELECT * FROM users WHERE email = $1 AND company_id = $2`,
      [email, company_id] // 🧠 ensure case-insensitive matching
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials (user not found)' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials (password)' });
    }

    const token = jwt.sign(
      { id: user.id, company_id: user.company_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.user;
    const result = await client.query(
      `SELECT u.id, u.name, u.email, u.role, c.id AS company_id, c.name AS company_name
       FROM users u
       JOIN companies c ON u.company_id = c.id
       WHERE u.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user' });
  } finally {
    client.release();
  }
};