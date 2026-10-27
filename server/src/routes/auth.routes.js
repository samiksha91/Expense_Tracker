import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  me,
  updateName,
  changePassword,
} from "../controllers/auth.controller.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  updateNameSchema,
  changePasswordSchema,
} from "../schemas.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

function limitUnlessTest() {
  return env.NODE_ENV === "test" ? (req, res, next) => next() : authLimiter;
}

router.post("/register", limitUnlessTest(), validate(registerSchema), register);
router.post("/login", limitUnlessTest(), validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, validate(updateNameSchema), updateName);
router.put("/password", requireAuth, validate(changePasswordSchema), changePassword);

export default router;
