
const express = require("express");
const router  = express.Router();

const {
    createRecruiterProfile,
    getRecruiterProfile,
    updateRecruiterProfile
} = require("../controllers/recruiterController");

const { getRecruiterAnalytics } = require("../controllers/analyticsController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole     = require("../middleware/roleMiddleware");

// Create Recruiter Profile
router.post(
    "/profile",
    authenticateToken,
    authorizeRole("recruiter"),
    createRecruiterProfile
);

// Get Recruiter Profile
router.get(
    "/profile",
    authenticateToken,
    authorizeRole("recruiter"),
    getRecruiterProfile
);

// Update Recruiter Profile
router.put(
    "/profile",
    authenticateToken,
    authorizeRole("recruiter"),
    updateRecruiterProfile
);

// Recruiter Analytics
router.get(
    "/analytics",
    authenticateToken,
    authorizeRole("recruiter"),
    getRecruiterAnalytics
);

module.exports = router;
