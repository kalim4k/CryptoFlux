
export interface CryptoCurrency {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
  color: string;
}

export interface WalletBalance {
  currencyId: string;
  amount: number;
}

export interface Transaction {
  id: string;
  type: 'SWAP' | 'CASH_OUT' | 'CASH_IN';
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  timestamp: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface MarketInsight {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  analysis: string;
  sources: { title: string; uri: string }[];
}
