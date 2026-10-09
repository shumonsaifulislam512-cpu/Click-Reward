import React from 'react';
import { Ad, SubscriptionPlan } from '../types';
import { 
  Play, 
  Sparkles, 
  Clock, 
  Eye, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface AdGridProps {
  ads: Ad[];
  subscription?: SubscriptionPlan;
  onWatchAd: (ad: Ad) => void;
  onOpenDeposit: () => void;
}

export const AdGrid: React.FC<AdGridProps> = ({
  ads,
  subscription,
  onWatchAd,
  onOpenDeposit,
}) => {
  const isPlanActive = subscription?.status === 'ACTIVE';
  const adsViewedToday = subscription?.adsViewedToday ?? 0;
  const quota = subscription?.dailyAdQuota ?? 10;
  const isQuotaFulfilled = adsViewedToday >= quota;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>Available PTC Ad Campaigns</span>
            <span className="text-xs font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-full">
              {ads.filter(a => a.isActive).length} Active
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Earn <span className="text-pink-400 font-bold">৳10.00 BDT</span> per verified advertisement view (10 ads daily quota)
          </p>
        </div>

        {/* Quota reminder pill */}
        <div className="text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>
            Daily Quota: <strong className="text-white">{quota - adsViewedToday}</strong> ads remaining
          </span>
        </div>
      </div>

      {/* Grid of ads */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.filter(a => a.isActive).map(ad => {
          const canWatch = isPlanActive && !isQuotaFulfilled;

          return (
            <div
              key={ad.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between group hover:shadow-xl hover:shadow-pink-900/10"
            >
              <div>
                {/* Thumbnail banner */}
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img
                    src={ad.thumbnailUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  
                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-300 px-2 py-0.5 rounded-lg">
                    {ad.category}
                  </span>

                  {/* Reward Badge */}
                  <div className="absolute top-3 right-3 flex items-center space-x-1 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    <span>+৳{ad.rewardAmount.toFixed(0)} BDT</span>
                  </div>

                  {/* Duration Tag */}
                  <div className="absolute bottom-2 left-3 flex items-center text-[10px] text-slate-300 bg-black/60 backdrop-blur px-2 py-0.5 rounded">
                    <Clock className="w-2.5 h-2.5 mr-1 text-pink-400" />
                    <span>{ad.minDurationSeconds}s Required</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="text-[11px] font-semibold text-pink-400 uppercase tracking-wide">
                    {ad.advertiserName}
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-white line-clamp-2 leading-snug">
                    {ad.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 text-[11px]">
                    {ad.description}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 pt-0">
                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    <span>{ad.totalViews.toLocaleString()} views</span>
                  </div>

                  {canWatch ? (
                    <button
                      onClick={() => onWatchAd(ad)}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-600/30 transition-all active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch & Earn ৳10</span>
                    </button>
                  ) : !isPlanActive ? (
                    <button
                      onClick={onOpenDeposit}
                      className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                      title="Activate 30-Day Plan to start earning"
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      <span>Unlock with Plan</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                      Quota Done Today
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
