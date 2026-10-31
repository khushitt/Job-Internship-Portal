
const path = require("path");
const fs   = require("fs");
const db   = require("../config/db");
const { UPLOAD_DIR } = require("../middleware/uploadMiddleware");

// ==============================
// UPLOAD RESUME
// ==============================

const uploadResume = (req, res) => {
    const user_id = req.user.user_id;

    if (!req.file) {
        return res.status(400).json({
            message: "No file uploaded. Please attach a PDF, DOC or DOCX file."
        });
    }

    const filename = req.file.filename;

    // Get student record to find previous resume
    const studentQuery = "SELECT student_id, resume_file FROM students WHERE user_id = ?";

    db.query(studentQuery, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (results.length === 0) {
            // Remove newly uploaded file since student profile doesn't exist
            fs.unlink(path.join(UPLOAD_DIR, filename), () => {});
            return res.status(404).json({
                message: "Student profile not found. Please create your profile first."
            });
        }

        const { student_id, resume_file: oldFile } = results[0];

        // Delete old resume file if it exists
        if (oldFile) {
            const oldPath = path.join(UPLOAD_DIR, oldFile);
            fs.unlink(oldPath, () => {});  // Ignore error if file doesn't exist
        }

        // Update database with new filename
        const updateQuery = `
            UPDATE students
            SET resume_file = ?
            WHERE student_id = ?
        `;

        db.query(updateQuery, [filename, student_id], (err) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to save resume reference",
                    error: err.message
                });
            }

            res.status(200).json({
                message: "Resume uploaded successfully",
                filename: filename,
                file_url: `/api/student/resume/${filename}`
            });
        });
    });
};


// ==============================
// DOWNLOAD / VIEW RESUME
// Only allows student to view their own, or recruiter to view any
// ==============================

const getResume = (req, res) => {
    const filename = req.params.filename;
    const user_role = req.user.role;
    const user_id   = req.user.user_id;

    // Prevent path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            message: "Resume file not found"
        });
    }

    // For students, ensure they can only access their own resume
    if (user_role === "student") {
        const checkQuery = `
            SELECT resume_file FROM students WHERE user_id = ?
        `;

        db.query(checkQuery, [user_id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(403).json({
                    message: "Access denied"
                });
            }

            if (results[0].resume_file !== safeName) {
                return res.status(403).json({
                    message: "You can only access your own resume"
                });
            }

            res.sendFile(filePath);
        });
    } else {
        // Recruiters and admins can access any resume
        res.sendFile(filePath);
    }
};


// ==============================
// DELETE RESUME
// ==============================

const deleteResume = (req, res) => {
    const user_id = req.user.user_id;

    const studentQuery =
        "SELECT student_id, resume_file FROM students WHERE user_id = ?";

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

        const { student_id, resume_file } = results[0];

        if (!resume_file) {
            return res.status(404).json({
                message: "No resume uploaded yet"
            });
        }

        // Remove file
        const filePath = path.join(UPLOAD_DIR, resume_file);
        fs.unlink(filePath, () => {});

        // Clear DB reference
        db.query(
            "UPDATE students SET resume_file = NULL WHERE student_id = ?",
            [student_id],
            (err) => {
                if (err) {
                    return res.status(500).json({
                        message: "Failed to remove resume reference",
                        error: err.message
                    });
                }

                res.status(200).json({
                    message: "Resume deleted successfully"
                });
            }
        );
    });
};


// ==============================
// EXPORT
// ==============================

module.exports = {
    uploadResume,
    getResume,
    deleteResume
};
