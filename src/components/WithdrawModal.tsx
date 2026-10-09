import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { 
  X, 
  ArrowUpRight, 
  Coins, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  Lock
} from 'lucide-react';

interface WithdrawModalProps {
  userId: string;
  currentBalance: number;
  userBkashNumber?: string;
  onClose: () => void;
  onWithdrawalSuccess: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  userId,
  currentBalance,
  userBkashNumber = '01712345678',
  onClose,
  onWithdrawalSuccess,
}) => {
  const MIN_WITHDRAWAL = 50;
  const [amount, setAmount] = useState<string>('100');
  const [bkashNumber, setBkashNumber] = useState<string>(userBkashNumber);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is ৳${MIN_WITHDRAWAL} BDT.`);
      return;
    }

    if (numAmount > currentBalance) {
      setError(`Insufficient balance. Available: ৳${currentBalance.toFixed(2)} BDT.`);
      return;
    }

    if (!bkashNumber.trim() || bkashNumber.length < 11) {
      setError('Please provide a valid 11-digit Bangladeshi bKash number.');
      return;
    }

    setIsSubmitting(true);
    try {
      apiService.requestWithdrawal(userId, numAmount, bkashNumber);
      setSuccess(true);
      setTimeout(() => {
        onWithdrawalSuccess();
        onClose();
      }, 1600);
    } catch (err: any) {
      setError(err.message || 'Withdrawal request failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Withdraw to bKash</h3>
              <p className="text-xs text-slate-400">Direct disbursement to personal bKash wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {success ? (
            <div className="p-6 bg-emerald-950/60 border border-emerald-700 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-emerald-200 text-sm">Withdrawal Request Placed!</h4>
              <p className="text-xs text-slate-300">
                ৳{parseFloat(amount).toFixed(2)} has been locked and forwarded to the payout processing queue.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Available balance banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center">
                  <Coins className="w-3.5 h-3.5 text-pink-400 mr-1.5" />
                  Available to Withdraw:
                </span>
                <span className="font-extrabold text-pink-400 font-mono text-sm">
                  ৳{currentBalance.toFixed(2)} BDT
                </span>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Withdrawal Amount (BDT):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">৳</span>
                  <input
                    type="number"
                    step="10"
                    min={MIN_WITHDRAWAL}
                    max={currentBalance}
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono font-bold"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Min: ৳{MIN_WITHDRAWAL}</span>
                  <button
                    type="button"
                    onClick={() => setAmount(currentBalance.toString())}
                    className="text-pink-400 hover:text-pink-300 font-medium"
                  >
                    Max ({currentBalance.toFixed(0)})
                  </button>
                </div>
              </div>

              {/* Recipient bKash number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipient bKash Phone Number:
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={bkashNumber}
                    onChange={e => setBkashNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Anti-fraud escrow note */}
              <div className="bg-purple-950/30 border border-purple-900/50 rounded-xl p-3 flex items-start space-x-2 text-[11px] text-purple-300">
                <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Escrow Lock:</strong> Funds are deducted from your active balance immediately to prevent double spending. If rejected by admin, the amount is refunded instantly.
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || currentBalance < MIN_WITHDRAWAL}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                {isSubmitting ? 'Placing Request...' : 'Confirm Withdrawal Request'}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
