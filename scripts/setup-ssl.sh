#!/bin/bash

# SSL Setup Script for Radiology RAG
# This script sets up Let's Encrypt SSL certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Radiology RAG - SSL Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Check if domain is configured
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: DOMAIN environment variable is not set${NC}"
    echo "Please set your domain in .env.production file"
    exit 1
fi

echo -e "${YELLOW}Domain: $DOMAIN${NC}"
echo

# Create directories
echo "Creating SSL directories..."
mkdir -p certbot/conf
mkdir -p certbot/www

# Check if running in staging mode
STAGING_ARG=""
if [ "$SSL_STAGING" = "true" ]; then
    echo -e "${YELLOW}Running in STAGING mode (test certificates)${NC}"
    STAGING_ARG="--staging"
fi

# Get email for Let's Encrypt
if [ -z "$SSL_EMAIL" ]; then
    echo -e "${YELLOW}Please enter your email for Let's Encrypt notifications:${NC}"
    read SSL_EMAIL
fi

# Stop nginx if running
echo "Stopping nginx temporarily..."
docker-compose -f docker-compose.prod.yml stop nginx || true

# Request certificate
echo -e "${GREEN}Requesting SSL certificate for $DOMAIN...${NC}"
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $SSL_EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING_ARG \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSL certificate obtained successfully!${NC}"

    # Start nginx
    echo "Starting nginx with SSL..."
    docker-compose -f docker-compose.prod.yml up -d nginx

    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}SSL Setup Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo
    echo -e "Your site is now accessible at: ${GREEN}https://$DOMAIN${NC}"
    echo
    echo "Certificate will auto-renew every 12 hours via certbot container"
else
    echo -e "${RED}✗ Failed to obtain SSL certificate${NC}"
    echo "Please check your domain DNS settings and try again"
    exit 1
fi
