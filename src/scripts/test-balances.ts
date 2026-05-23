import { getBalances } from "../agent/celo-client";
import { type Address } from "viem";

async function main() {
  const address = "0x207d064161cD85351Be21ecA570807eD8bCEe0AD" as Address;
  const balances = await getBalances(address);
  console.log("BALANCES:", balances);
}

main().catch(console.error);
