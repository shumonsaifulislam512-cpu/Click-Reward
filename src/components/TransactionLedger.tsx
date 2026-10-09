import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles, 
  Receipt, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Smartphone
} from 'lucide-react';

interface TransactionLedgerProps {
  transactions: Transaction[];
  title?: string;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  title = 'Wallet Transaction History',
}) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredList = transactions.filter(t => {
    if (filter === 'ALL') return true;
    return t.type === filter;
  });

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return (
          <span className="flex items-center text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
            <ArrowDownLeft className="w-2.5 h-2.5 mr-1" /> Deposit
          </span>
        );
      case 'AD_REWARD':
        return (
          <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            <Sparkles className="w-2.5 h-2.5 mr-1" /> Ad Reward
          </span>
        );
      case 'PLAN_PURCHASE':
        return (
          <span className="flex items-center text-[10px] font-bold text-pink-400 bg-pink-950/60 border border-pink-800/60 px-2 py-0.5 rounded">
            <Receipt className="w-2.5 h-2.5 mr-1" /> Subscription
          </span>
        );
      case 'WITHDRAWAL':
        return (
          <span className="flex items-center text-[10px] font-bold text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded">
            <ArrowUpRight className="w-2.5 h-2.5 mr-1" /> Withdrawal
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return (
          <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> {status}
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-700/50 px-2 py-0.5 rounded-full">
            <Clock className="w-2.5 h-2.5 mr-1" /> Pending
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-700/50 px-2 py-0.5 rounded-full">
            <XCircle className="w-2.5 h-2.5 mr-1" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header and Filter */}
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base text-white tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400">Audited double-entry ledger with balance checkpoints</p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {['ALL', 'DEPOSIT', 'AD_REWARD', 'PLAN_PURCHASE', 'WITHDRAWAL'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all text-[11px] ${
                filter === f
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No transactions found for the selected filter.
          </div>
        ) : (
          filteredList.map(tx => (
            <div key={tx.id} className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              
              {/* Left Column: Type, Notes, Date */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  {getTypeBadge(tx.type)}
                  {getStatusBadge(tx.status)}
                  {tx.trxId && (
                    <div className="flex items-center space-x-1 font-mono text-[10px] text-pink-400 bg-pink-950/40 border border-pink-900/40 px-1.5 py-0.5 rounded">
                      <Smartphone className="w-2.5 h-2.5" />
                      <span>TrxID: {tx.trxId}</span>
                      <button
                        onClick={() => handleCopy(tx.trxId!, tx.id)}
                        className="text-slate-400 hover:text-white ml-0.5"
                        title="Copy TrxID"
                      >
                        {copiedId === tx.id ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-slate-200 font-medium text-xs">
                  {tx.notes || `${tx.type} transaction`}
                </p>

                <div className="text-[11px] text-slate-500 flex items-center space-x-3">
                  <span>{new Date(tx.createdAt).toLocaleString()}</span>
                  {tx.senderNumber && <span>Sender: <strong className="text-slate-400">{tx.senderNumber}</strong></span>}
                  {tx.recipientNumber && <span>To: <strong className="text-slate-400">{tx.recipientNumber}</strong></span>}
                </div>
              </div>

              {/* Right Column: Amount & Balance Delta */}
              <div className="text-right sm:self-center shrink-0">
                <div className={`font-mono text-base font-extrabold ${
                  tx.type === 'AD_REWARD' || tx.type === 'DEPOSIT'
                    ? 'text-emerald-400'
                    : 'text-slate-200'
                }`}>
                  {tx.type === 'AD_REWARD' || (tx.type === 'DEPOSIT' && tx.status === 'APPROVED')
                    ? `+৳${tx.amount.toFixed(2)}`
                    : tx.type === 'WITHDRAWAL'
                    ? `-৳${tx.amount.toFixed(2)}`
                    : `৳${tx.amount.toFixed(2)}`}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Balance: ৳{tx.balanceBefore.toFixed(2)} &rarr; ৳{tx.balanceAfter.toFixed(2)}
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};
