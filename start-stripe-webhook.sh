#!/bin/bash

# Stripe Webhook Forwarding Script for Local Development

echo "🔗 Starting Stripe Webhook Forwarding..."
echo ""

# Check if stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI is not installed!"
    echo ""
    echo "Install it with:"
    echo "  • macOS: brew install stripe/stripe-cli/stripe"
    echo "  • Linux: Download from https://github.com/stripe/stripe-cli/releases"
    echo ""
    exit 1
fi

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo "⚠️  You need to login to Stripe first"
    echo "Run: stripe login"
    echo ""
    exit 1
fi

# Get the backend port from .env or use default
BACKEND_PORT=3000
if [ -f "backend/.env" ]; then
    ENV_PORT=$(grep "^PORT=" backend/.env | cut -d '=' -f2)
    if [ ! -z "$ENV_PORT" ]; then
        BACKEND_PORT=$ENV_PORT
    fi
fi

echo "📡 Forwarding webhooks to: http://localhost:$BACKEND_PORT/api/stripe/webhook"
echo ""
echo "⚠️  IMPORTANT: Copy the webhook signing secret (whsec_...) that appears below"
echo "              and add it to your backend/.env file as STRIPE_WEBHOOK_SECRET"
echo ""
echo "---"
echo ""

# Start stripe listen
stripe listen --forward-to localhost:$BACKEND_PORT/api/stripe/webhook

echo ""
echo "Webhook forwarding stopped."
