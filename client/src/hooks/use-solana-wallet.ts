import { useState, useEffect, useCallback } from "react";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useToast } from "@/hooks/use-toast";
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { createConnection } from "@/lib/solana";

export interface SolanaWallet {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>;
}

// Use a test keypair for testing without an external wallet
const getTestKeypair = (): Keypair => {
  // Use hardcoded value to keep the same address after page reloads
  const TEST_PRIVATE_KEY = new Uint8Array([
    174, 47, 154, 16, 202, 193, 206, 113, 199, 190, 53, 133, 169, 175, 31, 56,
    222, 53, 138, 189, 224, 216, 117, 173, 10, 149, 53, 45, 73, 251, 237, 246
  ]);
  
  return Keypair.fromSecretKey(TEST_PRIVATE_KEY);
};

// Check if Phantom or Solflare wallets are available
const isSolanaWalletAvailable = () => {
  return !!(
    typeof window !== 'undefined' && 
    ((window as any).solana || (window as any).solflare)
  );
};

// Check specifically for Phantom wallet
const isPhantomWalletAvailable = () => {
  const provider = (window as any).solana;
  return !!(
    typeof window !== 'undefined' && 
    provider && 
    provider.isPhantom
  );
};

export function useSolanaWallet() {
  const [wallet, setWallet] = useState<SolanaWallet | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();
  const connection = createConnection();

  // Connect to a real wallet or fall back to test wallet
  const connect = useCallback(async () => {
    if (wallet) return;
    
    setConnecting(true);
    try {
      let externalWallet: any = null;
      
      // Check for external wallets (Phantom, Solflare, etc.)
      if (isSolanaWalletAvailable()) {
        try {
          // Try to connect to Phantom first (most popular wallet)
          if ((window as any).solana && (window as any).solana.connect) {
            // Check if it's actually Phantom
            if ((window as any).solana.isPhantom) {
              await (window as any).solana.connect();
              externalWallet = (window as any).solana;
              console.log("Connected to Phantom wallet");
            } else {
              // Generic Solana wallet implementation
              await (window as any).solana.connect();
              externalWallet = (window as any).solana;
              console.log("Connected to Solana compatible wallet");
            }
          } 
          // Fall back to Solflare as second option
          else if ((window as any).solflare && (window as any).solflare.connect) {
            await (window as any).solflare.connect();
            externalWallet = (window as any).solflare;
            console.log("Connected to Solflare wallet");
          }
          
          if (externalWallet && externalWallet.publicKey) {
            const publicKey = new PublicKey(externalWallet.publicKey.toString());
            
            const externalSolanaWallet: SolanaWallet = {
              publicKey,
              signTransaction: async (transaction: Transaction) => {
                console.log("Signing transaction with external wallet...");
                return await externalWallet.signTransaction(transaction);
              },
              signAllTransactions: async (transactions: Transaction[]) => {
                console.log("Signing all transactions with external wallet...");
                return await externalWallet.signAllTransactions(transactions);
              },
              sendTransaction: async (transaction: Transaction, connection: Connection) => {
                console.log("Sending transaction with external wallet...");
                try {
                  // Get recent blockhash
                  const { blockhash } = await connection.getLatestBlockhash();
                  transaction.recentBlockhash = blockhash;
                  transaction.feePayer = publicKey;
                  
                  // Sign and send transaction
                  const signed = await externalWallet.signTransaction(transaction);
                  const signature = await connection.sendRawTransaction(signed.serialize());
                  
                  // Wait for confirmation
                  await connection.confirmTransaction(signature);
                  console.log("Transaction confirmed with signature:", signature);
                  return signature;
                } catch (error) {
                  console.error("Error sending transaction:", error);
                  throw error;
                }
              }
            };
            
            setWallet(externalSolanaWallet);
            toast({
              title: "Wallet Connected",
              description: `Connected with address: ${publicKey.toString().substring(0, 10)}...`,
            });
            setConnecting(false);
            return;
          }
        } catch (walletError) {
          console.error("Error connecting to external wallet:", walletError);
          // Fall back to test wallet if external wallet fails
        }
      }
      
      // Since we're on devnet, we need a real wallet - don't use test wallets
      toast({
        title: "Wallet Connection Required",
        description: "Please install a Solana wallet to use this app on devnet.",
        variant: "destructive",
      });
      setConnecting(false);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
      setConnecting(false);
    }
  }, [wallet, toast, connection]);

  const disconnect = useCallback(() => {
    // Disconnect external wallet if possible
    try {
      // Try Phantom first
      if ((window as any).solana && (window as any).solana.disconnect) {
        // Check if it's Phantom
        if ((window as any).solana.isPhantom) {
          console.log("Disconnecting from Phantom wallet");
        }
        (window as any).solana.disconnect();
      } 
      // Then try Solflare
      else if ((window as any).solflare && (window as any).solflare.disconnect) {
        console.log("Disconnecting from Solflare wallet");
        (window as any).solflare.disconnect();
      }
    } catch (error) {
      console.error("Error disconnecting external wallet:", error);
    }
    
    setWallet(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  }, [toast]);

  return {
    wallet,
    connecting,
    connected: !!wallet,
    connect,
    disconnect,
    // Helper function to ensure wallet is connected
    ensureConnected: () => {
      if (!wallet) throw new WalletNotConnectedError();
      return wallet;
    },
  };
}
