
const express = require("express");
const router  = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole     = require("../middleware/roleMiddleware");

const {
    getNotifications,
    markAsRead,
    markAllAsRead
} = require("../controllers/notificationController");

// GET /api/notifications  — all notifications for logged-in user
router.get(
    "/",
    authenticateToken,
    getNotifications
);

// PUT /api/notifications/:id/read  — mark one as read
router.put(
    "/:id/read",
    authenticateToken,
    markAsRead
);

// PUT /api/notifications/read-all  — mark all as read
router.put(
    "/read-all",
    authenticateToken,
    markAllAsRead
);

module.exports = router;
