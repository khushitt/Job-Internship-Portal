
const db = require("../config/db");

// ==============================
// GET ADMIN DASHBOARD STATS
// ==============================

const getAdminStats = (req, res) => {
    const queries = {
        totalUsers:       "SELECT COUNT(*) AS count FROM users",
        totalStudents:    "SELECT COUNT(*) AS count FROM students",
        totalRecruiters:  "SELECT COUNT(*) AS count FROM recruiters",
        totalJobs:        "SELECT COUNT(*) AS count FROM jobs",
        totalApplications:"SELECT COUNT(*) AS count FROM applications",
        recentUsers: `
            SELECT user_id, name, email, role, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 10
        `,
        recentJobs: `
            SELECT j.job_id, j.title, j.company_name, j.job_type,
                   j.created_at, u.name AS recruiter_name
            FROM jobs j
            INNER JOIN recruiters r ON j.recruiter_id = r.recruiter_id
            INNER JOIN users u ON r.user_id = u.user_id
            ORDER BY j.created_at DESC
            LIMIT 10
        `
    };

    const results = {};
    const keys = Object.keys(queries);
    let completed = 0;

    keys.forEach(key => {
        db.query(queries[key], (err, rows) => {
            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            results[key] = key.includes("recent")
                ? rows
                : rows[0].count;

            completed++;

            if (completed === keys.length) {
                res.status(200).json({
                    message: "Admin stats retrieved successfully",
                    stats: {
                        total_users:        results.totalUsers,
                        total_students:     results.totalStudents,
                        total_recruiters:   results.totalRecruiters,
                        total_jobs:         results.totalJobs,
                        total_applications: results.totalApplications
                    },
                    recent_users: results.recentUsers,
                    recent_jobs:  results.recentJobs
                });
            }
        });
    });
};


// ==============================
// GET ALL USERS (ADMIN)
// ==============================

const getAllUsers = (req, res) => {
    const { role, search } = req.query;

    let query = `
        SELECT
            u.user_id,
            u.name,
            u.email,
            u.role,
            u.created_at,
            CASE
                WHEN u.role = 'student' THEN s.college
                WHEN u.role = 'recruiter' THEN r.company_name
                ELSE NULL
            END AS detail
        FROM users u
        LEFT JOIN students s   ON u.user_id = s.user_id
        LEFT JOIN recruiters r ON u.user_id = r.user_id
        WHERE 1 = 1
    `;

    const values = [];

    if (role && ["student", "recruiter", "admin"].includes(role)) {
        query += " AND u.role = ?";
        values.push(role);
    }

    if (search) {
        query += " AND (u.name LIKE ? OR u.email LIKE ?)";
        values.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY u.created_at DESC";

    db.query(query, values, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.status(200).json({
            message: "Users retrieved successfully",
            total: results.length,
            users: results
        });
    });
};


// ==============================
// DELETE USER (ADMIN)
// ==============================

const deleteUser = (req, res) => {
    const user_id = req.params.id;

    // Prevent deleting the last admin
    const checkAdminQuery = `
        SELECT COUNT(*) AS admin_count
        FROM users
        WHERE role = 'admin' AND user_id != ?
    `;

    db.query(checkAdminQuery, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        // Check if we are deleting an admin and it's the last one
        db.query(
            "SELECT role FROM users WHERE user_id = ?",
            [user_id],
            (err, userResults) => {
                if (err) {
                    return res.status(500).json({
                        message: "Database error",
                        error: err.message
                    });
                }

                if (userResults.length === 0) {
                    return res.status(404).json({
                        message: "User not found"
                    });
                }

                const targetRole = userResults[0].role;

                if (
                    targetRole === "admin" &&
                    results[0].admin_count === 0
                ) {
                    return res.status(400).json({
                        message:
                            "Cannot delete the last admin account"
                    });
                }

                db.query(
                    "DELETE FROM users WHERE user_id = ?",
                    [user_id],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                message: "Database error",
                                error: err.message
                            });
                        }

                        if (result.affectedRows === 0) {
                            return res.status(404).json({
                                message: "User not found"
                            });
                        }

                        res.status(200).json({
                            message: "User deleted successfully"
                        });
                    }
                );
            }
        );
    });
};


// ==============================
// GET ALL JOBS (ADMIN)
// ==============================

const getAllJobsAdmin = (req, res) => {
    const query = `
        SELECT
            j.job_id,
            j.title,
            j.company_name,
            j.location,
            j.job_type,
            j.created_at,
            u.name AS recruiter_name,
            u.email AS recruiter_email,
            COUNT(a.application_id) AS application_count
        FROM jobs j
        INNER JOIN recruiters r ON j.recruiter_id = r.recruiter_id
        INNER JOIN users u      ON r.user_id = u.user_id
        LEFT JOIN applications a ON j.job_id = a.job_id
        GROUP BY j.job_id
        ORDER BY j.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.status(200).json({
            message: "All jobs retrieved successfully",
            total: results.length,
            jobs: results
        });
    });
};


// ==============================
// DELETE JOB (ADMIN)
// ==============================

const deleteJobAdmin = (req, res) => {
    const job_id = req.params.id;

    db.query(
        "DELETE FROM jobs WHERE job_id = ?",
        [job_id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Job not found"
                });
            }

            res.status(200).json({
                message: "Job deleted by admin"
            });
        }
    );
};


// ==============================
// EXPORT
// ==============================

module.exports = {
    getAdminStats,
    getAllUsers,
    deleteUser,
    getAllJobsAdmin,
    deleteJobAdmin
};
