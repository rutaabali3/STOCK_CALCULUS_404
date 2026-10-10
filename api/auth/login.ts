import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { loginSchema } from '../../shared/schema';
import { createToken } from '../_lib/auth';
import { checkRateLimit, recordLoginAttempt } from '../_lib/ratelimit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Method Not Allowed' } });
  }

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  try {
    const isAllowed = await checkRateLimit(ip);
    if (!isAllowed) {
      return res.status(429).json({
        error: { code: 'too_many_attempts', message: 'Too many failed login attempts. Try again in 15 minutes.' },
      });
    }

    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: { code: 'bad_request', message: 'Invalid request body' },
      });
    }

    const { pin } = parseResult.data;
    const expectedPin = process.env.APP_PIN;

    if (!expectedPin) {
      return res.status(500).json({
        error: { code: 'server_configuration_error', message: 'APP_PIN is not set on the server' },
      });
    }

    // Constant-time comparison using sha256 hashes
    const hashA = crypto.createHash('sha256').update(pin).digest();
    const hashB = crypto.createHash('sha256').update(expectedPin).digest();

    const isMatch = crypto.timingSafeEqual(hashA, hashB);

    await recordLoginAttempt(ip, isMatch);

    if (!isMatch) {
      return res.status(401).json({
        error: { code: 'invalid_pin', message: 'Invalid PIN' },
      });
    }

    const tokenData = await createToken();
    return res.status(200).json(tokenData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({
      error: { code: 'internal_error', message },
    });
  }
}
