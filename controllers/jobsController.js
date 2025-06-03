const pool = require('../config/db');

exports.createJob = async (req, res) => {
  try {
    const {
      title, description, weight, price,
      origin_address, origin_lat, origin_lng,
      destination_address, destination_lat, destination_lng,
      deadline
    } = req.body;

    const userId = req.user.id;

    const result = await pool.query(`
      INSERT INTO jobs (
        title, description, weight, price,
        origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        deadline, created_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      ) RETURNING *;
    `, [
      title, description, weight, price,
      origin_address, origin_lat, origin_lng,
      destination_address, destination_lat, destination_lng,
      deadline, userId
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM jobs WHERE status = 'open' ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};