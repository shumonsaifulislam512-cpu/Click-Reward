import React from 'react';
import { Wallet, SubscriptionPlan } from '../types';
import { 
  Wallet as WalletIcon, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Coins, 
  Lock, 
  Sparkles,
  Smartphone
} from 'lucide-react';

interface WalletSummaryCardProps {
  wallet: Wallet;
  subscription?: SubscriptionPlan;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const WalletSummaryCard: React.FC<WalletSummaryCardProps> = ({
  wallet,
  subscription,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const isPlanActive = subscription?.status === 'ACTIVE';

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative bKash themed glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-pink-950/80 border border-pink-700/50 flex items-center justify-center text-pink-400 shadow-md">
            <WalletIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Dedicated User Wallet</h2>
              <span className="flex items-center text-[10px] font-semibold bg-pink-500/10 border border-pink-500/30 text-pink-400 px-2 py-0.5 rounded-full">
                <Smartphone className="w-3 h-3 mr-1" /> bKash Personal
              </span>
            </div>
            <p className="text-xs text-slate-400">ACID ledger updated in real-time with anti-double spend locks</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenDeposit}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-pink-600/25 transition-all transform active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit 1,000 BDT</span>
          </button>
          <button
            onClick={onOpenWithdraw}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span>Withdraw bKash</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        
        {/* Available Balance */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Available Balance</span>
            <Coins className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight flex items-baseline">
            <span className="text-pink-500 text-xl font-bold mr-1">৳</span>
            {wallet.currentBalance.toFixed(2)}
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Ready for payout</span>
            {wallet.lockedWithdrawalAmount > 0 && (
              <span className="text-amber-400 flex items-center">
                <Lock className="w-2.5 h-2.5 mr-0.5" /> ৳{wallet.lockedWithdrawalAmount.toFixed(0)} held
              </span>
            )}
          </div>
        </div>

        {/* Total Deposited */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Deposited</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight flex items-baseline">
            <span className="text-blue-400 text-xl font-bold mr-1">৳</span>
            {wallet.totalDeposited.toFixed(2)}
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            Via bKash TrxID verification
          </div>
        </div>

        {/* Total Earned from Ads */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Earned (PTC)</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight flex items-baseline">
            <span className="text-emerald-400 text-xl font-bold mr-1">৳</span>
            {wallet.totalEarned.toFixed(2)}
          </div>
          <div className="mt-2 text-[10px] text-emerald-500 font-medium">
            +৳10 per genuine verified ad
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Withdrawn</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight flex items-baseline">
            <span className="text-purple-400 text-xl font-bold mr-1">৳</span>
            {wallet.totalWithdrawn.toFixed(2)}
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            Sent to bKash recipient number
          </div>
        </div>

      </div>
    </div>
  );
};
