
import { USD_TO_XOF_RATE } from "./priceService";

const FUSION_PAY_API_URL = "https://www.pay.moneyfusion.net/CryptoFlux/efb6b9d5b6631566/pay/";

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
  // On s'assure que l'URL de retour est propre
  const currentUrl = new URL(window.location.href);
  const returnUrl = `${currentUrl.origin}${currentUrl.pathname}`;

  const paymentData = {
    totalPrice: amount,
    article: [
      { "Recharge Compte CryptoFlux": amount }
    ],
    numeroSend: phoneNumber,
    nomclient: clientName,
    return_url: returnUrl,
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
