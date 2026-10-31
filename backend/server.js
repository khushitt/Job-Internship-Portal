
require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const path       = require("path");

require("./config/db");

// Import routes
const authRoutes         = require("./routes/authRoutes");
const studentRoutes      = require("./routes/studentRoutes");
const recruiterRoutes    = require("./routes/recruiterRoutes");
const jobRoutes          = require("./routes/jobRoutes");
const applicationRoutes  = require("./routes/applicationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes        = require("./routes/adminRoutes");

// Create Express app
const app  = express();
const PORT = process.env.PORT || 5000;

// ==============================
// SECURITY MIDDLEWARE
// ==============================

// Helmet sets secure HTTP headers
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);

// CORS — allow all origins in development
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded resumes (auth enforced inside route handler)
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// ==============================
// API ROUTES
// ==============================

app.use("/api/auth",          authRoutes);
app.use("/api/student",       studentRoutes);
app.use("/api/recruiter",     recruiterRoutes);
app.use("/api/jobs",          jobRoutes);
app.use("/api/applications",  applicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin",         adminRoutes);

// ==============================
// HOME / HEALTH-CHECK ROUTE
// ==============================

app.get("/", (req, res) => {
    res.status(200).json({
        message: "CareerConnect — Job & Internship Portal API is running!",
        version: "2.0.0",
        endpoints: {
            auth:          "/api/auth",
            student:       "/api/student",
            recruiter:     "/api/recruiter",
            jobs:          "/api/jobs",
            applications:  "/api/applications",
            notifications: "/api/notifications",
            admin:         "/api/admin"
        }
    });
});

// ==============================
// GLOBAL ERROR HANDLER
// ==============================

app.use((err, req, res, _next) => {
    console.error("Unhandled error:", err.message);

    // Multer file-too-large error
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            message: "File is too large. Maximum allowed size is 5 MB."
        });
    }

    res.status(err.status || 500).json({
        message: err.message || "Internal server error"
    });
});

// ==============================
// 404 HANDLER
// ==============================

app.use((req, res) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
    console.log(`CareerConnect server is running on http://localhost:${PORT}`);
});
