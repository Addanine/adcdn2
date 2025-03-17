#!/bin/bash

# Initialize Let's Encrypt SSL certificates for Nginx

# Check for docker-compose or docker compose
if [ -x "$(command -v docker-compose)" ]; then
  DOCKER_COMPOSE="docker-compose"
elif [ -x "$(command -v docker)" ] && docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
else
  echo 'Error: Neither docker-compose nor docker compose is available.' >&2
  exit 1
fi

domains=(cdn.adenine.xyz)
rsa_key_size=4096
data_path="./nginx/certbot"
email="admin@adenine.xyz" # Change to your email

if [ -d "$data_path/conf/live/$domains" ]; then
  read -p "Existing certificates found. Continue and replace existing certificates? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "Downloading recommended TLS parameters..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

echo "Creating temporary nginx config for certificate issuance..."
mkdir -p "$data_path/www"

# Create temporary nginx config for certificate generation
cat > ./nginx/conf/app.conf.template <<EOF
server {
    listen 80;
    server_name ${domains[0]};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${domains[0]};
    
    ssl_certificate /etc/letsencrypt/live/${domains[0]}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domains[0]}/privkey.pem;
    
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Increase timeout for uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 500M;
    }
}
EOF

cp ./nginx/conf/app.conf.template ./nginx/conf/app.conf

# Stop any existing web servers temporarily
echo "Stopping any services using port 80..."
$DOCKER_COMPOSE down

# Request Let's Encrypt certificate in standalone mode
echo "Requesting Let's Encrypt certificates using standalone mode..."
$DOCKER_COMPOSE run --rm --entrypoint "\
  certbot certonly --standalone \
    --email $email \
    --agree-tos \
    --no-eff-email \
    --preferred-challenges http \
    -d ${domains[0]}" certbot

# Start all services
echo "Starting all services..."
$DOCKER_COMPOSE up -d

echo "Waiting for services to start..."
sleep 5

echo "Setup complete! Your site should now be accessible via HTTPS."