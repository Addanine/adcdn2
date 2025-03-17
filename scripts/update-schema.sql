-- Add new columns to the users table for role and storage limit
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS storage_limit_bytes BIGINT DEFAULT 104857600; -- 100MB

-- Update existing users with appropriate defaults if the columns were just added
UPDATE users SET role = 'user' WHERE role IS NULL;
UPDATE users SET storage_limit_bytes = 104857600 WHERE storage_limit_bytes IS NULL;

-- Add special permissions for specific emails
UPDATE users SET role = 'unlimited', storage_limit_bytes = -1 
WHERE email = 'harry.oltmans@gmail.com' OR email = 'emily@adenine.xyz';

-- Update comment on the users table
COMMENT ON TABLE users IS 'Users table for authentication with role and storage management';

-- Comment on columns
COMMENT ON COLUMN users.role IS 'User role: user, admin, or unlimited';
COMMENT ON COLUMN users.storage_limit_bytes IS 'Storage limit in bytes, -1 for unlimited';