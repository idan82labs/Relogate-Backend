#!/bin/bash

# Stripe Local Development Setup Script
# =====================================

echo "🔐 Stripe Local Development Setup"
echo "=================================="
echo ""

# Check if stripe CLI is installed
if ! command -v stripe &> /dev/null && ! command -v ~/.local/bin/stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Installing..."
    cd /tmp
    curl -sL https://github.com/stripe/stripe-cli/releases/download/v1.21.0/stripe_1.21.0_linux_x86_64.tar.gz -o stripe.tar.gz
    tar -xzf stripe.tar.gz
    mkdir -p ~/.local/bin
    mv stripe ~/.local/bin/
    rm stripe.tar.gz
    export PATH="$HOME/.local/bin:$PATH"
    echo "✅ Stripe CLI installed to ~/.local/bin/stripe"
fi

STRIPE_CMD="stripe"
if command -v ~/.local/bin/stripe &> /dev/null; then
    STRIPE_CMD="$HOME/.local/bin/stripe"
fi

echo ""
echo "📋 Steps to set up Stripe test keys:"
echo ""
echo "1. Go to https://dashboard.stripe.com/test/apikeys"
echo "   (Create a free Stripe account if you don't have one)"
echo ""
echo "2. Copy your test keys:"
echo "   - Publishable key (starts with pk_test_)"
echo "   - Secret key (starts with sk_test_)"
echo ""
echo "3. Run: $STRIPE_CMD login"
echo "   This will open a browser to authenticate"
echo ""
echo "4. After login, run this script again or manually update .env"
echo ""

# Check if already logged in
if $STRIPE_CMD config --list 2>/dev/null | grep -q "test_mode_api_key"; then
    echo "✅ Stripe CLI is already authenticated!"
    echo ""

    # Get the webhook secret
    echo "Starting webhook listener to get webhook secret..."
    echo "Press Ctrl+C after you see the webhook secret"
    echo ""
    $STRIPE_CMD listen --print-secret
else
    echo "⚠️  Please run: $STRIPE_CMD login"
    echo ""
    echo "After logging in, run this script again to get the webhook secret."
fi
