
import React from 'react';

interface ThankYouPageProps {
  amount: number;
  onReturn: () => void;
}

const ThankYouPage: React.FC<ThankYouPageProps> = ({ amount, onReturn }) => {
  return (
    <div className="max-w-md w-full animate-in fade-in zoom-in duration-700">
      <div className="glass p-10 rounded-[3rem] text-center border-emerald-500/20 shadow-2xl relative overflow-hidden">
        {/* Background Sparkles */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-20 right-10 w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full"></div>
        </div>

        <div className="relative z-10">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40 border-8 border-emerald-500/20">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-black text-white mb-2">Paiement Réussi !</h1>
          <p className="text-slate-400 font-medium mb-8">Merci pour votre confiance.</p>

          <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-10">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Montant Crédité</span>
            <div className="text-3xl font-black text-emerald-400">
              +{amount.toLocaleString()} <span className="text-sm">XOF</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-10 leading-relaxed px-4">
            Votre balance a été mise à jour instantanément. Vous pouvez maintenant échanger vos fonds contre des crypto-monnaies.
          </p>

          <button
            onClick={onReturn}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
          >
            Accéder à mon Wallet
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">Confirmation de Transaction CryptoFlux</p>
    </div>
  );
};

export default ThankYouPage;
