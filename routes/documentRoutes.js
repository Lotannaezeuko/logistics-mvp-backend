// routes/documentRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// Wraps multer to return structured JSON errors instead of crashing
const handleUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.use(authenticateJWT);

router.get('/types', documentController.getDocumentTypes);
router.get('/', documentController.getUserDocuments);
router.post('/upload', handleUpload('document'), documentController.uploadDocument);
router.get('/:id/download', documentController.downloadDocument);
router.put('/:id', handleUpload('document'), documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;