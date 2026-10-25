const express = require("express");

const router = express.Router();

const {
    createJob,
    getAllJobs,
    getJobById,
    getMyJobs,
    updateJob,
    deleteJob
} = require("../controllers/jobController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

// ==============================
// CREATE JOB / INTERNSHIP
// Recruiter only
// ==============================

router.post(
    "/",
    authenticateToken,
    authorizeRole("recruiter"),
    createJob
);

// ==============================
// GET ALL JOBS / INTERNSHIPS
// Public route - no login required
// ==============================

router.get(
    "/",
    getAllJobs
);

// ==============================
// GET RECRUITER'S OWN JOBS
// Recruiter only
// ==============================

router.get(
    "/my-jobs",
    authenticateToken,
    authorizeRole("recruiter"),
    getMyJobs
);

// ==============================
// GET SINGLE JOB
// Login required
// ==============================

router.get(
    "/:id",
    authenticateToken,
    getJobById
);

// ==============================
// UPDATE JOB / INTERNSHIP
// Recruiter only
// ==============================

router.put(
    "/:id",
    authenticateToken,
    authorizeRole("recruiter"),
    updateJob
);

// ==============================
// DELETE JOB / INTERNSHIP
// Recruiter only
// ==============================

router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("recruiter"),
    deleteJob
);

module.exports = router;