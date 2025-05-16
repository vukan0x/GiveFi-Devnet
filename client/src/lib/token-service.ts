import { 
  PublicKey, 
  Transaction, 
  Connection, 
  LAMPORTS_PER_SOL,
  SystemProgram
} from '@solana/web3.js';

// We need to polyfill Buffer for the browser since SPL token uses it
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = require('buffer/').Buffer;
}

import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getMint
} from '@solana/spl-token';
import { SolanaWallet } from '@/hooks/use-solana-wallet';
import { createConnection } from './solana';

// USDC token on devnet - provided by user
// This is a specific USDC token address on Solana devnet
export const DEVNET_USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

// Get a user's associated token account for USDC
export const getUsdcTokenAccount = async (
  walletPublicKey: PublicKey,
  connection: Connection
): Promise<PublicKey> => {
  return getAssociatedTokenAddress(
    DEVNET_USDC_MINT,
    walletPublicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
};

// Check if a token account exists, create if it doesn't
export const getOrCreateTokenAccount = async (
  wallet: SolanaWallet,
  connection: Connection,
  mint: PublicKey
): Promise<PublicKey> => {
  const associatedTokenAddress = await getAssociatedTokenAddress(
    mint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  try {
    // Check if token account exists
    await getAccount(connection, associatedTokenAddress);
    return associatedTokenAddress;
  } catch (error) {
    // Account doesn't exist, create it
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,          // payer
        associatedTokenAddress,    // associated token account
        wallet.publicKey,          // owner
        mint,                      // mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    // Sign and send transaction
    await wallet.sendTransaction(transaction, connection);
    return associatedTokenAddress;
  }
};

// Get the user's USDC balance
export const getUsdcBalance = async (
  walletPublicKey: PublicKey,
  connection: Connection
): Promise<number> => {
  try {
    const tokenAccount = await getUsdcTokenAccount(walletPublicKey, connection);
    
    try {
      // Get account info
      const accountInfo = await getAccount(connection, tokenAccount);
      
      // Get mint info to determine decimals
      const mintInfo = await getMint(connection, DEVNET_USDC_MINT);
      
      // Calculate token amount considering decimals
      const balance = Number(accountInfo.amount) / Math.pow(10, mintInfo.decimals);
      return balance;
    } catch (error) {
      // If token account doesn't exist yet
      return 0;
    }
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return 0;
  }
};

// Create a swap transaction (SOL -> USDC)
// In a real production app, this would interact with a DEX or liquidity pool
// For devnet testing, we'll simulate a swap by simply transferring SOL to a swap service wallet
export const createSwapSolToUsdcTransaction = async (
  wallet: SolanaWallet,
  solAmount: number,
  usdcAmount: number, 
  connection: Connection
): Promise<Transaction> => {
  // Get or create the user's USDC token account
  const userUsdcAccount = await getOrCreateTokenAccount(
    wallet,
    connection,
    DEVNET_USDC_MINT
  );
  
  // On devnet, we simulate a swap service
  // This address represents a swap service that would handle the swap
  // In a real app, this would be a smart contract address or DEX protocol
  const SWAP_SERVICE_ADDRESS = new PublicKey('BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx');
  
  // Create a transaction to:
  // 1. Send SOL to our swap service
  // 2. For a real swap, the service would need to listen for this tx and send USDC back
  const transaction = new Transaction();
  
  // Convert SOL amount to lamports
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
  
  // Add transfer instruction to send SOL to the swap service
  const { SystemProgram } = await import('@solana/web3.js');
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: SWAP_SERVICE_ADDRESS,
    lamports,
  });
  
  transaction.add(transferInstruction);
  
  console.log(`Creating swap transaction: ${solAmount} SOL (${lamports} lamports) for ~${usdcAmount} USDC`);
  
  return transaction;
};

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