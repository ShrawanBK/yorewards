import bcrypt from "bcryptjs";

const PIN_BCRYPT_ROUNDS = 10;
const PIN_REGEX = /^\d{4,6}$/;

export function isValidStaffPin(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

export async function hashStaffPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, PIN_BCRYPT_ROUNDS);
}

export async function verifyStaffPin(
  pin: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(pin, hash);
}
