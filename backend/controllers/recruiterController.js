const db = require("../config/db");

// ==============================
// CREATE RECRUITER PROFILE
// ==============================

const createRecruiterProfile = (req, res) => {

    const { company_name, company_description, company_website, phone } = req.body;

    const user_id = req.user.user_id;

    // Required field
    if (!company_name) {
        return res.status(400).json({
            message: "Company name is required"
        });
    }

    // Check whether profile already exists
    const checkQuery = `
        SELECT * FROM recruiters
        WHERE user_id = ?
    `;

    db.query(checkQuery, [user_id], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (results.length > 0) {
            return res.status(409).json({
                message: "Recruiter profile already exists"
            });
        }

        // Insert recruiter profile
        const insertQuery = `
            INSERT INTO recruiters
            (user_id, company_name, company_description, company_website, phone)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            insertQuery,
            [
                user_id,
                company_name,
                company_description,
                company_website,
                phone
            ],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to create recruiter profile",
                        error: err.message
                    });
                }

                res.status(201).json({
                    message: "Recruiter profile created successfully",
                    recruiter_id: result.insertId
                });
            }
        );
    });
};


// ==============================
// GET RECRUITER PROFILE
// ==============================

const getRecruiterProfile = (req, res) => {

    const user_id = req.user.user_id;

    const query = `
        SELECT
            recruiter_id,
            user_id,
            company_name,
            company_description,
            company_website,
            phone
        FROM recruiters
        WHERE user_id = ?
    `;

    db.query(query, [user_id], (err, results) => {

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

        res.status(200).json({
            message: "Recruiter profile retrieved successfully",
            profile: results[0]
        });
    });
};


// ==============================
// UPDATE RECRUITER PROFILE
// ==============================

const updateRecruiterProfile = (req, res) => {

    const user_id = req.user.user_id;

    const {
        company_name,
        company_description,
        company_website,
        phone
    } = req.body;

    const query = `
        UPDATE recruiters
        SET
            company_name = ?,
            company_description = ?,
            company_website = ?,
            phone = ?
        WHERE user_id = ?
    `;

    db.query(
        query,
        [
            company_name,
            company_description,
            company_website,
            phone,
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
                    message: "Recruiter profile not found"
                });
            }

            res.status(200).json({
                message: "Recruiter profile updated successfully"
            });
        }
    );
};


// ==============================
// EXPORT FUNCTIONS
// ==============================

module.exports = {
    createRecruiterProfile,
    getRecruiterProfile,
    updateRecruiterProfile
};