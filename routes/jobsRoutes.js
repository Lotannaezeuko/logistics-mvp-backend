const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.post('/', authenticateJWT, jobsController.createJob);
router.get('/', jobsController.getAllJobs);

module.exports = router;