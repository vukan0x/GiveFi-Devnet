import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDonationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Donation routes
  app.get("/api/donations/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching donation stats:", error);
      res.status(500).json({ error: "Failed to fetch donation statistics" });
    }
  });

  app.get("/api/donations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid donation ID" });
      }
      
      const donation = await storage.getDonation(id);
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }
      
      res.json(donation);
    } catch (error) {
      console.error("Error fetching donation:", error);
      res.status(500).json({ error: "Failed to fetch donation" });
    }
  });

  app.get("/api/users/:userId/donations", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const donations = await storage.getDonationsByUser(userId);
      res.json(donations);
    } catch (error) {
      console.error("Error fetching user donations:", error);
      res.status(500).json({ error: "Failed to fetch user donations" });
    }
  });

  app.post("/api/donations", async (req: Request, res: Response) => {
    try {
      const validatedData = insertDonationSchema.parse(req.body);
      const donation = await storage.createDonation(validatedData);
      res.status(201).json(donation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating donation:", error);
      res.status(500).json({ error: "Failed to create donation" });
    }
  });

  app.patch("/api/donations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid donation ID" });
      }
      
      const donation = await storage.getDonation(id);
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }
      
      const updatedDonation = await storage.updateDonation(id, req.body);
      res.json(updatedDonation);
    } catch (error) {
      console.error("Error updating donation:", error);
      res.status(500).json({ error: "Failed to update donation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
