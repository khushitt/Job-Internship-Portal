
const db = require("../config/db");

// ==============================
// GET JOB RECOMMENDATIONS
// Compares student skills with job requirements
// Returns jobs ranked by match percentage
// ==============================

const getRecommendations = (req, res) => {
    const user_id = req.user.user_id;

    // Step 1: Get student skills
    const studentQuery = `
        SELECT student_id, skills
        FROM students
        WHERE user_id = ?
    `;

    db.query(studentQuery, [user_id], (err, studentResults) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (studentResults.length === 0) {
            return res.status(404).json({
                message: "Student profile not found. Please complete your profile first."
            });
        }

        const student = studentResults[0];
        const rawSkills = student.skills || "";

        // Parse student skill list (comma-separated)
        const studentSkills = rawSkills
            .split(",")
            .map(s => s.trim().toLowerCase())
            .filter(s => s.length > 0);

        // Step 2: Get all jobs (exclude already applied)
        const jobsQuery = `
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
                j.created_at,
                CASE WHEN a.application_id IS NOT NULL THEN 1 ELSE 0 END AS already_applied,
                CASE WHEN sv.id IS NOT NULL THEN 1 ELSE 0 END AS is_saved
            FROM jobs j
            LEFT JOIN applications a
                ON j.job_id = a.job_id AND a.student_id = ?
            LEFT JOIN saved_jobs sv
                ON j.job_id = sv.job_id AND sv.student_id = ?
            ORDER BY j.created_at DESC
        `;

        db.query(
            jobsQuery,
            [student.student_id, student.student_id],
            (err, jobs) => {
                if (err) {
                    return res.status(500).json({
                        message: "Database error",
                        error: err.message
                    });
                }

                // Step 3: Calculate match percentage for each job
                const recommendations = jobs.map(job => {
                    const jobSkillsRaw = job.skills_required || "";
                    const jobSkills = jobSkillsRaw
                        .split(",")
                        .map(s => s.trim().toLowerCase())
                        .filter(s => s.length > 0);

                    if (jobSkills.length === 0) {
                        return {
                            ...job,
                            match_percentage: 0,
                            matched_skills: [],
                            missing_skills: []
                        };
                    }

                    const matched = jobSkills.filter(js =>
                        studentSkills.some(ss =>
                            ss.includes(js) || js.includes(ss)
                        )
                    );

                    const missing = jobSkills.filter(js =>
                        !studentSkills.some(ss =>
                            ss.includes(js) || js.includes(ss)
                        )
                    );

                    const matchPercentage = Math.round(
                        (matched.length / jobSkills.length) * 100
                    );

                    return {
                        ...job,
                        match_percentage: matchPercentage,
                        matched_skills: matched,
                        missing_skills: missing
                    };
                });

                // Step 4: Sort by match percentage (highest first), then by date
                recommendations.sort((a, b) => {
                    if (b.match_percentage !== a.match_percentage) {
                        return b.match_percentage - a.match_percentage;
                    }
                    return new Date(b.created_at) - new Date(a.created_at);
                });

                // Step 5: Return top 10 recommendations with >= 0% match
                const topRecommendations = recommendations.slice(0, 10);

                return res.status(200).json({
                    message: "Job recommendations retrieved successfully",
                    student_skills: studentSkills,
                    total_recommendations: topRecommendations.length,
                    recommendations: topRecommendations
                });
            }
        );
    });
};


// ==============================
// EXPORT
// ==============================

module.exports = {
    getRecommendations
};
