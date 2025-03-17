#!/bin/bash

# Script to initialize deployment on a fresh server

# Generate a secure random string for NEXTAUTH_SECRET
RANDOM_SECRET=$(openssl rand -base64 32)

# Ensure we have the required environment variables
if ! grep -q "JWT_SECRET=" .env; then
    echo "JWT_SECRET=\"$RANDOM_SECRET\"" >> .env
fi

if ! grep -q "NEXTAUTH_SECRET=" .env; then
    echo "NEXTAUTH_SECRET=\"$RANDOM_SECRET\"" >> .env
else
    # Update existing NEXTAUTH_SECRET with the same value as JWT_SECRET for consistency
    sed -i "s/NEXTAUTH_SECRET=.*$/NEXTAUTH_SECRET=\"$RANDOM_SECRET\"/" .env
    sed -i "s/JWT_SECRET=.*$/JWT_SECRET=\"$RANDOM_SECRET\"/" .env
fi

# Check if docker-compose or docker compose is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "Error: Neither docker-compose nor docker compose is available"
    exit 1
fi

# Print environment for debugging purposes
echo "Current environment configuration:"
cat .env

# Stop any running containers first
echo "Stopping any existing containers..."
$DOCKER_COMPOSE down

# Build and start the containers
echo "Building and starting containers..."
$DOCKER_COMPOSE up -d --build

# Wait for services to be ready
echo "Waiting for database to initialize..."
sleep 20

# Initialize the database schema
echo "Initializing database schema..."
$DOCKER_COMPOSE exec -T app node scripts/update-schema.cjs

echo "Deployment initialized successfully!"
echo "Your application is now running at http://cdn.adenine.xyz:3000"
echo "You can access it directly at http://$(hostname -I | awk '{print $1}'):3000"