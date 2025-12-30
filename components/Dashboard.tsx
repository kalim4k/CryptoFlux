
import React from 'react';
import { CryptoCurrency, Transaction } from '../types';
import { HistoryPoint, USD_TO_XOF_RATE } from '../services/priceService';
import SwapCard from './SwapCard';
import MarketAnalysis from './MarketAnalysis';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  cryptos: CryptoCurrency[];
  selectedCrypto: CryptoCurrency;
  setSelectedCrypto: (c: CryptoCurrency) => void;
  historyData: HistoryPoint[];
  loadingHistory: boolean;
  loadingPrices: boolean;
  isDemoMode: boolean;
  lastUpdate: Date;
  transactions: Transaction[];
  handleExecuteSwap: (from: any, to: any, amount: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  cryptos, selectedCrypto, setSelectedCrypto, historyData, 
  loadingHistory, loadingPrices, isDemoMode, lastUpdate,
  transactions, handleExecuteSwap
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Marchés en Direct 
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isDemoMode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
          </h2>
          <span className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Màj: {lastUpdate.toLocaleTimeString()}</span>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2">
          {cryptos.map(crypto => (
            <button 
              key={crypto.id}
              onClick={() => setSelectedCrypto(crypto)}
              className={`p-4 min-w-[155px] rounded-2xl border transition-all text-left flex-shrink-0 ${
                selectedCrypto.id === crypto.id 
                ? 'bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500' 
                : 'bg-slate-900 border-white/5 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xl" style={{ color: crypto.color }}>{crypto.icon}</span>
                <span className={`text-[10px] font-bold ${crypto.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {crypto.change24h > 0 ? '+' : ''}{crypto.change24h}%
                </span>
              </div>
              <div className="font-bold text-xs truncate">{crypto.name}</div>
              <div className="text-sm font-mono font-bold tracking-tight">
                {loadingPrices && crypto.price === 0 ? '...' : `$${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </div>
            </button>
          ))}
        </div>

        <div className="glass p-6 rounded-3xl h-[400px] relative overflow-hidden group">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {selectedCrypto.name} <span className="text-slate-500 text-lg font-mono">/ USD</span>
              </h2>
              <p className="text-slate-400 text-xs font-medium">Historique 7 jours (réel)</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold tracking-tighter text-indigo-400">${selectedCrypto.price.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">≈ {(selectedCrypto.price * USD_TO_XOF_RATE).toLocaleString()} XOF</div>
            </div>
          </div>
          
          <div className="h-[250px] relative">
            {loadingHistory ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} 
                    dy={10}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Prix']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-3xl">
          <h3 className="font-bold text-lg mb-6 tracking-tight">Activités Récentes</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                 <p className="italic text-sm font-medium">Aucun mouvement récent</p>
              </div>
            ) : (
              transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2.5 rounded-xl ${tx.type === 'CASH_OUT' ? 'bg-rose-500/20 text-rose-400' : tx.type === 'CASH_IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </div>
                    <div>
                      <div className="font-bold text-sm tracking-tight">{tx.type === 'CASH_OUT' ? 'Retrait' : tx.type === 'CASH_IN' ? 'Dépôt' : 'Échange'}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{new Date(tx.timestamp).toLocaleString('fr-FR')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-sm">
                      {tx.fromAmount} {tx.fromCurrency} → {tx.toAmount.toLocaleString(undefined, { maximumFractionDigits: tx.toCurrency === 'XOF' ? 0 : 4 })} {tx.toCurrency}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-8">
        <SwapCard onExecute={handleExecuteSwap} cryptos={cryptos} />
        <div className="h-[450px]"><MarketAnalysis currencyName={selectedCrypto.name} /></div>
      </div>
    </div>
  );
};

export default Dashboard;
