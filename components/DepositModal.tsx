
import React, { useState } from 'react';
import { initiateDeposit } from '../services/paymentService';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, userName }) => {
  const [amount, setAmount] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await initiateDeposit(parseFloat(amount), phone, userName);
      if (result.statut && result.url) {
        // Redirection vers la passerelle de paiement Money Fusion
        window.location.href = result.url;
      } else {
        setError(result.message || "Erreur lors de la création du paiement.");
      }
    } catch (err) {
      setError("Impossible de contacter la passerelle Money Fusion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="glass w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black tracking-tighter">Recharger Cash</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Montant (XOF)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="Ex: 5000"
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Numéro de téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Ex: 01010101"
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium text-sm"
            />
          </div>

          <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex gap-3">
             <div className="text-xl">💳</div>
             <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
               Vous allez être redirigé vers <b>Fusion Pay</b> pour finaliser votre recharge via Orange Money, Moov Money ou MTN.
             </p>
          </div>

          <button
            type="submit"
            disabled={loading || !amount || !phone}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-2xl font-black text-white shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>Payer avec Fusion Pay</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
