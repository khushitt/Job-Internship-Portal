
const express = require("express");
const router  = express.Router();

const {
    createStudentProfile,
    getStudentProfile,
    updateStudentProfile
} = require("../controllers/studentController");

const { getRecommendations }               = require("../controllers/recommendationController");
const { saveJob, getSavedJobs, removeSavedJob } = require("../controllers/savedJobsController");
const { uploadResume, getResume, deleteResume } = require("../controllers/resumeController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole     = require("../middleware/roleMiddleware");

let uploadMiddleware;
try {
    const { upload } = require("../middleware/uploadMiddleware");
    uploadMiddleware  = upload;
} catch (e) {
    uploadMiddleware = null;
}

// ==============================
// STUDENT PROFILE
// ==============================

router.post(
    "/profile",
    authenticateToken,
    authorizeRole("student"),
    createStudentProfile
);

router.get(
    "/profile",
    authenticateToken,
    authorizeRole("student"),
    getStudentProfile
);

router.put(
    "/profile",
    authenticateToken,
    authorizeRole("student"),
    updateStudentProfile
);

// ==============================
// JOB RECOMMENDATIONS
// ==============================

router.get(
    "/recommendations",
    authenticateToken,
    authorizeRole("student"),
    getRecommendations
);

// ==============================
// SAVED JOBS / BOOKMARKS
// ==============================

router.post(
    "/save-job",
    authenticateToken,
    authorizeRole("student"),
    saveJob
);

router.get(
    "/saved-jobs",
    authenticateToken,
    authorizeRole("student"),
    getSavedJobs
);

router.delete(
    "/saved-jobs/:job_id",
    authenticateToken,
    authorizeRole("student"),
    removeSavedJob
);

// ==============================
// RESUME UPLOAD & MANAGEMENT
// ==============================

router.post(
    "/upload-resume",
    authenticateToken,
    authorizeRole("student"),
    (req, res, next) => {
        if (!uploadMiddleware) {
            return res.status(500).json({
                message: "File upload module not available. Run: npm install multer"
            });
        }
        const upload = uploadMiddleware.single("resume");
        upload(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    message: err.message || "File upload failed"
                });
            }
            next();
        });
    },
    uploadResume
);

// GET resume — accessible by student (own), recruiter, and admin
router.get(
    "/resume/:filename",
    authenticateToken,
    getResume
);

// DELETE resume
router.delete(
    "/resume",
    authenticateToken,
    authorizeRole("student"),
    deleteResume
);

module.exports = router;
