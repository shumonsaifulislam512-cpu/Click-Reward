import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

interface DepositModalProps {
  userId: string;
  userBkashNumber?: string;
  onClose: () => void;
  onDepositSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  userId,
  userBkashNumber = '01712345678',
  onClose,
  onDepositSuccess,
}) => {
  const adminBkashNumber = apiService.getAdminBkashNumber() || '01875338959';
  // Format for display: e.g. 01875-338959
  const formattedAdminNumber = adminBkashNumber.length === 11 
    ? `${adminBkashNumber.slice(0, 5)}-${adminBkashNumber.slice(5)}` 
    : adminBkashNumber;

  const [senderNumber, setSenderNumber] = useState<string>(userBkashNumber);
  const [trxId, setTrxId] = useState<string>('');
  const [instantSandbox, setInstantSandbox] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCopyReceiver = () => {
    navigator.clipboard.writeText(adminBkashNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateSampleTrx = () => {
    // Generate realistic bKash TrxID e.g. 9K2M4N7P8R
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let sample = '';
    for (let i = 0; i < 10; i++) {
      sample += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTrxId(sample);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!senderNumber.trim()) {
      setError('Please provide your bKash sender number.');
      return;
    }
    if (!trxId.trim()) {
      setError('Please enter the bKash Transaction ID (TrxID).');
      return;
    }

    setIsSubmitting(true);
    try {
      apiService.submitDeposit(userId, trxId, senderNumber, 1000, instantSandbox);
      
      setSuccessMessage(
        instantSandbox 
          ? 'Deposit verified successfully! Your 30-Day Plan (10 ads/day) is now ACTIVE.'
          : 'TrxID submitted! It is now pending verification in the Admin Dashboard.'
      );

      setTimeout(() => {
        onDepositSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Deposit submission failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-900/60 to-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-pink-600/30">
              ৳
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Deposit 1,000 BDT via bKash</h3>
              <p className="text-xs text-pink-300">Activate 30-Day Ad Plan (10 Ads/Day @ ৳10)</p>
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
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Success Notification */}
          {successMessage ? (
            <div className="p-5 bg-emerald-950/60 border border-emerald-700 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-emerald-200 text-sm">Deposit Processed</h4>
              <p className="text-xs text-slate-300">{successMessage}</p>
            </div>
          ) : (
            <>
              {/* Payment Steps Instructions */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-slate-200 flex items-center text-xs">
                  <Smartphone className="w-3.5 h-3.5 text-pink-400 mr-1.5" />
                  <span>Manual bKash "Send Money" Instructions:</span>
                </div>

                <div className="space-y-2 text-slate-300 text-[11px]">
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-pink-900/80 text-pink-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <span>Open <strong>bKash App</strong> or dial <code className="text-pink-300 font-mono">*247#</code></span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-pink-900/80 text-pink-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <div>
                      Select <strong>Send Money</strong> to Merchant/Admin Wallet:
                      <div className="mt-1 flex items-center space-x-2 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-lg">
                        <span className="font-mono text-pink-400 font-bold">{formattedAdminNumber}</span>
                        <button
                          type="button"
                          onClick={handleCopyReceiver}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1 ml-auto"
                        >
                          {copied ? (
                            <span className="text-emerald-400 flex items-center"><Check className="w-3 h-3 mr-0.5" /> Copied</span>
                          ) : (
                            <span className="flex items-center"><Copy className="w-3 h-3 mr-0.5" /> Copy</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-pink-900/80 text-pink-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                    <span>Enter Amount: <strong className="text-white font-mono">1,000 BDT</strong></span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-pink-900/80 text-pink-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
                    <span>Complete transaction & copy the <strong>Transaction ID (TrxID)</strong> from confirmation SMS.</span>
                  </div>
                </div>
              </div>

              {/* Deposit Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* Sender bKash Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your bKash Sender Phone Number:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01712345678"
                    value={senderNumber}
                    onChange={e => setSenderNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-mono"
                  />
                </div>

                {/* TrxID Input with Sample Helper */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      bKash Transaction ID (TrxID):
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSampleTrx}
                      className="text-[10px] text-pink-400 hover:text-pink-300 font-medium"
                    >
                      + Generate Test TrxID
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8N7A6B5C4D"
                    value={trxId}
                    onChange={e => setTrxId(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 uppercase font-mono tracking-wider"
                  />
                </div>

                {/* Evaluation Simulator Toggle */}
                <div className="bg-slate-950 border border-pink-900/40 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white flex items-center space-x-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Instant Sandbox Auto-Approval</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {instantSandbox 
                        ? 'Simulates automatic gateway verification (activates plan instantly).' 
                        : 'Creates pending deposit for manual approval in the Admin Portal.'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={instantSandbox}
                      onChange={e => setInstantSandbox(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isSubmitting 
                      ? 'Verifying Ledger...' 
                      : instantSandbox 
                      ? 'Confirm & Activate 30-Day Plan' 
                      : 'Submit TrxID for Admin Review'}
                  </span>
                </button>
              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
