
const db = require("../config/db");

// ==============================
// SAVE A JOB (BOOKMARK)
// ==============================

const saveJob = (req, res) => {
    const user_id = req.user.user_id;
    const job_id = req.body.job_id;

    if (!job_id) {
        return res.status(400).json({
            message: "Job ID is required"
        });
    }

    // Get student_id
    const studentQuery = "SELECT student_id FROM students WHERE user_id = ?";

    db.query(studentQuery, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

        const student_id = results[0].student_id;

        // Check job exists
        db.query(
            "SELECT job_id FROM jobs WHERE job_id = ?",
            [job_id],
            (err, jobResults) => {
                if (err) {
                    return res.status(500).json({
                        message: "Database error",
                        error: err.message
                    });
                }

                if (jobResults.length === 0) {
                    return res.status(404).json({
                        message: "Job not found"
                    });
                }

                // Insert saved job (IGNORE duplicate)
                const insertQuery = `
                    INSERT IGNORE INTO saved_jobs (student_id, job_id)
                    VALUES (?, ?)
                `;

                db.query(
                    insertQuery,
                    [student_id, job_id],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                message: "Failed to save job",
                                error: err.message
                            });
                        }

                        if (result.affectedRows === 0) {
                            return res.status(409).json({
                                message: "Job is already saved"
                            });
                        }

                        res.status(201).json({
                            message: "Job saved successfully"
                        });
                    }
                );
            }
        );
    });
};


// ==============================
// GET SAVED JOBS
// ==============================

const getSavedJobs = (req, res) => {
    const user_id = req.user.user_id;

    const query = `
        SELECT
            sv.id AS saved_id,
            sv.saved_at,
            j.job_id,
            j.title,
            j.description,
            j.company_name,
            j.location,
            j.job_type,
            j.skills_required,
            j.salary,
            j.application_deadline,
            CASE WHEN a.application_id IS NOT NULL THEN 1 ELSE 0 END AS already_applied
        FROM saved_jobs sv
        INNER JOIN students s   ON sv.student_id = s.student_id
        INNER JOIN jobs j       ON sv.job_id = j.job_id
        LEFT JOIN applications a
            ON a.job_id = j.job_id AND a.student_id = sv.student_id
        WHERE s.user_id = ?
        ORDER BY sv.saved_at DESC
    `;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.status(200).json({
            message: "Saved jobs retrieved successfully",
            total: results.length,
            saved_jobs: results
        });
    });
};


// ==============================
// REMOVE SAVED JOB
// ==============================

const removeSavedJob = (req, res) => {
    const user_id = req.user.user_id;
    const job_id  = req.params.job_id;

    const query = `
        DELETE sv
        FROM saved_jobs sv
        INNER JOIN students s ON sv.student_id = s.student_id
        WHERE s.user_id = ?
        AND sv.job_id = ?
    `;

    db.query(query, [user_id, job_id], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Saved job not found"
            });
        }

        res.status(200).json({
            message: "Job removed from saved list"
        });
    });
};


// ==============================
// EXPORT
// ==============================

module.exports = {
    saveJob,
    getSavedJobs,
    removeSavedJob
};
