import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { users, donations } from './shared/schema';

async function main() {
  console.log('Setting up database...');
  
  // Create a client
  const migrationClient = postgres(process.env.DATABASE_URL!);
  // Create the db instance
  const db = drizzle(migrationClient);

  // Create tables if they don't exist
  console.log('Creating tables if they don\'t exist...');
  
  try {
    await db.execute`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `;

    await db.execute`
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        recipient_address TEXT NOT NULL,
        amount INTEGER NOT NULL,
        enabled BOOLEAN DEFAULT FALSE,
        last_donated TEXT,
        metadata JSONB
      )
    `;

    console.log('Database setup complete!');
  } catch (e) {
    console.error('Error setting up database:', e);
    process.exit(1);
  } finally {
    // Close the connection
    await migrationClient.end();
  }
}

main();