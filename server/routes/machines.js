import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import pool from '../db.js';
import { hasRole } from '../utils/checkUserRole.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });


// =============================
// 🔧 Create a Machine (Admin only)
// =============================
router.post('/', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { name, description, location } = req.body;
  const company_id = req.user.company_id;


  try {
    // Step 1: Is the user an admin for this company?
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND company_id = $2 AND role = $3',
      [userId, company_id, 'admin']
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Only company admins can add machines.' });
    }

    // Step 2: Insert new machine
    const machine = await pool.query(
      `INSERT INTO machines (name, description, company_id, location, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, company_id, location, userId]
    );

    const machineId = machine.rows[0].id;

    // Step 3: Automatically assign machine access to creator (admin)
    await pool.query(
      'INSERT INTO machine_access (user_id, machine_id, role) VALUES ($1, $2, $3)',
      [userId, machineId, 'admin']
    );

    res.status(201).json({ message: 'Machine created', machine: machine.rows[0] });

  } catch (err) {
    console.error('Create machine error:', err.message);
    res.status(500).json({ message: 'Server error creating machine' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const machinesRes = await pool.query(
      `SELECT m.*
       FROM machines m
       JOIN machine_access ma ON m.id = ma.machine_id
       WHERE ma.user_id = $1
       ORDER BY m.created_at DESC`,
      [userId]
    );

    res.json({ machines: machinesRes.rows });
  } catch (err) {
    console.error('Get machines error:', err.message);
    res.status(500).json({ message: 'Failed to fetch machines' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const machineId = req.params.id;

  try {
    const machineRes = await pool.query(
      `SELECT m.*, u.name as created_by_name
       FROM machines m
       JOIN machine_access ma ON m.id = ma.machine_id
       JOIN users u ON m.created_by = u.id
       WHERE m.id = $1 AND ma.user_id = $2`,
      [machineId, userId]
    );

    if (machineRes.rows.length === 0) {
      return res.status(404).json({ message: 'Machine not found or access denied' });
    }

    const runsRes = await pool.query(
      `SELECT r.*, u.name as user_name
       FROM machine_runs r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.machine_id = $1
       ORDER BY r.run_time DESC`,
      [machineId]
    );

    const filesRes = await pool.query(
      `SELECT mf.*, u.name AS uploaded_by_name
       FROM machine_files mf
       LEFT JOIN users u ON mf.uploaded_by = u.id
       WHERE mf.machine_id = $1
       ORDER BY mf.uploaded_at DESC`,
      [machineId]
    );

    res.json({
      ...machineRes.rows[0],
      runs: runsRes.rows, 
      files: filesRes.rows
    });

  } catch (err) {
    console.error('Fetch machine detail error:', err.message);
    res.status(500).json({ message: 'Error fetching machine' });
  }
});


router.post('/:id/run', verifyToken, async (req, res) => {
  const machineId = req.params.id;
  const userId = req.user.id;
  const { description, operatorName, selectedUserId } = req.body;

  try {
    const userToLog = selectedUserId || userId;

    const result = await pool.query(
      `INSERT INTO machine_runs (machine_id, user_id, operator_name, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [machineId, selectedUserId || null, operatorName || null, description]
    );

    res.status(201).json({ message: 'Run logged', run: result.rows[0] });
  } catch (err) {
    console.error('Run machine error:', err.message);
    res.status(500).json({ message: 'Failed to log run' });
  }
});

router.post('/:id/assign-user', verifyToken, async (req, res) => {
  const adminId = req.user.id;
  const machineId = req.params.id;
  const { userId, role } = req.body;
  
  if (role === 'admin') {
    return res.status(400).json({ message: 'Cannot assign admin role to users.' });
  }
  try {
    // Check admin owns the machine
    const accessRes = await pool.query(
      `SELECT * FROM machine_access WHERE user_id = $1 AND machine_id = $2 AND role = 'admin'`,
      [adminId, machineId]
    );

    if (accessRes.rows.length === 0) {
      return res.status(403).json({ message: 'Only machine admins can assign users.' });
    }

    // Insert or update role
    await pool.query(
      `INSERT INTO machine_access (user_id, machine_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, machine_id)
       DO UPDATE SET role = EXCLUDED.role`,
      [userId, machineId, role]
    );

    res.status(200).json({ message: 'User assigned to machine successfully.' });
  } catch (err) {
    console.error('Assign user error:', err.message);
    res.status(500).json({ message: 'Failed to assign user to machine' });
  }
});

router.post('/:id/upload', verifyToken, upload.single('file'), async (req, res) => {
  const userId = req.user.id;
  const machineId = req.params.id;
  const file = req.file;

  try {
    // Validate access
    const access = await pool.query(
      `SELECT * FROM machine_access WHERE user_id = $1 AND machine_id = $2`,
      [userId, machineId]
    );

    if (access.rows.length === 0) {
      return res.status(403).json({ message: 'No access to this machine' });
    }

    // Save file info to DB
    await pool.query(
      `INSERT INTO machine_files (machine_id, uploaded_by, filename, originalname)
       VALUES ($1, $2, $3, $4)`,
      [machineId, userId, file.filename, file.originalname]
    );

    res.status(201).json({ message: 'File uploaded' });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.delete('/:machineId/files/:fileId', verifyToken, async (req, res) => {
  const { machineId, fileId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    // Get file info
    const fileRes = await pool.query(
      `SELECT * FROM machine_files WHERE id = $1 AND machine_id = $2`,
      [fileId, machineId]
    );

    if (fileRes.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = fileRes.rows[0];

    // Only uploader or admin can delete
    if (!isAdmin && file.uploaded_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // Delete file from disk
    const filePath = path.join('uploads', file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from DB
    await pool.query(`DELETE FROM machine_files WHERE id = $1`, [fileId]);

    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete file error:', err.message);
    res.status(500).json({ message: 'Error deleting file' });
  }
});

// 🔍 Stats for charting run history
router.get('/:id/stats/runs', verifyToken, async (req, res) => {
  const machineId = req.params.id;
  const userId = req.user.id;

  try {
    // Access check
    const access = await pool.query(
      `SELECT * FROM machine_access WHERE user_id = $1 AND machine_id = $2`,
      [userId, machineId]
    );
    if (access.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Group by date (last 30 days)
    const stats = await pool.query(`
      SELECT 
        DATE(run_time) as date,
        COUNT(*) as total_runs
      FROM machine_runs
      WHERE machine_id = $1 AND run_time > CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(run_time)
      ORDER BY date ASC
    `, [machineId]);

    // Total count & top user
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_runs,
        MAX(run_time) as last_run,
        (
          SELECT u.name
          FROM machine_runs r
          LEFT JOIN users u ON r.user_id = u.id
          WHERE r.machine_id = $1
          GROUP BY u.name
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as top_operator
      FROM machine_runs
      WHERE machine_id = $1
    `, [machineId]);

    res.json({ history: stats.rows, summary: summary.rows[0] });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ✅ Update machine status
router.put('/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  try {
    const access = await pool.query(
      `SELECT * FROM machine_access WHERE user_id = $1 AND machine_id = $2 AND role = 'admin'`,
      [userId, id]
    );

    if (access.rows.length === 0) {
      return res.status(403).json({ message: 'Only admins can update status' });
    }

    await pool.query(`UPDATE machines SET status = $1 WHERE id = $2`, [status, id]);

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error('Update status error:', err.message);
    res.status(500).json({ message: 'Failed to update status' });
  }
});


export default router;