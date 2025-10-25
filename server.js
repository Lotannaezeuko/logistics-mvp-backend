require('dotenv').config();
const express = require("express");
const pool = require("./config/db");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const jobsRoutes = require("./routes/jobsRoutes");
const bookingsRoutes = require("./routes/bookingsRoutes");
const matchingRoutes = require("./routes/matchingRoutes");



const app = express();
app.use(cors());
app.use(express.json());

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use("/auth", authRoutes);
app.use("/jobs", jobsRoutes);
app.use("/bookings", bookingsRoutes);
app.use("/matching", matchingRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));