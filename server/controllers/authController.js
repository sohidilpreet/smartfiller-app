import pool from '../db.js';               // Connects to PostgreSQL
import bcrypt from 'bcryptjs';            // For hashing and comparing passwords
import jwt from 'jsonwebtoken';           // For creating and verifying JWT tokens
import dotenv from 'dotenv';              // Loads environment variables
dotenv.config();                          // Initialize dotenv

// ===========================================
// 📝 REGISTER NEW USER
// ===========================================
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Check if the user already exists by email
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash the password using bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert new user into database
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    // 4. Generate JWT token using secret from .env
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Send back token and basic user info
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
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
  const { email, password } = req.body;

  try {
    // 1. Look for user in the DB
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 2. Compare plain password to hashed one
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Send token and user info
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};


export const getMe = async (req, res) => {
  try {
    const user = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);

    if (user.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json(user.rows[0]); // ✅ not wrapped in { user: ... }
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
