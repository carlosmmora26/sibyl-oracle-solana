#!/usr/bin/env node
/**
 * Sibyl Oracle Agent - Solana Port
 * AI-powered prediction oracle for Solana
 * 
 * Usage: node agent/index.js [--devnet|--mainnet-beta]
 */

require("dotenv").config();
const { PublicKey } = require("@solana/web3.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Config
const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const AGENTWALLET_SOLANA = "3StpwUDjbkpZod2FZkULn3Ce8g5NFz3qnq52MGg89qzt"; // From AgentWallet

// Load wallet - use AgentWallet address as fallback
function loadWallet() {
    // Use AgentWallet address directly
    console.log("👛 Using AgentWallet address");
    return {
        publicKey: new PublicKey(AGENTWALLET_SOLANA),
        isAgentWallet: true
    };
}

async function generatePrediction() {
    if (!DEEPSEEK_API_KEY) {
        console.warn("⚠️  DEEPSEEK_API_KEY not set, using fallback prediction");
        return getFallbackPrediction();
    }

    const prompt = `You are Sibyl, an AI oracle that makes crypto market predictions.

Generate ONE specific, verifiable prediction about crypto markets for the next 24-72 hours.

Format your response EXACTLY like this:
PREDICTION: [your prediction statement]
CONFIDENCE: [number 50-90]
HOURS: [24, 48, or 72]

Example:
PREDICTION: SOL will break above $200 before dropping back to $190
CONFIDENCE: 68
HOURS: 48

Make your prediction specific enough to verify. Focus on BTC, ETH, SOL, or major tokens.`;

    try {
        const response = await axios.post("https://api.deepseek.com/v1/chat/completions", {
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.7
        }, {
            headers: {
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const text = response.data.choices[0].message.content;
        
        // Parse response
        const predMatch = text.match(/PREDICTION:\s*(.+)/i);
        const confMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
        const hoursMatch = text.match(/HOURS:\s*(\d+)/i);

        if (!predMatch || !confMatch || !hoursMatch) {
            console.warn("Failed to parse AI response, using fallback");
            return getFallbackPrediction();
        }

        return {
            statement: predMatch[1].trim(),
            confidence: parseInt(confMatch[1]),
            hours: parseInt(hoursMatch[1])
        };
    } catch (error) {
        console.error("AI generation failed:", error.message);
        return getFallbackPrediction();
    }
}

function getFallbackPrediction() {
    const predictions = [
        {
            statement: "SOL will test key resistance at $200 in the next 24h | Sibyl Oracle",
            confidence: 65,
            hours: 24
        },
        {
            statement: "BTC will consolidate between $95k-$100k before next move | Sibyl Oracle",
            confidence: 70,
            hours: 48
        },
        {
            statement: "ETH/BTC ratio will increase by 2% in the next 72h | Sibyl Oracle",
            confidence: 60,
            hours: 72
        }
    ];
    return predictions[Math.floor(Math.random() * predictions.length)];
}

async function postToTwitter(txHash, prediction) {
    console.log("🐦 Preparing X/Twitter post...");
    
    const tweet = `🔮 Sibyl Oracle Prediction #${prediction.id}\n\n"${prediction.statement}"\n\nConfidence: ${prediction.confidence}%\nDeadline: ${prediction.hours}h\n\nStatus: Local test (on-chain pending)\n\n#Solana #AI #Oracle #ColosseumHackathon #SibylOracle`;
    
    console.log("Tweet content (ready for manual posting):");
    console.log("=".repeat(50));
    console.log(tweet);
    console.log("=".repeat(50));
    
    // Save tweet to file for manual posting
    const tweetDir = path.join(__dirname, "..", "logs", "tweets");
    if (!fs.existsSync(tweetDir)) {
        fs.mkdirSync(tweetDir, { recursive: true });
    }
    
    const tweetFile = path.join(tweetDir, `prediction_${prediction.id}_${Date.now()}.txt`);
    fs.writeFileSync(tweetFile, tweet);
    
    console.log(`📝 Tweet saved to: ${tweetFile}`);
    console.log("   Manual posting required via @VisibleMonk account");
    
    return tweet;
}

async function main() {
    console.log("🔮 Sibyl Oracle Agent - Solana Port");
    console.log("📅 " + new Date().toISOString());
    console.log("=".repeat(50) + "\n");

    // Load wallet
    const wallet = loadWallet();
    console.log(`👛 Wallet: ${wallet.publicKey.toString()}`);
    if (wallet.isAgentWallet) {
        console.log("   ⚠️  Using AgentWallet address (read-only mode)");
    }

    console.log("📊 Generating prediction...");
    const prediction = await generatePrediction();
    console.log(`Prediction: ${prediction.statement}`);
    console.log(`Confidence: ${prediction.confidence}%`);
    console.log(`Deadline: ${prediction.hours}h\n`);

    console.log("📝 Logging prediction locally (on-chain deployment pending)...");
    
    try {
        // Generate a mock transaction hash for logging
        const mockTxHash = Array.from({length: 64}, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        // Read existing predictions to get next ID
        const logDir = path.join(__dirname, "..", "logs");
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, "predictions.log");
        let predictionCount = 0;
        
        if (fs.existsSync(logFile)) {
            const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
            if (lines.length > 0 && lines[0]) {
                const lastLine = JSON.parse(lines[lines.length - 1]);
                predictionCount = lastLine.predictionId || 0;
            }
        }
        
        const predictionId = predictionCount + 1;

        // Log to file
        const logEntry = {
            timestamp: new Date().toISOString(),
            predictionId: predictionId,
            statement: prediction.statement,
            confidence: prediction.confidence,
            hours: prediction.hours,
            txHash: mockTxHash,
            wallet: wallet.publicKey.toString(),
            status: "logged_locally",
            note: "On-chain deployment pending - program build issue with cargo-build-sbf Bus error"
        };
        
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");

        console.log(`✅ Prediction logged locally`);
        console.log(`   Prediction ID: ${predictionId}`);
        console.log(`   Status: Logged to ${logFile}`);
        console.log(`   Note: On-chain deployment pending (build issue)\n`);

        // Prepare Twitter post (mock)
        const tweet = await postToTwitter(mockTxHash, {
            id: predictionId,
            ...prediction
        });
        
        console.log("\n✅ Sibyl Oracle run complete!");
        console.log("⚠️  Note: Running in local mode due to build issues");
        console.log("   To deploy on-chain, need to fix cargo-build-sbf Bus error");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: node agent/index.js [options]

Options:
  --devnet        Use Solana devnet (default)
  --mainnet-beta  Use Solana mainnet-beta
  --help, -h      Show this help

Environment variables:
  SOLANA_RPC      Custom RPC endpoint
  SOLANA_PRIVATE_KEY  Wallet private key (base58 encoded)
  DEEPSEEK_API_KEY    DeepSeek API key for AI predictions
    `);
    process.exit(0);
}

if (args.includes("--mainnet-beta")) {
    process.env.SOLANA_RPC = "https://api.mainnet-beta.solana.com";
    console.log("🌐 Using Solana mainnet-beta");
} else {
    console.log("🌐 Using Solana devnet");
}

main().catch(console.error);