const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const {
    applyForJob,
    getMyApplications,
    getRecruiterApplications,
    updateApplicationStatus
} = require("../controllers/applicationController");

// ==============================
// APPLY FOR JOB
// ==============================

router.post(
    "/apply",
    authenticateToken,
    authorizeRole("student"),
    applyForJob
);

// ==============================
// GET MY APPLICATIONS - STUDENT
// ==============================

router.get(
    "/my-applications",
    authenticateToken,
    authorizeRole("student"),
    getMyApplications
);

// ==============================
// GET APPLICATIONS - RECRUITER
// ==============================

router.get(
    "/recruiter",
    authenticateToken,
    authorizeRole("recruiter"),
    getRecruiterApplications
);

// ==============================
// UPDATE APPLICATION STATUS - RECRUITER
// ==============================

router.put(
    "/:id/status",
    authenticateToken,
    authorizeRole("recruiter"),
    updateApplicationStatus
);

module.exports = router;
