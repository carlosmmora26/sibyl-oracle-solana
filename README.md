# 🔮 Sibyl Oracle - Solana Port

**AI-powered prediction oracle for the Colosseum Agent Hackathon**

[![Solana](https://img.shields.io/badge/Solana-000000?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-blue?style=for-the-badge)](https://www.anchor-lang.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

## 🎯 Overview

Sibyl Oracle is an AI-powered prediction oracle that records verifiable market predictions on-chain. Originally built for Monad (EVM), this port brings the oracle to Solana for the **Colosseum Agent Hackathon** ($100K prizes).

The oracle uses DeepSeek AI to generate specific, time-bound predictions about crypto markets, records them on Solana, and posts verification links to X/Twitter.

## ✨ Features

- **🤖 AI-Powered Predictions**: Uses DeepSeek API to generate market predictions
- **⛓️ On-Chain Verification**: All predictions stored immutably on Solana
- **🔐 Authority-Controlled**: Only authorized agent can write predictions
- **📊 Accuracy Tracking**: Tracks prediction accuracy over time
- **🐦 Social Integration**: Auto-posts predictions to X/Twitter with transaction links
- **🧪 Test Coverage**: Comprehensive Anchor tests for all program functions

## 🏗️ Architecture

### Smart Contract (Anchor Program)
- **Program ID**: `Siby1Oracle111111111111111111111111111111111`
- **Storage**: PDA-based accounts for oracle state and predictions
- **Features**:
  - Create predictions with statements, confidence scores, and deadlines
  - Resolve predictions after deadline passes
  - Track accuracy metrics
  - Transfer authority to new addresses

### Oracle Agent
- **Node.js script** that runs periodically
- **AI Integration**: Calls DeepSeek API for prediction generation
- **Solana Integration**: Uses @solana/web3.js and Anchor
- **Social Media**: Posts predictions to X/Twitter

## 📁 Project Structure

```
sibyl-oracle-solana/
├── programs/
│   └── sibyl-oracle/
│       └── src/
│           └── lib.rs          # Anchor program
├── agent/
│   ├── index.js               # Main oracle agent
│   └── init.js                # Initialization script
├── tests/
│   └── sibyl-oracle.test.ts   # Anchor tests
├── Anchor.toml                # Anchor configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Solana CLI 1.18+
- Anchor CLI 0.30+

### 1. Clone and Install
```bash
git clone <repository-url>
cd sibyl-oracle-solana
npm install
```

### 2. Environment Setup
Create `.env` file:
```bash
# Solana
SOLANA_RPC=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your_base58_private_key_here

# AI
DEEPSEEK_API_KEY=sk-your-deepseek-key-here

# Optional: Custom RPC
# SOLANA_RPC=https://your-custom-rpc.com
```

### 3. Build and Test
```bash
# Build the program
npm run build

# Run tests
npm test
```

### 4. Deploy to Devnet
```bash
# Build and deploy
anchor build
anchor deploy

# Note: Update program ID in Anchor.toml after deployment
```

### 5. Initialize Oracle
```bash
# Initialize on devnet
node agent/init.js

# Or on mainnet-beta
node agent/init.js --mainnet-beta
```

### 6. Run Oracle Agent
```bash
# Run on devnet (default)
npm run agent

# Or explicitly
node agent/index.js --devnet

# For mainnet
node agent/index.js --mainnet-beta
```

## 🔧 Configuration

### Wallet Setup
The agent supports multiple wallet sources:
1. **Environment variable**: `SOLANA_PRIVATE_KEY` (base58 encoded)
2. **Solana CLI**: `~/.config/solana/id.json`
3. **Custom file**: Set path in code

### RPC Endpoints
- **Devnet**: `https://api.devnet.solana.com` (default)
- **Mainnet**: `https://api.mainnet-beta.solana.com`
- **Custom**: Set `SOLANA_RPC` environment variable

### AI Configuration
- **DeepSeek API**: Required for AI predictions
- **Fallback**: Built-in fallback predictions if API fails
- **Prompt Engineering**: Customizable prediction prompts

## 📊 Program Details

### Accounts
- **Oracle**: Global oracle state (authority, counters)
- **Prediction**: Individual prediction data
  - `id`: Unique prediction identifier
  - `statement`: Prediction text (max 280 chars)
  - `confidence`: 0-100 confidence score
  - `deadline`: Unix timestamp for resolution
  - `resolved`: Whether prediction was resolved
  - `outcome`: True if correct, false if wrong
  - `created_at`: Creation timestamp

### Instructions
1. `initialize()` - Initialize oracle with authority
2. `create_prediction()` - Create new prediction (authority only)
3. `resolve_prediction()` - Resolve prediction after deadline (authority only)
4. `transfer_authority()` - Transfer oracle authority to new address

### Events
- `PredictionCreated`: Emitted when new prediction is created
- `PredictionResolved`: Emitted when prediction is resolved

## 🤖 Agent Operation

The oracle agent performs these steps:

1. **Generate Prediction**: Calls DeepSeek API with market prediction prompt
2. **Parse Response**: Extracts statement, confidence, and deadline
3. **On-Chain Record**: Creates prediction transaction on Solana
4. **Social Post**: Formats and posts prediction to X/Twitter
5. **Logging**: Records all activity to local log file

### Example Prediction
```
🔮 Sibyl Oracle Prediction #42

"SOL will test key resistance at $200 in the next 24h"

Confidence: 65%
Deadline: 24h

TX: https://solscan.io/tx/abc123...?cluster=devnet

#Solana #AI #Oracle #ColosseumHackathon
```

## 🧪 Testing

Run comprehensive tests:
```bash
# Run all tests
npm test

# Test specific functionality
anchor test --skip-build
```

Tests cover:
- ✅ Oracle initialization
- ✅ Prediction creation
- ✅ Validation (confidence, deadline)
- ✅ Authority controls
- ✅ PDA derivations

## 🔒 Security Considerations

1. **Authority Control**: Only authorized wallet can create/resolve predictions
2. **Input Validation**: Confidence (0-100), deadline (>0), statement length
3. **PDA Security**: All accounts use PDAs with proper seeds
4. **Error Handling**: Comprehensive error codes and messages

## 📈 Future Enhancements

1. **Multi-Agent Support**: Allow multiple authorized oracles
2. **Staking Mechanism**: Stake SOL on predictions
3. **Reputation System**: Oracle reputation based on accuracy
4. **Cross-Chain**: Bridge predictions to other chains
5. **UI Dashboard**: Web interface for prediction tracking

## 🏆 Hackathon Submission

This project is submitted to the **Colosseum Agent Hackathon** with:

### ✅ Requirements Met
- [x] **Solana Integration**: Full Anchor program with PDA accounts
- [x] **AI Agent**: DeepSeek-powered prediction generation
- [x] **Social Features**: X/Twitter integration with transaction links
- [x] **Testing**: Comprehensive Anchor test suite
- [x] **Documentation**: Complete setup and usage instructions

### 🎯 Unique Value Proposition
1. **Real Utility**: Actual market predictions with verification
2. **Transparency**: All predictions immutable on-chain
3. **Accuracy Tracking**: Quantifiable performance metrics
4. **Social Engagement**: Community verification via social media

### 🔗 Links
- **GitHub Repository**: [Link to repo]
- **Demo Video**: [Link to demo]
- **Live Agent**: [@VisibleMonk on X/Twitter]
- **Solana Devnet**: [Program address]

## 👥 Team

**Team Sibyl Oracle**
- **Carlos Mora** ([@VisibleMonk](https://x.com/VisibleMonk)) - Lead Developer
- **Sibyl AI** - AI Prediction Engine

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Solana Foundation** for the amazing ecosystem
- **Colosseum** for organizing the hackathon
- **Anchor Team** for the fantastic framework
- **DeepSeek** for AI API access

---

**🔮 Predict the future. Verify on-chain. 🚀**