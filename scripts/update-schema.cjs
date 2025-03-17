// Script to update database schema
require('dotenv').config({ path: '.env' }); // Use .env instead of .env.local
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function updateDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Running schema update with connection:', process.env.DATABASE_URL);
    const sqlFilePath = path.join(__dirname, 'update-schema.sql');
    const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');
    
    const result = await pool.query(sqlCommands);
    console.log('Schema update completed successfully!');
    console.log(result);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateDatabase();