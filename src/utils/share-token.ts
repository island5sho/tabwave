import crypto from 'crypto';

export interface ShareTokenPayload {
  sessionId: string;
  expiresAt: number;
  readonly: boolean;
}

export function generateShareToken(payload: ShareTokenPayload): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString('base64url');
  const hmac = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${hmac}`;
}

export function verifyShareToken(token: string): ShareTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expectedHmac = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');

  if (signature !== expectedHmac) return null;

  try {
    const data = Buffer.from(encoded, 'base64url').toString('utf-8');
    const payload: ShareTokenPayload = JSON.parse(data);

    if (Date.now() > payload.expiresAt) return null;

    return payload;
  } catch {
    return null;
  }
}

function getSecret(): string {
  return process.env.TABWAVE_SECRET ?? 'tabwave-default-secret';
}
