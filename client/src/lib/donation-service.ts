import { apiRequest } from "./queryClient";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Donation } from "@shared/schema";

export interface DonationStats {
  totalDonations: number;
  totalAmount: number;
}

export const donationService = {
  // Record a donation in the database
  async recordDonation(
    walletAddress: string,
    recipientAddress: string,
    amount: number, // in SOL
    transactionId?: string
  ): Promise<Donation> {
    const metadata = transactionId ? { transactionIds: [transactionId] } : undefined;
    
    const response = await apiRequest(
      "POST",
      "/api/donations", 
      {
        recipientAddress,
        amount: Math.floor(amount * LAMPORTS_PER_SOL), // Convert SOL to lamports
        enabled: true,
        metadata
      }
    );
    return response.json();
  },

  // Get donation statistics
  async getStats(): Promise<DonationStats> {
    const response = await apiRequest("GET", "/api/donations/stats");
    return response.json();
  },

  // Get user's donation history
  async getUserDonations(userId: number): Promise<Donation[]> {
    const response = await apiRequest("GET", `/api/users/${userId}/donations`);
    return response.json();
  },

  // Update a donation
  async updateDonation(id: number, data: Partial<Donation>): Promise<Donation> {
    const response = await apiRequest(
      "PATCH",
      `/api/donations/${id}`, 
      data
    );
    return response.json();
  }
};