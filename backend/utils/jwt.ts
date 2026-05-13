import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export interface JwtPayload {
  userId: string;
  role: string;
  hospitalId?: string;
}

export const generateToken = (payload: JwtPayload, expiresIn: string | number = "7d"): string => {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};
