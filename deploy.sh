#!/bin/bash

# Sibyl Oracle Deployment Script
# Usage: ./deploy.sh [devnet|mainnet]

set -e

NETWORK=${1:-devnet}
PROGRAM_NAME="sibyl_oracle"

echo "🔮 Deploying Sibyl Oracle to $NETWORK..."
echo "=".repeat(50)

# Set network
case $NETWORK in
    devnet)
        NETWORK_URL="https://api.devnet.solana.com"
        ;;
    mainnet)
        NETWORK_URL="https://api.mainnet-beta.solana.com"
        ;;
    *)
        echo "❌ Unknown network: $NETWORK"
        echo "Usage: $0 [devnet|mainnet]"
        exit 1
        ;;
esac

echo "🌐 Network: $NETWORK ($NETWORK_URL)"

# Check prerequisites
echo "🔍 Checking prerequisites..."
command -v solana >/dev/null 2>&1 || { echo "❌ solana CLI not found"; exit 1; }
command -v anchor >/dev/null 2>&1 || { echo "❌ anchor CLI not found"; exit 1; }

# Set network
echo "📡 Setting Solana network to $NETWORK..."
solana config set --url $NETWORK_URL

# Check wallet
echo "👛 Checking wallet..."
WALLET_ADDRESS=$(solana address)
if [ -z "$WALLET_ADDRESS" ]; then
    echo "❌ No wallet configured"
    echo "Run: solana-keygen new"
    exit 1
fi
echo "   Wallet: $WALLET_ADDRESS"

# Check balance
echo "💰 Checking balance..."
BALANCE=$(solana balance)
echo "   Balance: $BALANCE"

if [[ $BALANCE == "0 SOL" ]]; then
    if [[ $NETWORK == "devnet" ]]; then
        echo "💸 Requesting airdrop..."
        solana airdrop 2
    else
        echo "❌ Insufficient balance for mainnet deployment"
        exit 1
    fi
fi

# Build program
echo "🔨 Building program..."
anchor build

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/${PROGRAM_NAME}.so)
echo "📦 Program ID: $PROGRAM_ID"

# Update Anchor.toml with program ID
echo "📝 Updating Anchor.toml..."
sed -i.bak "s/^sibyl_oracle = \".*\"/sibyl_oracle = \"$PROGRAM_ID\"/" Anchor.toml

# Deploy
echo "🚀 Deploying program..."
anchor deploy

echo ""
echo "🎉 Deployment complete!"
echo "=".repeat(50)
echo "Program ID: $PROGRAM_ID"
echo "Network: $NETWORK"
echo "Wallet: $WALLET_ADDRESS"
echo ""
echo "Next steps:"
echo "1. Update .env with your SOLANA_PRIVATE_KEY"
echo "2. Run: node agent/init.js"
echo "3. Run: node agent/index.js"
echo ""
echo "🔮 Happy predicting!"