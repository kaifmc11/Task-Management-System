import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/**
 * Establishes connection to MongoDB database
 * @returns {Promise<void>}
 */
export const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Database connection established successfully");
  } catch (error) {
    console.error("❌ Database Connection Error:", error.message);
    // Proper error handling for production
    process.exit(1);
  }
};

/**
 * Creates and sets JWT token in cookie
 * @param {Object} res - Express response object
 * @param {string} userId - User ID to encode in token
 * @param {Object} additionalData - Optional additional data to include in token
 * @returns {string} Generated JWT token
 */
export const createJWT = (res, userId, additionalData = {}) => {
  try {
    // Create token payload
    const tokenPayload = {
      userId,
      ...additionalData,
    };

    // Generate JWT token
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_LIFETIME || "1d",
    });

    // Set secure cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
    };
console.log(token,"token");

    // Set cookie in response
    res.cookie("token", token, cookieOptions);

    return token;
  } catch (error) {
    console.error("Token Creation Error:", error.message);
    throw new Error("Error creating authentication token");
  }
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

/**
 * Clear authentication cookie
 * @param {Object} res - Express response object
 */
export const clearAuthCookie = (res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
};