
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
      // Pour cet exemple, on valide contre Supabase mais avec une UI restrictive sans Signup
      const { error } = await supabase.auth.signInWithPassword({ 
        email: paywinEmail, 
        password: paywinPassword 
      });
      if (error) throw error;
      setIsUnlocked(true);
    } catch (err: any) {
      setLoginError("Identifiants PAYWIN incorrects. Seuls les comptes existants sont autorisés.");
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

  // VUE : CONNEXION PAYWIN (SANS INSCRIPTION)
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto animate-in fade-in zoom-in duration-500 mt-12">
        <div className="glass p-8 rounded-[2.5rem] border-indigo-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <div className="w-24 h-24 bg-white rounded-full -mr-12 -mt-12"></div>
          </div>
          
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-500/20 mb-4">P</div>
            <h2 className="text-2xl font-black text-white">Accès PAYWIN</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Section Sécurisée</p>
          </div>

          <form onSubmit={handlePaywinLogin} className="space-y-6">
            {loginError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold text-center animate-shake">
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
                className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-indigo-500 text-white font-medium"
                placeholder="votre-compte@paywin.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Mot de passe</label>
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
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-2xl font-black text-white transition-all shadow-xl shadow-indigo-500/20"
            >
              {loginLoading ? 'Vérification...' : 'Se connecter à l\'Échange'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest leading-relaxed px-4">
              La création de compte est désactivée pour cette section. Contactez un administrateur PAYWIN pour obtenir vos accès.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // VUE : INTERFACE DE RECHARGE (DÉVERROUILLÉE)
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="glass p-8 rounded-[2.5rem] border-indigo-500/20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-white">Recharger mon compte</h2>
            <p className="text-slate-400 text-sm font-medium">Choisissez le montant à créditer sur votre compte PAYWIN</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Solde Actuel</div>
            <div className="text-2xl font-black text-indigo-400">{currentBalance.toLocaleString()} XOF</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => setSelectedAmount(amt)}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                selectedAmount === amt
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02]'
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <span className="text-2xl font-black text-white">{amt.toLocaleString()}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">FCFA</span>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Numéro Mobile Money (Recharge)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 0102030405"
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-lg text-white"
            />
          </div>

          <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex gap-4 items-center">
            <div className="text-2xl">⚡</div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Une fois le paiement validé sur **Money Fusion**, votre balance PAYWIN sera automatiquement créditée.
            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading || !selectedAmount || !phone}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-2xl font-black text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>Confirmer et Payer {selectedAmount ? `${selectedAmount.toLocaleString()} XOF` : ''}</>
            )}
          </button>
        </div>
      </div>
      
      <div className="text-center">
         <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Sécurisé par Money Fusion Pay</p>
      </div>
    </div>
  );
};

export default EchangePage;
