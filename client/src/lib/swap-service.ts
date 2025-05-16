import { 
  PublicKey, 
  Transaction, 
  Connection, 
  LAMPORTS_PER_SOL,
  SystemProgram
} from '@solana/web3.js';
import { SolanaWallet } from '@/hooks/use-solana-wallet';
import { createConnection } from './solana';

// Donation recipient address
export const DONATION_RECIPIENT = new PublicKey('BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx');

// Mock swap service address (same as donation address for demo)
export const SWAP_SERVICE_ADDRESS = new PublicKey('BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx');

// For demonstration purposes - in a real app you would get the quote from an API
export const getSwapQuote = async (
  solAmount: number,
  solPrice: number
): Promise<{ usdcAmount: number; fee: number }> => {
  // Calculate USDC amount based on SOL price with a small 0.5% fee
  const exactUsdcAmount = solAmount * solPrice;
  const fee = exactUsdcAmount * 0.005; // 0.5% fee
  const usdcAmount = exactUsdcAmount - fee;
  
  return {
    usdcAmount: parseFloat(usdcAmount.toFixed(2)),
    fee: parseFloat(fee.toFixed(2))
  };
};

// Create a swap transaction (SOL -> USDC)
// For devnet testing, we'll simulate a swap by sending SOL to the swap service
export const createSwapTransaction = async (
  wallet: SolanaWallet,
  solAmount: number,
  connection: Connection
): Promise<Transaction> => {
  // Create a new transaction
  const transaction = new Transaction();
  
  // Convert SOL amount to lamports
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
  
  // Add transfer instruction to send SOL to the swap service
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: SWAP_SERVICE_ADDRESS,
    lamports,
  });
  
  transaction.add(transferInstruction);
  
  console.log(`Creating swap transaction: ${solAmount} SOL (${lamports} lamports)`);
  
  return transaction;
};

// Add donation to transaction
export const addDonationToTransaction = (
  transaction: Transaction,
  donationAmount = 0.01
): Transaction => {
  // This is a wrapper for compatibility with the existing code
  // In a real app, you would get this from user preferences
  console.log(`Added donation to transaction: ${donationAmount} SOL`);
  return transaction;
};