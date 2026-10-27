import { z } from "zod";

const nullablePositiveId = z.preprocess(
  (value) => (value === null || value === undefined || value === "" ? null : Number(value)),
  z.number().int().positive().nullable()
);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export const updateNameSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const expenseSchema = z.object({
  category_id: nullablePositiveId,
  amount: z.coerce.number().positive(),
  description: z.string().trim().max(255).optional().nullable(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
