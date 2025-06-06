import pool from '../db.js';

export const hasRole = async (userId, machineId, role) => {
  const result = await pool.query(
    `SELECT * FROM machine_access WHERE user_id = $1 AND machine_id = $2 AND role = $3`,
    [userId, machineId, role]
  );
  return result.rows.length > 0;
};
