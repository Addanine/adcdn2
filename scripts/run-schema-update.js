// Run the database schema update script
import { config } from 'dotenv';
import pkg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runSchemaUpdate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    try {
      console.log('Running schema update...');
      const sqlFilePath = join(__dirname, 'update-schema.sql');
      const sqlCommands = readFileSync(sqlFilePath, 'utf8');
      
      await client.query(sqlCommands);
      console.log('Schema update completed successfully!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSchemaUpdate();