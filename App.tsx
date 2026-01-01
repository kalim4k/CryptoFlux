
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './lib/supabase';
import { SUPPORTED_CRYPTOS, SUPPORTED_FIATS } from './constants';
import { Transaction, CryptoCurrency } from './types';
import Dashboard from './components/Dashboard';
import WalletPage from './components/WalletPage';
import HistoryPage from './components/HistoryPage';
import ProfilePage from './components/ProfilePage';
import EchangePage from './components/EchangePage';
import ThankYouPage from './components/ThankYouPage';
import Auth from './components/Auth';
import { fetchRealTimePrices, fetchCryptoHistory, HistoryPoint } from './services/priceService';
import { checkPaymentStatus } from './services/paymentService';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [cryptos, setCryptos] = useState<CryptoCurrency[]>(SUPPORTED_CRYPTOS);
  const [selectedCrypto, setSelectedCrypto] = useState(SUPPORTED_CRYPTOS[0]);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [appLoading, setAppLoading] = useState(true);
  
  // Données utilisateur
  const [userBalance, setUserBalance] = useState(0);
  const [userFullName, setUserFullName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [lastCreditedAmount, setLastCreditedAmount] = useState<number>(0);

  // Utilisation d'une ref pour éviter les boucles infinies dans les callbacks
  const isVerifyingPayment = useRef(false);

  const handleHashRouting = useCallback(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('remerciement')) {
      setActiveTab('remerciement');
    } else if (hash.includes('echange')) {
      setActiveTab('echange');
    } else if (hash.includes('wallet')) {
      setActiveTab('wallet');
    } else if (hash.includes('history')) {
      setActiveTab('history');
    } else if (hash.includes('profile')) {
      setActiveTab('profile');
    } else {
      setActiveTab('dashboard');
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!userId) return;
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance, full_name, username')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUserBalance(data.balance || 0);
        setUserFullName(data.full_name || data.username || 'Utilisateur');
      } else if (error && error.code === 'PGRST116') {
        const { data: { user } } = await supabase.auth.getUser();
        const defaultName = user?.email?.split('@')[0] || 'Utilisateur';
        await supabase.from('profiles').insert([{ id: userId, balance: 0, full_name: defaultName }]);
        setUserBalance(0);
        setUserFullName(defaultName);
      }
    } catch (err) {
      console.error("Erreur profile:", err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const verifyPaymentReturn = useCallback(async (userId: string) => {
    if (isVerifyingPayment.current) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      isVerifyingPayment.current = true;
      try {
        const result = await checkPaymentStatus(token);
        if (result.statut && result.data.statut === 'paid') {
          const amountPaid = result.data.Montant;
          
          const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single();
          const currentBalance = profile?.balance || 0;
          const newBalance = currentBalance + amountPaid;
          
          const { error: updateError } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
          
          if (!updateError) {
            setUserBalance(newBalance);
            setLastCreditedAmount(amountPaid);
            
            const newUrl = window.location.origin + window.location.pathname + "#remerciement";
            window.history.replaceState({}, document.title, newUrl);
            setActiveTab('remerciement');

            const tx: Transaction = {
              id: token,
              type: 'CASH_IN',
              fromCurrency: 'XOF',
              toCurrency: 'XOF',
              fromAmount: amountPaid,
              toAmount: amountPaid,
              timestamp: Date.now(),
              status: 'COMPLETED'
            };
            setTransactions(prev => [tx, ...prev]);
          }
        }
      } catch (err) {
        console.error("Erreur post-paiement:", err);
      } finally {
        isVerifyingPayment.current = false;
      }
    }
  }, []);

  // Initialisation unique
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user.id);
        await verifyPaymentReturn(session.user.id);
        handleHashRouting();
      }
      setAppLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
        handleHashRouting();
      }
    });

    window.addEventListener('hashchange', handleHashRouting);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashRouting);
    };
  }, [fetchUserProfile, handleHashRouting, verifyPaymentReturn]);

  const updatePrices = useCallback(async () => {
    const ids = SUPPORTED_CRYPTOS.map(c => c.id);
    const priceData = await fetchRealTimePrices(ids);
    if (priceData && Object.keys(priceData).length > 0) {
      setCryptos(current => current.map(c => {
        const d = priceData[c.id];
        return d ? { ...c, price: d.usd, change24h: parseFloat(d.usd_24h_change?.toFixed(2) || '0') } : c;
      }));
      setLastUpdate(new Date());
    }
    setLoadingPrices(false);
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      const data = await fetchCryptoHistory(selectedCrypto.id);
      setHistoryData(data);
      setLoadingHistory(false);
    };
    loadHistory();
  }, [selectedCrypto]);

  useEffect(() => {
    updatePrices();
    const interval = setInterval(updatePrices, 30000);
    return () => clearInterval(interval);
  }, [updatePrices]);

  const handleExecuteSwap = (from: any, to: any, amount: number) => {
    const fromPrice = from.price || from.priceInUsd || 1;
    const toPrice = to.price || to.priceInUsd || 1;
    const toAmount = (amount * fromPrice) / toPrice;

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'SWAP',
      fromCurrency: from.symbol,
      toCurrency: to.symbol,
      fromAmount: amount,
      toAmount: toAmount,
      timestamp: Date.now(),
      status: 'COMPLETED'
    };
    setTransactions(prev => [newTx, ...prev]);
    alert(`Échange effectué avec succès !`);
    window.location.hash = 'wallet';
  };

  if (appLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Initialisation CryptoFlux...</p>
    </div>
  );

  if (!session) return <Auth />;

  // Rendu conditionnel des pages
  const renderContent = () => {
    if (activeTab === 'remerciement') {
      return <ThankYouPage amount={lastCreditedAmount} onReturn={() => { window.location.hash = 'wallet'; }} />;
    }

    if (activeTab === 'echange') {
      return profileLoading ? (
        <div className="flex flex-col items-center gap-4 py-20">
           <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-xs font-black uppercase tracking-widest text-slate-500">Accès au terminal sécurisé...</p>
        </div>
      ) : (
        <EchangePage userName={userFullName} currentBalance={userBalance} />
      );
    }

    switch(activeTab) {
      case 'wallet': return <WalletPage cryptos={cryptos} transactions={transactions} userName={userFullName} />;
      case 'history': return <HistoryPage transactions={transactions} />;
      case 'profile': return <ProfilePage user={session?.user} />;
      default: return (
        <Dashboard 
          cryptos={cryptos} selectedCrypto={selectedCrypto} setSelectedCrypto={setSelectedCrypto} 
          historyData={historyData} loadingHistory={loadingHistory} loadingPrices={loadingPrices} 
          isDemoMode={false} lastUpdate={lastUpdate} transactions={transactions} 
          handleExecuteSwap={handleExecuteSwap} 
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col pb-24 md:pb-0">
      <nav className="border-b border-white/5 py-4 px-6 flex justify-between items-center sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.hash = ''}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white">C</div>
          <span className="text-xl font-bold tracking-tight text-white">CryptoFlux</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <div className="flex space-x-8 text-sm font-bold uppercase tracking-widest text-slate-500">
            <button onClick={() => window.location.hash = ''} className={`transition-colors hover:text-indigo-400 ${activeTab === 'dashboard' ? 'text-indigo-400' : ''}`}>Marché</button>
            <button onClick={() => window.location.hash = 'wallet'} className={`transition-colors hover:text-indigo-400 ${activeTab === 'wallet' ? 'text-indigo-400' : ''}`}>Wallet</button>
            <button onClick={() => window.location.hash = 'history'} className={`transition-colors hover:text-indigo-400 ${activeTab === 'history' ? 'text-indigo-400' : ''}`}>Historique</button>
          </div>
          <button onClick={() => window.location.hash = 'profile'} className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden ${activeTab === 'profile' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10'}`}>
            <div className="w-full h-full bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">{userFullName.substring(0, 2).toUpperCase()}</div>
          </button>
        </div>
      </nav>

      <main className={`flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 ${activeTab === 'echange' || activeTab === 'remerciement' ? 'flex items-center justify-center' : ''}`}>
        {renderContent()}
      </main>

      {/* Navigation Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 bg-gradient-to-t from-slate-950 via-slate-950/98 to-transparent">
        <div className="glass rounded-2xl flex items-center justify-between p-2 shadow-2xl ring-1 ring-white/5">
          <button onClick={() => window.location.hash = ''} className={`flex flex-col items-center flex-1 p-2.5 ${activeTab === 'dashboard' ? 'text-indigo-400 bg-indigo-500/10 rounded-xl' : 'text-slate-500'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
             <span className="text-[10px] font-black mt-1 uppercase">Marché</span>
          </button>
          <button onClick={() => window.location.hash = 'wallet'} className={`flex flex-col items-center flex-1 p-2.5 ${activeTab === 'wallet' ? 'text-indigo-400 bg-indigo-500/10 rounded-xl' : 'text-slate-500'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span className="text-[10px] font-black mt-1 uppercase">Wallet</span>
          </button>
          <button onClick={() => window.location.hash = 'history'} className={`flex flex-col items-center flex-1 p-2.5 ${activeTab === 'history' ? 'text-indigo-400 bg-indigo-500/10 rounded-xl' : 'text-slate-500'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span className="text-[10px] font-black mt-1 uppercase">Historique</span>
          </button>
          <button onClick={() => window.location.hash = 'profile'} className={`flex flex-col items-center flex-1 p-2.5 ${activeTab === 'profile' ? 'text-indigo-400 bg-indigo-500/10 rounded-xl' : 'text-slate-500'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             <span className="text-[10px] font-black mt-1 uppercase">Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
