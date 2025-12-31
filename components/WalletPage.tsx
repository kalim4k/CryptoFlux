
import React, { useMemo, useState } from 'react';
import { CryptoCurrency, Transaction } from '../types';
import { USD_TO_XOF_RATE } from '../services/priceService';
import DepositModal from './DepositModal';

interface WalletPageProps {
  cryptos: CryptoCurrency[];
  transactions: Transaction[];
  userName: string;
}

const WalletPage: React.FC<WalletPageProps> = ({ cryptos, transactions, userName }) => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const balances = useMemo(() => {
    const b: Record<string, number> = {
      'xof': 0
    };
    
    cryptos.forEach(c => b[c.id] = 0);

    transactions.forEach(tx => {
      const fromId = tx.fromCurrency.toLowerCase() === 'xof' ? 'xof' : cryptos.find(c => c.symbol === tx.fromCurrency)?.id;
      if (fromId) b[fromId] = (b[fromId] || 0) - tx.fromAmount;

      const toId = tx.toCurrency.toLowerCase() === 'xof' ? 'xof' : cryptos.find(c => c.symbol === tx.toCurrency)?.id;
      if (toId) b[toId] = (b[toId] || 0) + tx.toAmount;
    });

    return b;
  }, [transactions, cryptos]);

  const totalValueXof = useMemo(() => {
    /* Fix line 36 & 39: Explicitly type acc and amount to avoid unknown type errors in reduction */
    return Object.entries(balances).reduce((acc: number, [id, amount]: [string, number]) => {
      if (id === 'xof') return acc + amount;
      const crypto = cryptos.find(c => c.id === id);
      if (!crypto) return acc;
      return acc + (amount * crypto.price * USD_TO_XOF_RATE);
    }, 0);
  }, [balances, cryptos]);

  const hasActivity = transactions.length > 0;

  if (!hasActivity) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <DepositModal 
          isOpen={isDepositModalOpen} 
          onClose={() => setIsDepositModalOpen(false)} 
          userName={userName} 
        />
        <div className="w-64 h-64 bg-indigo-500/10 rounded-full flex items-center justify-center relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
          <svg className="w-32 h-32 text-indigo-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-black tracking-tighter">Votre portefeuille est vide</h2>
          <p className="text-slate-400 font-medium leading-relaxed">
            Commencez par déposer du cash (XOF) via Mobile Money pour voir vos actifs apparaître ici.
          </p>
          <div className="flex gap-4 pt-6 justify-center">
            <button 
              onClick={() => setIsDepositModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20"
            >
              Faire un dépôt
            </button>
            <button className="bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all border border-white/5">Acheter Crypto</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
        userName={userName} 
      />
      <div className="glass p-10 rounded-[3rem] bg-gradient-to-br from-indigo-900/60 to-slate-900 border-indigo-500/30">
        <h2 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Valeur Totale du Portefeuille</h2>
        <div className="flex items-baseline gap-3">
          <span className="text-6xl font-black tracking-tighter text-white">{totalValueXof.toLocaleString()}</span>
          <span className="text-2xl font-bold text-indigo-400 uppercase">XOF</span>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <button 
            onClick={() => setIsDepositModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Dépôt Cash (Fusion Pay)
          </button>
          <button className="bg-slate-800 hover:bg-slate-700 px-8 py-4 rounded-2xl font-bold transition-all border border-white/5 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Retrait
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[2.5rem] space-y-6">
          <h3 className="font-bold text-2xl tracking-tight">Actifs Réels</h3>
          <div className="space-y-4">
            {Object.entries(balances)
              .filter(([_, amount]) => amount !== 0)
              /* Fix line 119, 129, 135: Explicitly type amount to ensure correct arithmetic operations and toLocaleString usage */
              .map(([id, amount]: [string, number]) => {
                const crypto = cryptos.find(c => c.id === id);
                const isXof = id === 'xof';
                const name = isXof ? 'Franc CFA' : crypto?.name;
                const symbol = isXof ? 'XOF' : crypto?.symbol;
                const icon = isXof ? 'CFA' : crypto?.icon;
                const color = isXof ? '#f59e0b' : crypto?.color;
                const valueXof = isXof ? amount : (amount * (crypto?.price || 0) * USD_TO_XOF_RATE);

                return (
                  <div key={id} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform shadow-lg" style={{ color }}>
                        {icon}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{name}</div>
                        <div className="text-xs text-slate-500 font-mono">{amount.toLocaleString(undefined, { maximumFractionDigits: isXof ? 0 : 6 })} {symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-white">{valueXof.toLocaleString()} XOF</div>
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                        {((valueXof / totalValueXof) * 100).toFixed(1)}% du portfolio
                      </div>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-2xl mb-8 tracking-tight">Répartition Stratégique</h3>
            <div className="space-y-8">
              {Object.entries(balances)
                .filter(([_, amount]) => amount !== 0)
                /* Fix line 153, 154: Explicitly type amount to avoid arithmetic errors with unknown types */
                .map(([id, amount]: [string, number]) => {
                  const crypto = cryptos.find(c => c.id === id);
                  const name = id === 'xof' ? 'Franc CFA' : crypto?.name;
                  const valueXof = id === 'xof' ? amount : (amount * (crypto?.price || 0) * USD_TO_XOF_RATE);
                  const percentage = (valueXof / totalValueXof) * 100;
                  const color = id === 'xof' ? '#f59e0b' : crypto?.color;

                  return (
                    <div key={id} className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.1em]">
                        <span className="text-slate-400">{name}</span>
                        <span className="text-white">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div 
                          className="h-full rounded-full transition-all duration-1000" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: color,
                            boxShadow: `0 0 15px ${color}40`
                          }}
                        />
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
          
          <div className="mt-12 p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex gap-4 items-center">
             <div className="text-3xl">✨</div>
             <p className="text-xs text-indigo-300 leading-relaxed font-medium">
               Portefeuille sécurisé par Money Fusion. Les recharges sont instantanées et disponibles directement dans votre solde XOF.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
