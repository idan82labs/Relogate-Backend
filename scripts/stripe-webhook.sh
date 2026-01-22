#!/bin/bash

# Stripe Webhook Listener Script
# ===============================
# Forwards Stripe webhook events to your local server

STRIPE_CMD="stripe"
if command -v ~/.local/bin/stripe &> /dev/null; then
    STRIPE_CMD="$HOME/.local/bin/stripe"
fi

echo "🔗 Starting Stripe Webhook Listener"
echo "==================================="
echo ""
echo "Forwarding events to: http://localhost:3001/api/v1/payments/webhook"
echo ""
echo "The webhook signing secret will be displayed below."
echo "Copy it to your .env file as STRIPE_WEBHOOK_SECRET"
echo ""
echo "Press Ctrl+C to stop"
echo ""

$STRIPE_CMD listen --forward-to localhost:3001/api/v1/payments/webhook
