import bcrypt from "bcryptjs";
import crypto from "crypto";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const bcryptHashed = async (password: string, salt: number) => {
  const hashed = await bcrypt.hash(password, salt);
  return hashed;
};

export const bcryptCompareHashed = async (
  password: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(password, hashedPassword);
};
