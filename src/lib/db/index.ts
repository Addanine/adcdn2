import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { hash, compare } from 'bcrypt';
import { env } from '~/env';
import fs from 'fs';
import path from 'path';

// Database connection pool
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Initialize the database schema check only - don't try to alter
(async () => {
  try {
    // Check if columns exist without trying to add them
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('role', 'storage_limit_bytes')
    `);
    
    const existingColumns = result.rows.map(row => row.column_name);
    if (!existingColumns.includes('role') || !existingColumns.includes('storage_limit_bytes')) {
      console.log('Missing columns detected:', 
        existingColumns.includes('role') ? '' : 'role', 
        existingColumns.includes('storage_limit_bytes') ? '' : 'storage_limit_bytes'
      );
      console.log('Please run the update-schema.sql script with database admin privileges');
    } else {
      console.log('Database schema check completed - all required columns exist');
    }
  } catch (error) {
    console.error('Error checking database schema:', error);
  }
})();

// User management
export async function createUser(email: string, password: string) {
  const passwordHash = await hash(password, 10);
  
  // Check if user should have unlimited storage
  let role = 'user';
  let storageLimit = 104857600; // 100MB default
  
  if (email === 'harry.oltmans@gmail.com' || email === 'emily@adenine.xyz') {
    role = 'unlimited';
    storageLimit = -1; // -1 indicates unlimited
  }
  
  try {
    // First check if the columns exist to provide better error messages
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('role', 'storage_limit_bytes')
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    const hasRoleColumn = existingColumns.includes('role');
    const hasStorageLimitColumn = existingColumns.includes('storage_limit_bytes');
    
    if (!hasRoleColumn || !hasStorageLimitColumn) {
      // Build a query that only includes columns that exist
      let insertColumns = ['email', 'password_hash'];
      let returnColumns = ['id', 'email', 'created_at'];
      let placeholders = ['$1', '$2'];
      let values = [email, passwordHash];
      let placeholderIndex = 3;
      
      if (hasRoleColumn) {
        insertColumns.push('role');
        returnColumns.push('role');
        placeholders.push(`$${placeholderIndex}`);
        values.push(role);
        placeholderIndex++;
      }
      
      if (hasStorageLimitColumn) {
        insertColumns.push('storage_limit_bytes');
        returnColumns.push('storage_limit_bytes');
        placeholders.push(`$${placeholderIndex}`);
        values.push(storageLimit.toString()); // Convert to string for query parameter
      }
      
      const query = `
        INSERT INTO users (${insertColumns.join(', ')}) 
        VALUES (${placeholders.join(', ')}) 
        RETURNING ${returnColumns.join(', ')}
      `;
      
      console.log('Using fallback query with existing columns only');
      const result = await pool.query(query, values);
      
      // Add missing fields with default values to match schema
      const user = result.rows[0];
      if (!hasRoleColumn) {
        user.role = role;
      }
      if (!hasStorageLimitColumn) {
        user.storage_limit_bytes = storageLimit;
      }
      
      return user;
    } else {
      // Standard insert if all columns exist
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, role, storage_limit_bytes) VALUES ($1, $2, $3, $4) RETURNING id, email, role, storage_limit_bytes, created_at',
        [email, passwordHash, role, storageLimit.toString()] // Convert to string for query parameter
      );
      return result.rows[0];
    }
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create user: ${error.message}`);
    } else {
      throw new Error('Failed to create user: Unknown error');
    }
  }
}

export async function verifyUser(email: string, password: string) {
  try {
    // Check if columns exist to determine the right query to use
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('role', 'storage_limit_bytes')
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    const hasRoleColumn = existingColumns.includes('role');
    const hasStorageLimitColumn = existingColumns.includes('storage_limit_bytes');
    
    // Build dynamic query based on available columns
    let query = 'SELECT id, email, password_hash';
    if (hasRoleColumn) query += ', role';
    if (hasStorageLimitColumn) query += ', storage_limit_bytes';
    query += ' FROM users WHERE email = $1';
    
    const result = await pool.query(query, [email]);
    if (result.rows.length === 0) return null;
    
    const user = result.rows[0];
    const passwordValid = await compare(password, user.password_hash);
    if (!passwordValid) return null;
    
    // Use default values if columns don't exist
    return { 
      id: user.id, 
      email: user.email,
      role: user.role || 'user', // Default if column doesn't exist
      storageLimit: user.storage_limit_bytes || 104857600 // Default if column doesn't exist
    };
  } catch (error: unknown) {
    console.error('Error verifying user:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to verify user: ${error.message}`);
    } else {
      throw new Error('Failed to verify user: Unknown error');
    }
  }
}

