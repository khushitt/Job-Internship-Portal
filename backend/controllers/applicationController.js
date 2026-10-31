const db = require("../config/db");
const { createNotification } = require("./notificationController");

// ==============================
// APPLY FOR A JOB
// ==============================

const applyForJob = (req, res) => {

    const user_id = req.user.user_id;
    const job_id = req.body.job_id;

    // Check job ID
    if (!job_id) {
        return res.status(400).json({
            message: "Job ID is required"
        });
    }

    // Find student using logged-in user
    const studentQuery = `
        SELECT student_id
        FROM students
        WHERE user_id = ?
    `;

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

        // Check whether job exists
        const jobQuery = `
            SELECT job_id
            FROM jobs
            WHERE job_id = ?
        `;

        db.query(jobQuery, [job_id], (err, results) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Job not found"
                });
            }

            // Check whether student already applied
            const checkApplicationQuery = `
                SELECT application_id
                FROM applications
                WHERE student_id = ?
                AND job_id = ?
            `;

            db.query(
                checkApplicationQuery,
                [student_id, job_id],
                (err, results) => {

                    if (err) {
                        return res.status(500).json({
                            message: "Database error",
                            error: err.message
                        });
                    }

                    if (results.length > 0) {
                        return res.status(409).json({
                            message: "You have already applied for this job"
                        });
                    }

                    // Create application
                    const insertQuery = `
                        INSERT INTO applications
                        (student_id, job_id)
                        VALUES (?, ?)
                    `;

                    db.query(
                        insertQuery,
                        [student_id, job_id],
                        (err, result) => {

                            if (err) {
                                return res.status(500).json({
                                    message: "Failed to apply for job",
                                    error: err.message
                                });
                            }

                            // Send confirmation notification to student
                            const notifJobQuery = `
                                SELECT title, company_name FROM jobs WHERE job_id = ?
                            `;
                            db.query(notifJobQuery, [job_id], (ne, jobRows) => {
                                if (!ne && jobRows.length > 0) {
                                    const msg = `Your application for "${jobRows[0].title}" at ${jobRows[0].company_name} has been submitted successfully.`;
                                    createNotification(user_id, msg);
                                }
                            });

                            res.status(201).json({
                                message: "Job application submitted successfully",
                                application_id: result.insertId
                            });
                        }
                    );
                }
            );
        });
    });
};


// ==============================
// GET MY APPLICATIONS
// ==============================

const getMyApplications = (req, res) => {

    const user_id = req.user.user_id;

    const query = `
        SELECT
            a.application_id,
            a.job_id,
            a.application_status,
            a.applied_at,
            j.title,
            j.description,
            j.company_name,
            j.location,
            j.job_type,
            j.skills_required,
            j.salary,
            j.application_deadline
        FROM applications a
        INNER JOIN students s
            ON a.student_id = s.student_id
        INNER JOIN jobs j
            ON a.job_id = j.job_id
        WHERE s.user_id = ?
        ORDER BY a.applied_at DESC
    `;

    db.query(query, [user_id], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.status(200).json({
            message: "Applications retrieved successfully",
            applications: results
        });
    });
};


// ==============================
// GET APPLICATIONS FOR RECRUITER
// ==============================

const getRecruiterApplications = (req, res) => {

    const user_id = req.user.user_id;

    const query = `
        SELECT
            a.application_id,
            a.application_status,
            a.applied_at,

            s.student_id,
            u.name AS student_name,
            u.email AS student_email,
            s.phone,
            s.college,
            s.degree,
            s.skills,
            s.resume,
            s.resume_file,

            j.job_id,
            j.title AS job_title,
            j.company_name,
            j.location,
            j.job_type

        FROM applications a

        INNER JOIN students s
            ON a.student_id = s.student_id

        INNER JOIN users u
            ON s.user_id = u.user_id

        INNER JOIN jobs j
            ON a.job_id = j.job_id

        INNER JOIN recruiters r
            ON j.recruiter_id = r.recruiter_id

        WHERE r.user_id = ?

        ORDER BY a.applied_at DESC
    `;

    db.query(query, [user_id], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.status(200).json({
            message: "Recruiter applications retrieved successfully",
            applications: results
        });
    });
};

// ==============================
// UPDATE APPLICATION STATUS
// ==============================

const updateApplicationStatus = (req, res) => {

    const user_id = req.user.user_id;
    const application_id = req.params.id;
    const status = req.body.status;

    // Validate status
    const allowedStatuses = [
        "Applied",
        "Shortlisted",
        "Rejected",
        "Selected"
    ];

    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid status. Use Applied, Shortlisted, Rejected, or Selected."
        });
    }

    // Check that this application belongs to a job posted by this recruiter
    const checkQuery = `
        SELECT a.application_id
        FROM applications a
        INNER JOIN jobs j
            ON a.job_id = j.job_id
        INNER JOIN recruiters r
            ON j.recruiter_id = r.recruiter_id
        WHERE a.application_id = ?
        AND r.user_id = ?
    `;

    db.query(
        checkQuery,
        [application_id, user_id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Application not found for your jobs"
                });
            }

            // Update application status
            const updateQuery = `
                UPDATE applications
                SET application_status = ?
                WHERE application_id = ?
            `;

            db.query(
                updateQuery,
                [status, application_id],
                (err) => {

                    if (err) {
                        return res.status(500).json({
                            message: "Failed to update application status",
                            error: err.message
                        });
                    }

                    // Send notification to the student
                    const notifQuery = `
                        SELECT u.user_id, j.title, j.company_name
                        FROM applications a
                        INNER JOIN students s ON a.student_id = s.student_id
                        INNER JOIN users u    ON s.user_id = u.user_id
                        INNER JOIN jobs j     ON a.job_id = j.job_id
                        WHERE a.application_id = ?
                    `;

                    db.query(notifQuery, [application_id], (notifErr, notifRows) => {
                        if (!notifErr && notifRows.length > 0) {
                            const row = notifRows[0];
                            const message = `Your application for "${row.title}" at ${row.company_name} has been updated to: ${status}.`;
                            createNotification(row.user_id, message);
                        }
                    });

                    res.status(200).json({
                        message: "Application status updated successfully",
                        application_id: Number(application_id),
                        status: status
                    });
                }
            );
        }
    );
};

// ==============================
// EXPORT FUNCTIONS
// ==============================

module.exports = {
    applyForJob,
    getMyApplications,
    getRecruiterApplications,
    updateApplicationStatus
};
