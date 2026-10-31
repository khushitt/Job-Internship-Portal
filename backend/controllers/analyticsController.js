
const db = require("../config/db");

// ==============================
// GET RECRUITER ANALYTICS
// ==============================

const getRecruiterAnalytics = (req, res) => {
    const user_id = req.user.user_id;

    // Get recruiter_id first
    const recruiterQuery =
        "SELECT recruiter_id FROM recruiters WHERE user_id = ?";

    db.query(recruiterQuery, [user_id], (err, recruiterResults) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (recruiterResults.length === 0) {
            return res.status(404).json({
                message: "Recruiter profile not found"
            });
        }

        const recruiter_id = recruiterResults[0].recruiter_id;

        // Overall stats
        const statsQuery = `
            SELECT
                COUNT(DISTINCT j.job_id)           AS total_jobs,
                COUNT(DISTINCT a.application_id)   AS total_applications,
                SUM(a.application_status = 'Shortlisted') AS shortlisted,
                SUM(a.application_status = 'Selected')    AS selected,
                SUM(a.application_status = 'Rejected')    AS rejected,
                SUM(a.application_status = 'Applied')     AS pending
            FROM jobs j
            LEFT JOIN applications a ON j.job_id = a.job_id
            WHERE j.recruiter_id = ?
        `;

        db.query(statsQuery, [recruiter_id], (err, statsResults) => {
            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            const overallStats = statsResults[0];

            // Per-job application counts
            const jobStatsQuery = `
                SELECT
                    j.job_id,
                    j.title,
                    j.job_type,
                    j.location,
                    j.created_at,
                    COUNT(a.application_id) AS application_count,
                    SUM(a.application_status = 'Shortlisted') AS shortlisted,
                    SUM(a.application_status = 'Selected')    AS selected,
                    SUM(a.application_status = 'Rejected')    AS rejected
                FROM jobs j
                LEFT JOIN applications a ON j.job_id = a.job_id
                WHERE j.recruiter_id = ?
                GROUP BY j.job_id
                ORDER BY application_count DESC
            `;

            db.query(
                jobStatsQuery,
                [recruiter_id],
                (err, jobStats) => {
                    if (err) {
                        return res.status(500).json({
                            message: "Database error",
                            error: err.message
                        });
                    }

                    // Applications per day (last 7 days)
                    const trendQuery = `
                        SELECT
                            DATE(a.applied_at) AS date,
                            COUNT(*)           AS count
                        FROM applications a
                        INNER JOIN jobs j ON a.job_id = j.job_id
                        WHERE j.recruiter_id = ?
                        AND a.applied_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                        GROUP BY DATE(a.applied_at)
                        ORDER BY date ASC
                    `;

                    db.query(
                        trendQuery,
                        [recruiter_id],
                        (err, trendData) => {
                            if (err) {
                                return res.status(500).json({
                                    message: "Database error",
                                    error: err.message
                                });
                            }

                            res.status(200).json({
                                message: "Recruiter analytics retrieved successfully",
                                overall: overallStats,
                                job_stats: jobStats,
                                application_trend: trendData
                            });
                        }
                    );
                }
            );
        });
    });
};


// ==============================
// EXPORT
// ==============================

module.exports = {
    getRecruiterAnalytics
};
