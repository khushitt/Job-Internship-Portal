
const db = require("../config/db");

// =====================================
// CREATE STUDENT PROFILE
// =====================================

const createStudentProfile = (req, res) => {
    const { phone, college, degree, skills, resume } = req.body;
    const user_id = req.user.user_id;

    // Validate required fields
    if (!college || !degree) {
        return res.status(400).json({
            message: "College and degree are required"
        });
    }

    // Check whether a profile already exists
    const checkQuery = `
        SELECT student_id
        FROM students
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
                message: "Student profile already exists"
            });
        }

        // Insert the new student profile
        const insertQuery = `
            INSERT INTO students
                (user_id, phone, college, degree, skills, resume)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
            insertQuery,
            [user_id, phone, college, degree, skills, resume],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message: "Failed to create student profile",
                        error: err.message
                    });
                }

                return res.status(201).json({
                    message: "Student profile created successfully",
                    student_id: result.insertId
                });
            }
        );
    });
};


// =====================================
// GET STUDENT PROFILE
// =====================================

const getStudentProfile = (req, res) => {
    const user_id = req.user.user_id;

    // Retrieve account details and student profile
    const query = `
        SELECT
            s.student_id,
            s.user_id,
            u.name,
            u.email,
            s.phone,
            s.college,
            s.degree,
            s.skills,
            s.resume
        FROM students AS s
        INNER JOIN users AS u
            ON s.user_id = u.user_id
        WHERE s.user_id = ?
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
                message: "Student profile not found"
            });
        }

        return res.status(200).json({
            message: "Student profile retrieved successfully",
            profile: results[0]
        });
    });
};


// =====================================
// UPDATE STUDENT PROFILE
// =====================================

const updateStudentProfile = (req, res) => {
    const user_id = req.user.user_id;
    const { phone, college, degree, skills, resume } = req.body;

    const query = `
        UPDATE students
        SET
            phone = ?,
            college = ?,
            degree = ?,
            skills = ?,
            resume = ?
        WHERE user_id = ?
    `;

    db.query(
        query,
        [phone, college, degree, skills, resume, user_id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Student profile not found"
                });
            }

            return res.status(200).json({
                message: "Student profile updated successfully"
            });
        }
    );
};


// =====================================
// EXPORT CONTROLLER FUNCTIONS
// =====================================

module.exports = {
    createStudentProfile,
    getStudentProfile,
    updateStudentProfile
};
