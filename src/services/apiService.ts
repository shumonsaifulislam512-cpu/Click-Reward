import { 
  User, 
  Wallet, 
  SubscriptionPlan, 
  Transaction, 
  Ad, 
  SecurityAuditLog, 
  AdSessionToken, 
  AdVerificationResult 
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_WALLETS, 
  INITIAL_SUBSCRIPTIONS, 
  INITIAL_ADS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_AUDIT_LOGS,
  getTodayDateString 
} from '../data/mock-db';
import { createSessionSignature, generateNonce, verifySessionSignature } from '../lib/crypto-utils';

const STORAGE_KEY_PREFIX = 'bkash_ptc_';

class LocalTransactionalDB {
  private users: User[];
  private wallets: Record<string, Wallet>;
  private subscriptions: Record<string, SubscriptionPlan>;
  private ads: Ad[];
  private transactions: Transaction[];
  private auditLogs: SecurityAuditLog[];
  private activeSessions: Map<string, { token: AdSessionToken; claimed: boolean }>;

  constructor() {
    this.activeSessions = new Map();
    this.users = this.loadOrInit('users', INITIAL_USERS);
    this.wallets = this.loadOrInit('wallets', INITIAL_WALLETS);
    this.subscriptions = this.loadOrInit('subscriptions', INITIAL_SUBSCRIPTIONS);
    this.ads = this.loadOrInit('ads', INITIAL_ADS);
    this.transactions = this.loadOrInit('transactions', INITIAL_TRANSACTIONS);
    this.auditLogs = this.loadOrInit('audit_logs', INITIAL_AUDIT_LOGS);

    // Sync admin bKash number to 01875338959 if using previous seed
    const adminUser = this.users.find(u => u.role === 'ADMIN');
    if (adminUser && adminUser.bkashNumber === '01899887766') {
      adminUser.bkashNumber = '01875338959';
      this.save('users', this.users);
    }

    this.checkMidnightResetAll();
  }

  public getAdminBkashNumber(): string {
    const admin = this.users.find(u => u.role === 'ADMIN');
    return admin?.bkashNumber || '01875338959';
  }

  public updateAdminBkashNumber(newNumber: string): string {
    const adminIndex = this.users.findIndex(u => u.role === 'ADMIN');
    if (adminIndex !== -1) {
      this.users[adminIndex].bkashNumber = newNumber;
      this.save('users', this.users);
      return newNumber;
    }
    return '01875338959';
  }

