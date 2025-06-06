import pool from '../db.js';

export const createMachine = async (req, res) => {
  const { name, type, location } = req.body;
  const userId = req.user.id;

  try {
    // Get user's company_id
    const userRes = await pool.query('SELECT company_id FROM users WHERE id = $1', [userId]);
    const company_id = userRes.rows[0].company_id;
     console.log(company_id, name, type, location, userId);
    // Insert machine
    const result = await pool.query(
      `INSERT INTO machines (company_id, name, type, location, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [company_id, name, type, location, userId]
    );

    const machine = result.rows[0];

    // Assign creator as admin in machine_access
    await pool.query(
      `INSERT INTO machine_access (user_id, machine_id, role) VALUES ($1, $2, $3)`,
      [userId, machine.id, 'admin']
    );

    res.status(201).json({ message: 'Machine created', machine });
  } catch (error) {
    console.error('Create Machine Error:', error.message);
    res.status(500).json({ message: 'Error creating machine' });
  }
};
