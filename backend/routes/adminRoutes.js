
const express = require("express");
const router  = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole     = require("../middleware/roleMiddleware");

const {
    getAdminStats,
    getAllUsers,
    deleteUser,
    getAllJobsAdmin,
    deleteJobAdmin
} = require("../controllers/adminController");

// All admin routes require authentication and admin role
const adminOnly = [authenticateToken, authorizeRole("admin")];

// GET /api/admin/stats
router.get("/stats",    ...adminOnly, getAdminStats);

// GET /api/admin/users
router.get("/users",    ...adminOnly, getAllUsers);

// DELETE /api/admin/users/:id
router.delete("/users/:id", ...adminOnly, deleteUser);

// GET /api/admin/jobs
router.get("/jobs",     ...adminOnly, getAllJobsAdmin);

// DELETE /api/admin/jobs/:id
router.delete("/jobs/:id",  ...adminOnly, deleteJobAdmin);

module.exports = router;
