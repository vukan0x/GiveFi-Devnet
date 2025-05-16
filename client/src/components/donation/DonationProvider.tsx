import { createContext, useState, useEffect, ReactNode } from "react";
import { SystemProgram, PublicKey, Transaction, clusterApiUrl, Connection } from "@solana/web3.js";
import { useSolanaWallet } from "@/hooks/use-solana-wallet";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { toast } from "@/hooks/use-toast";
import { donationService } from "@/lib/donation-service";
import { useQuery } from "@tanstack/react-query";
import { createConnection } from "@/lib/solana";
import { DEFAULT_DONATION_RECIPIENT } from "@/lib/solana";

export interface DonationContextType {
  isDonating: boolean;
  setIsDonating: (value: boolean) => void;
  donationAmount: number;
  setDonationAmount: (value: number) => void;
  donationRecipient: string;
  setDonationRecipient: (value: string) => void;
  addDonationToTransaction: (transaction: Transaction) => Transaction;
  totalDonations: number;
  totalAmount: number;
  recordDonationTransaction: (txSignature: string) => Promise<void>;
}

export const DonationContext = createContext<DonationContextType>({
  isDonating: false,
  setIsDonating: () => {},
  donationAmount: 0.01,
  setDonationAmount: () => {},
  donationRecipient: "BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx",
  setDonationRecipient: () => {},
  addDonationToTransaction: (tx) => tx,
  totalDonations: 0,
  totalAmount: 0,
  recordDonationTransaction: async () => {},
});

interface DonationProviderProps {
  children: ReactNode;
  defaultAmount?: number;
  defaultRecipient?: string;
}

export function DonationProvider({
  children,
  defaultAmount = 0.01,
  defaultRecipient = "BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx",
}: DonationProviderProps) {
  const [isDonating, setIsDonating] = useState(false);
  const [donationAmount, setDonationAmount] = useState(defaultAmount);
  const [donationRecipient, setDonationRecipient] = useState(defaultRecipient);
  const { wallet } = useSolanaWallet();

  // Fetch donation statistics
  const { data: stats = { totalDonations: 0, totalAmount: 0 } } = useQuery({
    queryKey: ["/api/donations/stats"],
    queryFn: donationService.getStats,
    enabled: true,
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  const addDonationToTransaction = (transaction: Transaction): Transaction => {
    if (!isDonating || !wallet?.publicKey) {
      return transaction;
    }

    try {
      // Create a donation transfer instruction
      const donationInstruction = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(donationRecipient),
        lamports: Math.floor(LAMPORTS_PER_SOL * donationAmount),
      });

      // Add the donation instruction to the transaction
      transaction.add(donationInstruction);
      
      return transaction;
    } catch (error) {
      console.error("Error adding donation to transaction:", error);
      toast({
        title: "Donation Error",
        description: "Failed to add donation to transaction. Please try again.",
        variant: "destructive",
      });
      return transaction;
    }
  };

  // Record a donation transaction
  const recordDonationTransaction = async (txSignature: string): Promise<void> => {
    if (!isDonating || !wallet?.publicKey) {
      return;
    }

    try {
      await donationService.recordDonation(
        wallet.publicKey.toString(),
        donationRecipient,
        donationAmount,
        txSignature
      );
      
      toast({
        title: "Donation Recorded",
        description: `Thank you for donating ${donationAmount} SOL to charity!`,
      });
    } catch (error) {
      console.error("Error recording donation:", error);
      toast({
        title: "Donation Recording Error",
        description: "Failed to record your donation. The transaction was still processed.",
        variant: "destructive",
      });
    }
  };

  // Validate the recipient address when it changes
  useEffect(() => {
    try {
      new PublicKey(donationRecipient);
    } catch (error) {
      console.error("Invalid donation recipient address:", error);
      toast({
        title: "Invalid Address",
        description: "The donation recipient address is invalid.",
        variant: "destructive",
      });
    }
  }, [donationRecipient]);

  return (
    <DonationContext.Provider
      value={{
        isDonating,
        setIsDonating,
        donationAmount,
        setDonationAmount,
        donationRecipient,
        setDonationRecipient,
        addDonationToTransaction,
        totalDonations: stats.totalDonations,
        totalAmount: stats.totalAmount,
        recordDonationTransaction,
      }}
    >
      {children}
    </DonationContext.Provider>
  );
}
