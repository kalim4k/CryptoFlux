
import { USD_TO_XOF_RATE } from "./priceService";

const FUSION_PAY_API_URL = "https://www.pay.moneyfusion.net/Paywin/86d5817d1b7ba39e/pay/";

export interface PaymentResponse {
  statut: boolean;
  token: string;
  message: string;
  url: string;
}

export interface PaymentStatusResponse {
  statut: boolean;
  data: {
    tokenPay: string;
    Montant: number;
    statut: "pending" | "paid" | "failure" | "no paid";
    nomclient: string;
    numeroSend: string;
    createdAt: string;
  };
  message: string;
}

export const initiateDeposit = async (amount: number, phoneNumber: string, clientName: string): Promise<PaymentResponse> => {
  const paymentData = {
    totalPrice: amount,
    article: [
      { "Recharge Compte CryptoFlux": amount }
    ],
    numeroSend: phoneNumber,
    nomclient: clientName,
    return_url: window.location.origin + window.location.pathname, // Redirection vers l'app avec le token
  };

  try {
    const response = await fetch(FUSION_PAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) throw new Error("Erreur lors de l'initialisation du paiement");
    return await response.json();
  } catch (error) {
    console.error("FusionPay Error:", error);
    throw error;
  }
};

export const checkPaymentStatus = async (token: string): Promise<PaymentStatusResponse> => {
  try {
    const response = await fetch(`https://www.pay.moneyfusion.net/paiementNotif/${token}`);
    if (!response.ok) throw new Error("Impossible de vérifier le statut");
    return await response.json();
  } catch (error) {
    console.error("Status Check Error:", error);
    throw error;
  }
};
