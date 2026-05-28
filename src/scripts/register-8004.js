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

// Minimal ABI for ERC-8004 registration
const REGISTRY_ABI = [
  'function register(string uri) external returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider('https://forno.celo.org');
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Registering agent with ERC-8004 using wallet:", wallet.address);

  const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);

  // Define the metadata URL
  const agentURI = "https://minipay-bot.vercel.app/.well-known/agent.json";

  console.log("Sending transaction to register with URI:", agentURI);
  const tx = await contract.register(agentURI);
  console.log("Transaction sent! Hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("Transaction confirmed!");

  // Find the Transfer event to get the tokenId (Agent ID)
  let agentId = null;
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog(log);
      if (parsedLog && parsedLog.name === 'Transfer') {
        agentId = parsedLog.args.tokenId.toString();
        break;
      }
    } catch (e) {
      // Not a Transfer event from this contract
    }
  }

  if (agentId) {
    console.log("ERC-8004 Agent registered! Agent ID:", agentId);
    console.log(`Your profile link: https://8004.org/agents/${agentId}`);
  } else {
    console.log("ERC-8004 Agent registered! (Could not parse Agent ID from Transfer event)");
  }
}

main().catch((err) => {
  console.error("Failed to register with ERC-8004:", err);
});
