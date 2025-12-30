
import { CryptoCurrency } from './types';

export const SUPPORTED_CRYPTOS: CryptoCurrency[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 0, change24h: 0, icon: '₿', color: '#f7931a' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 0, change24h: 0, icon: 'Ξ', color: '#627eea' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 0, change24h: 0, icon: 'BNB', color: '#f3ba2f' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', price: 0, change24h: 0, icon: '◎', color: '#14f195' },
  { id: 'ripple', symbol: 'XRP', name: 'Ripple', price: 0, change24h: 0, icon: 'XRP', color: '#23292f' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0, change24h: 0, icon: 'ADA', color: '#0033ad' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', price: 0, change24h: 0, icon: 'DOT', color: '#e6007a' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', price: 0, change24h: 0, icon: '$', color: '#2775ca' },
];

export const SUPPORTED_FIATS = [
  { id: 'eur', symbol: 'EUR', name: 'Euro', icon: '€', color: '#10b981', priceInUsd: 1.08 },
  { id: 'xof', symbol: 'XOF', name: 'Franc CFA', icon: 'CFA', color: '#f59e0b', priceInUsd: 0.00163 }, // 1/610 approx
];

export const MOCK_HISTORY = [
  { date: '1', price: 42000 }, { date: '2', price: 45000 }, { date: '3', price: 43000 },
  { date: '4', price: 48000 }, { date: '5', price: 52000 }, { date: '6', price: 51000 },
  { date: '7', price: 58000 }, { date: '8', price: 62000 }, { date: '9', price: 64000 },
];
