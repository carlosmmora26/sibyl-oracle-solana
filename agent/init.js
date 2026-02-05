#!/usr/bin/env node
/**
 * Initialize Sibyl Oracle on Solana
 */

require("dotenv").config();
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const { Program, AnchorProvider, BN } = require("@coral-xyz/anchor");
const bs58 = require("bs58");
const path = require("path");

// Load IDL
const idl = require("../target/idl/sibyl_oracle.json");

// Config
const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";
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

async function main() {
    console.log("🔮 Initializing Sibyl Oracle on Solana");
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

    console.log(`📦 Oracle PDA: ${oraclePda.toString()}`);

    try {
        // Check if already initialized
        const oracleAccount = await program.account.oracle.fetchNullable(oraclePda);
        
        if (oracleAccount) {
            console.log("✅ Oracle already initialized");
            console.log(`   Authority: ${oracleAccount.authority.toString()}`);
            console.log(`   Prediction Count: ${oracleAccount.predictionCount.toString()}`);
            console.log(`   Correct Predictions: ${oracleAccount.correctPredictions.toString()}`);
            return;
        }

        console.log("🚀 Initializing oracle...");
        
        // Initialize oracle
        const tx = await program.methods
            .initialize()
            .accounts({
                oracle: oraclePda,
                authority: wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        console.log(`✅ Initialization TX: ${tx}`);
        console.log(`   https://solscan.io/tx/${tx}?cluster=devnet\n`);

        // Verify initialization
        const newOracleAccount = await program.account.oracle.fetch(oraclePda);
        console.log("🎉 Oracle successfully initialized!");
        console.log(`   Authority: ${newOracleAccount.authority.toString()}`);
        console.log(`   Prediction Count: ${newOracleAccount.predictionCount.toString()}`);
        console.log(`   Correct Predictions: ${newOracleAccount.correctPredictions.toString()}`);

    } catch (error) {
        console.error("❌ Initialization failed:", error.message);
        process.exit(1);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes("--mainnet-beta")) {
    process.env.SOLANA_RPC = "https://api.mainnet-beta.solana.com";
    console.log("🌐 Using Solana mainnet-beta");
} else {
    console.log("🌐 Using Solana devnet");
}

const fs = require("fs");
main().catch(console.error);