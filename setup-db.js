const { Client } = require('pg');

async function setupDatabase() {
  console.log('Setting up database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);
    console.log('Users table created/verified');

    // Create donations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        recipient_address TEXT NOT NULL,
        amount INTEGER NOT NULL,
        enabled BOOLEAN DEFAULT FALSE,
        last_donated TEXT,
        metadata JSONB
      )
    `);
    console.log('Donations table created/verified');

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
  }
}

setupDatabase();