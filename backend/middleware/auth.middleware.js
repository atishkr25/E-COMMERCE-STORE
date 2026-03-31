import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Middleware to verify access token and protect routes
export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized - No access token provided" });
        }

        // Verify the token
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            
            // Get user from database (excluding password)
            const user = await User.findById(decoded.userId).select("-password");
            
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            // Attach user to request object
            req.user = user;
            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                console.log("error in protect route middlware ")
                return res.status(401).json({ message: "Unauthorized - Access token expired" });
            }
            throw error;
        }
    } catch (error) {
        console.error("Error in protectRoute middleware:", error);
        res.status(401).json({ message: "Unauthorized - Invalid access token" });
    }
};

// Middleware to check if user is admin
export const adminRoute = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({ message: "Access denied - Admin only" });
    }
};
