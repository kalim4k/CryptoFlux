
import React from 'react';
import { supabase } from '../lib/supabase';

interface ProfilePageProps {
  user: any;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const memberSince = new Date(user?.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  });

  const initiales = user?.email?.substring(0, 2).toUpperCase() || '??';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Profile */}
      <div className="glass p-10 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-5xl font-black shadow-2xl shadow-indigo-500/40 border-4 border-white/10">
              {initiales}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-2xl border-4 border-slate-900 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L9.03 9.122a2 2 0 001.938 0L17.834 4.9A2 2 0 0016 1.5H4a2 2 0 00-1.834 3.4zM1.5 8a2 2 0 00-1.5 2v5a2 2 0 002 2h16a2 2 0 002-2v-5a2 2 0 00-1.5-2l-7.07 4.35a4 4 0 01-3.86 0L1.5 8z" clipRule="evenodd" /></svg>
            </div>
          </div>
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-4xl font-black tracking-tighter text-white">{user?.email?.split('@')[0]}</h2>
            <p className="text-slate-400 font-medium">{user?.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/20 uppercase tracking-widest">Membre depuis {memberSince}</span>
              <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20 uppercase tracking-widest">Identité Vérifiée</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Security & Access */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Sécurité du Compte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase">Activé</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Double Authentification</h4>
                  <p className="text-xs text-slate-500 mt-1">Protège vos transactions sensibles.</p>
                </div>
              </div>
              <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-3 opacity-60">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-slate-500/20 rounded-xl text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 bg-slate-500/10 px-2 py-1 rounded-lg uppercase">Désactivé</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Retraits par Whitelist</h4>
                  <p className="text-xs text-slate-500 mt-1">Autorise uniquement les adresses connues.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-bold">Détails de Session</h3>
            <div className="space-y-4">
              <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5 items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID Utilisateur</span>
                <span className="text-xs font-mono text-indigo-400 truncate max-w-[200px]">{user?.id}</span>
              </div>
              <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5 items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Méthode d'Auth</span>
                <span className="text-xs font-bold text-white uppercase">{user?.app_metadata?.provider || 'Email'}</span>
              </div>
              <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5 items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dernière Connexion</span>
                <span className="text-xs font-bold text-white">{new Date(user?.last_sign_in_at).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-[2.5rem] bg-indigo-600/10 border-indigo-500/20">
            <h3 className="font-bold text-lg mb-4 text-indigo-400">Centre d'aide</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">Besoin d'aide pour vos limites de retrait ou une transaction bloquée ?</p>
            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-indigo-600/20 mb-3">Contacter le Support</button>
            <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all border border-white/5">Consulter la FAQ</button>
          </div>

          <button 
            onClick={handleSignOut}
            className="w-full py-5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all border border-rose-500/20 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
