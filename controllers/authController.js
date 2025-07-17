// authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require("../config/db"); // PostgreSQL connection

// User Registration
exports.register = async (req, res) => {
    const { first_name,last_name, email, password, role } = req.body;
  
    // Validate role against allowed values
    const validRoles = ['manufacturer', 'haulier', 'freight_forwarder', 'logistics_company'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }
  
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
  
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Insert user into DB, including role
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, role',
      [first_name, last_name, email, hashedPassword, role]
    );
  
    const user = result.rows[0];
    // Generate JWT
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Include role in payload
    res.status(201).json({ user, token }); // Return token
    
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
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '3h' }); 
  
  res.status(200).json({ user, token }); 

};