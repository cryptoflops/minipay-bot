// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title AgentActionLog
 * @notice On-chain audit trail for MiniPayBot agent actions on Celo.
 * @dev Minimal contract that logs agent actions as events for verifiability.
 *      Part of the MiniPayBot submission to Celo Proof-of-Ship.
 */
contract AgentActionLog is Ownable2Step {
    struct Action {
        uint32 agentId;
        uint64 timestamp;
        address user;
        string actionType;
        bytes32 txRef;
    }

    event ActionLogged(
        uint32 indexed agentId,
        address indexed user,
        string actionType,
        bytes32 txRef,
        uint256 timestamp
    );

    /// @notice All logged actions
    Action[] public actions;

    /// @notice Agent ERC-8004 ID
    uint32 public agentId;

    constructor(uint32 _agentId) Ownable(msg.sender) {
        agentId = _agentId;
    }

    /// @notice Log an agent action
    /// @param _user The user who triggered the action
    /// @param _actionType Type of action (e.g., "transfer", "balanceCheck")
    /// @param _txRef Reference to the related transaction hash
    function logAction(
        address _user,
        string calldata _actionType,
        bytes32 _txRef
    ) external onlyOwner {
        require(_user != address(0), "Invalid user");
        
        Action memory action = Action({
            agentId: agentId,
            timestamp: uint64(block.timestamp),
            user: _user,
            actionType: _actionType,
            txRef: _txRef
        });

        actions.push(action);

        emit ActionLogged(
            agentId,
            _user,
            _actionType,
            _txRef,
            block.timestamp
        );
    }

    /// @notice Get total number of logged actions
    function getActionCount() external view returns (uint256) {
        return actions.length;
    }

    /// @notice Update agent ID (if re-registered on ERC-8004)
    function setAgentId(uint32 _agentId) external onlyOwner {
        agentId = _agentId;
    }
}
