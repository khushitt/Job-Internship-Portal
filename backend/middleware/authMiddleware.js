const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {

    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
        return res.status(401).json({
            message: "Access denied. No token provided."
        });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store decoded user information in request
        req.user = decoded;

        // Allow request to continue
        next();

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authenticateToken;