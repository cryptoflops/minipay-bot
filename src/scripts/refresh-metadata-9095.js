const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Parse .env manually
const envPath = path.join(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let privateKey = '';
for (const line of lines) {
  if (line.startsWith('AGENT_PRIVATE_KEY=')) {
    privateKey = line.split('=')[1].trim();
    break;
  }
}

if (!privateKey) {
  console.error("AGENT_PRIVATE_KEY not found in .env");
  process.exit(1);
}

const REGISTRY_ADDRESS = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

// Minimal ABI for setAgentURI
const REGISTRY_ABI = [
  'function setAgentURI(uint256 agentId, string uri) external'
];

async function main() {
  const provider = new ethers.JsonRpcProvider('https://forno.celo.org');
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Updating URI for Agent #9095 using wallet:", wallet.address);

  const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);
  const metadataURI = "https://minipay-bot.vercel.app/agent-metadata.json";

  console.log("Calling setAgentURI(9095, \"" + metadataURI + "\")...");
  const tx = await contract.setAgentURI(9095, metadataURI);
  console.log("Transaction sent! Hash:", tx.hash);

  await tx.wait();
  console.log("Transaction confirmed on-chain!");
  console.log("This will trigger 8004scan indexer to immediately re-fetch the metadata for Agent #9095.");
}

main().catch((err) => {
  console.error("Failed to update Agent URI:", err);
});