  private loadOrInit<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore fallback
    }
    return JSON.parse(JSON.stringify(fallback));
  }

  private save<T>(key: string, data: T) {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
    } catch {
      // Storage could be full
    }
  }

  // ACID Check: Reset daily ads viewed if date transitioned across UTC/BST midnight
  private checkMidnightReset(userId: string) {
    const today = getTodayDateString();
    const sub = this.subscriptions[userId];
    if (sub && sub.lastResetDate !== today) {
      sub.adsViewedToday = 0;
      sub.lastResetDate = today;
      this.save('subscriptions', this.subscriptions);
    }
  }

  private checkMidnightResetAll() {
    const today = getTodayDateString();
    let modified = false;
    for (const userId in this.subscriptions) {
      const sub = this.subscriptions[userId];
      if (sub && sub.lastResetDate !== today) {
        sub.adsViewedToday = 0;
        sub.lastResetDate = today;
        modified = true;
      }
    }
    if (modified) {
      this.save('subscriptions', this.subscriptions);
    }
  }

  public resetAllToDefault() {
    localStorage.clear();
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.wallets = JSON.parse(JSON.stringify(INITIAL_WALLETS));
    this.subscriptions = JSON.parse(JSON.stringify(INITIAL_SUBSCRIPTIONS));
    this.ads = JSON.parse(JSON.stringify(INITIAL_ADS));
    this.transactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
    this.auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    this.activeSessions.clear();
    this.save('users', this.users);
    this.save('wallets', this.wallets);
    this.save('subscriptions', this.subscriptions);
    this.save('ads', this.ads);
    this.save('transactions', this.transactions);
    this.save('audit_logs', this.auditLogs);
  }

  // --- User Operations ---
  public getUsers(): User[] {
    return [...this.users];
  }

  public getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public updateUserProfile(id: string, updates: Partial<User>): User {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    this.save('users', this.users);
    return this.users[userIndex];
  }

  // --- Wallet Operations ---
  public getWallet(userId: string): Wallet {
    if (!this.wallets[userId]) {
      this.wallets[userId] = {
        userId,
        currentBalance: 0,
        totalDeposited: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        lockedWithdrawalAmount: 0,
        updatedAt: new Date().toISOString(),
      };
      this.save('wallets', this.wallets);
    }
    return { ...this.wallets[userId] };
  }

  // --- Subscription Operations ---
  public getSubscription(userId: string): SubscriptionPlan | undefined {
    this.checkMidnightReset(userId);
    const sub = this.subscriptions[userId];
    if (!sub) return undefined;

    // Check expiration
    if (sub.status === 'ACTIVE' && sub.expiresAt) {
      if (new Date(sub.expiresAt).getTime() < Date.now()) {
        sub.status = 'EXPIRED';
        this.save('subscriptions', this.subscriptions);
      }
    }
    return { ...sub };
  }

  // --- Deposit Submission (Manual bKash) ---
  public submitDeposit(userId: string, trxId: string, senderNumber: string, amount = 1000, instantSandbox = false): Transaction {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const cleanTrxId = trxId.trim().toUpperCase();
    if (cleanTrxId.length < 6) throw new Error('Invalid bKash TrxID length (minimum 6-10 characters)');

    // Deduplication check
    const existing = this.transactions.find(t => t.trxId === cleanTrxId && t.status !== 'REJECTED');
    if (existing) {
      throw new Error(`bKash TrxID "${cleanTrxId}" has already been submitted or processed.`);
    }

    const wallet = this.getWallet(userId);
    const txId = 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    const newTx: Transaction = {
      id: txId,
      userId,
      userEmail: user.email,
      userName: user.name,
      type: 'DEPOSIT',
      amount,
      balanceBefore: wallet.currentBalance,
      balanceAfter: wallet.currentBalance,
      paymentMethod: 'BKASH_MANUAL',
      trxId: cleanTrxId,
      senderNumber,
      status: instantSandbox ? 'APPROVED' : 'PENDING',
      notes: instantSandbox 
        ? 'Sandbox simulated auto-approval. 30-Day plan provisioned.' 
        : 'Submitted bKash TrxID pending admin manual verification.',
      createdAt: new Date().toISOString(),
    };

    this.transactions.unshift(newTx);
    this.save('transactions', this.transactions);

    this.auditLogs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId,
      action: 'DEPOSIT_APPROVE',
      details: `Deposit submitted with TrxID: ${cleanTrxId}, Sender: ${senderNumber}. Status: ${newTx.status}`,
      ipAddress: '103.230.104.12',
      flagged: false,
    });
    this.save('audit_logs', this.auditLogs);

    if (instantSandbox) {
      this.activateSubscriptionPlan(userId, newTx.id);
    }

    return newTx;
  }

  // Admin approves deposit -> activates 30-day plan
  public approveDeposit(transactionId: string, adminId: string): Transaction {
    const tx = this.transactions.find(t => t.id === transactionId);
    if (!tx) throw new Error('Transaction not found');
    if (tx.status !== 'PENDING') throw new Error(`Cannot approve transaction with status: ${tx.status}`);

    const wallet = this.getWallet(tx.userId);
    wallet.totalDeposited += tx.amount;
    wallet.updatedAt = new Date().toISOString();
    this.wallets[tx.userId] = wallet;
    this.save('wallets', this.wallets);

    tx.status = 'APPROVED';
    tx.reviewedAt = new Date().toISOString();
    tx.reviewedBy = adminId;
    tx.notes = (tx.notes ? tx.notes + ' | ' : '') + 'Verified & Approved by Admin. Plan activated.';
    this.save('transactions', this.transactions);

    // Activate or renew 30-Day plan
    this.activateSubscriptionPlan(tx.userId, tx.id);

    this.auditLogs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: tx.userId,
      action: 'DEPOSIT_APPROVE',
      details: `Admin ${adminId} approved deposit ${tx.trxId} of ৳${tx.amount}`,
      ipAddress: '10.0.0.1 (Admin Gateway)',
      flagged: false,
    });
    this.save('audit_logs', this.auditLogs);

    return tx;
  }

  // Admin rejects deposit
  public rejectDeposit(transactionId: string, adminId: string, reason: string): Transaction {
    const tx = this.transactions.find(t => t.id === transactionId);
    if (!tx) throw new Error('Transaction not found');
    if (tx.status !== 'PENDING') throw new Error(`Cannot reject transaction with status: ${tx.status}`);

    tx.status = 'REJECTED';
    tx.reviewedAt = new Date().toISOString();
    tx.reviewedBy = adminId;
    tx.notes = `Rejected by Admin: ${reason || 'Invalid TrxID or mismatched SMS record'}`;
    this.save('transactions', this.transactions);

    return tx;
  }

  // Provision 30-Day Plan
  private activateSubscriptionPlan(userId: string, txId: string) {
    const activatedAt = new Date();
    const expiresAt = new Date(activatedAt.getTime() + 30 * 86400000); // 30 days
    const today = getTodayDateString();

    const plan: SubscriptionPlan = {
      id: 'sub_' + Date.now().toString(36),
      userId,
      planName: '30-Day Ad Plan',
      fee: 1000,
      status: 'ACTIVE',
      dailyAdQuota: 10,
      adsViewedToday: 0,
      lastResetDate: today,
      activatedAt: activatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.subscriptions[userId] = plan;
    this.save('subscriptions', this.subscriptions);

    // Record internal plan purchase ledger entry
    const user = this.getUserById(userId);
    const subTx: Transaction = {
      id: 'tx_sub_' + Date.now().toString(36),
      userId,
      userEmail: user?.email,
      userName: user?.name,
      type: 'PLAN_PURCHASE',
      amount: 1000,
      balanceBefore: this.getWallet(userId).currentBalance,
      balanceAfter: this.getWallet(userId).currentBalance,
      paymentMethod: 'INTERNAL_WALLET',
      status: 'PAID',
      notes: `Activated 30-Day Plan (Linked deposit: ${txId}). Valid until ${expiresAt.toLocaleDateString()}.`,
      createdAt: new Date().toISOString(),
    };
    this.transactions.unshift(subTx);
    this.save('transactions', this.transactions);
  }

  // --- Withdrawal Request ---
  public requestWithdrawal(userId: string, amount: number, bKashNumber: string): Transaction {
    if (amount < 50) throw new Error('Minimum withdrawal amount is ৳50');

    const wallet = this.getWallet(userId);
    if (wallet.currentBalance < amount) {
      throw new Error(`Insufficient wallet balance (Current: ৳${wallet.currentBalance.toFixed(2)}, Requested: ৳${amount})`);
    }

    const user = this.getUserById(userId);

    // Atomically lock balance to prevent double spending
    wallet.currentBalance -= amount;
    wallet.lockedWithdrawalAmount += amount;
    wallet.updatedAt = new Date().toISOString();
    this.wallets[userId] = wallet;
    this.save('wallets', this.wallets);

    const txId = 'tx_wd_' + Date.now().toString(36);
    const tx: Transaction = {
      id: txId,
      userId,
      userEmail: user?.email,
      userName: user?.name,
      type: 'WITHDRAWAL',
      amount,
      balanceBefore: wallet.currentBalance + amount,
      balanceAfter: wallet.currentBalance,
      paymentMethod: 'BKASH_MANUAL',
      recipientNumber: bKashNumber,
      status: 'PENDING',
      notes: `Requested payout of ৳${amount} to bKash ${bKashNumber}. Funds locked.`,
      createdAt: new Date().toISOString(),
    };

    this.transactions.unshift(tx);
    this.save('transactions', this.transactions);

    return tx;
  }

  // Admin marks withdrawal as PAID
  public processWithdrawalPaid(transactionId: string, payoutTrxId: string, adminId: string): Transaction {
    const tx = this.transactions.find(t => t.id === transactionId);
    if (!tx || tx.type !== 'WITHDRAWAL') throw new Error('Withdrawal transaction not found');
    if (tx.status !== 'PENDING') throw new Error(`Transaction is already ${tx.status}`);

    const wallet = this.getWallet(tx.userId);
    wallet.lockedWithdrawalAmount = Math.max(0, wallet.lockedWithdrawalAmount - tx.amount);
    wallet.totalWithdrawn += tx.amount;
    wallet.updatedAt = new Date().toISOString();
    this.wallets[tx.userId] = wallet;
    this.save('wallets', this.wallets);

    tx.status = 'PAID';
    tx.trxId = payoutTrxId || 'BKASH_DISB_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    tx.reviewedAt = new Date().toISOString();
    tx.reviewedBy = adminId;
    tx.notes = `Disbursed to ${tx.recipientNumber}. Payout Ref: ${tx.trxId}`;
    this.save('transactions', this.transactions);

    this.auditLogs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: tx.userId,
      action: 'WITHDRAWAL_PAY',
      details: `Admin ${adminId} marked withdrawal ৳${tx.amount} as PAID to ${tx.recipientNumber} (Ref: ${tx.trxId})`,
      ipAddress: '10.0.0.1 (Admin Gateway)',
      flagged: false,
    });
    this.save('audit_logs', this.auditLogs);

    return tx;
  }

  // Admin rejects withdrawal -> refund locked amount back to currentBalance
  public rejectWithdrawal(transactionId: string, reason: string, adminId: string): Transaction {
    const tx = this.transactions.find(t => t.id === transactionId);
    if (!tx || tx.type !== 'WITHDRAWAL') throw new Error('Withdrawal transaction not found');
    if (tx.status !== 'PENDING') throw new Error(`Transaction is already ${tx.status}`);

    const wallet = this.getWallet(tx.userId);
    wallet.lockedWithdrawalAmount = Math.max(0, wallet.lockedWithdrawalAmount - tx.amount);
    wallet.currentBalance += tx.amount; // Refund
    wallet.updatedAt = new Date().toISOString();
    this.wallets[tx.userId] = wallet;
    this.save('wallets', this.wallets);

    tx.status = 'REJECTED';
    tx.reviewedAt = new Date().toISOString();
    tx.reviewedBy = adminId;
    tx.notes = `Rejected: ${reason || 'Number inactive or unverified'}. Funds refunded to balance.`;
    this.save('transactions', this.transactions);

    return tx;
  }

  // --- Ad Engine: Cryptographic Session Generation ---
  public async startAdSession(userId: string, adId: string): Promise<AdSessionToken> {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status === 'FROZEN') throw new Error('Your account is currently frozen. Contact support.');

    const sub = this.getSubscription(userId);
    if (!sub || sub.status !== 'ACTIVE') {
      throw new Error('No active 30-Day Plan. Please deposit 1,000 BDT to activate.');
    }

    if (sub.adsViewedToday >= sub.dailyAdQuota) {
      throw new Error(`Daily limit reached (${sub.dailyAdQuota}/${sub.dailyAdQuota} ads watched today). Resets at midnight.`);
    }

    const ad = this.ads.find(a => a.id === adId && a.isActive);
    if (!ad) throw new Error('Ad not found or campaign inactive');

    const sessionId = 'ses_' + Date.now().toString(36) + '_' + generateNonce(8);
    const startedAt = Date.now();
    const clientNonce = generateNonce(12);

    const payload = {
      sessionId,
      userId,
      adId,
      startedAt,
      minDurationSeconds: ad.minDurationSeconds,
      clientNonce,
    };

    const signature = await createSessionSignature(payload);

    const token: AdSessionToken = {
      ...payload,
      signature,
    };

    // Store in active sessions
    this.activeSessions.set(sessionId, { token, claimed: false });

    this.auditLogs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId,
      action: 'SESSION_START',
      details: `Started ad viewing session: ${ad.title} (Min time: ${ad.minDurationSeconds}s)`,
      ipAddress: '103.230.104.12',
      flagged: false,
    });
    this.save('audit_logs', this.auditLogs);

    return token;
  }

  // --- Ad Engine: Claim Reward with Verification ---
  public async claimAdReward(
    userId: string,
    sessionToken: AdSessionToken,
    userProvidedCaptchaAnswer?: number,
    expectedCaptchaAnswer?: number
  ): Promise<AdVerificationResult> {
    const { sessionId, adId, startedAt, minDurationSeconds, clientNonce, signature } = sessionToken;

    // 1. Session Exists & Replay Attack Check
    const sessionRecord = this.activeSessions.get(sessionId);
    if (!sessionRecord) {
      return {
        success: false,
        message: 'Invalid or non-existent session token.',
        errorCode: 'SESSION_EXPIRED',
      };
    }
    if (sessionRecord.claimed) {
      return {
        success: false,
        message: 'Replay attack intercepted! This ad view token has already been redeemed.',
        errorCode: 'REPLAY_ATTACK',
      };
    }

    // 2. Cryptographic Signature Check
    const isValidSig = await verifySessionSignature(
      { sessionId, userId, adId, startedAt, minDurationSeconds, clientNonce },
      signature
    );

    if (!isValidSig) {
      this.flagSecurityAlert(userId, 'CHEAT_DETECTED', 'Signature tampering detected on ad claim.');
      return {
        success: false,
        message: 'Cryptographic signature mismatch! Ad token was altered or forged.',
        errorCode: 'INVALID_SIGNATURE',
      };
    }

    // 3. Timing Verification (Server-side Elapsed Time)
    const now = Date.now();
    const elapsedSeconds = (now - startedAt) / 1000;
    // Allow 0.8s tolerance for network latency
    if (elapsedSeconds < minDurationSeconds - 0.8) {
      this.flagSecurityAlert(
        userId,
        'CHEAT_DETECTED',
        `Fast-click cheat attempt: client claimed after ${elapsedSeconds.toFixed(1)}s (Required: ${minDurationSeconds}s).`
      );
      return {
        success: false,
        message: `Too fast! You must view the ad for at least ${minDurationSeconds} seconds.`,
        errorCode: 'TOO_FAST',
      };
    }

    // 4. Captcha Check
    if (expectedCaptchaAnswer !== undefined && userProvidedCaptchaAnswer !== expectedCaptchaAnswer) {
      return {
        success: false,
        message: 'Human verification math challenge failed.',
        errorCode: 'CHEAT_DETECTED' as any,
      };
    }

    // 5. Subscription & Quota Check
    const sub = this.getSubscription(userId);
    if (!sub || sub.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'No active 30-Day Plan found.',
        errorCode: 'NO_ACTIVE_PLAN',
      };
    }

    if (sub.adsViewedToday >= sub.dailyAdQuota) {
      return {
        success: false,
        message: 'Daily ad quota already fulfilled today.',
        errorCode: 'QUOTA_EXCEEDED',
      };
    }

    const ad = this.ads.find(a => a.id === adId);
    if (!ad) {
      return { success: false, message: 'Ad not found.' };
    }

    // 6. ACID State Mutation:
    // a. Mark session as claimed (single use)
    sessionRecord.claimed = true;
    this.activeSessions.set(sessionId, sessionRecord);

    // b. Increment ad quota
    sub.adsViewedToday += 1;
    this.save('subscriptions', this.subscriptions);

    // c. Credit wallet
    const reward = ad.rewardAmount || 10;
    const wallet = this.getWallet(userId);
    const balanceBefore = wallet.currentBalance;
    wallet.currentBalance += reward;
    wallet.totalEarned += reward;
    wallet.updatedAt = new Date().toISOString();
    this.wallets[userId] = wallet;
    this.save('wallets', this.wallets);

    // d. Update ad total view count
    ad.totalViews += 1;
    this.save('ads', this.ads);

    // e. Create transaction record
    const user = this.getUserById(userId);
    const tx: Transaction = {
      id: 'tx_ad_' + Date.now().toString(36),
      userId,
      userEmail: user?.email,
      userName: user?.name,
      type: 'AD_REWARD',
      amount: reward,
      balanceBefore,
      balanceAfter: wallet.currentBalance,
      paymentMethod: 'INTERNAL_WALLET',
      status: 'PAID',
      notes: `Watched ad: "${ad.title}" (${minDurationSeconds}s verified)`,
      createdAt: new Date().toISOString(),
    };
    this.transactions.unshift(tx);
    this.save('transactions', this.transactions);

    // f. Audit log
    this.auditLogs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId,
      action: 'REWARD_CLAIM',
      details: `Awarded +৳${reward} for ad "${ad.title}". Duration: ${elapsedSeconds.toFixed(1)}s. Quota: ${sub.adsViewedToday}/${sub.dailyAdQuota}.`,
      ipAddress: '103.230.104.12',
      flagged: false,
    });
    this.save('audit_logs', this.auditLogs);

    return {
      success: true,
      message: `Congratulations! +৳${reward} added to your bKash wallet.`,
      rewardEarned: reward,
      newBalance: wallet.currentBalance,
      adsRemainingToday: sub.dailyAdQuota - sub.adsViewedToday,
    };
  }

  private flagSecurityAlert(userId: string, action: SecurityAuditLog['action'], details: string) {
    this.auditLogs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId,
      action,
      details,
      ipAddress: '103.230.104.12 (DHAKA-ISP-FLAGGED)',
      flagged: true,
    });
    this.save('audit_logs', this.auditLogs);
  }

  // --- Ads Inventory Management ---
  public getAds(): Ad[] {
    return [...this.ads];
  }

  public createAd(adData: Omit<Ad, 'id' | 'totalViews'>): Ad {
    const newAd: Ad = {
      ...adData,
      id: 'ad_' + Date.now().toString(36),
      totalViews: 0,
    };
    this.ads.push(newAd);
    this.save('ads', this.ads);
    return newAd;
  }

  public toggleAdActive(adId: string): Ad {
    const ad = this.ads.find(a => a.id === adId);
    if (!ad) throw new Error('Ad not found');
    ad.isActive = !ad.isActive;
    this.save('ads', this.ads);
    return ad;
  }

  // --- Transactions & Audit ---
  public getTransactions(userId?: string): Transaction[] {
    if (userId) {
      return this.transactions.filter(t => t.userId === userId);
    }
    return [...this.transactions];
  }

  public getAuditLogs(): SecurityAuditLog[] {
    return [...this.auditLogs];
  }

  // --- Admin Analytics & Metrics ---
  public getAdminMetrics() {
    const totalUsers = this.users.length;
    let totalPlatformBalance = 0;
    let totalDepositsApproved = 0;
    let totalRewardsPaid = 0;
    let totalWithdrawnPaid = 0;

    for (const u of Object.values(this.wallets)) {
      totalPlatformBalance += u.currentBalance;
      totalDepositsApproved += u.totalDeposited;
      totalRewardsPaid += u.totalEarned;
      totalWithdrawnPaid += u.totalWithdrawn;
    }

    const pendingDeposits = this.transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'PENDING').length;
    const pendingWithdrawals = this.transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'PENDING').length;
    const activeSubscribers = Object.values(this.subscriptions).filter(s => s.status === 'ACTIVE').length;

    return {
      totalUsers,
      totalPlatformBalance,
      totalDepositsApproved,
      totalRewardsPaid,
      totalWithdrawnPaid,
      platformNetProfit: totalDepositsApproved - totalWithdrawnPaid,
      pendingDeposits,
      pendingWithdrawals,
      activeSubscribers,
      totalAdsServed: this.ads.reduce((acc, a) => acc + a.totalViews, 0),
    };
  }
}

export const apiService = new LocalTransactionalDB();
