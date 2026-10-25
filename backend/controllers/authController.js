const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// ==============================
// REGISTER USER
// ==============================

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // 1. Check required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // 2. Check valid role
        const validRoles = ["student", "recruiter", "admin"];

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        // 3. Check whether email already exists
        const checkEmailQuery =
            "SELECT * FROM users WHERE email = ?";

        db.query(checkEmailQuery, [email], async (err, results) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            if (results.length > 0) {
                return res.status(409).json({
                    message: "Email already registered"
                });
            }

            // 4. Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // 5. Insert user into database
            const insertQuery = `
                INSERT INTO users (name, email, password, role)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                insertQuery,
                [name, email, hashedPassword, role],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({
                            message: "Failed to register user",
                            error: err.message
                        });
                    }

                    // 6. Send success response
                    res.status(201).json({
                        message: "User registered successfully",
                        user_id: result.insertId
                    });
                }
            );
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==============================
// LOGIN USER
// ==============================

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // 2. Find user by email
        const query = "SELECT * FROM users WHERE email = ?";

        db.query(query, [email], async (err, results) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err.message
                });
            }

            // 3. Check whether user exists
            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            const user = results[0];

            // 4. Compare entered password with hashed password
            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            // 5. Create JWT token
            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );

            // 6. Login successful
            res.status(200).json({
                message: "Login successful",
                token: token,
                user: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==============================
// EXPORT FUNCTIONS
// ==============================

module.exports = {
    registerUser,
    loginUser
};