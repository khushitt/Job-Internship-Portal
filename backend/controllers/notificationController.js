
const db = require("../config/db");

// ==============================
// GET NOTIFICATIONS FOR LOGGED-IN USER
// ==============================

const getNotifications = (req, res) => {
    const user_id = req.user.user_id;

    const query = `
        SELECT
            notification_id,
            message,
            is_read,
            created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    `;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        const unread = results.filter(n => !n.is_read).length;

        res.status(200).json({
            message: "Notifications retrieved successfully",
            unread_count: unread,
            notifications: results
        });
    });
};


// ==============================
// MARK NOTIFICATION AS READ
// ==============================

const markAsRead = (req, res) => {
    const user_id = req.user.user_id;
    const notification_id = req.params.id;

    const query = `
        UPDATE notifications
        SET is_read = 1
        WHERE notification_id = ?
        AND user_id = ?
    `;

    db.query(query, [notification_id, user_id], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification marked as read"
        });
    });
};


// ==============================
// MARK ALL NOTIFICATIONS AS READ
// ==============================

const markAllAsRead = (req, res) => {
    const user_id = req.user.user_id;

    const query = `
        UPDATE notifications
        SET is_read = 1
        WHERE user_id = ?
        AND is_read = 0
    `;

    db.query(query, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.status(200).json({
            message: "All notifications marked as read",
            updated: result.affectedRows
        });
    });
};


// ==============================
// HELPER: Create a notification (internal use only)
// Called from applicationController when status changes
// ==============================

const createNotification = (user_id, message, callback) => {
    const query = `
        INSERT INTO notifications (user_id, message)
        VALUES (?, ?)
    `;

    db.query(query, [user_id, message], (err, result) => {
        if (callback) callback(err, result);
    });
};


// ==============================
// EXPORT
// ==============================

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification
};
