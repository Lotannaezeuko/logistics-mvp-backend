const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Get matched jobs for current user
router.get('/matched-jobs', authenticateJWT, matchingController.getMatchedJobs);

// Get detailed match explanation for a specific job
router.get('/job/:jobId/match-explanation', authenticateJWT, matchingController.getJobMatchExplanation);

module.exports = router;