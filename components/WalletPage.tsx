
import React, { useMemo, useState } from 'react';
import { CryptoCurrency, Transaction } from '../types';
import { USD_TO_XOF_RATE } from '../services/priceService';
import DepositModal from './DepositModal';

interface WalletPageProps {
  cryptos: CryptoCurrency[];
  transactions: Transaction[];
  userName: string;
  userBalance: number; // Nouveau : solde réel injecté depuis App.tsx
}

const WalletPage: React.FC<WalletPageProps> = ({ cryptos, transactions, userName, userBalance }) => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // On calcule les balances crypto à partir de l'historique, 
  // mais le XOF vient directement du solde utilisateur de la DB
  const balances = useMemo(() => {
    const b: Record<string, number> = { 'xof': userBalance }; // Source de vérité DB
    cryptos.forEach(c => b[c.id] = 0);
    
    // On n'ajoute ici que les flux CRYPTO (les flux XOF sont déjà dans userBalance)
    transactions.forEach(tx => {
      const fromId = cryptos.find(c => c.symbol === tx.fromCurrency)?.id;
      if (fromId) b[fromId] = (b[fromId] || 0) - tx.fromAmount;
      const toId = cryptos.find(c => c.symbol === tx.toCurrency)?.id;
      if (toId) b[toId] = (b[toId] || 0) + tx.toAmount;
    });
    return b;
  }, [transactions, cryptos, userBalance]);

  // Fix: Explicitly cast Object.entries(balances) to [string, number][] to ensure 'amount' is inferred as number
  const totalValueXof = useMemo(() => {
    return (Object.entries(balances) as [string, number][]).reduce((acc: number, entry: [string, number]) => {
      const [id, amount] = entry;
      if (id === 'xof') return acc + amount;
      const crypto = cryptos.find(c => c.id === id);
      if (!crypto) return acc;
      return acc + (amount * crypto.price * USD_TO_XOF_RATE);
    }, 0);
  }, [balances, cryptos]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} userName={userName} />
      
      <div className="glass p-10 rounded-[3rem] bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/20 shadow-2xl">
        <h2 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Valeur Totale Estime</h2>
        <div className="flex items-baseline gap-3 mb-8">
          <span className="text-6xl font-black tracking-tighter text-white">{totalValueXof.toLocaleString()}</span>
          <span className="text-2xl font-bold text-indigo-400 uppercase">XOF</span>
        </div>
        <button onClick={() => setIsDepositModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/30">
          Recharger en Cash
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[2.5rem] space-y-6">
          <h3 className="font-bold text-xl tracking-tight text-white mb-6">Vos Actifs</h3>
          <div className="space-y-4">
            {/* Fix: Explicitly cast Object.entries(balances) to [string, number][] */}
            {(Object.entries(balances) as [string, number][]).map(([id, amount]) => {
                const crypto = cryptos.find(c => c.id === id);
                const isXof = id === 'xof';
                if (!isXof && amount === 0) return null; // Ne pas afficher les cryptos vides

                const name = isXof ? 'Franc CFA (PAYWIN)' : crypto?.name;
                const symbol = isXof ? 'XOF' : crypto?.symbol;
                const icon = isXof ? 'CFA' : crypto?.icon;
                const color = isXof ? '#10b981' : crypto?.color;
                const valueXof = isXof ? amount : (amount * (crypto?.price || 0) * USD_TO_XOF_RATE);

                return (
                  <div key={id} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-lg font-bold" style={{ color }}>{icon}</div>
                      <div>
                        <div className="font-bold text-white text-base">{name}</div>
                        <div className="text-[10px] text-slate-500 font-black uppercase">{amount.toLocaleString()} {symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{valueXof.toLocaleString()} <span className="text-[10px] text-slate-500">XOF</span></div>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] bg-indigo-600/5">
           <h3 className="font-bold text-xl mb-6 text-indigo-400">Statistiques de Répartition</h3>
           <div className="space-y-6">
              {/* Fix: Explicitly cast Object.entries(balances) to [string, number][] */}
              {(Object.entries(balances) as [string, number][]).map(([id, amount]) => {
                  const crypto = cryptos.find(c => c.id === id);
                  const isXof = id === 'xof';
                  const valueXof = isXof ? amount : (amount * (crypto?.price || 0) * USD_TO_XOF_RATE);
                  if (valueXof === 0) return null;
                  const percentage = (valueXof / totalValueXof) * 100;

                  return (
                    <div key={id} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase">
                          <span className="text-slate-400">{isXof ? 'CFA' : crypto?.symbol}</span>
                          <span className="text-white">{percentage.toFixed(1)}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }} />
                       </div>
                    </div>
                  );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
