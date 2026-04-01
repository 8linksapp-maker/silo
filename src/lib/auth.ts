import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  import.meta.env.JWT_SECRET || 'silo-super-secret-key-please-change-in-production'
);

export interface TokenPayload {
  userId: number;
  username: string;
}

export async function createToken(userId: number, username: string): Promise<string> {
  return new SignJWT({ userId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
