const express = require("express");

const router = express.Router();

const {
    createStudentProfile,
    getStudentProfile,
    updateStudentProfile
} = require("../controllers/studentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

// Create Student Profile
router.post(
    "/profile",
    authenticateToken,
    authorizeRole("student"),
    createStudentProfile
);

// Get Student Profile
router.get(
    "/profile",
    authenticateToken,
    authorizeRole("student"),
    getStudentProfile
);

// Update Student Profile
router.put(
    "/profile",
    authenticateToken,
    authorizeRole("student"),
    updateStudentProfile
);

module.exports = router;