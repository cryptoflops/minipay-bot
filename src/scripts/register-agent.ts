import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { ethers } from "ethers";
import {
  computeRegistrationChallengeHash,
  signRegistrationChallenge,
  buildWalletFreeRegisterUserDataAscii,
  REGISTRY_ABI,
  NETWORKS
} from "@selfxyz/agent-sdk";

dotenv.config();

function randomIdHex(bytesCount = 16): string {
  const bytes = new Uint8Array(bytesCount);
  for (let i = 0; i < bytesCount; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function run() {
  console.log("Checking agent credentials");
  
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("AGENT_PRIVATE_KEY environment variable is missing");
  }

  const wallet = new ethers.Wallet(privateKey);
  const agentAddress = wallet.address;
  console.log("Agent Address derived from private key is", agentAddress);

  const networkName = "mainnet";
  const network = NETWORKS[networkName];
  const registryAddress = network.registryAddress;
  const rpcUrl = network.rpcUrl;
  const chainId = 42220;

  console.log("Connecting to Celo mainnet RPC");
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, provider);

  const agentPubKey = ethers.zeroPadValue(agentAddress, 32);
  const isVerified = await registry.isVerifiedAgent(agentPubKey);
  if (isVerified) {
    const agentId = await registry.getAgentId(agentPubKey);
    console.log("Agent is already registered on-chain");
    console.log("Agent ID is", agentId.toString());
    return;
  }

  console.log("Agent is not registered on-chain yet");
  console.log("Querying registration nonce from contract");
  const nonce = await registry.agentNonces(agentAddress);
  console.log("On-chain nonce is", nonce.toString());

  console.log("Generating registration challenge and signature");
  const signed = await signRegistrationChallenge(privateKey, {
    humanIdentifier: agentAddress,
    chainId,
    registryAddress,
    nonce: nonce.toString()
  });

  const disclosures = {
    minimumAge: 0 as const,
    ofac: false
  };

  const userDefinedData = buildWalletFreeRegisterUserDataAscii({
    agentAddress,
    signature: { r: signed.r, s: signed.s, v: signed.v },
    disclosures
  });

  const sessionId = randomIdHex(16);
  const stateToken = randomIdHex(24);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const listenPort = Math.floor(Math.random() * 10000) + 30000;

  const session = {
    version: 1,
    operation: "register",
    sessionId,
    createdAt,
    expiresAt,
    mode: "wallet-free",
    disclosures,
    network: {
      chainId,
      registryAddress,
      rpcUrl,
      endpointType: "celo",
      appUrl: "https://self-agent-id.vercel.app",
      appName: "Self Agent ID",
      scope: "self-agent-id"
    },
    registration: {
      humanIdentifier: agentAddress,
      agentAddress,
      userDefinedData,
      challengeHash: signed.messageHash,
      signature: {
        r: signed.r,
        s: signed.s,
        v: signed.v
      }
    },
    callback: {
      listenHost: "127.0.0.1",
      listenPort,
      path: "/callback",
      stateToken,
      used: false
    },
    state: {
      stage: "initialized",
      updatedAt: createdAt
    },
    secrets: {
      agentPrivateKey: privateKey
    }
  };

  const sessionDir = path.join(process.cwd(), ".self");
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const sessionPath = path.join(sessionDir, "session.json");
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), { mode: 0o600 });
  console.log("Written session to", sessionPath);

  const handoffPayload = {
    version: 1,
    operation: "register",
    sessionId,
    stateToken,
    callbackUrl: `http://127.0.0.1:${listenPort}/callback`,
    mode: "wallet-free",
    chainId,
    registryAddress,
    endpointType: "celo",
    appName: "Self Agent ID",
    scope: "self-agent-id",
    humanIdentifier: agentAddress,
    expectedAgentAddress: agentAddress,
    disclosures,
    userDefinedData,
    expiresAt: new Date(expiresAt).getTime()
  };

  const payloadString = JSON.stringify(handoffPayload);
  const base64UrlPayload = Buffer.from(payloadString, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const appUrl = "https://self-agent-id.vercel.app";
  const handoffUrl = `${appUrl}/cli/register?payload=${base64UrlPayload}`;

  console.log("\nSession setup complete");
  console.log("Handoff URL is", handoffUrl);
  console.log("\nTo wait for verification, run this command in a terminal");
  console.log(`npx self-agent register wait --session .self/session.json`);
}

run().catch((err) => {
  console.error("Error occurred", err);
  process.exit(1);
});
