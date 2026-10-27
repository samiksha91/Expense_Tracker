import { Router } from "express";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { categorySchema } from "../schemas.js";

const router = Router();

router.get("/", requireAuth, listCategories);
router.post("/", requireAuth, validate(categorySchema), createCategory);
router.put("/:id", requireAuth, validate(categorySchema), updateCategory);
router.delete("/:id", requireAuth, deleteCategory);

export default router;
