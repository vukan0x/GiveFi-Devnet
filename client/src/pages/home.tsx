import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DonationCheckbox } from "@/components/donation/DonationCheckbox";
import { useSolanaWallet } from "@/hooks/use-solana-wallet";
import { useDonation } from "@/hooks/use-donation";
import { useToast } from "@/hooks/use-toast";
import { createConnection } from "@/lib/solana";
import { Transaction, LAMPORTS_PER_SOL, SystemProgram, PublicKey } from "@solana/web3.js";
import { FaDollarSign } from "react-icons/fa";
import { Info, ArrowDownUp, Loader2 } from "lucide-react";
import { SiSolana } from "react-icons/si";
import { getSolanaPrice, calculateUsdValue, formatSolBalance } from "@/lib/price-service";
import { 
  getSwapQuote,
  createSwapTransaction,
  addDonationToTransaction
} from "@/lib/devnet-service";

export default function Home() {
  const [theme] = useState<"light" | "dark">("dark");
  const [fromAmount, setFromAmount] = useState("0.02");
  
  // Description section text
  const descriptionText = `GiveFi is a checkbox widget that any Solana dApp can integrate, allowing users to make donations to the dApp's chosen charity when submitting their onchain transaction.`;
  const devnetNotice = `This is a version on Solana devnet. Get free devnet tokens at `;
  const faucetUrl = `https://solfaucet.com/`;
  
  // Wallet addresses
  const CHARITY_WALLET = 'BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx';
  const LIQUIDITY_POOL_WALLET = 'qtSJb5syrrzpahukEEsBmw6C2VipBc8breXNAQGBdQ1';
  const [toAmount, setToAmount] = useState("134.21");
  const [solPrice, setSolPrice] = useState<number>(134.21);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [loadingPrice, setLoadingPrice] = useState<boolean>(false);
  const [swapFee, setSwapFee] = useState<number>(0);
  const [swapping, setSwapping] = useState<boolean>(false);
  const [charityBalance, setCharityBalance] = useState<number>(0);
  const [loadingCharityBalance, setLoadingCharityBalance] = useState<boolean>(false);
  // LP balance tracking removed as requested
  
  const { wallet, connect, disconnect, connected } = useSolanaWallet();
  const { 
    addDonationToTransaction, 
    isDonating,
    donationRecipient, 
    recordDonationTransaction 
  } = useDonation();
  const { toast } = useToast();
  
  // Fetch SOL price on component mount
  useEffect(() => {
    const fetchSolPrice = async () => {
      setLoadingPrice(true);
      try {
        const price = await getSolanaPrice();
        setSolPrice(price);
        
        // Update USDC value based on current SOL amount and price
        if (fromAmount) {
          const usdValue = calculateUsdValue(parseFloat(fromAmount), price);
          setToAmount(usdValue);
        }
      } catch (error) {
        console.error("Error fetching SOL price:", error);
      } finally {
        setLoadingPrice(false);
      }
    };
    
    fetchSolPrice();
    // Refresh price every 60 seconds
    const intervalId = setInterval(fetchSolPrice, 60000);
    return () => clearInterval(intervalId);
  }, []);
  
  // Update USDC amount and fee when SOL amount changes
  useEffect(() => {
    const updateSwapQuote = async () => {
      const parsedAmount = parseFloat(fromAmount);
      if (!isNaN(parsedAmount) && solPrice) {
        try {
          // Get swap quote with fee calculation 
          const { usdcAmount, fee } = await getSwapQuote(parsedAmount, solPrice);
          setToAmount(usdcAmount.toString());
          setSwapFee(fee);
        } catch (error) {
          console.error("Error getting swap quote:", error);
          // Fallback calculation if the quote service fails
          const usdValue = calculateUsdValue(parsedAmount, solPrice);
          setToAmount(usdValue);
          setSwapFee(parsedAmount * 0.005); // Assume 0.5% fee
        }
      }
    };
    
    updateSwapQuote();
  }, [fromAmount, solPrice]);
  
  // Fetch wallet balance when wallet is connected
  useEffect(() => {
    const fetchBalances = async () => {
      if (!connected || !wallet) return;
      
      setLoadingBalance(true);
      try {
        const connection = createConnection();
        
        // Fetch SOL balance
        const balanceInLamports = await connection.getBalance(wallet.publicKey);
        const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
        setSolBalance(balanceInSol);
        
        // For simplicity, we're showing a fixed USDC balance in the UI
        // In a real application, you would interact with the token program here
        setUsdcBalance(10.0); // Placeholder value for demo
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
      } finally {
        setLoadingBalance(false);
      }
    };
    
    fetchBalances();
    // Refresh balances every 15 seconds when connected
    const intervalId = connected ? setInterval(fetchBalances, 15000) : null;
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [connected, wallet]);
  
  // Fetch charity wallet balance
  useEffect(() => {
    const fetchCharityBalance = async () => {
      setLoadingCharityBalance(true);
      try {
        const connection = createConnection();
        
        // Fetch charity wallet balance only
        const charityPublicKey = new PublicKey(CHARITY_WALLET);
        const charityBalanceInLamports = await connection.getBalance(charityPublicKey);
        const charityBalanceInSol = charityBalanceInLamports / LAMPORTS_PER_SOL;
        setCharityBalance(charityBalanceInSol);
        
        // We're not tracking LP balance as requested
      } catch (error) {
        console.error("Error fetching charity wallet balance:", error);
      } finally {
        setLoadingCharityBalance(false);
      }
    };
    
    fetchCharityBalance();
    // Refresh charity balance every 30 seconds
    const intervalId = setInterval(fetchCharityBalance, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSwap = async () => {
    if (!connected || !wallet) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      connect();
      return;
    }

    try {
      setSwapping(true);
      
      // Create a Solana connection
      const connection = createConnection();
      
      // Parse the SOL amount
      const solAmount = parseFloat(fromAmount);
      if (isNaN(solAmount) || solAmount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid SOL amount",
          variant: "destructive",
        });
        setSwapping(false);
        return;
      }
      
      // Check if user has enough SOL (accounting for fees)
      // Solana transactions cost ~0.000005 SOL, so add some buffer
      const totalNeeded = solAmount + (isDonating ? 0.01 : 0) + 0.001;
      
      if (totalNeeded > solBalance) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${totalNeeded.toFixed(3)} SOL (including fees) but your balance is ${formatSolBalance(solBalance)} SOL`,
          variant: "destructive",
        });
        setSwapping(false);
        return;
      }
      
      // Create a swap transaction
      const transaction = await createSwapTransaction(wallet, solAmount, connection);
      
      // Process donation if enabled
      if (isDonating) {
        // Create a separate donation transaction
        const donationTransaction = new Transaction();
        
        // Add donation transfer instruction (0.01 SOL fixed amount)
        const donationAmount = 0.01;
        const donationLamports = Math.floor(donationAmount * LAMPORTS_PER_SOL);
        
        donationTransaction.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey('BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx'),
            lamports: donationLamports,
          })
        );
        
        // Execute donation transaction separately for simplicity
        try {
          const donationTxSignature = await wallet.sendTransaction(donationTransaction, connection);
          console.log("Donation transaction sent with signature:", donationTxSignature);
          
          // Record the donation
          await recordDonationTransaction(donationTxSignature);
          
          toast({
            title: "Donation Sent",
            description: "Your 0.01 SOL donation has been sent successfully!",
          });
        } catch (donationError) {
          console.error("Error sending donation:", donationError);
          toast({
            title: "Donation Failed",
            description: "Your swap was successful, but the donation failed to send.",
            variant: "destructive"
          });
        }
      }
      
      console.log("Transaction with donation:", transaction);
      
      // Sign and send the swap transaction
      const txSignature = await wallet.sendTransaction(transaction, connection);
      
      console.log("Swap transaction sent with signature:", txSignature);

      // Refresh balances after transaction
      const balanceInLamports = await connection.getBalance(wallet.publicKey);
      const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
      setSolBalance(balanceInSol);

      toast({
        title: "Transaction Submitted",
        description: isDonating 
          ? `Swap and donation completed! Sent ${solAmount} SOL${isDonating ? ' + 0.01 SOL donation' : ''}` 
          : `Swap completed! Sent ${solAmount} SOL`,
        action: (
          <a 
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline text-blue-500"
          >
            View on Explorer
          </a>
        )
      });
      
      setSwapping(false);
    } catch (error) {
      console.error("Error processing transaction:", error);
      toast({
        title: "Transaction Failed",
        description: typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : "Failed to process the transaction. Please try again.",
        variant: "destructive",
      });
      setSwapping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-solana-black">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-3">
            GiveFi Donation Widget
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {descriptionText}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            {devnetNotice}
            <a 
              href={faucetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              solfaucet.com
            </a>
          </p>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-200">
            Demo
          </h2>
          
          {connected ? (
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                className="border-green-500 text-green-500"
              >
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Connected
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={disconnect}
                className="border-red-500 text-red-500"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              variant="default"
              onClick={connect}
              className="bg-solana-blue hover:bg-solana-blue-light"
            >
              Connect Wallet
            </Button>
          )}
        </div>
        
        <Card className="bg-white dark:bg-solana-dark-gray rounded-xl shadow-lg overflow-hidden">
          <CardContent className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">
              Demo Swap Interface
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Swapped SOL will go to the GiveFi Devnet LP address.
            </p>
            
            <div className="space-y-4 mb-6">
              {/* From Token */}
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  From
                </Label>
                <div className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-2">
                        <div className="w-8 h-8 bg-solana-blue rounded-full flex items-center justify-center">
                          <SiSolana className="text-white text-sm" />
                        </div>
                      </div>
                      <span className="font-medium">SOL</span>
                    </div>
                    <Input 
                      type="text" 
                      value={fromAmount} 
                      onChange={(e) => {
                        // Validate to allow only numeric values with decimal
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                          setFromAmount(value);
                        }
                      }}
                      className="w-24 bg-transparent focus:outline-none text-lg border-0 shadow-none text-right"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {connected ? (
                    <>
                      Balance: {loadingBalance ? (
                        <span className="inline-flex items-center">
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Loading...
                        </span>
                      ) : (
                        `${formatSolBalance(solBalance)} SOL`
                      )}
                    </>
                  ) : (
                    "Connect wallet to see balance"
                  )}
                </div>
              </div>
              
              {/* Swap Arrow */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-10 h-10 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </div>
              
              {/* To Token */}
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  To
                </Label>
                <div className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <FaDollarSign className="text-gray-700 dark:text-gray-300 text-sm" />
                        </div>
                      </div>
                      <span className="font-medium">USDC</span>
                    </div>
                    <Input 
                      type="text" 
                      value={toAmount} 
                      readOnly
                      className="w-24 bg-transparent focus:outline-none text-lg border-0 shadow-none text-right"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {loadingPrice ? (
                    <span className="inline-flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Loading price...
                    </span>
                  ) : (
                    `1 SOL ≈ ${solPrice.toFixed(2)} USDC`
                  )}
                </div>
              </div>
              
              <DonationCheckbox 
                amount={0.01}
                label={`Donate ~$${(0.01 * solPrice).toFixed(2)} to Charity?`}
                theme={theme}
              />
              
              <Button 
                className="w-full bg-solana-blue hover:bg-solana-blue-light text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                onClick={handleSwap}
              >
                Swap
              </Button>
            </div>
          </CardContent>
          
          <CardContent className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-200">
              Charity Wallet Balance
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Donations go to the charity wallet shown below.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Charity Address:</span>
                <a 
                  href={`https://explorer.solana.com/address/${CHARITY_WALLET}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-500 hover:underline"
                >
                  {CHARITY_WALLET.slice(0, 6)}...{CHARITY_WALLET.slice(-4)}
                </a>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SOL Balance:</span>
                <div className="flex items-center">
                  {loadingCharityBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <SiSolana className="text-solana-blue mr-2 h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {loadingCharityBalance ? "Loading..." : `${formatSolBalance(charityBalance)} SOL`}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">USD Value:</span>
                <div className="flex items-center">
                  {loadingCharityBalance || loadingPrice ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FaDollarSign className="text-green-500 mr-1 h-3 w-3" />
                  )}
                  <span className="text-sm font-medium">
                    {loadingCharityBalance || loadingPrice 
                      ? "Loading..." 
                      : `$${(charityBalance * solPrice).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-200">
              Implementation Guide
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-200">1. Install the package</h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm overflow-x-auto">
                  <code>npm install givefi-donation-widget</code>
                </pre>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-200">2. Import component</h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm overflow-x-auto">
                  <code>import {"{ DonationCheckbox }"} from 'givefi-donation-widget';</code>
                </pre>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-200">3. Add to your component</h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm overflow-x-auto">
                  <code>{`<DonationCheckbox 
  amount={0.01}
  recipient="BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx"
  theme="dark"
  onDonationChange={(isDonating) => {
    // Update your transaction logic
  }}
/>`}</code>
                </pre>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-200">4. Update transaction</h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm overflow-x-auto">
                  <code>{`// Example transaction handling
if (isDonationEnabled) {
  // Add donation instruction to transaction
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: new PublicKey(recipientAddress),
      lamports: LAMPORTS_PER_SOL * 0.01
    })
  );
}`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
