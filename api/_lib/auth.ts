import { jwtVerify, SignJWT } from 'jose';

const getSecretKey = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is missing');
  }
  return new TextEncoder().encode(secret);
};

export async function createToken(): Promise<{ token: string; expiresAt: string }> {
  const secretKey = getSecretKey();
  const exp = '30d';

  const token = await new SignJWT({ sub: 'shop' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secretKey);

  // 30 days in ISO string
  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + 30);

  return {
    token,
    expiresAt: expiresDate.toISOString(),
  };
}

export async function verifyToken(authHeader: string | undefined): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload.sub === 'shop';
  } catch {
    return false;
  }
}
