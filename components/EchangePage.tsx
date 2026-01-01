
import React, { useState } from 'react';
import { initiateDeposit } from '../services/paymentService';
import { supabase } from '../lib/supabase';

interface EchangePageProps {
  userName: string;
  currentBalance: number;
}

const AMOUNTS = [2000, 3000, 5000, 10000];

const EchangePage: React.FC<EchangePageProps> = ({ userName, currentBalance }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [paywinEmail, setPaywinEmail] = useState('');
  const [paywinPassword, setPaywinPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaywinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: paywinEmail, 
        password: paywinPassword 
      });
      if (error) throw error;
      setIsUnlocked(true);
    } catch (err: any) {
      setLoginError("Identifiants PAYWIN incorrects. Seuls les comptes enregistants sont autorisés.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedAmount || !phone) return;
    setLoading(true);
    setError(null);

    try {
      const result = await initiateDeposit(selectedAmount, phone, userName);
      if (result.statut && result.url) {
        window.location.href = result.url;
      } else {
        setError(result.message || "Échec de l'initialisation du paiement.");
      }
    } catch (err) {
      setError("Erreur de connexion à la passerelle de paiement.");
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto animate-in fade-in zoom-in duration-500 mt-12">
        <div className="glass p-8 rounded-[2.5rem] border-indigo-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <div className="w-24 h-24 bg-white rounded-full -mr-12 -mt-12"></div>
          </div>
          
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-500/20 mb-4 text-white">P</div>
            <h2 className="text-xl font-black text-white text-center">Ravi de vous revoir,<br/><span className="text-indigo-400">{userName}</span></h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4 bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">Veuillez déverrouiller PAYWIN</p>
          </div>

          <form onSubmit={handlePaywinLogin} className="space-y-6">
            {loginError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[10px] font-black uppercase text-center animate-shake">
                {loginError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">E-mail PAYWIN</label>
              <input
                type="email"
                value={paywinEmail}
                onChange={(e) => setPaywinEmail(e.target.value)}
                required
                className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-indigo-500 text-white font-medium text-sm"
                placeholder="votre-compte@paywin.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Code PIN / Mot de passe</label>
              <input
                type="password"
                value={paywinPassword}
                onChange={(e) => setPaywinPassword(e.target.value)}
                required
                className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-indigo-500 text-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              {loginLoading ? 'Validation...' : 'Déverrouiller l\'Échange'}
            </button>
          </form>

          <p className="mt-8 text-[10px] text-slate-600 text-center font-bold uppercase tracking-widest italic">Connexion sécurisée via protocole SSL 256-bit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">Interface d'Échange</h1>
            <p className="text-slate-400 font-medium">Session active : <span className="text-indigo-400 font-bold">{userName}</span></p>
          </div>
          <div className="bg-indigo-600/10 border border-indigo-500/20 px-6 py-3 rounded-2xl">
            <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Solde de Recharge</span>
            <span className="text-2xl font-black text-white">{currentBalance.toLocaleString()} <span className="text-indigo-400 text-sm">XOF</span></span>
          </div>
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">1. Sélectionnez un forfait de crédit</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className={`p-4 rounded-2xl font-black border transition-all ${
                    selectedAmount === amt 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-105' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">2. Numéro Mobile Money Destination</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 01 02 03 04 05"
                className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-indigo-500 text-white font-bold text-xl placeholder:text-slate-700"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center font-black text-[10px] text-orange-400">OM</div>
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center font-black text-[10px] text-blue-400">MV</div>
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center font-black text-[10px] text-yellow-400">MTN</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-black uppercase text-center">
              {error}
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={handlePayment}
              disabled={loading || !selectedAmount || !phone}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-[2rem] font-black text-xl text-white shadow-2xl shadow-indigo-600/40 transition-all flex items-center justify-center gap-4 group active:scale-95"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Confirmer le Dépôt Cash
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
            <p className="mt-4 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Sécurisé par Money Fusion Gateway</p>
          </div>
        </div>
      </div>

      <button onClick={() => window.location.hash = ''} className="mt-8 text-slate-500 hover:text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 mx-auto transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Quitter l'Interface Sécurisée
      </button>
    </div>
  );
};

export default EchangePage;
