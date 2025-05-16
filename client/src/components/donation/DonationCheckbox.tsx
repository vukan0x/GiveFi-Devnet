import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDonation } from "@/hooks/use-donation";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export type DonationCheckboxProps = {
  /** Amount to donate in SOL */
  amount?: number;
  /** Recipient wallet address */
  recipient?: string;
  /** Label for the donation checkbox */
  label?: string;
  /** CSS class to apply to the container */
  className?: string;
  /** Theme - light or dark */
  theme?: "light" | "dark";
  /** Callback when donation status changes */
  onDonationChange?: (isDonating: boolean) => void;
};

export function DonationCheckbox({
  amount = 0.01,
  recipient = "BivYS3FohCDzhNCV52Qkf59crbzmqkjUQqnCkQ9Bqpcx",
  label = `Donate 0.01 $SOL to Charity?`,
  className,
  theme = "dark",
  onDonationChange,
}: DonationCheckboxProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { isDonating, setIsDonating } = useDonation();

  const handleCheckboxChange = (checked: boolean) => {
    setIsDonating(checked);
    onDonationChange?.(checked);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(recipient).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const shortAddress = `${recipient.slice(0, 6)}...${recipient.slice(-5)}`;
  
  return (
    <div
      className={cn(
        "relative rounded-lg border p-3 transition-colors duration-150",
        theme === "dark" 
          ? "border-gray-600 hover:bg-gray-700/50" 
          : "border-gray-300 hover:bg-gray-50",
        className
      )}
    >
      <div className="flex items-center">
        <div className="flex items-center h-5">
          <Checkbox
            id="donation-checkbox"
            checked={isDonating}
            onCheckedChange={handleCheckboxChange}
            className="h-5 w-5 cursor-pointer text-solana-blue"
          />
        </div>
        <div className="ml-3 flex items-center">
          <Label
            htmlFor="donation-checkbox"
            className="text-base font-medium cursor-pointer"
          >
            {label}
          </Label>
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 h-auto p-0"
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          >
            {isDetailsOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
            )}
          </Button>
        </div>
      </div>

      {isDetailsOpen && (
        <div className="mt-3 pl-8">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              Adding <strong>0.01 SOL</strong> ({amount * LAMPORTS_PER_SOL} lamports) to your transaction to support our partner charity.
            </p>
            <div className="flex items-center">
              <span className="font-medium mr-1">Recipient:</span>
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {shortAddress}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0"
                      onClick={handleCopyAddress}
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3 text-solana-blue-light" />
                      ) : (
                        <Copy className="h-3 w-3 text-solana-blue hover:text-solana-blue-light" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isCopied ? "Copied!" : "Copy address"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
