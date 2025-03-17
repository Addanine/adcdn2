#!/usr/bin/env node

const { Pool } = require('pg');
// Load environment variables from .env file
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv module not found. Make sure to create a .env file with DATABASE_URL.');
}

// Get the email from command-line arguments
const email = process.argv[2];

if (!email) {
  console.error('Error: Email is required');
  console.log('Usage: node set-admin.js <email>');
  process.exit(1);
}

// Database connection
console.log('Connecting to database...');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setUserAdmin(email) {
  try {
    // Check if user exists
    const checkResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    
    if (checkResult.rows.length === 0) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    // Update user to admin with unlimited storage
    const result = await pool.query(
      'UPDATE users SET role = $1, storage_limit_bytes = $2 WHERE email = $3 RETURNING id, email, role, storage_limit_bytes',
      ['admin', -1, email]
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ Success: User ${email} has been set as admin with unlimited storage`);
      
      // Display the updated user details
      const user = result.rows[0];
      console.log('\nUser details:');
      console.log(`- ID: ${user.id}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- Storage limit: ${user.storage_limit_bytes === -1 ? 'Unlimited' : `${user.storage_limit_bytes / (1024 * 1024)} MB`}`);
    } else {
      console.error('Failed to update user role');
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown database error');
    console.error('Database error:', error.message);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
setUserAdmin(email).catch(console.error);