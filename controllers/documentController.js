// controllers/documentController.js

const pool = require('../config/db');
const fs = require('fs').promises;
const path = require('path');
const { DOCUMENT_TYPES } = require('../config/documentTypes');

// Upload a new document for the logged-in user
exports.uploadDocument = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { document_type, document_category, expiry_date, notes } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const validTypes = DOCUMENT_TYPES[userRole];
    const typeConfig = validTypes.find(t => t.type === document_type);

    if (!typeConfig) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        message: 'Invalid document type for your role',
        validTypes: validTypes.map(t => ({ type: t.type, label: t.label }))
      });
    }

    if (typeConfig.requiresExpiry && !expiry_date) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ message: 'Expiry date is required for this document type' });
    }

    const result = await client.query(
      `INSERT INTO documents
        (user_id, document_type, document_category, file_name, file_path,
         file_size, mime_type, expiry_date, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        document_type,
        document_category,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        expiry_date || null,
        notes || null,
        'pending'
      ]
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: { ...result.rows[0], typeLabel: typeConfig.label }
    });

  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(err => console.error('File cleanup error:', err));
    }
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload document' });
  } finally {
    client.release();
  }
};

// Fetch all documents belonging to the logged-in user
exports.getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, document_type, document_category, file_name, file_size,
              mime_type, expiry_date, status, uploaded_at, verified_at, notes
       FROM documents
       WHERE user_id = $1
       ORDER BY uploaded_at DESC`,
      [userId]
    );

    const documents = result.rows.map(doc => {
      const typeConfig = DOCUMENT_TYPES[req.user.role]?.find(t => t.type === doc.document_type);
      const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
      const expiresIn = doc.expiry_date
        ? Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...doc,
        typeLabel: typeConfig?.label || doc.document_type,
        isExpired,
        expiresIn
      };
    });

    res.status(200).json({ documents });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Failed to retrieve documents' });
  }
};

// Returns the list of document types available for the logged-in user's role
exports.getDocumentTypes = async (req, res) => {
  try {
    const types = DOCUMENT_TYPES[req.user.role] || [];
    res.status(200).json({ documentTypes: types });
  } catch (error) {
    console.error('Get document types error:', error);
    res.status(500).json({ message: 'Failed to retrieve document types' });
  }
};

// Stream a document file back to the user, verifying they own it
exports.downloadDocument = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const document = result.rows[0];

    try {
      await fs.access(document.file_path);
    } catch {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(document.file_path, document.file_name);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Failed to download document' });
  }
};

// Delete a document and remove its file from disk
exports.deleteDocument = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Document not found' });
    }

    const document = result.rows[0];

    await client.query(`DELETE FROM documents WHERE id = $1`, [req.params.id]);
    await client.query('COMMIT');

    try {
      await fs.unlink(document.file_path);
    } catch (error) {
      console.error('File deletion error:', error);
    }

    res.status(200).json({ message: 'Document deleted successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  } finally {
    client.release();
  }
};

// Replace a document's file and/or update its metadata (expiry date, notes)
exports.updateDocument = async (req, res) => {
  const client = await pool.connect();

  try {
    const { expiry_date, notes } = req.body;

    await client.query('BEGIN');

    const existingDoc = await client.query(
      `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existingDoc.rows.length === 0) {
      await client.query('ROLLBACK');
      if (req.file) await fs.unlink(req.file.path);
      return res.status(404).json({ message: 'Document not found' });
    }

    const oldDocument = existingDoc.rows[0];
    let updateQuery, updateParams;

    if (req.file) {
      updateQuery = `
        UPDATE documents
        SET file_name = $1, file_path = $2, file_size = $3,
            mime_type = $4, expiry_date = $5, notes = $6,
            uploaded_at = NOW(), status = 'pending'
        WHERE id = $7
        RETURNING *
      `;
      updateParams = [
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        expiry_date || oldDocument.expiry_date,
        notes || oldDocument.notes,
        req.params.id
      ];
    } else {
      updateQuery = `
        UPDATE documents
        SET expiry_date = $1, notes = $2
        WHERE id = $3
        RETURNING *
      `;
      updateParams = [
        expiry_date || oldDocument.expiry_date,
        notes || oldDocument.notes,
        req.params.id
      ];
    }

    const result = await client.query(updateQuery, updateParams);
    await client.query('COMMIT');

    if (req.file && oldDocument.file_path) {
      await fs.unlink(oldDocument.file_path).catch(console.error);
    }

    res.status(200).json({ message: 'Document updated successfully', document: result.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    if (req.file) await fs.unlink(req.file.path).catch(console.error);
    console.error('Update error:', error);
    res.status(500).json({ message: 'Failed to update document' });
  } finally {
    client.release();
  }
};