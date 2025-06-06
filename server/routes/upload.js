import express from 'express';
import multer from 'multer';
import path from 'path';
import verifyToken from '../middleware/verifyToken.js';
import pool from '../db.js';

const router = express.Router();

// 📁 Define storage engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (_, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// 📤 POST /api/upload/:machineId
router.post('/:machineId', verifyToken, upload.single('file'), async (req, res) => {
  const userId = req.user.id;
  const { machineId } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO machine_files (machine_id, file_name, file_path, uploaded_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [machineId, file.originalname, file.filename, userId]
    );

    res.status(201).json({ message: 'File uploaded', file: result.rows[0] });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ message: 'Server error uploading file' });
  }
});

export default router;
