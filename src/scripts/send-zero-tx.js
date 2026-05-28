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

async function main() {
  const provider = new ethers.JsonRpcProvider('https://forno.celo.org');
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Sending 0 CELO transfer from agent wallet to itself:", wallet.address);
  
  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0
  });
  console.log("Transaction sent! Hash:", tx.hash);
  await tx.wait();
  console.log("Transaction confirmed!");
}

main().catch((err) => {
  console.error("Failed to send zero tx:", err);
});
