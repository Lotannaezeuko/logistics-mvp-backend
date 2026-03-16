// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateJWT, isAdmin } = require('../middleware/authMiddleware');

// All admin routes require a valid JWT and admin role
router.use(authenticateJWT);
router.use(isAdmin);

// GET /admin/documents?status=pending|approved|rejected
router.get('/documents', adminController.getAllDocuments);

// PUT /admin/documents/:id/approve
router.put('/documents/:id/approve', adminController.approveDocument);

// PUT /admin/documents/:id/reject   body: { notes: "reason" }
router.put('/documents/:id/reject', adminController.rejectDocument);

module.exports = router;
