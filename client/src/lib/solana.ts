import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Default donation recipient address
export const DEFAULT_DONATION_RECIPIENT = "BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx";

// Create a connection to the Solana network
// Use devnet for testing
export const createConnection = (endpoint = "https://api.devnet.solana.com") => {
  return new Connection(endpoint);
};

// Create a donation transfer instruction
export const createDonationInstruction = (
  fromPubkey: PublicKey,
  amount: number = 0.01,
  recipientAddress: string = DEFAULT_DONATION_RECIPIENT
) => {
  try {
    const toPubkey = new PublicKey(recipientAddress);
    return SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: Math.floor(LAMPORTS_PER_SOL * amount),
    });
  } catch (error) {
    console.error("Error creating donation instruction:", error);
    throw error;
  }
};

// Add donation to an existing transaction
export const addDonationToTransaction = (
  transaction: Transaction,
  fromPubkey: PublicKey,
  amount: number = 0.01,
  recipientAddress: string = DEFAULT_DONATION_RECIPIENT
): Transaction => {
  try {
    const donationInstruction = createDonationInstruction(
      fromPubkey,
      amount,
      recipientAddress
    );
    transaction.add(donationInstruction);
    return transaction;
  } catch (error) {
    console.error("Error adding donation to transaction:", error);
    throw error;
  }
};

// Format SOL amount with appropriate precision
export const formatSol = (amount: number): string => {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
};

// Truncate wallet address for display
export const truncateAddress = (address: string, startChars = 6, endChars = 5): string => {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

// Validate a Solana wallet address
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};
