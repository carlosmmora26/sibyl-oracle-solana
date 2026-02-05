#!/usr/bin/env node
/**
 * Sibyl Oracle Agent - Solana Port
 * AI-powered prediction oracle for Solana
 * 
 * Usage: node agent/index.js [--devnet|--mainnet-beta]
 */

require("dotenv").config();
const { Connection, Keypair, PublicKey, Transaction } = require("@solana/web3.js");
const { Program, AnchorProvider, BN } = require("@coral-xyz/anchor");
const axios = require("axios");
const fs = require("fs");
const bs58 = require("bs58");
const path = require("path");

// Load IDL
const idl = require("../target/idl/sibyl_oracle.json");

// Config
const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const ORACLE_PROGRAM_ID = new PublicKey("Siby1Oracle111111111111111111111111111111111");
const ORACLE_SEED = "oracle";

// Load wallet from private key
function loadWallet() {
    // Try to load from environment variable first
    if (process.env.SOLANA_PRIVATE_KEY) {
        const privateKey = bs58.decode(process.env.SOLANA_PRIVATE_KEY);
        return Keypair.fromSecretKey(privateKey);
    }
    
    // Try to load from file
    try {
        const keypairPath = path.join(process.env.HOME, ".config/solana/id.json");
        if (fs.existsSync(keypairPath)) {
            const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
            return Keypair.fromSecretKey(new Uint8Array(keypairData));
        }
    } catch (error) {
        console.warn("Could not load wallet from file:", error.message);
    }
    
    throw new Error("No wallet found. Set SOLANA_PRIVATE_KEY env var or configure solana CLI");
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
    console.log("🐦 Posting to X/Twitter...");
    
    const tweet = `🔮 Sibyl Oracle Prediction #${prediction.id}\n\n"${prediction.statement}"\n\nConfidence: ${prediction.confidence}%\nDeadline: ${prediction.hours}h\n\nTX: https://solscan.io/tx/${txHash}?cluster=devnet\n\n#Solana #AI #Oracle #ColosseumHackathon`;
    
    console.log("Tweet content:");
    console.log("=".repeat(50));
    console.log(tweet);
    console.log("=".repeat(50));
    
    // In a real implementation, you would use Twitter API
    // For now, we'll just log it
    console.log("📝 Twitter post ready (manual posting required)");
    
    return tweet;
}

async function main() {
    console.log("🔮 Sibyl Oracle Agent - Solana Port");
    console.log("📅 " + new Date().toISOString());
    console.log("=".repeat(50) + "\n");

    // Load wallet
    const wallet = loadWallet();
    console.log(`👛 Wallet: ${wallet.publicKey.toString()}`);

    // Connect to Solana
    const connection = new Connection(SOLANA_RPC, "confirmed");
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });
    
    const program = new Program(idl, ORACLE_PROGRAM_ID, provider);

    // Find oracle PDA
    const [oraclePda] = PublicKey.findProgramAddressSync(
        [Buffer.from(ORACLE_SEED)],
        ORACLE_PROGRAM_ID
    );

    console.log("📊 Generating prediction...");
    const prediction = await generatePrediction();
    console.log(`Prediction: ${prediction.statement}`);
    console.log(`Confidence: ${prediction.confidence}%`);
    console.log(`Deadline: ${prediction.hours}h\n`);

    console.log("⛓️ Recording on Solana...");
    try {
        // Find prediction PDA
        const oracleAccount = await program.account.oracle.fetch(oraclePda);
        const predictionCount = oracleAccount.predictionCount.toNumber();
        
        const [predictionPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("prediction"),
                new BN(predictionCount + 1).toArrayLike(Buffer, "le", 8)
            ],
            ORACLE_PROGRAM_ID
        );

        // Create prediction transaction
        const tx = await program.methods
            .createPrediction(
                prediction.statement,
                prediction.confidence,
                prediction.hours
            )
            .accounts({
                oracle: oraclePda,
                prediction: predictionPda,
                authority: wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        console.log(`✅ TX: ${tx}`);
        console.log(`   Prediction ID: ${predictionCount + 1}`);
        console.log(`   https://solscan.io/tx/${tx}?cluster=devnet\n`);

        // Log to file
        const logEntry = {
            timestamp: new Date().toISOString(),
            predictionId: predictionCount + 1,
            statement: prediction.statement,
            confidence: prediction.confidence,
            hours: prediction.hours,
            txHash: tx,
            wallet: wallet.publicKey.toString()
        };
        
        const logDir = path.join(__dirname, "..", "logs");
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        fs.appendFileSync(
            path.join(logDir, "predictions.log"),
            JSON.stringify(logEntry) + "\n"
        );

        // Prepare Twitter post
        await postToTwitter(tx, {
            id: predictionCount + 1,
            ...prediction
        });
        
        console.log("\n✅ Sibyl Oracle run complete!");
        
    } catch (error) {
        console.error("❌ Transaction failed:", error.message);
        
        // Check if oracle needs initialization
        if (error.message.includes("Account does not exist") || error.message.includes("Account not found")) {
            console.log("\n⚠️  Oracle not initialized. Run initialization first:");
            console.log("   node agent/init.js");
        }
        
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