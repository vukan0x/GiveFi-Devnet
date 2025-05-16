import { 
  PublicKey, 
  Transaction, 
  Connection, 
  LAMPORTS_PER_SOL,
  SystemProgram
} from '@solana/web3.js';
import { SolanaWallet } from '@/hooks/use-solana-wallet';
import { createConnection } from './solana';

// Wallet addresses
export const DONATION_RECIPIENT = new PublicKey('BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx');
export const LIQUIDITY_POOL = new PublicKey('qtSJb5syrrzpahukEEsBmw6C2VipBc8breXNAQGBdQ1');

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
// For devnet testing, we'll simulate a swap by sending SOL to the same recipient as donations
export const createSwapTransaction = async (
  wallet: SolanaWallet,
  solAmount: number,
  connection: Connection
): Promise<Transaction> => {
  // Create a new transaction
  const transaction = new Transaction();
  
  // Convert SOL amount to lamports
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
  
  // Add transfer instruction to send SOL to the liquidity pool (simulating a swap)
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: LIQUIDITY_POOL,
    lamports,
  });
  
  transaction.add(transferInstruction);
  
  console.log(`Creating swap transaction: ${solAmount} SOL (${lamports} lamports)`);
  
  return transaction;
};

// Add donation to transaction
export const addDonationToTransaction = (
  transaction: Transaction
): Transaction => {
  // Convert donation amount to lamports (fixed at 0.01 SOL)
  const donationAmount = 0.01;
  const donationLamports = Math.floor(donationAmount * LAMPORTS_PER_SOL);
  
  // Create a new transaction that just sends SOL to the donation recipient
  const donationTransaction = new Transaction();
  
  // We'll create a proper instruction in the handleSwap function
  // This is just a placeholder transaction that will be properly set up later
  console.log(`Added donation to transaction: ${donationAmount} SOL`);
  
  return donationTransaction;
};