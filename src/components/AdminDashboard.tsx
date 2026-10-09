import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { Ad, Transaction, User, SecurityAuditLog } from '../types';
import { 
  Shield, 
  Coins, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  AlertTriangle, 
  Eye, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Check, 
  Copy,
  Users,
  Film,
  FileText,
  Lock,
  Unlock,
  Radio,
  Smartphone
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser: User;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onRefresh,
}) => {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'deposits' | 'withdrawals' | 'ads' | 'users' | 'audit'>('deposits');
  
  // Rejection modal state
  const [rejectModalData, setRejectModalData] = useState<{ id: string; type: 'deposit' | 'withdrawal' } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Invalid bKash Transaction ID');

  // Payout confirmation state
  const [payoutModalData, setPayoutModalData] = useState<{ id: string; amount: number; recipient: string } | null>(null);
  const [payoutTrxId, setPayoutTrxId] = useState<string>('');

  // Create Ad Form State
  const [showCreateAdModal, setShowCreateAdModal] = useState<boolean>(false);
  const [newAdTitle, setNewAdTitle] = useState<string>('');
  const [newAdCategory, setNewAdCategory] = useState<Ad['category']>('FinTech');
  const [newAdAdvertiser, setNewAdAdvertiser] = useState<string>('');
  const [newAdTargetUrl, setNewAdTargetUrl] = useState<string>('https://');
  const [newAdMediaUrl, setNewAdMediaUrl] = useState<string>('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80');
  const [newAdDescription, setNewAdDescription] = useState<string>('');
  const [newAdDuration, setNewAdDuration] = useState<number>(15);

  // Admin bKash Number Editor State
  const [showEditBkashModal, setShowEditBkashModal] = useState<boolean>(false);
  const [adminBkashInput, setAdminBkashInput] = useState<string>(adminUser.bkashNumber || '01875338959');

  const handleUpdateAdminBkash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminBkashInput.trim() || adminBkashInput.trim().length < 11) {
      alert('Please enter a valid 11-digit bKash number.');
      return;
    }
    apiService.updateAdminBkashNumber(adminBkashInput.trim());
    setShowEditBkashModal(false);
    onRefresh();
  };

  const metrics = apiService.getAdminMetrics();
  const allTransactions = apiService.getTransactions();
  const pendingDeposits = allTransactions.filter(t => t.type === 'DEPOSIT' && t.status === 'PENDING');
  const pendingWithdrawals = allTransactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'PENDING');
  const ads = apiService.getAds();
  const users = apiService.getUsers();
  const auditLogs = apiService.getAuditLogs();

  // Handlers for Deposits
  const handleApproveDeposit = (txId: string) => {
    try {
      apiService.approveDeposit(txId, adminUser.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmRejectDeposit = () => {
    if (!rejectModalData) return;
    try {
      apiService.rejectDeposit(rejectModalData.id, adminUser.id, rejectReason);
      setRejectModalData(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handlers for Withdrawals
  const handleConfirmPayout = () => {
    if (!payoutModalData) return;
    try {
      apiService.processWithdrawalPaid(payoutModalData.id, payoutTrxId, adminUser.id);
      setPayoutModalData(null);
      setPayoutTrxId('');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmRejectWithdrawal = () => {
    if (!rejectModalData) return;
    try {
      apiService.rejectWithdrawal(rejectModalData.id, rejectReason, adminUser.id);
      setRejectModalData(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handlers for Ads
  const handleToggleAd = (adId: string) => {
    try {
      apiService.toggleAdActive(adId);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle || !newAdAdvertiser) return;

    try {
      apiService.createAd({
        title: newAdTitle,
        category: newAdCategory,
        advertiserName: newAdAdvertiser,
        targetUrl: newAdTargetUrl,
        mediaType: 'BANNER',
        mediaUrl: newAdMediaUrl,
        thumbnailUrl: newAdMediaUrl,
        rewardAmount: 10,
        minDurationSeconds: newAdDuration,
        isActive: true,
        description: newAdDescription || 'Advertiser sponsored campaign on ClickReward bKash Platform.',
      });
      setShowCreateAdModal(false);
      setNewAdTitle('');
      setNewAdAdvertiser('');
      setNewAdDescription('');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handlers for Users
  const handleToggleUserFreeze = (userId: string, currentStatus: User['status']) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
      apiService.updateUserProfile(userId, { status: nextStatus });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Platform Liquidity Metrics */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-900/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-amber-900/80 border border-amber-700/60 flex items-center justify-center text-amber-400 shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-extrabold text-white">Chief Admin Operations Console</h2>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  Financial Authority
                </span>
              </div>
              <p className="text-xs text-slate-400">bKash TrxID Reconciliation &bull; Payout Disbursements &bull; Fraud Prevention</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setAdminBkashInput(apiService.getAdminBkashNumber());
                setShowEditBkashModal(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-pink-900/40 hover:border-pink-500/50 text-slate-200 hover:text-white font-bold text-xs rounded-xl shadow-md transition-all"
              title="Click to view or edit the admin receiving bKash number"
            >
              <Smartphone className="w-3.5 h-3.5 text-pink-400" />
              <span>Receiver bKash: <strong className="text-pink-400 font-mono">{apiService.getAdminBkashNumber()}</strong></span>
            </button>
            <button
              onClick={() => setShowCreateAdModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Publish New Ad Campaign</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Deposits</div>
            <div className="text-base font-black text-blue-400 mt-1 font-mono">
              ৳{metrics.totalDepositsApproved.toFixed(0)}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Approved via bKash</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Rewards Paid</div>
            <div className="text-base font-black text-emerald-400 mt-1 font-mono">
              ৳{metrics.totalRewardsPaid.toFixed(0)}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">৳10 per verified ad</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Disbursed</div>
            <div className="text-base font-black text-purple-400 mt-1 font-mono">
              ৳{metrics.totalWithdrawnPaid.toFixed(0)}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Paid to bKash wallets</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Platform Net Profit</div>
            <div className="text-base font-black text-amber-400 mt-1 font-mono">
              ৳{metrics.platformNetProfit.toFixed(0)}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Deposits - Payouts</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Pending Deposits</div>
            <div className="text-base font-black text-amber-300 mt-1 font-mono flex items-center">
              <span>{metrics.pendingDeposits}</span>
              {metrics.pendingDeposits > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-2" />}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Awaiting TrxID check</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Active Plans</div>
            <div className="text-base font-black text-pink-400 mt-1 font-mono">
              {metrics.activeSubscribers} Users
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">30-Day subscribers</div>
          </div>
        </div>
      </div>

      {/* Sub navigation tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setActiveAdminSubTab('deposits')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
            activeAdminSubTab === 'deposits'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Pending Deposits ({pendingDeposits.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('withdrawals')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
            activeAdminSubTab === 'withdrawals'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Pending Withdrawals ({pendingWithdrawals.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('ads')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
            activeAdminSubTab === 'ads'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Manage Ads ({ads.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('users')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
            activeAdminSubTab === 'users'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('audit')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
            activeAdminSubTab === 'audit'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Anti-Fraud & Audit Logs</span>
        </button>
      </div>

      {/* Tab 1: Pending Deposits */}
      {activeAdminSubTab === 'deposits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">bKash Deposit Verification Queue</h3>
              <p className="text-xs text-slate-400">Match submitted TrxID with Merchant SMS statement to activate 30-Day Plan</p>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {pendingDeposits.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No pending deposits right now. All submissions are verified!
              </div>
            ) : (
              pendingDeposits.map(tx => (
                <div key={tx.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-pink-400 bg-pink-950/60 border border-pink-800/60 px-2 py-0.5 rounded text-xs">
                        TrxID: {tx.trxId}
                      </span>
                      <span className="font-bold text-white">৳{tx.amount.toFixed(2)} BDT</span>
                    </div>
                    <div className="text-slate-300">
                      User: <strong>{tx.userName}</strong> ({tx.userEmail})
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Sender Mobile: <strong className="text-slate-200">{tx.senderNumber}</strong> &bull; Submitted: {new Date(tx.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    <button
                      onClick={() => handleApproveDeposit(tx.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow-md shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Activate Plan</span>
                    </button>
                    <button
                      onClick={() => setRejectModalData({ id: tx.id, type: 'deposit' })}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-semibold rounded-lg text-xs flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Pending Withdrawals */}
      {activeAdminSubTab === 'withdrawals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">bKash Withdrawal Payout Queue</h3>
            <p className="text-xs text-slate-400">Process payouts to customer bKash wallets and input reference ID</p>
          </div>

          <div className="divide-y divide-slate-800">
            {pendingWithdrawals.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No pending withdrawals in escrow queue.
              </div>
            ) : (
              pendingWithdrawals.map(tx => (
                <div key={tx.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white text-sm font-mono">
                        ৳{tx.amount.toFixed(2)} BDT
                      </span>
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded">
                        Held in Escrow
                      </span>
                    </div>
                    <div className="text-slate-300">
                      User: <strong>{tx.userName}</strong> ({tx.userEmail})
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Destination bKash: <strong className="text-pink-400 font-mono">{tx.recipientNumber}</strong> &bull; Requested: {new Date(tx.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    <button
                      onClick={() => setPayoutModalData({ id: tx.id, amount: tx.amount, recipient: tx.recipientNumber || '' })}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow-md shadow-purple-600/30"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Mark Paid (bKash Disbursed)</span>
                    </button>
                    <button
                      onClick={() => setRejectModalData({ id: tx.id, type: 'withdrawal' })}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-semibold rounded-lg text-xs flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject & Refund</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Manage Ads */}
      {activeAdminSubTab === 'ads' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Advertiser Inventory Management</h3>
              <p className="text-xs text-slate-400">Enable/disable campaigns or adjust reward settings</p>
            </div>
            <button
              onClick={() => setShowCreateAdModal(true)}
              className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ad</span>
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {ads.map(ad => (
              <div key={ad.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex items-center space-x-3">
                  <img
                    src={ad.thumbnailUrl}
                    alt={ad.title}
                    className="w-16 h-10 object-cover rounded-lg bg-slate-950 shrink-0"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{ad.title}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-medium">
                        {ad.category}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Advertiser: <strong>{ad.advertiserName}</strong> &bull; {ad.minDurationSeconds}s timer &bull; +৳{ad.rewardAmount} BDT
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      Delivered Views: {ad.totalViews.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    ad.isActive ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {ad.isActive ? 'ACTIVE' : 'PAUSED'}
                  </span>

                  <button
                    onClick={() => handleToggleAd(ad.id)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs"
                  >
                    {ad.isActive ? 'Pause' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: User Management */}
      {activeAdminSubTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">Platform Registered Users</h3>
            <p className="text-xs text-slate-400">View user balances, connected bKash MSISDNs, and freeze suspect accounts</p>
          </div>

          <div className="divide-y divide-slate-800">
            {users.map(u => {
              const uWallet = apiService.getWallet(u.id);
              const uSub = apiService.getSubscription(u.id);

              return (
                <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{u.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        u.role === 'ADMIN' ? 'bg-amber-900 text-amber-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                      {u.status === 'FROZEN' && (
                        <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded font-bold">
                          FROZEN
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Email: {u.email} &bull; bKash: <strong className="text-pink-400 font-mono">{u.bkashNumber}</strong>
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      Subscription: {uSub?.status === 'ACTIVE' ? `Active (${uSub.adsViewedToday}/10 today)` : 'No active plan'}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-start sm:self-center">
                    <div className="text-right">
                      <div className="font-mono font-bold text-pink-400">
                        ৳{uWallet.currentBalance.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Earned: ৳{uWallet.totalEarned.toFixed(0)}
                      </div>
                    </div>

                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleToggleUserFreeze(u.id, u.status)}
                        className={`p-2 rounded-lg border transition-all ${
                          u.status === 'FROZEN'
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400 hover:bg-emerald-900'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400'
                        }`}
                        title={u.status === 'FROZEN' ? 'Unfreeze Account' : 'Freeze Account for Fraud Investigation'}
                      >
                        {u.status === 'FROZEN' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Anti-Fraud & Security Audit Logs */}
      {activeAdminSubTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">Anti-Fraud & Cryptographic Audit Stream</h3>
            <p className="text-xs text-slate-400">Real-time ledger security checks, fast-click intercepts, and tamper alerts</p>
          </div>

          <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3.5 flex items-start space-x-3 text-xs hover:bg-slate-800/40">
                <div className={`mt-0.5 p-1 rounded ${
                  log.flagged ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {log.flagged ? <AlertTriangle className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-[11px] font-bold ${
                      log.flagged ? 'text-rose-300' : 'text-slate-200'
                    }`}>
                      [{log.action}]
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    {log.details}
                  </p>
                  <div className="text-[10px] text-slate-500">
                    Source: {log.ipAddress} &bull; User ID: {log.userId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create Ad */}
      {showCreateAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm">Publish New PTC Ad Campaign</h4>
              <button onClick={() => setShowCreateAdModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ad Headline / Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. bKash 20% Cashback at Aarong"
                  value={newAdTitle}
                  onChange={e => setNewAdTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category:</label>
                  <select
                    value={newAdCategory}
                    onChange={e => setNewAdCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="FinTech">FinTech</option>
                    <option value="Tech">Tech</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Telecom">Telecom</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Sec):</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={newAdDuration}
                    onChange={e => setNewAdDuration(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Advertiser Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarong Bangladesh"
                  value={newAdAdvertiser}
                  onChange={e => setNewAdAdvertiser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destination URL:</label>
                <input
                  type="url"
                  required
                  value={newAdTargetUrl}
                  onChange={e => setNewAdTargetUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Image Banner URL:</label>
                <input
                  type="url"
                  required
                  value={newAdMediaUrl}
                  onChange={e => setNewAdMediaUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all"
                >
                  Publish Campaign (+৳10 Reward)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mark Withdrawal Paid */}
      {payoutModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 text-xs">
            <h4 className="font-bold text-white text-sm">Confirm bKash Payout Disbursement</h4>
            <p className="text-slate-300">
              Disbursing <strong className="text-white">৳{payoutModalData.amount.toFixed(2)} BDT</strong> to recipient <strong className="text-pink-400 font-mono">{payoutModalData.recipient}</strong>.
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">bKash Disbursement TrxID:</label>
              <input
                type="text"
                placeholder="e.g. 9B8C7D6E5F"
                value={payoutTrxId}
                onChange={e => setPayoutTrxId(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setPayoutModalData(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayout}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg"
              >
                Confirm Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rejection Reason */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 text-xs">
            <h4 className="font-bold text-rose-300 text-sm">
              Reject {rejectModalData.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </h4>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Rejection Reason:</label>
              <input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectModalData(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={rejectModalData.type === 'deposit' ? handleConfirmRejectDeposit : handleConfirmRejectWithdrawal}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Admin bKash Number */}
      {showEditBkashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm flex items-center space-x-1.5">
                <Smartphone className="w-4 h-4 text-pink-400" />
                <span>Admin Deposit bKash Number</span>
              </h4>
              <button onClick={() => setShowEditBkashModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              This is the official merchant/admin bKash account number displayed to customers during deposit instructions (Send Money).
            </p>

            <form onSubmit={handleUpdateAdminBkash} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">bKash Number:</label>
                <input
                  type="text"
                  required
                  value={adminBkashInput}
                  onChange={e => setAdminBkashInput(e.target.value)}
                  placeholder="01875338959"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditBkashModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg shadow-md transition-all"
                >
                  Save New Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
