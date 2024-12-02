import express from "express";
import userRoutes from "./userRoutes.js";
import taskRoutes from "./taskRoutes.js";
import teamRoutes from "./teamRoutes.js";

const router = express.Router();

router.use("/user", userRoutes); 

router.use("/task", taskRoutes); 

router.use("/teams", teamRoutes);

export default router;
