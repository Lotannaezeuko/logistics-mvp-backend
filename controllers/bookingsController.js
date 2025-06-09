const pool = require('../config/db');

// Create a booking
exports.createBooking = async (req, res) => {
  const userId = req.user.id;
  const { job_id } = req.body;

  try {
    // Check if job already booked
    const jobCheck = await pool.query(
      "SELECT * FROM bookings WHERE job_id = $1 AND status = 'booked'",
      [job_id]
    );

    if (jobCheck.rows.length > 0) {
      return res.status(400).json({ error: "Job already booked" });
    }

    // Insert new booking
    const newBooking = await pool.query(
      `INSERT INTO bookings (job_id, booked_by, status, booked_at)
       VALUES ($1, $2, 'booked', NOW())
       RETURNING *`,
      [job_id, userId]
    );

    // Update job status
    await pool.query(`UPDATE jobs SET status = 'booked' WHERE id = $1`, [job_id]);

    res.status(201).json(newBooking.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all bookings for current user
exports.getMyBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const bookings = await pool.query(
      `SELECT b.*, j.title, j.origin_address, j.destination_address
       FROM bookings b
       JOIN jobs j ON b.job_id = j.id
       WHERE b.booked_by = $1`,
      [userId]
    );
    res.json(bookings.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Mark booking as completed (optional)
exports.completeBooking = async (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;

  try {
    const updated = await pool.query(
      `UPDATE bookings
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1 AND booked_by = $2
       RETURNING *`,
      [bookingId, userId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found or unauthorized" });
    }

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};