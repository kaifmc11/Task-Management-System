import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Middleware to protect routes
const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.token;


    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Not authorized. Token not found. Please log in again.",
      });
    }

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.userId).select("isAdmin email");

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Not authorized. User not found. Please log in again.",
      });
    }

    req.user = {
      email: user.email,
      isAdmin: user.isAdmin,
      userId: decodedToken.userId,
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      status: false,
      message: "Not authorized. Invalid token. Please log in again.",
    });
  }
};

// Middleware to check admin status
const isAdminRoute = (req, res, next) => {
  if (req.user?.isAdmin) {
    return next();
  } else {
    return res.status(403).json({
      status: false,
      message: "Access denied. Admins only.",
    });
  }
};

export { isAdminRoute, protectRoute };
