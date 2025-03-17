# Admin Scripts

This directory contains administrative scripts for managing the adcdn system.

## Set Admin Script

The `set-admin.js` script allows you to set a user as an admin with unlimited storage.

### Prerequisites

1. Node.js installed
2. A `.env` file with `DATABASE_URL` in the root directory

### Usage

```bash
node scripts/set-admin.js <email>
```

Example:
```bash
node scripts/set-admin.js user@example.com
```

When executed, the script will:
1. Check if the user exists
2. Update the user to admin status
3. Grant unlimited storage capacity
4. Display the updated user details

### Notes

- For security reasons, this script should only be run by system administrators
- Admin users can set other users as admins through the API as well
- Admins have unlimited storage capacity and can access admin-only features

## Database Schema Update

The `update-schema.sql` file contains SQL commands to update the database schema.

### Usage

If you see errors about missing columns in the database, you need to run the schema update.

```bash
# Using psql directly (requires PostgreSQL client tools)
psql $DATABASE_URL -f scripts/update-schema.sql

# OR using the update-schema script
sudo -u postgres psql $DATABASE_URL -f /opt/adcdn/scripts/update-schema.sql
```

The schema update:
1. Adds the `role` and `storage_limit_bytes` columns to the users table
2. Sets default values for existing users
3. Gives unlimited storage to specific users

### Schema Changes

- `role`: User role (user, admin, or unlimited)
- `storage_limit_bytes`: Storage limit in bytes, default 100MB (104857600 bytes)