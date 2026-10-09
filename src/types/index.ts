export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  bkashNumber: string;
  avatar?: string;
  createdAt: string;
  status: 'ACTIVE' | 'FROZEN';
}

export interface Wallet {
  userId: string;
  currentBalance: number;       // Available BDT
  totalDeposited: number;       // All-time deposited
  totalEarned: number;          // All-time ad rewards earned
  totalWithdrawn: number;       // All-time successfully withdrawn
  lockedWithdrawalAmount: number; // In-flight pending withdrawal
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  userId: string;
  planName: string;             // "30-Day Ad Plan"
  fee: number;                  // 1000 BDT
  status: 'INACTIVE' | 'ACTIVE' | 'EXPIRED';
  dailyAdQuota: number;         // 10 ads
  adsViewedToday: number;       // Count for current day
  lastResetDate: string;        // YYYY-MM-DD (BST/UTC)
  activatedAt?: string;
  expiresAt?: string;           // 30 days from activation
}

export type TransactionType = 'DEPOSIT' | 'PLAN_PURCHASE' | 'AD_REWARD' | 'WITHDRAWAL' | 'REFUND';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
export type PaymentMethod = 'BKASH_MANUAL' | 'BKASH_TOKENIZED' | 'INTERNAL_WALLET';

export interface Transaction {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod: PaymentMethod;
  trxId?: string;               // bKash Transaction ID (e.g. 9K3L7M8N1P)
  senderNumber?: string;        // bKash sender MSISDN
  recipientNumber?: string;     // bKash recipient number for withdrawals
  status: TransactionStatus;
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Ad {
  id: string;
  title: string;
  category: 'Tech' | 'FinTech' | 'E-Commerce' | 'Education' | 'Entertainment' | 'Telecom';
  advertiserName: string;
  targetUrl: string;
  mediaType: 'BANNER' | 'VIDEO' | 'INTERACTIVE';
  mediaUrl: string;
  thumbnailUrl: string;
  rewardAmount: number;         // 10 BDT
  minDurationSeconds: number;   // 15 seconds
  isActive: boolean;
  totalViews: number;
  description: string;
}

export interface AdSessionToken {
  sessionId: string;
  userId: string;
  adId: string;
  startedAt: number;            // Timestamp ms
  minDurationSeconds: number;
  clientNonce: string;
  signature: string;            // HMAC-SHA256
}

export interface AdVerificationResult {
  success: boolean;
  message: string;
  rewardEarned?: number;
  newBalance?: number;
  adsRemainingToday?: number;
  errorCode?: 'INVALID_SIGNATURE' | 'TOO_FAST' | 'SESSION_EXPIRED' | 'REPLAY_ATTACK' | 'QUOTA_EXCEEDED' | 'NO_ACTIVE_PLAN';
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: 'SESSION_START' | 'REWARD_CLAIM' | 'CLAIM_REJECTED' | 'DEPOSIT_APPROVE' | 'WITHDRAWAL_PAY' | 'CHEAT_DETECTED';
  details: string;
  ipAddress: string;
  flagged: boolean;
}
