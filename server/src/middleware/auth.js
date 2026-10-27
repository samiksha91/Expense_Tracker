import { verifyAccessToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: Number(payload.sub) };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
