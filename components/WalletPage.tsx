
import React, { useMemo, useState } from 'react';
import { CryptoCurrency, Transaction } from '../types';
import { USD_TO_XOF_RATE } from '../services/priceService';
import DepositModal from './DepositModal';

interface WalletPageProps {
  cryptos: CryptoCurrency[];
  transactions: Transaction[];
  userName: string;
  userBalance: number;
}

const WalletPage: React.FC<WalletPageProps> = ({ cryptos, transactions, userName, userBalance }) => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Utilise userBalance (de la base de données) comme solde de départ pour XOF
  const balances = useMemo(() => {
    const b: Record<string, number> = { 'xof': userBalance };
    
    // Initialise les autres cryptos à 0
    cryptos.forEach(c => b[c.id] = 0);
    
    // Si vous avez des transactions crypto, elles s'ajoutent/soustraient ici
    // Pour l'instant on garde le calcul par transactions si nécessaire
    transactions.forEach(tx => {
      const fromId = tx.fromCurrency.toLowerCase() === 'xof' ? 'xof' : cryptos.find(c => c.symbol === tx.fromCurrency)?.id;
      if (fromId && fromId !== 'xof') b[fromId] = (b[fromId] || 0) - tx.fromAmount;
      
      const toId = tx.toCurrency.toLowerCase() === 'xof' ? 'xof' : cryptos.find(c => c.symbol === tx.toCurrency)?.id;
      if (toId && toId !== 'xof') b[toId] = (b[toId] || 0) + tx.toAmount;
    });
    return b;
  }, [transactions, cryptos, userBalance]);

  const totalValueXof = useMemo(() => {
    return Object.entries(balances).reduce((acc: number, entry: [string, number]) => {
      const [id, amount] = entry;
      if (id === 'xof') return acc + amount;
      const crypto = cryptos.find(c => c.id === id);
      if (!crypto) return acc;
      return acc + (amount * crypto.price * USD_TO_XOF_RATE);
    }, 0);
  }, [balances, cryptos]);

  // Si le solde DB est > 0, on considère qu'il y a de l'activité
  const hasAssets = userBalance > 0 || transactions.length > 0;

  if (!hasAssets) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} userName={userName} />
        <div className="w-64 h-64 bg-indigo-500/10 rounded-full flex items-center justify-center relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
          <svg className="w-32 h-32 text-indigo-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-black tracking-tighter text-white">Votre portefeuille est vide</h2>
          <p className="text-slate-400 font-medium leading-relaxed">Commencez par déposer du cash (XOF) via Mobile Money pour voir vos actifs apparaître ici.</p>
          <div className="flex gap-4 pt-6 justify-center">
            <button onClick={() => setIsDepositModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 text-white">Faire un dépôt</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} userName={userName} />
      <div className="glass p-10 rounded-[3rem] bg-gradient-to-br from-indigo-900/60 to-slate-900 border-indigo-500/30">
        <h2 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Valeur Totale des Actifs</h2>
        <div className="flex items-baseline gap-3">
          <span className="text-6xl font-black tracking-tighter text-white">{totalValueXof.toLocaleString()}</span>
          <span className="text-2xl font-bold text-indigo-400 uppercase">XOF</span>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <button onClick={() => setIsDepositModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Recharger Cash
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[2.5rem] space-y-6">
          <h3 className="font-bold text-2xl tracking-tight text-white">Mes Actifs</h3>
          <div className="space-y-4">
            {/* Actif XOF direct depuis la DB */}
            <div className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-indigo-500/20 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-xl font-black text-amber-500">CFA</div>
                <div>
                  <div className="font-bold text-white text-lg">Franc CFA</div>
                  <div className="text-xs text-slate-500 font-mono">Disponibilité immédiate</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black font-mono text-xl text-emerald-400">{userBalance.toLocaleString()} XOF</div>
              </div>
            </div>

            {/* Autres cryptos (si > 0) */}
            {/* Fix: Explicitly cast Object.entries to [string, number][] to ensure 'amount' is treated as a number */}
            {(Object.entries(balances) as [string, number][])
              .filter(([id, amount]) => id !== 'xof' && amount > 0)
              .map((entry: [string, number]) => {
                const [id, amount] = entry;
                const crypto = cryptos.find(c => c.id === id);
                if (!crypto) return null;
                const valueXof = amount * crypto.price * USD_TO_XOF_RATE;

                return (
                  <div key={id} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-xl font-bold" style={{ color: crypto.color }}>{crypto.icon}</div>
                      <div>
                        <div className="font-bold text-white text-lg">{crypto.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{amount.toLocaleString()} {crypto.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-white">{valueXof.toLocaleString()} XOF</div>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-2xl mb-8 tracking-tight text-white">Répartition du Portefeuille</h3>
            <div className="space-y-8">
              {/* Fix: Explicitly cast Object.entries to [string, number][] to ensure 'amount' is treated as a number */}
              {(Object.entries(balances) as [string, number][])
                .filter(([_, amount]) => amount > 0)
                .map((entry: [string, number]) => {
                  const [id, amount] = entry;
                  const crypto = cryptos.find(c => c.id === id);
                  const name = id === 'xof' ? 'Franc CFA' : crypto?.name;
                  const valueXof = id === 'xof' ? amount : (amount * (crypto?.price || 0) * USD_TO_XOF_RATE);
                  const percentage = totalValueXof > 0 ? (valueXof / totalValueXof) * 100 : 0;
                  const color = id === 'xof' ? '#f59e0b' : crypto?.color;

                  return (
                    <div key={id} className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.1em]">
                        <span className="text-slate-400">{name}</span>
                        <span className="text-white">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
            <p className="text-xs text-slate-400 italic">
              "Le solde XOF est synchronisé directement avec votre compte Cash sécurisé. Les cryptos sont évaluées selon les cours du marché en temps réel."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
