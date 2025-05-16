import { useDonation } from "@/hooks/use-donation";
import { formatSol } from "@/lib/solana";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

export const DonationStats: React.FC = () => {
  const { totalDonations, totalAmount } = useDonation();
  
  // Convert lamports to SOL for display
  const solAmount = totalAmount / 1_000_000_000;

  return (
    <Card className="bg-white dark:bg-solana-dark-gray rounded-xl shadow-lg overflow-hidden mt-4">
      <CardHeader className="p-4 flex flex-row items-center justify-start space-x-2">
        <Heart className="h-5 w-5 text-red-500" />
        <CardTitle className="text-base">Donation Stats</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex justify-between">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Donations</div>
            <div className="text-xl font-semibold">{totalDonations}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Amount Donated</div>
            <div className="text-xl font-semibold">{formatSol(solAmount)} SOL</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};