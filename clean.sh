#!/bin/bash

# Stop and remove all containers, including orphans
echo "Stopping and removing all containers..."
docker compose down --remove-orphans

# Remove any remaining containers related to the project
echo "Removing any remaining containers..."
docker ps -a | grep 'adcdn' | awk '{print $1}' | xargs -r docker rm -f

# Check if any containers are still using port 80 or 443
echo "Checking for containers using port 80 or 443..."
docker ps -a | grep -E '0.0.0.0:80|0.0.0.0:443'