// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AgentActionLog.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("AGENT_PRIVATE_KEY");
        // We assume agentId = 1 for now if we haven't registered on ERC-8004 yet.
        // It can be updated via setAgentId later
        uint32 agentId = 1;

        vm.startBroadcast(deployerPrivateKey);

        AgentActionLog actionLog = new AgentActionLog(agentId);
        
        console.log("AgentActionLog deployed at:", address(actionLog));

        vm.stopBroadcast();
    }
}
