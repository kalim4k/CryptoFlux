
import React, { useState, useMemo } from 'react';
import { SUPPORTED_FIATS } from '../constants';
import { CryptoCurrency } from '../types';

interface SwapCardProps {
  onExecute: (from: any, to: any, amount: number) => void;
  cryptos: CryptoCurrency[];
}

const SwapCard: React.FC<SwapCardProps> = ({ onExecute, cryptos }) => {
  const allOptions = [...cryptos, ...SUPPORTED_FIATS];
  const [fromCurrency, setFromCurrency] = useState<any>(cryptos[0]);
  const [toCurrency, setToCurrency] = useState<any>(SUPPORTED_FIATS[1]); // Default to XOF
  const [amount, setAmount] = useState<string>('');

  const estimatedValue = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    
    // Find current price from the latest cryptos list to stay real-time
    const currentFrom = allOptions.find(o => o.id === fromCurrency.id) || fromCurrency;
    const currentTo = allOptions.find(o => o.id === toCurrency.id) || toCurrency;

    const fromPrice = currentFrom.price || currentFrom.priceInUsd || 1;
    const toPrice = currentTo.price || currentTo.priceInUsd || 1;
    
    return (numAmount * fromPrice) / toPrice;
  }, [amount, fromCurrency, toCurrency, cryptos]);

  const handleSwapSelection = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  return (
    <div className="glass p-6 rounded-3xl shadow-2xl space-y-4">
      <h2 className="text-xl font-bold mb-4">Échange Instantané</h2>
      
      <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>De</span>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="bg-transparent text-2xl font-semibold w-full outline-none"
          />
          <select
            value={fromCurrency.id}
            onChange={(e) => setFromCurrency(allOptions.find(c => c.id === e.target.value))}
            className="bg-slate-700 p-2 rounded-xl text-sm font-medium outline-none cursor-pointer"
          >
            <optgroup label="Cryptos">
              {cryptos.map(c => <option key={c.id} value={c.id}>{c.symbol}</option>)}
            </optgroup>
            <optgroup label="Fiat">
              {SUPPORTED_FIATS.map(f => <option key={f.id} value={f.id}>{f.symbol}</option>)}
            </optgroup>
          </select>
        </div>
      </div>

      <div className="flex justify-center -my-6 relative z-10">
        <button 
          onClick={handleSwapSelection}
          className="bg-indigo-600 p-2 rounded-full border-4 border-slate-900 hover:bg-indigo-500 transition-colors shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Vers (Estimé)</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-semibold w-full text-slate-300">
            {estimatedValue.toLocaleString(undefined, { maximumFractionDigits: toCurrency.id === 'xof' ? 0 : 6 })}
          </div>
          <select
            value={toCurrency.id}
            onChange={(e) => setToCurrency(allOptions.find(c => c.id === e.target.value))}
            className="bg-slate-700 p-2 rounded-xl text-sm font-medium outline-none cursor-pointer"
          >
            <optgroup label="Cryptos">
              {cryptos.map(c => <option key={c.id} value={c.id}>{c.symbol}</option>)}
            </optgroup>
            <optgroup label="Fiat">
              {SUPPORTED_FIATS.map(f => <option key={f.id} value={f.id}>{f.symbol}</option>)}
            </optgroup>
          </select>
        </div>
      </div>

      <button
        disabled={!amount || parseFloat(amount) <= 0}
        onClick={() => onExecute(fromCurrency, toCurrency, parseFloat(amount))}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed py-4 rounded-2xl font-bold text-lg transition-all shadow-indigo-500/20 shadow-lg mt-4"
      >
        Confirmer l'échange
      </button>
      
      <p className="text-[10px] text-center text-slate-500 uppercase tracking-tighter">
        Taux mis à jour en direct depuis CoinGecko
      </p>
    </div>
  );
};

export default SwapCard;
