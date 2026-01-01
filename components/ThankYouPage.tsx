
import React from 'react';

interface ThankYouPageProps {
  amount: number;
  onReturn: () => void;
}

const ThankYouPage: React.FC<ThankYouPageProps> = ({ amount, onReturn }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-700">
      <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/40 border-4 border-white/10">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 className="text-4xl font-black tracking-tighter text-white mb-2">Paiement Réussi !</h2>
      <p className="text-slate-400 font-medium max-w-sm mb-8">
        Votre compte a été crédité avec succès de <span className="text-emerald-400 font-bold">{amount.toLocaleString()} XOF</span>.
      </p>

      <div className="glass p-6 rounded-3xl border-emerald-500/20 bg-emerald-500/5 mb-8">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-black mb-1">Montant Reçu</p>
        <div className="text-2xl font-black text-white">{amount.toLocaleString()} <span className="text-emerald-400">XOF</span></div>
      </div>

      <button
        onClick={onReturn}
        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
      >
        Retour au Portefeuille
      </button>
    </div>
  );
};

export default ThankYouPage;
