
const db = require("../config/db");

// ==============================
// CREATE JOB / INTERNSHIP
// Recruiter only
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

    const user_id = req.user.id || req.user.user_id;

    if (
        !title ||
        !description ||
        !company_name ||
        !location ||
        !job_type
    ) {
        return res.status(400).json({
            message: "Please provide all required job details"
        });
    }

    if (!["Job", "Internship"].includes(job_type)) {
        return res.status(400).json({
            message: "Job type must be Job or Internship"
        });
    }

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

        const values = [
            recruiter_id,
            title,
            description,
            company_name,
            location,
            job_type,
            skills_required || null,
            salary || null,
            application_deadline || null
        ];

        db.query(insertQuery, values, (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Unable to create job",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Job created successfully",
                job_id: result.insertId
            });
        });
    });
};


// ==============================
// GET ALL JOBS / SMART JOB SEARCH
// Public route
// ==============================

const getAllJobs = (req, res) => {
    const {
        search,
        location,
        job_type,
        skills
    } = req.query;

    let query = `
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
        WHERE 1 = 1
    `;

    const values = [];

    // Search by title, company or required skills
    if (search) {
        query += `
            AND (
                title LIKE ?
                OR company_name LIKE ?
                OR skills_required LIKE ?
            )
        `;

        const searchValue = `%${search}%`;

        values.push(
            searchValue,
            searchValue,
            searchValue
        );
    }

    // Filter by location
    if (location) {
        query += " AND location LIKE ?";
        values.push(`%${location}%`);
    }

    // Filter by job type
    if (job_type) {
        if (!["Job", "Internship"].includes(job_type)) {
            return res.status(400).json({
                message: "Job type must be Job or Internship"
            });
        }

        query += " AND job_type = ?";
        values.push(job_type);
    }

    // Filter by required skills
    if (skills) {
        query += " AND skills_required LIKE ?";
        values.push(`%${skills}%`);
    }

    query += " ORDER BY created_at DESC";

    db.query(query, values, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.status(200).json({
            message: "Jobs retrieved successfully",
            totalJobs: results.length,
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
        SELECT *
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
// GET RECRUITER'S OWN JOBS
// ==============================

const getMyJobs = (req, res) => {
    const user_id = req.user.id || req.user.user_id;

    const query = `
        SELECT jobs.*
        FROM jobs
        INNER JOIN recruiters
        ON jobs.recruiter_id = recruiters.recruiter_id
        WHERE recruiters.user_id = ?
        ORDER BY jobs.created_at DESC
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
            totalJobs: results.length,
            jobs: results
        });
    });
};


// ==============================
// UPDATE JOB / INTERNSHIP
// Recruiter only
// ==============================

const updateJob = (req, res) => {
    const job_id = req.params.id;
    const user_id = req.user.id || req.user.user_id;

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

    if (job_type && !["Job", "Internship"].includes(job_type)) {
        return res.status(400).json({
            message: "Job type must be Job or Internship"
        });
    }

    const query = `
        UPDATE jobs
        INNER JOIN recruiters
        ON jobs.recruiter_id = recruiters.recruiter_id
        SET
            jobs.title = COALESCE(?, jobs.title),
            jobs.description = COALESCE(?, jobs.description),
            jobs.company_name = COALESCE(?, jobs.company_name),
            jobs.location = COALESCE(?, jobs.location),
            jobs.job_type = COALESCE(?, jobs.job_type),
            jobs.skills_required = COALESCE(?, jobs.skills_required),
            jobs.salary = COALESCE(?, jobs.salary),
            jobs.application_deadline = COALESCE(?, jobs.application_deadline)
        WHERE jobs.job_id = ?
        AND recruiters.user_id = ?
    `;

    const values = [
        title ?? null,
        description ?? null,
        company_name ?? null,
        location ?? null,
        job_type ?? null,
        skills_required ?? null,
        salary ?? null,
        application_deadline ?? null,
        job_id,
        user_id
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Job not found or you are not its owner"
            });
        }

        res.status(200).json({
            message: "Job updated successfully"
        });
    });
};


// ==============================
// DELETE JOB / INTERNSHIP
// Recruiter only
// ==============================

const deleteJob = (req, res) => {
    const job_id = req.params.id;
    const user_id = req.user.id || req.user.user_id;

    const query = `
        DELETE jobs
        FROM jobs
        INNER JOIN recruiters
        ON jobs.recruiter_id = recruiters.recruiter_id
        WHERE jobs.job_id = ?
        AND recruiters.user_id = ?
    `;

    db.query(query, [job_id, user_id], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Job not found or you are not its owner"
            });
        }

        res.status(200).json({
            message: "Job deleted successfully"
        });
    });
};


// ==============================
// EXPORT ALL FUNCTIONS
// ==============================

module.exports = {
    createJob,
    getAllJobs,
    getJobById,
    getMyJobs,
    updateJob,
    deleteJob
};
