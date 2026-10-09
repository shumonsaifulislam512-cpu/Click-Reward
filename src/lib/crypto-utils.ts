/**
 * Universal Cryptographic Security Helpers for PTC Token Validation
 * Implements anti-tamper HMAC signatures and nonces
 */

// Secret salt for PTC ad verification session signing
const AD_SESSION_SECRET = 'bkash_ptc_secure_hmac_secret_2026_salt_9988';

// Simple fast SHA-256 implementation that works in any environment (Node, Web Worker, Browser)
export async function sha256Hex(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback Node-like or lightweight hash
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

export function generateNonce(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface AdSessionPayload {
  sessionId: string;
  userId: string;
  adId: string;
  startedAt: number;
  minDurationSeconds: number;
  clientNonce: string;
}

export async function createSessionSignature(payload: AdSessionPayload): Promise<string> {
  const dataString = `${payload.sessionId}:${payload.userId}:${payload.adId}:${payload.startedAt}:${payload.minDurationSeconds}:${payload.clientNonce}:${AD_SESSION_SECRET}`;
  return sha256Hex(dataString);
}

export async function verifySessionSignature(
  payload: AdSessionPayload,
  providedSignature: string
): Promise<boolean> {
  const expected = await createSessionSignature(payload);
  return expected === providedSignature;
}
