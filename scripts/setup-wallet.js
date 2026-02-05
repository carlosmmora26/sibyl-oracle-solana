#!/usr/bin/env node
/**
 * Setup wallet for Sibyl Oracle
 * Converts private key from solana_config.py to .env format
 */

const fs = require('fs');
const path = require('path');
const bs58 = require('bs58');

// Read the existing Solana config
const configPath = path.join(__dirname, '..', '..', '..', 'scripts', 'solana_config.py');
const envExamplePath = path.join(__dirname, '..', '.env.example');
const envPath = path.join(__dirname, '..', '.env');

try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Extract private key and address
    const privateKeyMatch = configContent.match(/PHANTOM_PRIVATE_KEY\s*=\s*"([^"]+)"/);
    const addressMatch = configContent.match(/WALLET_ADDRESS\s*=\s*"([^"]+)"/);
    
    if (!privateKeyMatch || !addressMatch) {
        console.error('❌ Could not extract private key or address from solana_config.py');
        process.exit(1);
    }
    
    const privateKey = privateKeyMatch[1];
    const walletAddress = addressMatch[1];
    
    console.log('🔑 Found wallet configuration:');
    console.log(`   Address: ${walletAddress}`);
    console.log(`   Private Key: ${privateKey.substring(0, 10)}...`);
    
    // Read .env.example
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    
    // Replace placeholders
    let envContent = envExample
        .replace('your_base58_encoded_private_key_here', privateKey)
        .replace('sk-your-deepseek-api-key-here', process.env.DEEPSEEK_API_KEY || 'sk-your-deepseek-api-key-here');
    
    // Write .env
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Created .env file with wallet configuration');
    console.log(`📁 Location: ${envPath}`);
    
    // Show important notes
    console.log('\n📝 Important:');
    console.log('1. The .env file contains your private key - KEEP IT SECURE!');
    console.log('2. Never commit .env to version control');
    console.log('3. Add .env to .gitignore if not already');
    console.log(`4. Wallet has ${walletAddress} on devnet`);
    
    // Check if we should add to .gitignore
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignore.includes('.env')) {
            console.log('\n⚠️  Warning: .env not in .gitignore');
            console.log('   Consider adding ".env" to .gitignore');
        }
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}