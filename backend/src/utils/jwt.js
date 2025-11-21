import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

// `subject` needs at least { id }. `extra` can carry role, providerId, etc.
export function signAccessToken(subject, extra = {}) {
  return jwt.sign({ sub: subject.id, name: subject.name, email: subject.email, ...extra }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

export function signRefreshToken(subject, extra = {}) {
  return jwt.sign({ sub: subject.id, type: "refresh", ...extra }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
