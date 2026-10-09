import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../types';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

interface SubscriptionPlanCardProps {
  subscription?: SubscriptionPlan;
  onOpenDeposit: () => void;
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  subscription,
  onOpenDeposit,
}) => {
  const [timeUntilMidnight, setTimeUntilMidnight] = useState<string>('');

  // Live timer calculating exact hours, minutes, seconds until next Midnight (BST / Local)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0); // Next 00:00:00

      const diffMs = nextMidnight.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeUntilMidnight('00h 00m 00s');
        return;
      }

      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      setTimeUntilMidnight(
        `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const isActive = subscription?.status === 'ACTIVE';
  const adsViewed = subscription?.adsViewedToday ?? 0;
  const quota = subscription?.dailyAdQuota ?? 10;
  const remaining = Math.max(0, quota - adsViewed);
  const progressPercent = Math.min(100, Math.round((adsViewed / quota) * 100));

  // Expiration calculation
  let daysRemaining = 0;
  if (subscription?.expiresAt) {
    const exp = new Date(subscription.expiresAt).getTime();
    daysRemaining = Math.max(0, Math.ceil((exp - Date.now()) / 86400000));
  }

  return (
    <div className={`rounded-2xl border p-6 transition-all ${
      isActive 
        ? 'bg-slate-900 border-pink-900/40 shadow-lg' 
        : 'bg-slate-900/90 border-slate-800'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        
        {/* Title and Plan Tag */}
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
            isActive 
              ? 'bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-md shadow-pink-600/30' 
              : 'bg-slate-800 text-slate-400'
          }`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-white text-base">30-Day Ad Reward Plan</h3>
              {isActive ? (
                <span className="flex items-center text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                  Active Plan
                </span>
              ) : (
                <span className="text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Subscription Cost: <span className="text-pink-400 font-semibold">1,000 BDT</span> &bull; Daily Limit: <span className="text-slate-200 font-semibold">10 Ads</span> &bull; ৳10 / Ad
            </p>
          </div>
        </div>

        {/* Plan Expiration or Activate button */}
        {isActive ? (
          <div className="flex items-center space-x-3 text-xs bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-pink-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Plan Validity</div>
              <div className="font-bold text-slate-200">
                {daysRemaining} Days Left <span className="text-slate-500 font-normal">({new Date(subscription!.expiresAt!).toLocaleDateString()})</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenDeposit}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-600/30 transition-all"
          >
            <span>Activate for 1,000 BDT</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quota Progress & Midnight Reset Bar */}
      {isActive ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
          
          {/* Daily Quota Counter */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 text-pink-400 mr-1.5" />
                Today's Ad Quota Progress:
              </span>
              <span className="font-bold text-pink-400">
                {adsViewed} / {quota} Watched ({remaining} Remaining)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-pink-500 via-rose-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Earned today: <strong className="text-emerald-400 font-mono">+৳{(adsViewed * 10).toFixed(2)}</strong></span>
              <span>Potential today: <strong className="text-slate-300 font-mono">৳{(quota * 10).toFixed(2)}</strong></span>
            </div>
          </div>

          {/* Midnight Reset Countdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-center items-center text-center">
            <div className="flex items-center text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 mr-1" />
              <span>Quota Resets In</span>
            </div>
            <div className="font-mono text-base font-extrabold text-amber-300 tracking-wider">
              {timeUntilMidnight || 'Calculating...'}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">
              Every 24h at Midnight (00:00 BST)
            </span>
          </div>

        </div>
      ) : (
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-300/90">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-200">
              You do not have an active 30-Day Plan.
            </p>
            <p className="text-slate-400 text-[11px]">
              Deposit 1,000 BDT via bKash to unlock 10 daily ads for 30 consecutive days. Watch 10 ads/day to earn up to <span className="text-emerald-400 font-bold">3,000 BDT (৳100/day &times; 30 days)</span>!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