// Admin functions
export async function setUserAdmin(email: string) {
  try {
    // Check if columns exist
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('role', 'storage_limit_bytes')
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    const hasRoleColumn = existingColumns.includes('role');
    const hasStorageLimitColumn = existingColumns.includes('storage_limit_bytes');
    
    if (!hasRoleColumn && !hasStorageLimitColumn) {
      console.log('Cannot set admin role: Required columns are missing');
      throw new Error('Database schema is missing required columns. Please run update-schema.sql');
    }
    
    // Build dynamic update query based on available columns
    const setClause = [];
    const values = [];
    let paramIndex = 1;
    
    if (hasRoleColumn) {
      setClause.push(`role = $${paramIndex}`);
      values.push('admin');
      paramIndex++;
    }
    
    if (hasStorageLimitColumn) {
      setClause.push(`storage_limit_bytes = $${paramIndex}`);
      values.push(-1);
      paramIndex++;
    }
    
    // Add email as the last parameter
    values.push(email);
    
    // Determine which columns to return
    const returnColumns = ['id', 'email'];
    if (hasRoleColumn) returnColumns.push('role');
    if (hasStorageLimitColumn) returnColumns.push('storage_limit_bytes');
    
    // Build and execute the query
    const query = `
      UPDATE users 
      SET ${setClause.join(', ')} 
      WHERE email = $${paramIndex} 
      RETURNING ${returnColumns.join(', ')}
    `;
    
    const result = await pool.query(query, values);
    
    // Add missing fields with default values to match expected schema
    const user = result.rows.length > 0 ? result.rows[0] : null;
    if (user) {
      if (!hasRoleColumn) {
        user.role = 'admin';
      }
      if (!hasStorageLimitColumn) {
        user.storage_limit_bytes = -1;
      }
    }
    
    return user;
  } catch (error: unknown) {
    console.error('Error setting user as admin:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to set user as admin: ${error.message}`);
    } else {
      throw new Error('Failed to set user as admin: Unknown error');
    }
  }
}

export async function getUserStorageUsed(userId: string) {
  const result = await pool.query(
    'SELECT COALESCE(SUM(size_bytes), 0) as total_bytes FROM files WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].total_bytes);
}

// File management
export async function saveFile(userId: string, filename: string, mimeType: string, data: Buffer, sizeBytes: number) {
  const result = await pool.query(
    'INSERT INTO files (user_id, original_filename, mime_type, file_data, size_bytes) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [userId, filename, mimeType, data, sizeBytes]
  );
  return result.rows[0].id;
}

export async function getUserFiles(userId: string) {
  const result = await pool.query(
    `SELECT f.id, f.original_filename, f.mime_type, f.size_bytes, f.upload_timestamp, 
     l.share_code, l.id as link_id
     FROM files f
     LEFT JOIN links l ON f.id = l.file_id
     WHERE f.user_id = $1
     ORDER BY f.upload_timestamp DESC`,
    [userId]
  );
  return result.rows;
}

export async function deleteFile(fileId: string, userId: string) {
  const result = await pool.query(
    'DELETE FROM files WHERE id = $1 AND user_id = $2 RETURNING id',
    [fileId, userId]
  );
  return result.rows.length > 0;
}

export async function renameFile(fileId: string, userId: string, newFilename: string) {
  const result = await pool.query(
    'UPDATE files SET original_filename = $3 WHERE id = $1 AND user_id = $2 RETURNING id, original_filename',
    [fileId, userId, newFilename]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

// Link management
export async function createShareableLink(fileId: string) {
  // Generate a short, unique code (first 8 chars of a UUID, should be unique enough for this purpose)
  const shareCode = randomUUID().replace(/-/g, '').substring(0, 8);
  
  const result = await pool.query(
    'INSERT INTO links (file_id, share_code) VALUES ($1, $2) RETURNING id, share_code',
    [fileId, shareCode]
  );
  return result.rows[0];
}

// Get a file by ID
export async function getFileById(fileId: string) {
  const result = await pool.query(
    'SELECT id, original_filename, mime_type, file_data, size_bytes FROM files WHERE id = $1',
    [fileId]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function getFileByShareCode(shareCode: string) {
  const result = await pool.query(
    `SELECT f.id, f.original_filename, f.mime_type, f.file_data, f.size_bytes 
     FROM files f
     JOIN links l ON f.id = l.file_id
     WHERE l.share_code = $1`,
    [shareCode]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}