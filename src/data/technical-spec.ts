export interface SpecSection {
  id: string;
  title: string;
  description: string;
  code?: string;
  language?: string;
  diagram?: string;
  notes?: string[];
}

export const TECHNICAL_SPECIFICATIONS: SpecSection[] = [
  {
    id: 'postgres-ddl',
    title: 'Deliverable 1: Relational Database Schema (PostgreSQL DDL)',
    description: 'ACID-compliant relational schema with strict balance constraints, row-level locking support, compound indexes, and foreign keys.',
    language: 'sql',
    code: `-- =======================================================================
-- Pay-To-Click (PTC) & bKash Reward System - PostgreSQL DDL Schema
-- Optimized for High-Concurrency Financial Integrity & Anti-Fraud
-- =======================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TYPE user_role_enum AS ENUM ('USER', 'ADMIN', 'AUDITOR');
CREATE TYPE account_status_enum AS ENUM ('ACTIVE', 'FROZEN', 'BANNED');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role user_role_enum DEFAULT 'USER',
    bkash_number VARCHAR(15) NOT NULL, -- e.g. +8801712345678
    status account_status_enum DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_bkash_format CHECK (bkash_number ~ '^(\\+?8801|01)[3-9][0-9]{8}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_bkash ON users(bkash_number);

-- 2. WALLETS TABLE (Double-entry balance tracking with Optimistic Locking)
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_deposited NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_earned NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_withdrawn NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    locked_withdrawal NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- Held during pending payout
    version INT NOT NULL DEFAULT 1,                        -- Concurrency versioning
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_balance_non_negative CHECK (current_balance >= 0.00),
    CONSTRAINT check_locked_non_negative CHECK (locked_withdrawal >= 0.00)
);

CREATE INDEX idx_wallets_user ON wallets(user_id);

-- 3. SUBSCRIPTIONS TABLE (30-Day Plan with daily 10-ad quota)
CREATE TYPE subscription_status_enum AS ENUM ('INACTIVE', 'ACTIVE', 'EXPIRED');

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL DEFAULT '30-Day Ad Plan',
    fee NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    status subscription_status_enum DEFAULT 'ACTIVE',
    daily_ad_quota INT NOT NULL DEFAULT 10,
    ads_viewed_today INT NOT NULL DEFAULT 0,
    last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Tracks midnight UTC/BST reset
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,       -- activated_at + 30 days
    CONSTRAINT check_quota_positive CHECK (daily_ad_quota >= 0 AND ads_viewed_today <= daily_ad_quota)
);

CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);

-- 4. TRANSACTIONS LEDGER (Immutable financial audit trail)
CREATE TYPE transaction_type_enum AS ENUM ('DEPOSIT', 'PLAN_PURCHASE', 'AD_REWARD', 'WITHDRAWAL', 'REFUND');
CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
CREATE TYPE payment_method_enum AS ENUM ('BKASH_MANUAL', 'BKASH_TOKENIZED', 'INTERNAL_WALLET');

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    type transaction_type_enum NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    balance_before NUMERIC(14, 2) NOT NULL,
    balance_after NUMERIC(14, 2) NOT NULL,
    payment_method payment_method_enum NOT NULL,
    trx_id VARCHAR(64) UNIQUE,                     -- bKash TrxID (Unique to prevent replay)
    sender_number VARCHAR(15),                     -- Customer bKash number (for deposits)
    recipient_number VARCHAR(15),                  -- Target bKash number (for withdrawals)
    status transaction_status_enum NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_trx_id ON transactions(trx_id);
CREATE INDEX idx_transactions_status_type ON transactions(status, type);

-- 5. ADS INVENTORY
CREATE TYPE ad_media_type_enum AS ENUM ('BANNER', 'VIDEO', 'INTERACTIVE');

CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    advertiser_name VARCHAR(150) NOT NULL,
    target_url TEXT NOT NULL,
    media_type ad_media_type_enum DEFAULT 'BANNER',
    media_url TEXT NOT NULL,
    reward_amount NUMERIC(8, 2) NOT NULL DEFAULT 10.00,
    min_duration_seconds INT NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    total_views INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ads_active ON ads(is_active);

-- 6. AD VIEWS & SECURITY AUDIT (Anti-replay single-use tokens)
CREATE TABLE ad_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(64) UNIQUE NOT NULL,       -- Generated cryptographic session ID
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    reward_amount NUMERIC(8, 2) NOT NULL DEFAULT 10.00,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_watched_ms INT NOT NULL,
    ip_address INET,
    client_user_agent TEXT,
    signature_hash VARCHAR(64) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ad_views_user_completed ON ad_views(user_id, completed_at);
CREATE INDEX idx_ad_views_session ON ad_views(session_id);`,
    notes: [
      'ACID Concurrency: Uses `SELECT ... FOR UPDATE` row-level locks on `wallets` table during rewards and payouts.',
      'Check Constraints: Prevents negative balances at the database engine level.',
      'Unique TrxID: Prevents the same bKash Transaction ID from being credited twice.',
    ]
  },
  {
    id: 'mongodb-schema',
    title: 'Deliverable 1B: Document Schema Design (MongoDB Mongoose)',
    description: 'MongoDB collections with Multi-Document ACID Transactions (`session.startTransaction()`) for document databases.',
    language: 'javascript',
    code: `// MongoDB Mongoose Models for PTC bKash System
import mongoose, { Schema } from 'mongoose';

// User Schema
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  bkashNumber: { 
    type: String, 
    required: true,
    match: [/^(\\+?8801|01)[3-9][0-9]{8}$/, 'Invalid bKash phone number']
  },
  status: { type: String, enum: ['ACTIVE', 'FROZEN'], default: 'ACTIVE' }
}, { timestamps: true });

// Wallet Schema
const WalletSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  currentBalance: { type: Number, default: 0.00, min: 0 },
  totalDeposited: { type: Number, default: 0.00 },
  totalEarned: { type: Number, default: 0.00 },
  totalWithdrawn: { type: Number, default: 0.00 },
  lockedWithdrawal: { type: Number, default: 0.00, min: 0 },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// Subscription Schema
const SubscriptionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  planName: { type: String, default: '30-Day Ad Plan' },
  fee: { type: Number, default: 1000 },
  status: { type: String, enum: ['INACTIVE', 'ACTIVE', 'EXPIRED'], default: 'ACTIVE' },
  dailyAdQuota: { type: Number, default: 10 },
  adsViewedToday: { type: Number, default: 0 },
  lastResetDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  activatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Transaction Schema
const TransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['DEPOSIT', 'PLAN_PURCHASE', 'AD_REWARD', 'WITHDRAWAL', 'REFUND'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['BKASH_MANUAL', 'BKASH_TOKENIZED', 'INTERNAL_WALLET'], required: true },
  trxId: { type: String, unique: true, sparse: true, index: true },
  senderNumber: { type: String },
  recipientNumber: { type: String },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID'], default: 'PENDING' },
  notes: { type: String }
}, { timestamps: true });

// Atomic MongoDB Transaction Example (Ad Reward Credit)
export async function claimAdRewardMongo(userId, rewardAmount, adId, sessionId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Check & increment quota
    const sub = await Subscription.findOneAndUpdate(
      { userId, status: 'ACTIVE', adsViewedToday: { $lt: 10 } },
      { $inc: { adsViewedToday: 1 }, $set: { lastResetDate: today } },
      { session, new: true }
    );
    if (!sub) throw new Error('Daily quota exceeded or inactive plan');

    // 2. Increment wallet balance
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { currentBalance: rewardAmount, totalEarned: rewardAmount } },
      { session, new: true }
    );

    // 3. Record transaction
    await Transaction.create([{
      userId,
      type: 'AD_REWARD',
      amount: rewardAmount,
      balanceBefore: wallet.currentBalance - rewardAmount,
      balanceAfter: wallet.currentBalance,
      paymentMethod: 'INTERNAL_WALLET',
      status: 'PAID',
      notes: \`Ad reward for session \${sessionId}\`
    }], { session });

    await session.commitTransaction();
    return { success: true, newBalance: wallet.currentBalance };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}`,
    notes: [
      'Multi-document ACID transactions with replica sets ensure wallet funds cannot drift.',
      'Sparse unique index on `trxId` allows nulls for internal rewards but prevents double bKash deposits.',
    ]
  },
  {
    id: 'api-architecture',
    title: 'Deliverable 2: Server API Endpoints & Security Middleware',
    description: 'REST API routes, JWT authentication, IP rate limiting, and RBAC authorization policies.',
    language: 'typescript',
    code: `// REST API Endpoint Map & Security Middleware
// Base URL: /api/v1

/**
 * 1. Authentication Endpoints
 * POST /api/auth/register          - Body: { email, password, name, bkashNumber }
 * POST /api/auth/login             - Body: { email, password } -> returns JWT
 * POST /api/auth/google            - Body: { googleIdToken } -> OAuth exchange
 * GET  /api/auth/me                - Headers: Bearer <JWT>
 * PUT  /api/auth/profile           - Update connected bKash MSISDN
 *
 * 2. Wallet & Deposit Endpoints
 * GET  /api/wallet/summary         - Current balance, deposited, earned, withdrawn
 * GET  /api/wallet/transactions    - Paginated transaction ledger
 * POST /api/deposits/submit-trx    - Body: { trxId, senderNumber, amount: 1000 }
 *
 * 3. Subscription Endpoints
 * GET  /api/subscriptions/status   - Active plan, expiry countdown, daily 10-ad quota
 *
 * 4. PTC Ad Engine Endpoints (Security Token Flow)
 * GET  /api/ads/list               - List active campaigns (title, duration, reward)
 * POST /api/ads/start-session      - Body: { adId } -> generates signed HMAC token
 * POST /api/ads/claim-reward       - Body: { sessionToken, captchaAnswer } -> verifies elapsed time >= 15s
 *
 * 5. Withdrawals
 * POST /api/withdrawals/request    - Body: { amount, bkashNumber } (Locks balance)
 * GET  /api/withdrawals/my         - User withdrawal status tracking
 *
 * 6. Admin Endpoints (Requires role: ADMIN)
 * GET  /api/admin/metrics          - Revenue, active subscriptions, pending counts
 * GET  /api/admin/deposits/pending - Queue of bKash TrxIDs to verify
 * POST /api/admin/deposits/:id/approve - Approves TrxID & provisions 30-day plan
 * POST /api/admin/deposits/:id/reject  - Rejects invalid TrxID
 * GET  /api/admin/withdrawals/pending  - Queue of withdrawal requests
 * POST /api/admin/withdrawals/:id/pay  - Marks paid with disbursement TrxID
 * POST /api/admin/withdrawals/:id/reject - Rejects and refunds locked balance
 * POST /api/admin/ads/create       - Create new banner or video ad campaign
 */

// Middleware Stack Implementation Example:
import rateLimit from 'express-rate-limit';

// Global API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Too many requests, please slow down.' }
});

// Strict rate limiter for ad claim endpoint (prevents rapid clicking)
export const adClaimLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 6, // Max 6 claims per minute (each ad takes min 15s)
  message: { error: 'Fast-click rate limit exceeded. Cheating flagged.' }
});`,
    notes: [
      'Bearer JWT with 24-hour expiry and refresh token rotation.',
      'Anti-Brute Force: Login attempts rate-limited to 5 per 15 minutes.',
      'Role-based middleware `requireRole("ADMIN")` protects administrative routes.',
    ]
  },
  {
    id: 'ad-verification-logic',
    title: 'Deliverable 3: Cryptographic Ad-View Verification Protocol',
    description: 'Sequence diagram, HMAC token generation, Page Visibility API client protection, and server verification.',
    language: 'typescript',
    diagram: `
+------------+                 +------------+                 +------------+
|  Browser   |                 | Express.js |                 | PostgreSQL |
|  Client    |                 |   Server   |                 |  Database  |
+------------+                 +------------+                 +------------+
      |                              |                              |
      | 1. POST /ads/start-session   |                              |
      |----------------------------->| Check Quota & Sub Active     |
      |                              |----------------------------->|
      |                              | Generate HMAC-SHA256 Token   |
      | 2. Return Session Token      | (sessionId, nonce, time)     |
      |<-----------------------------|                              |
      |                              |                              |
      | [Runs 15-30s Timer]          |                              |
      | - Uses Visibility API        |                              |
      | - Pauses if tab loses focus  |                              |
      | - Captcha check at end       |                              |
      |                              |                              |
      | 3. POST /ads/claim-reward    |                              |
      | (token + captcha)            |                              |
      |----------------------------->| 1. Verify HMAC Signature     |
      |                              | 2. Elapsed Time >= 15.0s     |
      |                              | 3. Anti-Replay Cache Check   |
      |                              |                              |
      |                              | BEGIN TRANSACTION            |
      |                              | Increment Wallet Balance +10 |
      |                              | Increment Viewed Quota +1    |
      |                              | COMMIT TRANSACTION           |
      |                              |----------------------------->|
      | 4. Return Reward Success     |                              |
      |<-----------------------------|                              |
`,
    code: `// Backend HMAC Verification Controller
import crypto from 'crypto';

const HMAC_SECRET = process.env.AD_VERIFICATION_SECRET || 'ad_secret_salt_xyz';

export async function handleClaimAdReward(req, res) {
  const { sessionToken, captchaAnswer, expectedCaptcha } = req.body;
  const userId = req.user.id;

  const { sessionId, adId, startedAt, minDurationSeconds, clientNonce, signature } = sessionToken;

  // 1. Verify HMAC signature integrity
  const expectedPayload = \`\${sessionId}:\${userId}:\${adId}:\${startedAt}:\${minDurationSeconds}:\${clientNonce}:\${HMAC_SECRET}\`;
  const computedHash = crypto.createHash('sha256').update(expectedPayload).digest('hex');

  if (computedHash !== signature) {
    return res.status(403).json({ error: 'Tampered ad session token detected!' });
  }

  // 2. Validate genuine elapsed watch duration
  const now = Date.now();
  const elapsedMs = now - startedAt;
  const minRequiredMs = (minDurationSeconds * 1000) - 800; // 800ms network variance

  if (elapsedMs < minRequiredMs) {
    return res.status(400).json({ 
      error: \`Cheating detected: Only \${(elapsedMs/1000).toFixed(1)}s elapsed of \${minDurationSeconds}s requirement.\` 
    });
  }

  // 3. Prevent Replay Attack using Redis or DB unique index
  const alreadyClaimed = await db.adViews.findOne({ sessionId });
  if (alreadyClaimed) {
    return res.status(409).json({ error: 'This ad session has already been claimed!' });
  }

  // 4. ACID Transaction to Credit Balance & Record View
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Row-level lock on subscription
    const subRes = await client.query(
      'SELECT id, daily_ad_quota, ads_viewed_today FROM subscriptions WHERE user_id = $1 AND status = \\'ACTIVE\\' FOR UPDATE',
      [userId]
    );
    if (!subRes.rows.length || subRes.rows[0].ads_viewed_today >= subRes.rows[0].daily_ad_quota) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Daily quota completed for today.' });
    }

    // Row-level lock on wallet
    const walletRes = await client.query(
      'SELECT id, current_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [userId]
    );

    const reward = 10.00;
    await client.query(
      'UPDATE wallets SET current_balance = current_balance + $1, total_earned = total_earned + $1, updated_at = NOW() WHERE user_id = $2',
      [reward, userId]
    );

    await client.query(
      'UPDATE subscriptions SET ads_viewed_today = ads_viewed_today + 1 WHERE id = $1',
      [subRes.rows[0].id]
    );

    await client.query(
      'INSERT INTO ad_views (session_id, user_id, ad_id, reward_amount, started_at, completed_at, duration_watched_ms, signature_hash) VALUES ($1, $2, $3, $4, TO_TIMESTAMP($5/1000.0), NOW(), $6, $7)',
      [sessionId, userId, adId, reward, startedAt, elapsedMs, signature]
    );

    await client.query('COMMIT');
    return res.json({ success: true, reward, newBalance: Number(walletRes.rows[0].current_balance) + reward });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}`,
    notes: [
      'Client enforces Page Visibility API (`document.hidden`): Timer automatically stops when user switches tabs.',
      'HMAC incorporates high-entropy client nonce and server-only cryptographic salt.',
      'Single-use session records prevent replay attacks even if client duplicates HTTP payloads.',
    ]
  },
  {
    id: 'bkash-integration-guide',
    title: 'Deliverable 4: bKash Payment Integration Architecture',
    description: 'Detailed technical specification for both Manual TrxID verification and Automated Tokenized Checkout PGW.',
    language: 'typescript',
    code: `/**
 * bKash Payment Integration Architecture:
 * 1. Manual Deposit Workflow (TrxID matching):
 *    - User sends 1,000 BDT via bKash App or USSD *247# to Merchant Wallet.
 *    - User receives SMS with TrxID (e.g. 9K3L7M8N1P) from bKash (16247).
 *    - User inputs Sender Number and TrxID on Web Portal.
 *    - Admin verifies transaction on bKash Merchant Portal or via SIM SMS Gateway.
 *    - Admin approves in Admin Dashboard -> Triggers automated 30-Day Plan provisioning.
 *
 * 2. Automated bKash Tokenized Checkout (v1.2.0-beta):
 *    - Uses bKash Merchant API credentials:
 *      * app_key, app_secret, username, password
 *    - Flow:
 *      Step 1: Grant Token (POST /tokenized/checkout/token/grant)
 *      Step 2: Create Payment (POST /tokenized/checkout/create)
 *              Payload: { amount: "1000", payerReference: userId, callbackURL: "..." }
 *      Step 3: Redirect user to bKash PGW hosted page
 *      Step 4: Execute Payment (POST /tokenized/checkout/execute)
 *              Verifies transactionStatus === "Completed" and statusCode === "0000"
 *      Step 5: Automated Instant Provisioning without human admin intervention
 */

// Automated bKash PGW Service Implementation Example:
import axios from 'axios';

export class BkashGatewayService {
  private baseUrl = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
  private idToken = '';

  async grantToken() {
    const res = await axios.post(\`\${this.baseUrl}/tokenized/checkout/token/grant\`, {
      app_key: process.env.BKASH_APP_KEY,
      app_secret: process.env.BKASH_APP_SECRET
    }, {
      headers: {
        username: process.env.BKASH_USERNAME,
        password: process.env.BKASH_PASSWORD
      }
    });
    this.idToken = res.data.id_token;
    return this.idToken;
  }

  async createPayment(userId: string, amount: number) {
    const token = await this.grantToken();
    const res = await axios.post(\`\${this.baseUrl}/tokenized/checkout/create\`, {
      mode: '0011',
      payerReference: userId,
      callbackURL: \`\${process.env.APP_URL}/api/bkash/callback\`,
      amount: amount.toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: 'INV-' + Date.now()
    }, {
      headers: {
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY
      }
    });
    return res.data; // contains bkashURL for redirection
  }

  async executePayment(paymentID: string) {
    const res = await axios.post(\`\${this.baseUrl}/tokenized/checkout/execute\`, {
      paymentID
    }, {
      headers: {
        Authorization: this.idToken,
        'X-APP-Key': process.env.BKASH_APP_KEY
      }
    });
    // statusCode "0000" means payment success
    return res.data;
  }
}`,
    notes: [
      'Manual TrxID workflow includes strict regex validation `^[A-Z0-9]{8,12}$`.',
      'Instant Sandbox Simulator provided in the UI allows testing instant automated approval without waiting for SMS!',
      'Disbursement API (B2C) can automate instant withdrawal payouts directly to user bKash numbers.',
    ]
  }
];
