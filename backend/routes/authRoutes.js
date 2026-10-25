const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

// Register API
router.post("/register", registerUser);

// Login API
router.post("/login", loginUser);

// Protected test API
router.get("/protected", authenticateToken, (req, res) => {

    res.status(200).json({
        message: "You have accessed a protected route!",
        user: req.user
    });

});

// Student-only test API
router.get(
    "/student-only",
    authenticateToken,
    authorizeRole("student"),
    (req, res) => {

        res.status(200).json({
            message: "Welcome Student! You have access to this route.",
            user: req.user
        });

    }
);

module.exports = router;