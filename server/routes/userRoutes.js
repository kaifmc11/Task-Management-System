import express from "express";
import { isAdminRoute, protectRoute } from "../middlewares/authMiddlewave.js";
import {
    activateUserProfile,
    changeUserPassword,
    deleteUserProfile,
    getNotificationsList,
    getTeamList,
    loginUser,
    logoutUser,
    markNotificationRead,
    createUser,
    updateUser,
    getCurrentUser
} from "../controllers/userController.js";

import {
    registerUser,
    getPendingApprovals,
    approveUser,
    rejectUser,
    getPendingUser,
} from "../controllers/UserApprovalController.js";

const router = express.Router();

// User registration and authentication routes
router.post("/register", registerUser);
router.post("/create", protectRoute, isAdminRoute, createUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Protected routes for user actions
router.get("/get-team", protectRoute, getTeamList);
router.get("/notifications", protectRoute, getNotificationsList);

// User profile management
router.put("/profile", protectRoute, updateUser);
router.put("/read-noti", protectRoute, markNotificationRead);
router.put("/change-password", protectRoute, changeUserPassword);

// Admin-only routes for managing users
router.route("/:id")
    .put(protectRoute, isAdminRoute, activateUserProfile)
    .delete(protectRoute, isAdminRoute, deleteUserProfile);

// New admin route for updating user details
router.put("/update/:id", protectRoute, isAdminRoute, updateUser);

// User approval routes
router.get("/pending-approvals", protectRoute, isAdminRoute, getPendingApprovals);
router.get("/pending/:id", protectRoute, isAdminRoute, getPendingUser);
router.post("/approve/:id", protectRoute, isAdminRoute, approveUser);
router.post("/reject/:id", protectRoute, isAdminRoute, rejectUser);

router.get("/current", protectRoute, getCurrentUser);

export default router;