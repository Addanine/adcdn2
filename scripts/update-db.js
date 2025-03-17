// Script to update database schema
import { pool } from '../src/lib/db/index.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateDatabase() {
  try {
    console.log('Running schema update...');
    const sqlFilePath = join(__dirname, 'update-schema.sql');
    const sqlCommands = readFileSync(sqlFilePath, 'utf8');
    
    await pool.query(sqlCommands);
    console.log('Schema update completed successfully!');
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateDatabase();