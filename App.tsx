
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
import { fetchRealTimePrices } from './services/priceService';
import { checkPaymentStatus } from './services/paymentService';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userFullName, setUserFullName] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appLoading, setAppLoading] = useState(true);
  const [cryptos, setCryptos] = useState<CryptoCurrency[]>(SUPPORTED_CRYPTOS);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [lastCreditedAmount, setLastCreditedAmount] = useState<number>(0);

  const isVerifyingRef = useRef(false);

  // RÉCUPÉRATION DU PROFIL DEPUIS SUPABASE
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance, full_name, username')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUserBalance(Number(data.balance) || 0);
        setUserFullName(data.full_name || data.username || 'Utilisateur');
      } else if (error) {
        console.error("Erreur lecture profil:", error.message);
      }
    } catch (err) {
      console.error("Erreur système lecture profil:", err);
    }
  }, []);

  // LOGIQUE ULTIME : CRÉDIT DE LA COLONNE 'balance' EN BASE DE DONNÉES
  const executeAutoCredit = useCallback(async (userId: string) => {
    if (isVerifyingRef.current) return;

    // 1. EXTRACTION ROBUSTE DU TOKEN
    // Gère : ?token=... OU #token=... OU #/page?token=...
    const fullUrl = window.location.href;
    const urlSearchParams = new URLSearchParams(window.location.search);
    let token = urlSearchParams.get('token');

    if (!token) {
      // Tente d'extraire depuis le hash
      const hashPart = window.location.hash;
      const hashParams = new URLSearchParams(hashPart.includes('?') ? hashPart.split('?')[1] : hashPart.replace('#', ''));
      token = hashParams.get('token');
    }

    if (!token) return;

    isVerifyingRef.current = true;
    console.log("--- DÉBUT PROCESSUS CRÉDIT ---");
    console.log("Token identifié:", token);

    try {
      // 2. VÉRIFICATION DU STATUT CHEZ MONEY FUSION
      const result = await checkPaymentStatus(token);
      const paymentData = result.data;
      const status = paymentData?.statut?.toLowerCase();

      console.log("Réponse Money Fusion:", result);

      const isSuccess = result.statut && (status === 'paid' || status === 'success' || status === 'completed');

      if (isSuccess) {
        const amountToAdd = Number(paymentData.Montant);
        console.log(`Paiement de ${amountToAdd} XOF validé.`);

        // 3. RÉCUPÉRATION DU SOLDE FRAIS DEPUIS LA DB (Évite les désynchronisations)
        const { data: freshProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();

        if (fetchError) throw new Error("Impossible de lire le solde actuel : " + fetchError.message);

        const currentDbBalance = Number(freshProfile?.balance || 0);
        const finalBalance = Math.floor(currentDbBalance + amountToAdd); // int4 supporte les entiers

        console.log(`Solde actuel DB: ${currentDbBalance}. Nouveau solde calculé: ${finalBalance}`);

        // 4. MISE À JOUR ATOMIQUE DANS SUPABASE
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ balance: finalBalance })
          .eq('id', userId);

        if (updateError) {
          throw new Error("Échec de la mise à jour SQL : " + updateError.message);
        }

        console.log("--- CRÉDIT RÉUSSI EN BASE DE DONNÉES ---");
        
        // Mise à jour de l'interface
        setUserBalance(finalBalance);
        setLastCreditedAmount(amountToAdd);
        
        // Nettoyage de l'URL pour éviter de re-créditer au refresh
        const cleanUrl = window.location.origin + window.location.pathname + "#remerciement";
        window.history.replaceState({}, document.title, cleanUrl);
        setActiveTab('remerciement');

      } else {
        console.log("Le paiement n'est pas encore prêt ou a échoué. Statut reçu:", status);
      }
    } catch (err: any) {
      console.error("CRASH DU PROCESSUS DE CRÉDIT:", err.message);
      alert("Erreur de crédit automatique : " + err.message);
    } finally {
      isVerifyingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const startApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        // Important: Fetch profile first
        await fetchUserProfile(session.user.id);
        // Then try auto-credit
        await executeAutoCredit(session.user.id);
      }
      setAppLoading(false);
    };
    startApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const routeManager = () => {
      const h = window.location.hash.toLowerCase();
      if (h.includes('remerciement')) setActiveTab('remerciement');
      else if (h.includes('wallet')) setActiveTab('wallet');
      else if (h.includes('echange')) setActiveTab('echange');
      else if (h.includes('profile')) setActiveTab('profile');
      else setActiveTab('dashboard');
    };
    window.addEventListener('hashchange', routeManager);
    routeManager();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', routeManager);
    };
  }, [fetchUserProfile, executeAutoCredit]);

  useEffect(() => {
    const updateMarketPrices = async () => {
      const ids = SUPPORTED_CRYPTOS.map(c => c.id);
      const data = await fetchRealTimePrices(ids);
      if (data) {
        setCryptos(current => current.map(c => {
          const d = data[c.id];
          return d ? { ...c, price: d.usd, change24h: d.usd_24h_change } : c;
        }));
        setLastUpdate(new Date());
      }
    };
    updateMarketPrices();
    const interval = setInterval(updateMarketPrices, 45000);
    return () => clearInterval(interval);
  }, []);

  if (appLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center font-bold text-indigo-400">Démarrage sécurisé...</div>;
  if (!session) return <Auth />;

  const renderView = () => {
    if (activeTab === 'remerciement') return <ThankYouPage amount={lastCreditedAmount} onReturn={() => window.location.hash = 'wallet'} />;
    if (activeTab === 'wallet') return <WalletPage cryptos={cryptos} transactions={[]} userName={userFullName} userBalance={userBalance} />;
    if (activeTab === 'echange') return <EchangePage userName={userFullName} currentBalance={userBalance} />;
    if (activeTab === 'profile') return <ProfilePage user={session.user} />;
    return <Dashboard cryptos={cryptos} selectedCrypto={cryptos[0]} setSelectedCrypto={() => {}} historyData={[]} loadingHistory={false} loadingPrices={false} isDemoMode={false} lastUpdate={lastUpdate} transactions={[]} handleExecuteSwap={() => {}} />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.hash = ''}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black">C</div>
          <span className="text-xl font-black tracking-tighter">CryptoFlux</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Balance (DB)</div>
            <div className="text-sm font-bold text-emerald-400">{userBalance.toLocaleString()} XOF</div>
          </div>
        </div>
      </nav>
      <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto">{renderView()}</main>
    </div>
  );
};

export default App;
