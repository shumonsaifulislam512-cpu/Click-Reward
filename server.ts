import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HMAC_SECRET = process.env.AD_VERIFICATION_SECRET || 'bkash_ptc_secure_hmac_secret_2026_salt_9988';

app.use(express.json());

// In-Memory Replay Cache and Store for backend API testing
const activeAdSessions = new Map<string, {
  sessionId: string;
  userId: string;
  adId: string;
  startedAt: number;
  minDurationSeconds: number;
  clientNonce: string;
  claimed: boolean;
}>();

// Simple in-memory rate limiter per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
function rateLimiter(limit = 100, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = requestCounts.get(ip);

    if (!entry || now > entry.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      return res.status(429).json({ error: 'Too many requests, please slow down.' });
    }

    entry.count += 1;
    next();
  };
}

// --------------------------------------------------------------------------
// 1. Health & Info
// --------------------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'ClickReward bKash PTC Platform API',
    timestamp: new Date().toISOString(),
    version: '1.2.0-beta'
  });
});

// --------------------------------------------------------------------------
// 2. Authentication Mock Routes
// --------------------------------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'admin@bkashreward.com') {
    return res.json({
      token: 'jwt_mock_admin_token_xyz',
      user: {
        id: 'usr_admin_001',
        email: 'admin@bkashreward.com',
        name: 'Chief Admin (System)',
        role: 'ADMIN',
        bkashNumber: '01875338959'
      }
    });
  }
  return res.json({
    token: 'jwt_mock_user_token_abc',
    user: {
      id: 'usr_demo_101',
      email: email || 'shumonsaifulislam512@gmail.com',
      name: 'Saiful Islam',
      role: 'USER',
      bkashNumber: '01712345678'
    }
  });
});

// --------------------------------------------------------------------------
// 3. PTC Ad Security Engine Endpoints
// --------------------------------------------------------------------------

// Start Ad Session (Generates HMAC Token)
app.post('/api/ads/start-session', (req: Request, res: Response) => {
  const { adId, userId = 'usr_demo_101', minDurationSeconds = 15 } = req.body;
  
  const sessionId = 'ses_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
  const startedAt = Date.now();
  const clientNonce = crypto.randomBytes(8).toString('hex');

  // Compute HMAC-SHA256 signature
  const dataString = `${sessionId}:${userId}:${adId}:${startedAt}:${minDurationSeconds}:${clientNonce}:${HMAC_SECRET}`;
  const signature = crypto.createHash('sha256').update(dataString).digest('hex');

  // Store in active sessions map
  activeAdSessions.set(sessionId, {
    sessionId,
    userId,
    adId,
    startedAt,
    minDurationSeconds,
    clientNonce,
    claimed: false,
  });

  res.json({
    sessionId,
    userId,
    adId,
    startedAt,
    minDurationSeconds,
    clientNonce,
    signature,
  });
});

// Claim Ad Reward (Cryptographic Verification)
app.post('/api/ads/claim-reward', rateLimiter(10, 60000), (req: Request, res: Response) => {
  const { sessionToken, captchaAnswer, expectedCaptcha } = req.body;

  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing sessionToken' });
  }

  const { sessionId, userId, adId, startedAt, minDurationSeconds, clientNonce, signature } = sessionToken;

  // 1. Verify Session Exists and Replay Protection
  const sessionRecord = activeAdSessions.get(sessionId);
  if (!sessionRecord) {
    return res.status(403).json({ error: 'Session expired or not found.' });
  }
  if (sessionRecord.claimed) {
    return res.status(409).json({ error: 'Replay attack prevented: Token already redeemed.' });
  }

  // 2. Verify HMAC Signature
  const expectedData = `${sessionId}:${userId}:${adId}:${startedAt}:${minDurationSeconds}:${clientNonce}:${HMAC_SECRET}`;
  const computedSig = crypto.createHash('sha256').update(expectedData).digest('hex');

  if (computedSig !== signature) {
    return res.status(403).json({ error: 'Cryptographic signature mismatch! Ad token tampered.' });
  }

  // 3. Timing Verification
  const now = Date.now();
  const elapsedSeconds = (now - startedAt) / 1000;
  if (elapsedSeconds < minDurationSeconds - 0.8) {
    return res.status(400).json({ 
      error: `Fast-click detected: Only ${elapsedSeconds.toFixed(1)}s elapsed of required ${minDurationSeconds}s.` 
    });
  }

  // 4. Mark session claimed
  sessionRecord.claimed = true;

  return res.json({
    success: true,
    rewardAmount: 10.00,
    message: 'Ad view validated successfully. ৳10.00 BDT credited.',
    elapsedSeconds: parseFloat(elapsedSeconds.toFixed(1)),
  });
});

// --------------------------------------------------------------------------
// 4. bKash Tokenized Checkout Sandbox Simulator Route
// --------------------------------------------------------------------------
app.post('/api/bkash/tokenized/create', (req: Request, res: Response) => {
  const { amount = 1000, payerReference } = req.body;
  const paymentID = 'BK_TRX_' + Date.now().toString(36).toUpperCase();

  res.json({
    paymentID,
    createTime: new Date().toISOString(),
    orgLogo: 'https://www.bkash.com/logo.png',
    orgName: 'ClickReward Platform',
    transactionStatus: 'Initiated',
    amount: amount.toString(),
    currency: 'BDT',
    intent: 'sale',
    merchantInvoiceNumber: 'INV-' + Date.now(),
    bkashURL: `/bkash-mock-checkout?paymentID=${paymentID}`
  });
});

// --------------------------------------------------------------------------
// Mount Vite Middleware (Dev) or Static Files (Prod)
// --------------------------------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ClickReward] Fullstack Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
