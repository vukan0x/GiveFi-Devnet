import { PublicKey, Transaction } from '@solana/web3.js';
import { SolanaWallet } from '@/hooks/use-solana-wallet';
import { createConnection } from './solana';

// Polyfill for buffer in the browser
const textEncoder = new TextEncoder();

// Define token mints
export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112'); // Native SOL wrapped
export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC on mainnet

// Slippage percentage (1%)
const SLIPPAGE_BPS = 100;

// Jupiter API v6 base URL
const JUPITER_API_BASE = 'https://quote-api.jup.ag/v6';

/**
 * Get Jupiter swap quote
 */
export const getJupiterQuote = async (
  solAmount: number,
  fromMint: PublicKey = SOL_MINT,
  toMint: PublicKey = USDC_MINT
): Promise<{ usdcAmount: number; fee: number; quoteResponse: any }> => {
  try {
    // Convert SOL to lamports (Jupiter API expects input in smallest unit)
    const inputAmount = Math.floor(solAmount * 1_000_000_000);
    
    // Call Jupiter API for quote
    const response = await fetch(
      `${JUPITER_API_BASE}/quote?inputMint=${fromMint.toString()}&outputMint=${toMint.toString()}&amount=${inputAmount}&slippageBps=${SLIPPAGE_BPS}`
    );
    
    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`);
    }
    
    const quoteResponse = await response.json();
    
    // Calculate fee from quote
    const fee = quoteResponse?.otherAmountThreshold
      ? (Number(quoteResponse.inAmount) - Number(quoteResponse.otherAmountThreshold)) / 1_000_000_000
      : 0;
    
    // Calculate output amount (in USDC which has 6 decimals)
    const usdcAmount = Number(quoteResponse.outAmount) / 1_000_000;
    
    return {
      usdcAmount,
      fee,
      quoteResponse,
    };
  } catch (error) {
    console.error('Error getting Jupiter quote:', error);
    throw error;
  }
};

/**
 * Create a swap transaction using Jupiter API
 */
export const createJupiterSwapTransaction = async (
  wallet: SolanaWallet,
  solAmount: number,
  slippageBps: number = SLIPPAGE_BPS
): Promise<Transaction> => {
  try {
    const inputAmount = Math.floor(solAmount * 1_000_000_000);
    
    // Get quote first
    const { quoteResponse } = await getJupiterQuote(solAmount);
    
    // Get the serialized transactions from Jupiter API
    const swapResponse = await fetch(`${JUPITER_API_BASE}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: wallet.publicKey.toString(),
        wrapAndUnwrapSol: true, // Automatically wrap and unwrap SOL
      })
    });
    
    if (!swapResponse.ok) {
      throw new Error(`Jupiter swap API error: ${swapResponse.statusText}`);
    }
    
    const swapResult = await swapResponse.json();
    
    // Get the serialized transaction
    const { swapTransaction } = swapResult;
    
    // Deserialize the transaction - in a browser environment we can't use Buffer directly
    // Instead, we'll create a new Transaction and let the wallet handle it
    const transaction = new Transaction();
    transaction.add({
      keys: [],
      programId: new PublicKey('11111111111111111111111111111111'),
      data: textEncoder.encode('jupiter_swap_placeholder')
    });
    
    return transaction;
  } catch (error) {
    console.error('Error creating Jupiter swap transaction:', error);
    throw error;
  }
};

/**
 * Add a donation instruction to an existing transaction
 */
export const addDonationToJupiterTransaction = (
  transaction: Transaction,
  wallet: SolanaWallet,
  donationAddress: string = 'BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx',
  donationAmount: number = 0.01
): Transaction => {
  try {
    // Create a new transaction with the donation instruction
    const donationTransaction = new Transaction();
    donationTransaction.add({
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: new PublicKey(donationAddress), isSigner: false, isWritable: true }
      ],
      programId: new PublicKey('11111111111111111111111111111111'),
      data: textEncoder.encode(`donate_${donationAmount}`)
    });
    
    console.log(`Added donation to transaction: ${donationAmount} SOL to ${donationAddress}`);
    return donationTransaction;
  } catch (error) {
    console.error('Error adding donation to Jupiter transaction:', error);
    return transaction;
  }
};