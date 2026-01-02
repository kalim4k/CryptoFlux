
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
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userFullName, setUserFullName] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appLoading, setAppLoading] = useState(true);
  const [cryptos, setCryptos] = useState<CryptoCurrency[]>(SUPPORTED_CRYPTOS);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency>(SUPPORTED_CRYPTOS[0]);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [lastCreditedAmount, setLastCreditedAmount] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const isVerifyingRef = useRef(false);

  // RÉCUPÉRATION DU PROFIL
  const fetchUserProfile = useCallback(async (userId: string, userEmail?: string) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance, full_name')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUserBalance(Number(data.balance) || 0);
        setUserFullName(data.full_name || userEmail?.split('@')[0] || 'Utilisateur');
      }
    } catch (err) {
      console.error("Erreur lecture profil:", err);
    }
  }, []);

  // RÉCUPÉRATION DE L'HISTORIQUE POUR LA COURBE
  const updateHistory = useCallback(async (cryptoId: string) => {
    setLoadingHistory(true);
    try {
      const data = await fetchCryptoHistory(cryptoId);
      setHistoryData(data);
    } catch (err) {
      console.error("Erreur historique:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // LOGIQUE DE CRÉDIT AUTOMATIQUE (POST-ACHAT FUSION PAY)
  const executeAutoCredit = useCallback(async (userId: string) => {
    if (isVerifyingRef.current) return;

    // Détection du token dans l'URL (Query ou Hash)
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');
    
    if (!token) {
      const hash = window.location.hash;
      if (hash.includes('token=')) {
        token = hash.split('token=')[1].split('&')[0];
      }
    }

    if (!token) return;

    isVerifyingRef.current = true;
    try {
      const result = await checkPaymentStatus(token);
      const status = result.data?.statut?.toLowerCase();

      if (result.statut && (status === 'paid' || status === 'success')) {
        const amountToAdd = Number(result.data.Montant);
        
        // On récupère le solde le plus récent
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();

        const newBalance = Math.floor((Number(profile?.balance) || 0) + amountToAdd);

        const { error: upError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', userId);

        if (!upError) {
          setUserBalance(newBalance);
          setLastCreditedAmount(amountToAdd);
          
          // Nettoyage URL et redirection vers page de remerciement
          const cleanUrl = window.location.origin + window.location.pathname + "#remerciement";
          window.history.replaceState({}, document.title, cleanUrl);
          setActiveTab('remerciement');
        }
      }
    } catch (err) {
      console.error("Erreur vérification paiement:", err);
    } finally {
      isVerifyingRef.current = false;
    }
  }, []);

  // INITIALISATION
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user.id, session.user.email);
        await executeAutoCredit(session.user.id);
        await updateHistory(selectedCrypto.id);
      }
      setAppLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id, session.user.email);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, executeAutoCredit, selectedCrypto.id]);

  // MISE À JOUR PRIX & COURBE QUAND LA CRYPTO CHANGE
  useEffect(() => {
    if (session) {
      updateHistory(selectedCrypto.id);
    }
  }, [selectedCrypto.id, session, updateHistory]);

  useEffect(() => {
    const updatePrices = async () => {
      const data = await fetchRealTimePrices(SUPPORTED_CRYPTOS.map(c => c.id));
      if (data) {
        setCryptos(current => current.map(c => {
          const d = data[c.id];
          return d ? { ...c, price: d.usd, change24h: d.usd_24h_change } : c;
        }));
        setLastUpdate(new Date());
      }
    };
    updatePrices();
    const timer = setInterval(updatePrices, 60000);
    return () => clearInterval(timer);
  }, []);

  // GESTION NAVIGATION HASH
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.toLowerCase();
      if (h.includes('remerciement')) setActiveTab('remerciement');
      else if (h.includes('wallet')) setActiveTab('wallet');
      else if (h.includes('echange')) setActiveTab('echange');
      else if (h.includes('profile')) setActiveTab('profile');
      else setActiveTab('dashboard');
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (appLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-indigo-400 font-black text-xs uppercase tracking-widest">Initialisation sécurisée...</p>
    </div>
  );
  
  if (!session) return <Auth />;

  const handleExecuteSwap = (from: any, to: any, amount: number) => {
    // Logique de simulation d'échange local
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'SWAP',
      fromCurrency: from.symbol,
      toCurrency: to.symbol,
      fromAmount: amount,
      toAmount: (amount * (from.price || from.priceInUsd || 1)) / (to.price || to.priceInUsd || 1),
      timestamp: Date.now(),
      status: 'COMPLETED'
    };
    setTransactions([newTx, ...transactions]);
    alert("Échange effectué avec succès (Simulation)");
  };

  const renderView = () => {
    switch (activeTab) {
      case 'remerciement': return <ThankYouPage amount={lastCreditedAmount} onReturn={() => window.location.hash = 'wallet'} />;
      case 'wallet': return <WalletPage cryptos={cryptos} transactions={transactions} userName={userFullName} userBalance={userBalance} />;
      case 'echange': return <EchangePage userName={userFullName} currentBalance={userBalance} />;
      case 'profile': return <ProfilePage user={session.user} balance={userBalance} />;
      default: return (
        <Dashboard 
          cryptos={cryptos} 
          selectedCrypto={selectedCrypto} 
          setSelectedCrypto={setSelectedCrypto} 
          historyData={historyData} 
          loadingHistory={loadingHistory} 
          loadingPrices={false} 
          isDemoMode={false} 
          lastUpdate={lastUpdate} 
          transactions={transactions} 
          handleExecuteSwap={handleExecuteSwap} 
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <nav className="fixed top-0 left-0 right-0 z-[100] glass border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.hash = ''}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black transition-transform group-hover:rotate-12">C</div>
          <span className="text-xl font-black tracking-tighter">CryptoFlux</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:block text-right">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Portefeuille Cash</div>
            <div className="text-sm font-bold text-emerald-400">{userBalance.toLocaleString()} XOF</div>
          </div>
          <div 
            onClick={() => window.location.hash = 'profile'}
            className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center cursor-pointer hover:bg-indigo-500/40 transition-all active:scale-90"
          >
            <span className="text-xs font-black text-indigo-400">{session.user.email?.substring(0, 2).toUpperCase()}</span>
          </div>
        </div>
      </nav>
      
      <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
        {renderView()}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 md:hidden">
        <div className="flex justify-around items-center h-20">
          {[
            { id: '', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
            { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => window.location.hash = tab.id}
              className={`p-3 rounded-2xl transition-all ${activeTab === (tab.id || 'dashboard') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default App;
