# ⚡ Quick Start - Sibyl Oracle Solana

Get up and running in 5 minutes!

## 🚀 Ultra-Quick Start

### 1. Setup Environment
```bash
# Clone and enter
cd /home/carlosmora/clawd/projects/solana-hackathon

# Setup wallet from existing config
node scripts/setup-wallet.js

# Install dependencies
npm install
```

### 2. Build and Deploy
```bash
# Build the program
npm run build

# Deploy to devnet
./deploy.sh devnet
```

### 3. Initialize Oracle
```bash
# Initialize on devnet
node agent/init.js
```

### 4. Run Oracle Agent
```bash
# Make predictions!
node agent/index.js
```

## 📋 Step-by-Step Details

### Prerequisites Check
```bash
# Check installations
solana --version
anchor --version
node --version
rustc --version
```

### Wallet Setup (Already Done)
Your wallet is already configured from `~/clawd/scripts/solana_config.py`:
- **Address**: `2svrNAr9u54XfACzMd2rFvcvDVkfvrL1MmedXfMW2sTq`
- **Balance**: ~0.46 SOL on devnet

### DeepSeek API Key
Already configured from `~/.secrets/api_keys.env`:
- **Key**: `sk-5b077f28a1a148989d33cda48e948274`

## 🧪 Test Run

### Run Tests
```bash
npm test
```

### Manual Test
```bash
# Check wallet
solana balance

# Check program
anchor test --skip-build
```

## 🔄 Running Periodically

### Cron Job (Every 6 hours)
```bash
# Add to crontab
0 */6 * * * cd /home/carlosmora/clawd/projects/solana-hackathon && node agent/index.js >> logs/cron.log 2>&1
```

### Manual Run
```bash
# Devnet
node agent/index.js

# Mainnet (when ready)
node agent/index.js --mainnet-beta
```

## 🐛 Troubleshooting

### "Account does not exist"
```bash
# Initialize first
node agent/init.js
```

### "Insufficient balance"
```bash
# Get devnet SOL
solana airdrop 2
```

### Build errors
```bash
# Clean and rebuild
anchor clean
npm run build
```

## 📊 Monitoring

### Check Logs
```bash
tail -f logs/predictions.log
```

### Check On-Chain
```bash
# Get program ID from Anchor.toml
solana program show <PROGRAM_ID>
```

## 🎯 Ready for Hackathon!

Your Sibyl Oracle is now:
- ✅ Program deployed to Solana devnet
- ✅ Wallet configured with 0.46 SOL
- ✅ AI API key configured
- ✅ Agent ready to run
- ✅ Tests passing

**Next**: Run the agent and start making predictions!

```bash
node agent/index.js
```

## 🔗 Useful Links

- **Solana Devnet Explorer**: https://explorer.solana.com/?cluster=devnet
- **Solscan**: https://solscan.io/?cluster=devnet
- **Anchor Docs**: https://www.anchor-lang.com/
- **DeepSeek API**: https://platform.deepseek.com/api-docs