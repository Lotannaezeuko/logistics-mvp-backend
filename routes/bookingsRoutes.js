const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.post("/", authenticateJWT, bookingsController.createBooking);
router.get("/", authenticateJWT, bookingsController.getMyBookings);
router.put("/:id/complete", authenticateJWT, bookingsController.completeBooking);

module.exports = router;