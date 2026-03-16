// authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require("../config/db"); // PostgreSQL connection

// User Registration
exports.register = async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    password,
    role,
    // role-specific fields
    years_in_business,
    product_type,
    target_areas,
    fleet_size,
    preferred_routes,
    insurance_valid_until,
    company_size,
    specialties,
    target_lanes,
  } = req.body;

  const client = await pool.connect();

  try {
    // Validate role
    const validRoles = ["manufacturer", "haulier", "logistics_company"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    // Check if user already exists
    const userCheck = await client.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    // Insert into users
    const result = await client.query(
      `INSERT INTO users (first_name, last_name, email, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, email, role`,
      [first_name, last_name, email, hashedPassword, role]
    );

    const user = result.rows[0];

    // Insert into the corresponding role table
    if (role === "manufacturer") {
      await client.query(
        `INSERT INTO manufacturers (user_id, years_in_business, product_type, target_areas)
         VALUES ($1, $2, $3, $4)`,
        [user.id, years_in_business || null, product_type || null, target_areas || null]
      );
    } else if (role === "haulier") {
      await client.query(
        `INSERT INTO hauliers (user_id, fleet_size, preferred_routes, insurance_valid_until)
         VALUES ($1, $2, $3, $4)`,
        [user.id, fleet_size || null, preferred_routes || null, insurance_valid_until || null]
      );
    } else if (role === "logistics_company") {
      await client.query(
        `INSERT INTO logistics_companies (user_id, company_size, specialties, target_lanes)
         VALUES ($1, $2, $3, $4)`,
        [user.id, company_size || null, specialties || null, target_lanes || null]
      );
    }

    await client.query("COMMIT");

    // Generate token (include role in payload)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  } finally {
    client.release();
  }
};

// User Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  // Find user in DB
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  
  const user = result.rows[0];
  
  // Compare password with hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  
  // Generate JWT (commented out)
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '3h' });
  
  res.status(200).json({ user, token }); 

};