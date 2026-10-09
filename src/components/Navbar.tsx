import React from 'react';
import { User, Wallet, SubscriptionPlan } from '../types';
import { 
  Zap, 
  Shield, 
  Coins, 
  UserCheck, 
  FileCode2, 
  RotateCcw, 
  ExternalLink,
  Smartphone
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  wallet: Wallet;
  subscription?: SubscriptionPlan;
  activeTab: 'ptc' | 'wallet' | 'admin' | 'specs';
  setActiveTab: (tab: 'ptc' | 'wallet' | 'admin' | 'specs') => void;
  onSwitchUser: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  wallet,
  subscription,
  activeTab,
  setActiveTab,
  onSwitchUser,
  onResetData,
}) => {
  const isPlanActive = subscription?.status === 'ACTIVE';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('ptc')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-600/30 text-white font-black text-xl tracking-tight">
              ৳
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-white tracking-tight">
                  Click<span className="text-pink-500">Reward</span>
                </span>
                <span className="bg-pink-950/80 border border-pink-700/50 text-pink-400 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  bKash Pay
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">PTC & Ad-Reward Micro-Earnings Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('ptc')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ptc'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Ad Reward Hub
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'wallet'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              bKash Wallet & Payouts
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'specs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Tech Specs & DDL</span>
            </button>
          </nav>

          {/* User Status, Balance & Quick Switcher */}
          <div className="flex items-center space-x-3">
            {/* Balance Pill */}
            <div 
              onClick={() => setActiveTab('wallet')}
              className="cursor-pointer bg-slate-950 border border-pink-900/40 hover:border-pink-500/60 transition-all rounded-xl px-3 py-1.5 flex items-center space-x-2"
              title="Click to view wallet details"
            >
              <Coins className="w-4 h-4 text-pink-500" />
              <div className="text-right">
                <div className="text-xs font-extrabold text-pink-400">
                  ৳{wallet.currentBalance.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-400 leading-tight">
                  {isPlanActive ? 'Plan Active' : 'No Active Plan'}
                </div>
              </div>
            </div>

            {/* Current Account Profile Switcher */}
            <div className="relative group">
              <button 
                onClick={onSwitchUser}
                className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-left transition-all"
                title="Switch between User and Admin demo profiles"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                  {currentUser.role === 'ADMIN' ? (
                    <Shield className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-pink-400" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight flex items-center space-x-1">
                    <span>{currentUser.name}</span>
                    <span className={`text-[9px] px-1 rounded font-bold uppercase ${
                      currentUser.role === 'ADMIN' ? 'bg-amber-900/80 text-amber-300' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {currentUser.bkashNumber}
                  </div>
                </div>
                <UserCheck className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>
            </div>

            {/* Reset Demo Data button */}
            <button
              onClick={onResetData}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
              title="Reset Demo Ledger & Balances"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('ptc')}
            className={`px-2 py-1 rounded ${activeTab === 'ptc' ? 'text-pink-400 font-bold' : 'text-slate-400'}`}
          >
            Ad Rewards
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-2 py-1 rounded ${activeTab === 'wallet' ? 'text-pink-400 font-bold' : 'text-slate-400'}`}
          >
            Wallet & bKash
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-2 py-1 rounded ${activeTab === 'admin' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
          >
            Admin
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-2 py-1 rounded ${activeTab === 'specs' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
          >
            Tech Specs
          </button>
        </div>
      </div>
    </header>
  );
};
