# HTTPS Setup Instructions

The application has been configured to work with the existing Nginx HTTPS setup on the server.

## Steps to deploy with HTTPS:

1. Update the Nginx configuration to use the new port (3002):
   ```bash
   sudo cp /opt/adcdn/nginx.conf /etc/nginx/sites-available/cdn.adenine.xyz
   sudo systemctl reload nginx
   ```

2. Start the application (without the Nginx container):
   ```bash
   cd /opt/adcdn
   ./start.sh
   ```

## How it works:

1. The Docker Compose configuration:
   - Docker application runs on port 3002
   - No Nginx container is included, using the host's Nginx instead
   - Uses existing SSL certificates managed by Certbot

2. Nginx Configuration:
   - Listens on ports 80 and 443
   - SSL certificates are managed by Certbot
   - Proxies requests to the Docker container on port 3002
   - Configured for large file uploads (up to 500MB)

## Troubleshooting:

If the application doesn't work:

1. Check if port 3002 is used by another service:
   ```bash
   sudo lsof -i :3002
   ```

2. Check the Docker logs:
   ```bash
   docker compose logs -f
   ```

3. Check the Nginx logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. Verify the application is running:
   ```bash
   docker compose ps
   ```