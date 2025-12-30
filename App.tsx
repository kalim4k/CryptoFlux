
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { SUPPORTED_CRYPTOS, SUPPORTED_FIATS } from './constants';
import { Transaction, CryptoCurrency } from './types';
import Dashboard from './components/Dashboard';
import WalletPage from './components/WalletPage';
import HistoryPage from './components/HistoryPage';
import ProfilePage from './components/ProfilePage';
import Auth from './components/Auth';
import { fetchRealTimePrices, fetchCryptoHistory, USD_TO_XOF_RATE, HistoryPoint } from './services/priceService';
import { checkPaymentStatus } from './services/paymentService';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [cryptos, setCryptos] = useState<CryptoCurrency[]>(SUPPORTED_CRYPTOS);
  const [selectedCrypto, setSelectedCrypto] = useState(SUPPORTED_CRYPTOS[0]);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState({ title: '', sub: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  // Gestion de l'Auth Supabase
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setAppLoading(false);
      })
      .catch((err) => {
        console.error("Erreur de session Supabase :", err);
        setAppLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Vérification des paiements Money Fusion (Callback URL)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token && session) {
      const verifyPayment = async () => {
        try {
          const result = await checkPaymentStatus(token);
          if (result.statut && result.data.statut === 'paid') {
            // Éviter les doublons (simplifié ici, idéalement vérifié en DB)
            const alreadyExists = transactions.some(t => t.id === `fusion-${token}`);
            if (!alreadyExists) {
              const newTx: Transaction = {
                id: `fusion-${token}`,
                type: 'CASH_IN',
                fromCurrency: 'Mobile Money',
                toCurrency: 'XOF',
                fromAmount: result.data.Montant,
                toAmount: result.data.Montant,
                timestamp: Date.now(),
                status: 'COMPLETED'
              };
              setTransactions(prev => [newTx, ...prev]);
              setNotificationMsg({ title: 'Recharge validée !', sub: `${result.data.Montant} XOF ajoutés.` });
              setShowNotification(true);
              setTimeout(() => setShowNotification(false), 5000);
            }
          }
        } catch (err) {
          console.error("Erreur de vérification paiement:", err);
        } finally {
          // Nettoyer l'URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      verifyPayment();
    }
  }, [session, transactions.length]);

  // Mise à jour des prix en temps réel
  const updatePrices = useCallback(async () => {
    const ids = SUPPORTED_CRYPTOS.map(c => c.id);
    const priceData = await fetchRealTimePrices(ids);
    
    if (Object.keys(priceData).length > 0) {
      setCryptos(currentCryptos => {
        const updated = currentCryptos.map(c => {
          const data = priceData[c.id];
          return data ? {
            ...c,
            price: data.usd,
            change24h: parseFloat(data.usd_24h_change.toFixed(2))
          } : c;
        });
        
        const updatedSelected = updated.find(c => c.id === selectedCrypto.id);
        if (updatedSelected) {
          setSelectedCrypto(prev => (prev.id === updatedSelected.id ? updatedSelected : prev));
        }
        return updated;
      });
      setLastUpdate(new Date());
      setIsDemoMode(false); 
    } else {
      setIsDemoMode(true);
    }
    setLoadingPrices(false);
  }, [selectedCrypto.id]);

  // Chargement de l'historique réel pour la crypto sélectionnée
  const updateHistory = useCallback(async () => {
    setLoadingHistory(true);
    const history = await fetchCryptoHistory(selectedCrypto.id);
    setHistoryData(history);
    setLoadingHistory(false);
  }, [selectedCrypto.id]);

  useEffect(() => {
    if (session) {
      updatePrices();
      const interval = setInterval(updatePrices, 30000); 
      return () => clearInterval(interval);
    }
  }, [updatePrices, session]);

  useEffect(() => {
    if (session) updateHistory();
  }, [updateHistory, session]);

  const handleExecuteSwap = (from: any, to: any, amount: number) => {
    const isFiat = (id: string) => SUPPORTED_FIATS.some(f => f.id === id);
    const fromPrice = from.price || from.priceInUsd || 1;
    const toPrice = to.price || to.priceInUsd || 1;

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: isFiat(to.id) ? 'CASH_OUT' : isFiat(from.id) ? 'CASH_IN' : 'SWAP',
      fromCurrency: from.symbol,
      toCurrency: to.symbol,
      fromAmount: amount,
      toAmount: (amount * fromPrice) / toPrice,
      timestamp: Date.now(),
      status: 'COMPLETED'
    };
    
    setTransactions(prev => [newTx, ...prev]);
    setNotificationMsg({ title: 'Transaction validée', sub: 'Blockchain confirmée' });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            cryptos={cryptos}
            selectedCrypto={selectedCrypto}
            setSelectedCrypto={setSelectedCrypto}
            historyData={historyData}
            loadingHistory={loadingHistory}
            loadingPrices={loadingPrices}
            isDemoMode={isDemoMode}
            lastUpdate={lastUpdate}
            transactions={transactions}
            handleExecuteSwap={handleExecuteSwap}
          />
        );
      case 'wallet':
        return <WalletPage cryptos={cryptos} transactions={transactions} userName={session.user.email?.split('@')[0]} />;
      case 'history':
        return <HistoryPage transactions={transactions} />;
      case 'profile':
        return <ProfilePage user={session?.user} />;
      default:
        return null;
    }
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium animate-pulse">Initialisation de la session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col pb-24 md:pb-0">
      <nav className="border-b border-white/5 py-4 px-6 flex justify-between items-center sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div 
          className="flex items-center space-x-2 cursor-pointer" 
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">C</div>
          <span className="text-xl font-bold tracking-tight">CryptoFlux</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <div className="flex space-x-8 text-sm font-bold uppercase tracking-widest text-slate-500">
            <button onClick={() => setActiveTab('dashboard')} className={`transition-colors hover:text-indigo-400 ${activeTab === 'dashboard' ? 'text-indigo-400' : ''}`}>Marché</button>
            <button onClick={() => setActiveTab('wallet')} className={`transition-colors hover:text-indigo-400 ${activeTab === 'wallet' ? 'text-indigo-400' : ''}`}>Wallet</button>
            <button onClick={() => setActiveTab('history')} className={`transition-colors hover:text-indigo-400 ${activeTab === 'history' ? 'text-indigo-400' : ''}`}>Historique</button>
          </div>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden ${activeTab === 'profile' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-slate-500'}`}
          >
            {session.user.user_metadata?.avatar_url ? (
              <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center font-bold text-[10px]">
                {session.user.email?.substring(0, 2).toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {renderContent()}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 bg-gradient-to-t from-slate-950 via-slate-950/98 to-transparent">
        <div className="glass rounded-2xl flex items-center justify-between p-2 shadow-2xl ring-1 ring-white/5">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center flex-1 p-2.5 transition-all ${activeTab === 'dashboard' ? 'text-indigo-400 bg-indigo-500/10 rounded-xl' : 'text-slate-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-[10px] font-black mt-1 uppercase">Marché</span>
          </button>
          <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center flex-1 p-2.5 transition-all ${activeTab === 'wallet' ? 'text-indigo-400 bg-indigo-500/10 rounded-xl' : 'text-slate-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[10px] font-black mt-1 uppercase">Wallet</span>
          </button>
          <div className="flex-1 flex justify-center -mt-9">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="w-16 h-16 bg-indigo-600 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center text-white border-[6px] border-slate-950 active:scale-90 transition-all"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </button>
          </div>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center flex-1 p-2.5 transition-all ${activeTab === 'history' ? 'text-indigo-400 bg-indigo-500/10 rounded-xl' : 'text-slate-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[10px] font-black mt-1 uppercase">Historique</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center flex-1 p-2.5 transition-all ${activeTab === 'profile' ? 'text-indigo-400 bg-indigo-500/10 rounded-xl' : 'text-slate-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-black mt-1 uppercase">Profil</span>
          </button>
        </div>
      </div>

      {showNotification && (
        <div className="fixed bottom-28 md:bottom-8 right-8 bg-indigo-500 text-white px-8 py-5 rounded-3xl shadow-2xl z-[200] flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 ring-4 ring-indigo-500/20">
          <div className="bg-white/20 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <div className="font-black uppercase text-sm tracking-widest">{notificationMsg.title}</div>
            <div className="text-[10px] font-bold text-white/80">{notificationMsg.sub}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
