
const path = require("path");
const fs   = require("fs");

let multer;
try {
    multer = require("multer");
} catch (e) {
    // multer not installed yet - will throw at runtime if used before install
    multer = null;
}

// ==============================
// UPLOAD DIRECTORY
// ==============================

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "resumes");

// Create directory if it does not exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ==============================
// MULTER STORAGE CONFIG
// ==============================

let upload;

if (multer) {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
            // Format: resume_<userId>_<timestamp><ext>
            const ext = path.extname(file.originalname).toLowerCase();
            const filename = `resume_${req.user.user_id}_${Date.now()}${ext}`;
            cb(null, filename);
        }
    });

    const fileFilter = (req, file, cb) => {
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        const allowedExts = [".pdf", ".doc", ".docx"];
        const ext = path.extname(file.originalname).toLowerCase();

        if (
            allowedTypes.includes(file.mimetype) &&
            allowedExts.includes(ext)
        ) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Invalid file type. Only PDF, DOC, and DOCX files are allowed."
                ),
                false
            );
        }
    };

    upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024  // 5 MB
        }
    });
}

module.exports = { upload, UPLOAD_DIR };
