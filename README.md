# Minimalist File CDN

A simple, secure file hosting service with user authentication and shareable links.

## Features

- **User Authentication:** Register and log in securely
- **File Management:** Upload, view, and delete your files
- **Shareable Links:** Generate unique links to share files with anyone
- **Secure Storage:** Files are securely stored in the PostgreSQL database
- **Storage Limits:** 100MB per regular user, unlimited for special accounts
- **Large File Support:** Upload files up to 500MB in size
- **Admin Controls:** Special privileges for administrative accounts
- **Responsive UI:** Works on desktop and mobile devices

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (stores user data, file content, and shareable links)
- **Authentication:** Custom JWT-based auth with HttpOnly cookies

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/adcdn
   JWT_SECRET=your-secret-key
   ```
4. Set up the database:
   ```
   # For new installations:
   psql -U postgres -f src/lib/db/schema.sql
   
   # For updating existing databases:
   psql -U postgres -f scripts/update-schema.sql
   ```
   
   **Note:** If you see errors about missing database columns (e.g., "column 'role' does not exist"),
   run the schema update script with database admin privileges:
   ```
   sudo -u postgres psql your_database_url -f /path/to/scripts/update-schema.sql
   ```
5. Run the development server:
   ```
   npm run dev
   ```

### Special Accounts

The system has two types of special accounts:

1. **Admin accounts**: Created using the admin script
   ```
   node scripts/set-admin.js user@example.com
   ```
   
2. **Unlimited accounts**: The following emails automatically get unlimited storage:
   - harry.oltmans@gmail.com
   - emily@adenine.xyz
   
Both account types have no storage limits and can upload files up to 500MB in size.

## Deployment

### Standard Deployment

1. Build the application:
   ```
   npm run build
   ```
2. Start the production server:
   ```
   npm start
   ```

### Docker Deployment

#### Prerequisites
- Docker and Docker Compose installed on your machine
- Traefik as a reverse proxy (for production deployment)
- PostgreSQL database server (for production deployment)

#### Local Development Deployment

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd adcdn
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. For local development, modify the DATABASE_URL to use the local database:
   ```
   DATABASE_URL="postgresql://postgres:postgres@db:5432/adcdn"
   ```

4. And update docker-compose.yml to include a local PostgreSQL service.

5. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

6. Initialize the database (first time only):
   ```bash
   docker-compose exec app node scripts/update-schema.cjs
   ```

7. Access the application at http://localhost:3000

#### Production Deployment to cdn.adenine.xyz with HTTPS

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd adcdn
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. The production configuration is already set up for:
   - Domain: cdn.adenine.xyz
   - Integration with PostgreSQL database
   - HTTPS with Let's Encrypt certificates

4. Initialize the SSL certificates:
   ```bash
   ./init-letsencrypt.sh
   ```

5. Start the Docker containers:
   ```bash
   docker compose up -d
   ```

6. Initialize the database schema (if needed):
   ```bash
   docker compose exec app node scripts/update-schema.cjs
   ```

7. Your application will be available at https://cdn.adenine.xyz

#### Managing the Docker Application

- View logs:
  ```bash
  docker-compose logs -f
  ```

- Stop the application:
  ```bash
  docker-compose down
  ```

- Restart the application:
  ```bash
  docker-compose restart
  ```

- Rebuild after code changes:
  ```bash
  docker-compose up -d --build
  ```

## License

MIT
