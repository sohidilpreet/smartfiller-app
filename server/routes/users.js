import express from 'express';
import bcrypt from 'bcryptjs';
import verifyToken from '../middleware/verifyToken.js';
import pool from '../db.js';

const router = express.Router();

// ✅ CREATE USER (admin only)
router.post('/', verifyToken, async (req, res) => {
  const { name, email, password, role } = req.body;
  const { id: adminId, company_id, role: currentRole } = req.user;

  if (currentRole !== 'admin') {
    return res.status(403).json({ message: 'Only admins can create users.' });
  }

  if (!['controller', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Only controller or viewer allowed.' });
  }

  try {
    // Check if email already exists in the same company
    const exists = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND company_id = $2',
      [email, company_id]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists in the company.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, company_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role, company_id]
    );

    res.status(201).json({ message: 'User created', user: result.rows[0] });

  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ message: 'Server error creating user' });
  }
});

// ✅ CHANGE PASSWORD (any logged-in user)
router.put('/change-password', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing current or new password' });
  }

  try {
    const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNew, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// ✅ GET ALL USERS IN COMPANY (admin only, for assignment)
router.get('/', verifyToken, async (req, res) => {
  const { company_id, role } = req.user;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can view users.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users 
       WHERE company_id = $1
       ORDER BY 
         CASE role 
           WHEN 'admin' THEN 1 
           WHEN 'controller' THEN 2 
           WHEN 'viewer' THEN 3 
           ELSE 4 
         END,
         created_at ASC`,
      [company_id]
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

export default router;
