const db = require("../config/db");

// ==============================
// CREATE JOB / INTERNSHIP
// ==============================

const createJob = (req, res) => {

    const {
        title,
        description,
        company_name,
        location,
        job_type,
        skills_required,
        salary,
        application_deadline
    } = req.body;

    const user_id = req.user.user_id;

    // Required fields
    if (
        !title ||
        !description ||
        !company_name ||
        !job_type
    ) {
        return res.status(400).json({
            message: "Title, description, company name and job type are required"
        });
    }

    // Validate job type
    if (!["Job", "Internship"].includes(job_type)) {
        return res.status(400).json({
            message: "Job type must be Job or Internship"
        });
    }

    // Find recruiter using logged-in user
    const recruiterQuery = `
        SELECT recruiter_id
        FROM recruiters
        WHERE user_id = ?
    `;

    db.query(recruiterQuery, [user_id], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Recruiter profile not found"
            });
        }

        const recruiter_id = results[0].recruiter_id;

        // Insert job
        const insertQuery = `
            INSERT INTO jobs
            (
                recruiter_id,
                title,
                description,
                company_name,
                location,
                job_type,
                skills_required,
                salary,
                application_deadline
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            insertQuery,
            [
                recruiter_id,
                title,
                description,
                company_name,
                location,
                job_type,
                skills_required,
                salary,
                application_deadline
            ],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to create job",
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: "Job/Internship created successfully",
                    job_id: result.insertId
                });
            }
        );
    });
};


// ==============================
// GET ALL JOBS / INTERNSHIPS
// ==============================

const getAllJobs = (req, res) => {

    const query = `
        SELECT
            job_id,
            recruiter_id,
            title,
            description,
            company_name,
            location,
            job_type,
            skills_required,
            salary,
            application_deadline,
            created_at
        FROM jobs
        ORDER BY created_at DESC
    `;

    db.query(query, (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.status(200).json({
            message: "Jobs retrieved successfully",
            jobs: results
        });
    });
};


// ==============================
// GET SINGLE JOB
// ==============================

const getJobById = (req, res) => {

    const job_id = req.params.id;

    const query = `
        SELECT
            job_id,
            recruiter_id,
            title,
            description,
            company_name,
            location,
            job_type,
            skills_required,
            salary,
            application_deadline,
            created_at
        FROM jobs
        WHERE job_id = ?
    `;

    db.query(query, [job_id], (err, results) => {

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

        res.status(200).json({
            message: "Job retrieved successfully",
            job: results[0]
        });
    });
};


// ==============================
// GET RECRUITER'S JOBS
// ==============================

const getMyJobs = (req, res) => {

    const user_id = req.user.user_id;

    const query = `
        SELECT
            j.job_id,
            j.title,
            j.description,
            j.company_name,
            j.location,
            j.job_type,
            j.skills_required,
            j.salary,
            j.application_deadline,
            j.created_at
        FROM jobs j
        INNER JOIN recruiters r
            ON j.recruiter_id = r.recruiter_id
        WHERE r.user_id = ?
        ORDER BY j.created_at DESC
    `;

    db.query(query, [user_id], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.status(200).json({
            message: "Your jobs retrieved successfully",
            jobs: results
        });
    });
};


// ==============================
// UPDATE JOB / INTERNSHIP
// ==============================

const updateJob = (req, res) => {

    const job_id = req.params.id;
    const user_id = req.user.user_id;

    const {
        title,
        description,
        company_name,
        location,
        job_type,
        skills_required,
        salary,
        application_deadline
    } = req.body;

    if (
        !title ||
        !description ||
        !company_name ||
        !job_type
    ) {
        return res.status(400).json({
            message: "Title, description, company name and job type are required"
        });
    }

    if (!["Job", "Internship"].includes(job_type)) {
        return res.status(400).json({
            message: "Job type must be Job or Internship"
        });
    }

    const query = `
        UPDATE jobs j
        INNER JOIN recruiters r
            ON j.recruiter_id = r.recruiter_id
        SET
            j.title = ?,
            j.description = ?,
            j.company_name = ?,
            j.location = ?,
            j.job_type = ?,
            j.skills_required = ?,
            j.salary = ?,
            j.application_deadline = ?
        WHERE j.job_id = ?
        AND r.user_id = ?
    `;

    db.query(
        query,
        [
            title,
            description,
            company_name,
            location,
            job_type,
            skills_required,
            salary,
            application_deadline,
            job_id,
            user_id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Job not found or you do not have permission to update it"
                });
            }

            res.status(200).json({
                message: "Job/Internship updated successfully"
            });
        }
    );
};


// ==============================
// DELETE JOB / INTERNSHIP
// ==============================

const deleteJob = (req, res) => {

    const job_id = req.params.id;
    const user_id = req.user.user_id;

    const query = `
        DELETE j
        FROM jobs j
        INNER JOIN recruiters r
            ON j.recruiter_id = r.recruiter_id
        WHERE j.job_id = ?
        AND r.user_id = ?
    `;

    db.query(
        query,
        [job_id, user_id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Job not found or you do not have permission to delete it"
                });
            }

            res.status(200).json({
                message: "Job/Internship deleted successfully"
            });
        }
    );
};


// ==============================
// EXPORT FUNCTIONS
// ==============================

module.exports = {
    createJob,
    getAllJobs,
    getJobById,
    getMyJobs,
    updateJob,
    deleteJob
};