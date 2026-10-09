import React, { useState, useEffect, useRef } from 'react';
import { Ad, AdSessionToken, AdVerificationResult } from '../types';
import { apiService } from '../services/apiService';
import confetti from 'canvas-confetti';
import { 
  X, 
  Play, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Sparkles,
  Lock,
  Pause,
  KeyRound
} from 'lucide-react';

interface AdViewerModalProps {
  ad: Ad;
  userId: string;
  onClose: () => void;
  onRewardClaimed: (result: AdVerificationResult) => void;
}

export const AdViewerModal: React.FC<AdViewerModalProps> = ({
  ad,
  userId,
  onClose,
  onRewardClaimed,
}) => {
  // Session & Security State
  const [sessionToken, setSessionToken] = useState<AdSessionToken | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<AdVerificationResult | null>(null);

  // Timer & Visibility State
  const duration = ad.minDurationSeconds || 15;
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseReason, setPauseReason] = useState<string>('');
  const [isTimerComplete, setIsTimerComplete] = useState<boolean>(false);

  // Human Math Captcha to confirm presence
  const [mathNum1, setMathNum1] = useState<number>(() => Math.floor(Math.random() * 8) + 2);
  const [mathNum2, setMathNum2] = useState<number>(() => Math.floor(Math.random() * 8) + 1);
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  // Ref to track elapsed active time
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Step 1: Initialize Cryptographic Session on Mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const token = await apiService.startAdSession(userId, ad.id);
        if (isMounted) {
          setSessionToken(token);
        }
      } catch (err: any) {
        if (isMounted) {
          setInitError(err.message || 'Failed to initialize ad verification session.');
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userId, ad.id]);

  // Step 2: Page Visibility API listener (Anti-Cheat for Background Watching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsPaused(true);
        setPauseReason('You navigated away from this tab! The countdown has been paused to prevent background cheating.');
      } else {
        setIsPaused(false);
        setPauseReason('');
      }
    };

    const handleWindowBlur = () => {
      setIsPaused(true);
      setPauseReason('Window lost focus. Please keep this window active to earn the reward.');
    };

    const handleWindowFocus = () => {
      setIsPaused(false);
      setPauseReason('');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Step 3: Countdown Timer (Runs only when session ready, not paused, and not complete)
  useEffect(() => {
    if (!sessionToken || isPaused || isTimerComplete || initError) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTimerComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionToken, isPaused, isTimerComplete, initError]);

  // Step 4: Claim Reward Handler
  const handleClaimReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;

    const answer = parseInt(captchaInput.trim(), 10);
    const expected = mathNum1 + mathNum2;

    if (isNaN(answer) || answer !== expected) {
      setCaptchaError(`Incorrect answer! What is ${mathNum1} + ${mathNum2}?`);
      return;
    }

    setCaptchaError(null);
    setIsVerifying(true);

    try {
      const result = await apiService.claimAdReward(
        userId,
        sessionToken,
        answer,
        expected
      );

      setVerificationResult(result);

      if (result.success) {
        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#E2136E', '#10B981', '#3B82F6', '#F59E0B'],
          });
        } catch {
          // ignore
        }
        onRewardClaimed(result);
      }
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: err.message || 'Reward claim failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const progressPercent = Math.min(100, Math.round(((duration - timeLeft) / duration) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
            <span className="font-bold text-sm text-white">
              PTC Reward Player &bull; <span className="text-pink-400 font-extrabold">+৳10 BDT</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Cryptographic Session Badge */}
            {sessionToken && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded flex items-center">
                <Lock className="w-2.5 h-2.5 text-emerald-400 mr-1" />
                HMAC-Signed Session
              </span>
            )}
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security / Anti-Cheat Status Header */}
        <div className="bg-slate-950/90 border-b border-slate-800/80 px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-pink-400" />
              <span className="text-xs text-slate-300 font-semibold">
                {isTimerComplete 
                  ? 'Verification Complete! Claim your ৳10' 
                  : isPaused 
                  ? '⚠️ Timer Paused (Tab in background)' 
                  : `Watching ad... ${timeLeft}s remaining`}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-pink-400">
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isPaused 
                  ? 'bg-amber-500' 
                  : isTimerComplete 
                  ? 'bg-emerald-500' 
                  : 'bg-gradient-to-r from-pink-500 to-rose-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Paused Warning Alert */}
          {isPaused && (
            <div className="mt-2.5 p-2 bg-amber-950/60 border border-amber-800/60 rounded-lg flex items-center space-x-2 text-xs text-amber-300 animate-pulse">
              <Pause className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{pauseReason || 'Tab inactive. Please stay on this tab to continue countdown.'}</span>
            </div>
          )}
        </div>

        {/* Ad Content Display Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {initError ? (
            <div className="p-6 bg-rose-950/40 border border-rose-900/60 rounded-xl text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
              <h4 className="text-rose-200 font-bold text-sm">Session Initiation Blocked</h4>
              <p className="text-xs text-slate-300">{initError}</p>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white"
              >
                Close Window
              </button>
            </div>
          ) : (
            <>
              {/* Advertiser Banner / Media */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center group">
                <img
                  src={ad.mediaUrl}
                  alt={ad.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div className="space-y-1 max-w-[80%]">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-pink-600 text-white px-2 py-0.5 rounded">
                      {ad.category} &bull; Verified Advertiser
                    </span>
                    <h3 className="text-sm font-bold text-white drop-shadow-md">
                      {ad.title}
                    </h3>
                  </div>

                  <a
                    href={ad.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg text-white transition-colors"
                    title="Open advertiser website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Ad Description & Specs */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-300">Advertiser: {ad.advertiserName}</span>
                  <span className="text-emerald-400 font-semibold flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" /> Reward: ৳10.00 BDT
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {ad.description}
                </p>
              </div>

              {/* Claim Reward Box (Unlocked once timer finishes) */}
              {isTimerComplete && !verificationResult?.success && (
                <div className="bg-gradient-to-r from-pink-950/50 to-slate-950 border border-pink-700/60 rounded-xl p-4 animate-fadeIn space-y-3">
                  <div className="flex items-center space-x-2 text-pink-400 text-xs font-bold">
                    <KeyRound className="w-4 h-4" />
                    <span>Human Presence Verification & Claim</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Solve this quick arithmetic to verify presence and sign the reward ledger:
                  </p>

                  <form onSubmit={handleClaimReward} className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-white">
                      <span>{mathNum1} + {mathNum2} =</span>
                      <input
                        type="number"
                        value={captchaInput}
                        onChange={e => setCaptchaInput(e.target.value)}
                        placeholder="?"
                        className="w-12 bg-slate-800 text-center text-pink-400 font-bold focus:outline-none rounded py-0.5 border border-slate-600"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="px-5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-lg shadow-pink-600/30 transition-all flex items-center space-x-1.5"
                    >
                      {isVerifying ? (
                        <span>Validating Cryptographic Token...</span>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Claim ৳10 BDT Now</span>
                        </>
                      )}
                    </button>
                  </form>

                  {captchaError && (
                    <p className="text-xs text-rose-400 font-medium">{captchaError}</p>
                  )}
                </div>
              )}

              {/* Reward Claim Success State */}
              {verificationResult?.success && (
                <div className="p-4 bg-emerald-950/50 border border-emerald-700/60 rounded-xl text-center space-y-2 animate-fadeIn">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-extrabold text-emerald-200">
                    ৳10.00 BDT Credited to Wallet!
                  </h4>
                  <p className="text-xs text-slate-300">
                    {verificationResult.message}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Remaining ads today: <strong className="text-white">{verificationResult.adsRemainingToday}</strong>
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    Done & Return to Hub
                  </button>
                </div>
              )}

              {/* Reward Claim Failure State */}
              {verificationResult && !verificationResult.success && (
                <div className="p-4 bg-rose-950/50 border border-rose-800/60 rounded-xl text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                  <h4 className="text-sm font-bold text-rose-200">Verification Rejected</h4>
                  <p className="text-xs text-slate-300">{verificationResult.message}</p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-4 py-1.5 bg-slate-800 text-white text-xs rounded-lg"
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer Security Explainer */}
        <div className="bg-slate-950 px-5 py-2.5 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center">
            <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1" />
            Protected by anti-cheat token validation, Page Visibility API & replay detection.
          </span>
          <span>bKash Secure Micro-Ledger</span>
        </div>

      </div>
    </div>
  );
};
