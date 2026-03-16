// controllers/adminController.js

const pool = require('../config/db');

// ========================================
// GET ALL DOCUMENTS (with optional status filter)
// GET /admin/documents?status=pending
// ========================================
exports.getAllDocuments = async (req, res) => {
  try {
    const { status } = req.query;

    const query = `
      SELECT
        d.*,
        u.first_name, u.last_name, u.email, u.role AS user_role
      FROM documents d
      JOIN users u ON u.id = d.user_id
      ${status ? 'WHERE d.status = $1' : ''}
      ORDER BY d.uploaded_at DESC
    `;

    const result = await pool.query(query, status ? [status] : []);

    res.status(200).json({ documents: result.rows });
  } catch (error) {
    console.error('Admin get documents error:', error);
    res.status(500).json({ message: 'Failed to retrieve documents' });
  }
};

// ========================================
// APPROVE A DOCUMENT
// PUT /admin/documents/:id/approve
// ========================================
exports.approveDocument = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE documents
       SET status = 'approved', verified_at = NOW(), verified_by = $1, notes = $2
       WHERE id = $3
       RETURNING *`,
      [adminId, req.body.notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.status(200).json({
      message: 'Document approved',
      document: result.rows[0]
    });
  } catch (error) {
    console.error('Admin approve error:', error);
    res.status(500).json({ message: 'Failed to approve document' });
  }
};

// ========================================
// REJECT A DOCUMENT
// PUT /admin/documents/:id/reject
// Body: { notes: "Reason for rejection" }
// ========================================
exports.rejectDocument = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ message: 'A rejection reason is required in notes' });
    }

    const result = await pool.query(
      `UPDATE documents
       SET status = 'rejected', verified_at = NOW(), verified_by = $1, notes = $2
       WHERE id = $3
       RETURNING *`,
      [adminId, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.status(200).json({
      message: 'Document rejected',
      document: result.rows[0]
    });
  } catch (error) {
    console.error('Admin reject error:', error);
    res.status(500).json({ message: 'Failed to reject document' });
  }
};
