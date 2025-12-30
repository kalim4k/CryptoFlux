
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Vérifiez votre boîte mail pour confirmer l’inscription !');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="glass w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl relative z-10 border-white/10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-500/20 mb-4">C</div>
          <h1 className="text-3xl font-black tracking-tighter">CryptoFlux</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            {isSignUp ? 'Créez votre compte sécurisé' : 'Accédez à votre portefeuille'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Adresse E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nom@exemple.com"
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-2xl font-black text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            {loading ? 'Traitement...' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-slate-500 hover:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            {isSignUp ? 'Déjà un compte ? Connexion' : 'Pas de compte ? Inscription'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
