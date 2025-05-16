import { Pool } from 'pg';
import { 
  type User, type InsertUser, 
  type Donation, type InsertDonation 
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Donation methods
  getDonation(id: number): Promise<Donation | undefined>;
  getDonationsByUser(userId: number): Promise<Donation[]>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonation(id: number, data: Partial<Donation>): Promise<Donation | undefined>;
  getStats(): Promise<{ totalDonations: number, totalAmount: number }>;
}

export class PostgresStorage implements IStorage {
  private pool: Pool;

  constructor() {
    // Use the DATABASE_URL environment variable
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [insertUser.username, insertUser.password]
    );
    return result.rows[0];
  }

  async getDonation(id: number): Promise<Donation | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM donations WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async getDonationsByUser(userId: number): Promise<Donation[]> {
    const result = await this.pool.query(
      'SELECT * FROM donations WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const result = await this.pool.query(
      'INSERT INTO donations (user_id, recipient_address, amount, enabled, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        donation.userId || null,
        donation.recipientAddress,
        donation.amount,
        donation.enabled || false,
        donation.metadata || null
      ]
    );
    return result.rows[0];
  }

  async updateDonation(id: number, data: Partial<Donation>): Promise<Donation | undefined> {
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.userId !== undefined) {
      updates.push(`user_id = $${paramIndex++}`);
      values.push(data.userId);
    }
    if (data.recipientAddress !== undefined) {
      updates.push(`recipient_address = $${paramIndex++}`);
      values.push(data.recipientAddress);
    }
    if (data.amount !== undefined) {
      updates.push(`amount = $${paramIndex++}`);
      values.push(data.amount);
    }
    if (data.enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(data.enabled);
    }
    if (data.lastDonated !== undefined) {
      updates.push(`last_donated = $${paramIndex++}`);
      values.push(data.lastDonated);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(data.metadata);
    }

    if (updates.length === 0) {
      const donation = await this.getDonation(id);
      return donation;
    }

    // Add id to values array
    values.push(id);

    const result = await this.pool.query(
      `UPDATE donations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  async getStats(): Promise<{ totalDonations: number; totalAmount: number }> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count, SUM(amount) as sum FROM donations WHERE enabled = true'
    );
    
    return {
      totalDonations: parseInt(result.rows[0]?.count || '0', 10),
      totalAmount: parseInt(result.rows[0]?.sum || '0', 10)
    };
  }
}

// Use PostgreSQL storage
export const storage = new PostgresStorage();
