
import React, { useState } from 'react';
import { Transaction } from '../types';

interface HistoryPageProps {
  transactions: Transaction[];
}

const HistoryPage: React.FC<HistoryPageProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<'ALL' | 'SWAP' | 'CASH'>('ALL');

  const filtered = transactions.filter(tx => {
    if (filter === 'ALL') return true;
    if (filter === 'SWAP') return tx.type === 'SWAP';
    return tx.type === 'CASH_IN' || tx.type === 'CASH_OUT';
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Historique complet</h2>
          <p className="text-slate-500 text-sm font-medium">Suivez toutes vos activités blockchain et cash</p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
          {['ALL', 'SWAP', 'CASH'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'ALL' ? 'Tous' : f === 'SWAP' ? 'Échanges' : 'Cash'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Détails</th>
                <th className="px-6 py-4">Date & Heure</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-600 italic">
                    Aucune transaction trouvée pour ce filtre.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          tx.type === 'CASH_IN' ? 'bg-emerald-500/20 text-emerald-400' :
                          tx.type === 'CASH_OUT' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </div>
                        <span className="font-bold text-sm tracking-tight">
                          {tx.type === 'CASH_IN' ? 'Dépôt Cash' : tx.type === 'CASH_OUT' ? 'Retrait Cash' : 'Swap Crypto'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">
                      <div className="font-bold">
                        {tx.fromAmount} {tx.fromCurrency} <span className="text-slate-500 font-normal">→</span> {tx.toAmount.toLocaleString(undefined, { maximumFractionDigits: tx.toCurrency === 'XOF' ? 0 : 6 })} {tx.toCurrency}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {new Date(tx.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                        Réussi
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-600 hover:text-indigo-400 transition-colors p-2">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
