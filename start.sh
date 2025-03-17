#!/bin/bash

# Start the application with the existing Nginx configuration

# Stop and remove existing containers
docker compose down

# Start the database and app only (no nginx)
docker compose up -d db app

# Initialize the database schema if needed
docker compose exec app node scripts/update-schema.cjs

echo "Application is running at https://cdn.adenine.xyz"
echo "The existing Nginx configuration is being used for SSL termination"