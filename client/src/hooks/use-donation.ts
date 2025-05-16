import { useContext } from "react";
import { DonationContext, DonationContextType } from "@/components/donation/DonationProvider";

export function useDonation(): DonationContextType {
  const context = useContext(DonationContext);
  
  if (context === undefined) {
    throw new Error("useDonation must be used within a DonationProvider");
  }
  
  return context;
}
