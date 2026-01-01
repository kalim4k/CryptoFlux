
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './lib/supabase';
import { SUPPORTED_CRYPTOS } from './constants';
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
  
  // États utilisateur synchronisés avec la DB
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userFullName, setUserFullName] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [lastCreditedAmount, setLastCreditedAmount] = useState<number>(0);

  const isVerifyingRef = useRef(false);

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
        // IMPORTANT: On récupère la balance réelle de la DB
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
      console.error("Erreur de récupération du profil:", err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const verifyPaymentReturn = useCallback(async (userId: string) => {
    if (isVerifyingRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      isVerifyingRef.current = true;
      try {
        const result = await checkPaymentStatus(token);
        if (result.statut && result.data.statut === 'paid') {
          const amountPaid = result.data.Montant;
          
          // Récupération du solde actuel le plus récent avant mise à jour
          const { data: profile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();
          
          const currentBalance = profile?.balance || 0;
          const newBalance = currentBalance + amountPaid;
          
          // Mise à jour physique dans Supabase
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId);
          
          if (!updateError) {
            setUserBalance(newBalance);
            setLastCreditedAmount(amountPaid);
            
            // On nettoie l'URL et on affiche le succès
            const cleanUrl = window.location.origin + window.location.pathname + "#remerciement";
            window.history.replaceState({}, document.title, cleanUrl);
            setActiveTab('remerciement');

            setTransactions(prev => [{
              id: token,
              type: 'CASH_IN',
              fromCurrency: 'XOF',
              toCurrency: 'XOF',
              fromAmount: amountPaid,
              toAmount: amountPaid,
              timestamp: Date.now(),
              status: 'COMPLETED'
            }, ...prev]);
          }
        }
      } catch (err) {
        console.error("Erreur vérification paiement:", err);
      } finally {
        isVerifyingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user.id);
        await verifyPaymentReturn(session.user.id);
      }
      handleHashRouting();
      setAppLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
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

    setTransactions(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      type: 'SWAP',
      fromCurrency: from.symbol,
      toCurrency: to.symbol,
      fromAmount: amount,
      toAmount: toAmount,
      timestamp: Date.now(),
      status: 'COMPLETED'
    }, ...prev]);
    alert(`Échange effectué avec succès !`);
    window.location.hash = 'wallet';
  };

  if (appLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">CryptoFlux Sécurisé...</p>
    </div>
  );

  if (!session) return <Auth />;

  const renderContent = () => {
    if (activeTab === 'remerciement') {
      return <ThankYouPage amount={lastCreditedAmount} onReturn={() => { window.location.hash = 'wallet'; }} />;
    }

    if (activeTab === 'echange') {
      return profileLoading ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Accès PAYWIN...</p>
        </div>
      ) : (
        <EchangePage userName={userFullName} currentBalance={userBalance} />
      );
    }

    switch (activeTab) {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.hash = ''}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-lg">C</div>
          <span className="text-xl font-black tracking-tighter">CryptoFlux</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          {['dashboard', 'wallet', 'history', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => { window.location.hash = tab === 'dashboard' ? '' : tab; }}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                activeTab === tab ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Balance Profile</div>
            <div className="text-sm font-bold text-white leading-none">{userBalance.toLocaleString()} <span className="text-indigo-400">XOF</span></div>
          </div>
          <button 
            onClick={() => window.location.hash = 'echange'}
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
          >
            Échange
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
        {renderContent()}
      </main>

      {/* Navigation Mobile */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl border border-white/10 p-2 shadow-2xl flex gap-1">
        {[
          { id: 'dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
          { id: 'wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
          { id: 'history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { window.location.hash = item.id === 'dashboard' ? '' : item.id; }}
            className={`p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;
