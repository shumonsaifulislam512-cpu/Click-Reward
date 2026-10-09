/**
 * ClickReward bKash - Full-Stack Pay-To-Click (PTC) Ad Platform
 * Built for high-frequency rewards with ACID transaction security and bKash wallet integration.
 */

import React, { useState, useEffect } from 'react';
import { apiService } from './services/apiService';
import { User, Wallet, SubscriptionPlan, Transaction, Ad, AdVerificationResult } from './types';
import { Navbar } from './components/Navbar';
import { WalletSummaryCard } from './components/WalletSummaryCard';
import { SubscriptionPlanCard } from './components/SubscriptionPlanCard';
import { AdGrid } from './components/AdGrid';
import { TransactionLedger } from './components/TransactionLedger';
import { AdminDashboard } from './components/AdminDashboard';
import { TechnicalSpecModal } from './components/TechnicalSpecModal';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { AdViewerModal } from './components/AdViewerModal';

import { 
  Zap, 
  Shield, 
  Coins, 
  Sparkles, 
  FileCode2, 
  RotateCcw, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export default function App() {
  // Current logged in user (starts with demo user)
  const [currentUser, setCurrentUser] = useState<User>(() => apiService.getUsers()[0]);
  const [wallet, setWallet] = useState<Wallet>(() => apiService.getWallet(currentUser.id));
  const [subscription, setSubscription] = useState<SubscriptionPlan | undefined>(() => 
    apiService.getSubscription(currentUser.id)
  );
  const [ads, setAds] = useState<Ad[]>(() => apiService.getAds());
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    apiService.getTransactions(currentUser.role === 'ADMIN' ? undefined : currentUser.id)
  );

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'ptc' | 'wallet' | 'admin' | 'specs'>('ptc');

  // Modals state
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [activeAdWatching, setActiveAdWatching] = useState<Ad | null>(null);

  // Toast / Status banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sync state whenever currentUser changes or mutations occur
  const refreshAppData = () => {
    const updatedWallet = apiService.getWallet(currentUser.id);
    const updatedSub = apiService.getSubscription(currentUser.id);
    const updatedAds = apiService.getAds();
    const updatedTxs = apiService.getTransactions(currentUser.role === 'ADMIN' ? undefined : currentUser.id);

    setWallet(updatedWallet);
    setSubscription(updatedSub);
    setAds(updatedAds);
    setTransactions(updatedTxs);
  };

  useEffect(() => {
    refreshAppData();
  }, [currentUser.id, currentUser.role]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Switch between Regular User and Admin
  const handleSwitchUser = () => {
    const allUsers = apiService.getUsers();
    const nextUser = currentUser.role === 'USER' ? allUsers[1] : allUsers[0];
    setCurrentUser(nextUser);
    showToast(`Switched profile to: ${nextUser.name} (${nextUser.role})`, 'info');
  };

  // Reset all demo data to fresh initial state
  const handleResetData = () => {
    if (window.confirm('Reset all wallets, subscriptions, transactions and ad views to default state?')) {
      apiService.resetAllToDefault();
      const allUsers = apiService.getUsers();
      setCurrentUser(allUsers[0]);
      refreshAppData();
      showToast('All ledger records and balances have been reset to factory defaults.', 'info');
    }
  };

  // Reward claimed callback
  const handleRewardClaimed = (result: AdVerificationResult) => {
    refreshAppData();
    showToast(`+৳${result.rewardEarned} added to your wallet! ${result.adsRemainingToday} ads left today.`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        wallet={wallet}
        subscription={subscription}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchUser={handleSwitchUser}
        onResetData={handleResetData}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-fadeIn">
          <div className={`p-4 rounded-xl border shadow-2xl flex items-center space-x-3 text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-700 text-rose-200'
              : 'bg-slate-900/90 border-slate-700 text-slate-200'
          }`}>
            <Sparkles className="w-4 h-4 shrink-0 text-pink-400" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Quick Testing Helper Toolbar (Useful for evaluators) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="font-semibold text-slate-300">Live PTC Sandbox:</span>
            <span className="hidden sm:inline">Role: <strong className="text-white font-mono">{currentUser.role}</strong> ({currentUser.email})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSwitchUser}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 font-semibold transition-all"
            >
              Toggle {currentUser.role === 'USER' ? 'Admin Mode' : 'User Mode'}
            </button>
            <button
              onClick={() => setIsDepositOpen(true)}
              className="px-2.5 py-1 bg-pink-950/60 hover:bg-pink-900/80 border border-pink-700/60 text-pink-300 rounded-lg font-semibold transition-all"
            >
              + Deposit 1,000 BDT
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-700/60 text-blue-300 rounded-lg font-semibold transition-all flex items-center space-x-1"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>View Tech Specs</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PTC Ad-Reward Hub */}
        {activeTab === 'ptc' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Wallet Summary */}
            <WalletSummaryCard
              wallet={wallet}
              subscription={subscription}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
            />

            {/* 30-Day Plan Status Card */}
            <SubscriptionPlanCard
              subscription={subscription}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />

            {/* PTC Ad Grid */}
            <AdGrid
              ads={ads}
              subscription={subscription}
              onWatchAd={ad => setActiveAdWatching(ad)}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />

          </div>
        )}

        {/* TAB 2: Dedicated Wallet & Transaction Ledger */}
        {activeTab === 'wallet' && (
          <div className="space-y-6 animate-fadeIn">
            <WalletSummaryCard
              wallet={wallet}
              subscription={subscription}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
            />

            {/* bKash Connected Account Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Connected Payment Channel</span>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>bKash Personal Mobile Wallet:</span>
                  <span className="font-mono text-pink-400 bg-pink-950/60 px-2 py-0.5 rounded border border-pink-900/60">
                    {currentUser.bkashNumber}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Withdrawal cash-outs are dispatched directly to this verified mobile account number.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDepositOpen(true)}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Deposit 1,000 BDT
                </button>
                <button
                  onClick={() => setIsWithdrawOpen(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
                >
                  Cash Out
                </button>
              </div>
            </div>

            {/* Transactions History */}
            <TransactionLedger
              transactions={transactions}
              title="My bKash & Reward Transaction History"
            />
          </div>
        )}

        {/* TAB 3: Admin Operations Portal */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-fadeIn">
            {currentUser.role !== 'ADMIN' && (
              <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    You are viewing the Admin Portal as a demo viewer. Switch to Chief Admin for full operational privileges.
                  </span>
                </div>
                <button
                  onClick={handleSwitchUser}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shrink-0"
                >
                  Switch to Admin Profile
                </button>
              </div>
            )}

            <AdminDashboard
              adminUser={currentUser}
              onRefresh={refreshAppData}
            />

            {/* Global Financial Ledger in Admin */}
            <TransactionLedger
              transactions={apiService.getTransactions()}
              title="Global Platform Ledger (All Users & System Activities)"
            />
          </div>
        )}

        {/* TAB 4: Technical Specifications & Architecture Explorer */}
        {activeTab === 'specs' && (
          <div className="space-y-6 animate-fadeIn">
            <TechnicalSpecModal />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-pink-600 flex items-center justify-center text-white font-extrabold text-xs">
              ৳
            </div>
            <span className="font-bold text-slate-300">ClickReward bKash Platform</span>
            <span>&bull; High-Security Pay-To-Click System</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <button onClick={() => setActiveTab('specs')} className="text-blue-400 hover:underline">
              Technical Documentation & DDL
            </button>
            <span>&bull;</span>
            <button onClick={() => setActiveTab('admin')} className="text-amber-400 hover:underline">
              Admin Portal
            </button>
            <span>&bull;</span>
            <button onClick={handleResetData} className="text-slate-400 hover:text-white">
              Reset Demo
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL: Deposit bKash */}
      {isDepositOpen && (
        <DepositModal
          userId={currentUser.id}
          userBkashNumber={currentUser.bkashNumber}
          onClose={() => setIsDepositOpen(false)}
          onDepositSuccess={() => {
            refreshAppData();
            showToast('Deposit submitted successfully! Plan updated.', 'success');
          }}
        />
      )}

      {/* MODAL: Withdraw bKash */}
      {isWithdrawOpen && (
        <WithdrawModal
          userId={currentUser.id}
          currentBalance={wallet.currentBalance}
          userBkashNumber={currentUser.bkashNumber}
          onClose={() => setIsWithdrawOpen(false)}
          onWithdrawalSuccess={() => {
            refreshAppData();
            showToast('Withdrawal request placed in escrow queue.', 'success');
          }}
        />
      )}

      {/* MODAL: PTC Ad Watcher */}
      {activeAdWatching && (
        <AdViewerModal
          ad={activeAdWatching}
          userId={currentUser.id}
          onClose={() => setActiveAdWatching(null)}
          onRewardClaimed={result => {
            handleRewardClaimed(result);
            setActiveAdWatching(null);
          }}
        />
      )}

    </div>
  );
}
