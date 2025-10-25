const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Get matched jobs for current user
router.get('/matched-jobs', authenticateJWT, matchingController.getMatchedJobs);


module.exports = router;