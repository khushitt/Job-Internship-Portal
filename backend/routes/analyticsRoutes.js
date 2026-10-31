
const express = require("express");
const router  = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole     = require("../middleware/roleMiddleware");
const { getRecruiterAnalytics } = require("../controllers/analyticsController");

// GET /api/recruiter/analytics
router.get(
    "/analytics",
    authenticateToken,
    authorizeRole("recruiter"),
    getRecruiterAnalytics
);

module.exports = router;
