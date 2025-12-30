
export interface PriceData {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export interface HistoryPoint {
  date: string;
  price: number;
}

const FALLBACK_PRICES: PriceData = {
  'bitcoin': { usd: 64230.50, usd_24h_change: 2.4 },
  'ethereum': { usd: 3450.12, usd_24h_change: -1.2 },
  'binancecoin': { usd: 580.45, usd_24h_change: 1.8 },
  'solana': { usd: 145.80, usd_24h_change: 5.7 },
  'ripple': { usd: 0.62, usd_24h_change: -0.5 },
  'cardano': { usd: 0.45, usd_24h_change: 3.2 },
  'polkadot': { usd: 7.20, usd_24h_change: -2.1 },
  'usd-coin': { usd: 1.00, usd_24h_change: 0.01 },
};

export const fetchRealTimePrices = async (ids: string[]): Promise<PriceData> => {
  try {
    const idsString = ids.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true`;
    const response = await fetch(url);
    if (response.status === 429) return generateSimulatedData(ids);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    return await response.json();
  } catch (error) {
    console.debug("Info: Mode simulation pour les prix.");
    return generateSimulatedData(ids);
  }
};

export const fetchCryptoHistory = async (id: string): Promise<HistoryPoint[]> => {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("History fetch failed");
    
    const data = await response.json();
    return data.prices.map((p: [number, number]) => ({
      date: new Date(p[0]).toLocaleDateString('fr-FR', { weekday: 'short' }),
      price: p[1]
    }));
  } catch (error) {
    console.debug("Info: Génération d'historique simulé pour", id);
    return generateSimulatedHistory(id);
  }
};

const generateSimulatedData = (ids: string[]): PriceData => {
  const simulated: PriceData = {};
  ids.forEach(id => {
    const base = FALLBACK_PRICES[id] || { usd: 1.0, usd_24h_change: 0 };
    const variation = 1 + (Math.random() * 0.001 - 0.0005);
    simulated[id] = {
      usd: base.usd * variation,
      usd_24h_change: base.usd_24h_change + (Math.random() * 0.1 - 0.05)
    };
  });
  return simulated;
};

const generateSimulatedHistory = (id: string): HistoryPoint[] => {
  const basePrice = FALLBACK_PRICES[id]?.usd || 1000;
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { weekday: 'short' }),
    price: basePrice * (0.95 + Math.random() * 0.1)
  }));
};

export const USD_TO_XOF_RATE = 610.25;
