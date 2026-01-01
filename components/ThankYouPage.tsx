
import React from 'react';

interface ThankYouPageProps {
  amount: number;
  onReturn: () => void;
}

const ThankYouPage: React.FC<ThankYouPageProps> = ({ amount, onReturn }) => {
  return (
    <div className="max-w-md w-full animate-in fade-in zoom-in duration-500 text-center mx-auto py-12">
      <div className="glass p-10 rounded-[3rem] border-emerald-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full"></div>
        
        <div className="mb-8 relative">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-black tracking-tighter text-white mb-2">Paiement Reçu !</h1>
        <p className="text-slate-400 font-medium mb-8">Votre compte CryptoFlux a été crédité.</p>

        <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20 mb-8">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Montant ajouté</span>
          <div className="text-3xl font-black text-white">
            +{amount.toLocaleString()} <span className="text-sm text-emerald-400">XOF</span>
          </div>
        </div>

        <button
          onClick={onReturn}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
        >
          Retour au Portefeuille
        </button>
      </div>
      
      <p className="mt-8 text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">Confirmation de transaction PAYWIN</p>
    </div>
  );
};

export default ThankYouPage;
