import bcrypt from "bcryptjs";

export async function hashSecret(value: string): Promise<string> {
  return bcrypt.hash(value, 12);
}

export async function verifySecret(value: string, hash: string): Promise<boolean> {
  return bcrypt.compare(value, hash);
}
