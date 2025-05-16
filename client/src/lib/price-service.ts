import axios from 'axios';

// Current SOL price in USD from CoinGecko API
export const getSolanaPrice = async (): Promise<number> => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'solana',
        vs_currencies: 'usd'
      }
    });
    
    return response.data.solana.usd;
  } catch (error) {
    console.error('Error fetching Solana price:', error);
    return 134.21; // Fallback price if API fails
  }
};

// Calculate USD value based on SOL amount and current price
export const calculateUsdValue = (solAmount: number, solPrice: number): string => {
  if (!solAmount || !solPrice) return '0.00';
  const usdValue = solAmount * solPrice;
  return usdValue.toFixed(2);
};

// Format SOL balance to show appropriate decimal places
export const formatSolBalance = (balance: number): string => {
  if (balance === 0) return '0';
  if (balance < 0.001) return '<0.001';
  return balance.toFixed(3);
};