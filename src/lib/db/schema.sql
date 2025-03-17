-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  role TEXT DEFAULT 'user', -- 'user', 'admin', or 'unlimited'
  storage_limit_bytes BIGINT DEFAULT 104857600 -- Default 100MB (100 * 1024 * 1024)
);

-- Files table to store uploaded file data and metadata
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_data BYTEA NOT NULL, -- Store file content directly in the database
  size_bytes BIGINT NOT NULL,
  upload_timestamp TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Links table for shareable file links
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  share_code TEXT UNIQUE NOT NULL, -- Short, unique code for shareable links
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_links_share_code ON links(share_code);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);