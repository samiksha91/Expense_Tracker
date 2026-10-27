import { Router } from "express";
import {
  listExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expense.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { expenseSchema } from "../schemas.js";

const router = Router();

router.get("/", requireAuth, listExpenses);
router.post("/", requireAuth, validate(expenseSchema), createExpense);
router.get("/:id", requireAuth, getExpense);
router.put("/:id", requireAuth, validate(expenseSchema), updateExpense);
router.delete("/:id", requireAuth, deleteExpense);

export default router;
