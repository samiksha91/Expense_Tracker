import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import * as userModel from "../models/user.js";
import * as categoryModel from "../models/category.js";
import { signAccessToken } from "../utils/jwt.js";

const COOKIE_NAME = "token";

function setTokenCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 60 * 60 * 1000,
    path: "/",
  });
}

export async function register(req, res) {
  const { name, email, password } = req.validated;

  const existing = await userModel.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await userModel.createUser({ name, email, passwordHash });
  await categoryModel.createDefaultCategories(user.id);

  setTokenCookie(res, signAccessToken(user.id));
  return res.status(201).json({ data: { id: user.id, name: user.name, email: user.email } });
}

export async function login(req, res) {
  const { email, password } = req.validated;

  const user = await userModel.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  setTokenCookie(res, signAccessToken(user.id));
  return res.json({ data: { id: user.id, name: user.name, email: user.email } });
}

export function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  return res.json({ data: null });
}

export async function me(req, res) {
  const user = await userModel.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ data: { id: user.id, name: user.name, email: user.email } });
}

export async function updateName(req, res) {
  const user = await userModel.updateUserName(req.user.id, req.validated.name);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ data: { id: user.id, name: user.name, email: user.email } });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.validated;

  const current = await userModel.findUserById(req.user.id);
  if (!current) {
    return res.status(404).json({ error: "User not found" });
  }

  const record = await userModel.findUserByEmail(current.email);
  const passwordMatches = await bcrypt.compare(currentPassword, record.password_hash);
  if (!passwordMatches) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await userModel.updateUserPassword(req.user.id, passwordHash);

  return res.json({ data: null });
}
