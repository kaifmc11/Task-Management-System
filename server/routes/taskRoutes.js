import express from "express";
import {
  createSubTask,
  createTask,
  dashboardStatistics,
  deleteRestoreTask,
  duplicateTask,
  getTask,
  getTasks,
  postTaskActivity,
  trashTask,
  updateTask,
  getTaskFiles,
} from "../controllers/taskController.js";
import { isAdminRoute, protectRoute } from "../middlewares/authMiddlewave.js";
import { 
  uploadFile, 
  uploadMiddleware,
  getFile, 
  deleteFile
} from "../utils/gridFsStorage.js";

const router = express.Router();

// File Routes
router.post(
  '/upload', 
  protectRoute, 
  isAdminRoute,
  uploadMiddleware,
  uploadFile
);

// Get file
router.get(
  "/files/:fileId", 
  protectRoute, 
  getFile
);

// Delete file
router.delete(
  "/:taskId/files/:fileId", 
  protectRoute, 
  isAdminRoute, 
  deleteFile
);

// Get task files
router.get(
  "/task-files/:taskId", 
  protectRoute, 
  getTaskFiles
);

// Task Management Routes
router.post("/create", protectRoute, isAdminRoute, createTask);
router.post("/duplicate/:id", protectRoute, isAdminRoute, duplicateTask);
router.get("/dashboard", protectRoute, dashboardStatistics);
router.get("/", protectRoute, getTasks);
router.get("/:id", protectRoute, getTask);
router.post("/activity/:id", protectRoute, postTaskActivity);
router.put("/create-subtask/:id", protectRoute, isAdminRoute, createSubTask);
router.put("/update/:id", protectRoute, updateTask);
router.put("/trash/:id", protectRoute, isAdminRoute, trashTask);
router.delete("/delete-restore/:id?", protectRoute, isAdminRoute, deleteRestoreTask);

export default router;