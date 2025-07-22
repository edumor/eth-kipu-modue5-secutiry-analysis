// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title Ownable - Access Control Contract
 * @author Eduardo J. Moreno
 * @notice Simplified version of OpenZeppelin's Ownable for analysis purposes
 * @dev This contract demonstrates the access control pattern used in Grader5
 * 
 * ANALYSIS PURPOSE:
 * Understanding the Ownable pattern helps us verify:
 * 1. Which functions are admin-only in Grader5
 * 2. Whether there are privilege escalation vulnerabilities
 * 3. If ownership transfer mechanisms are secure
 * 4. Access control bypass possibilities
 */
abstract contract Ownable {
    
    /// @notice Current owner of the contract
    address private _owner;

    /**
     * @notice Events for ownership tracking
     */
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @notice Custom errors for gas efficiency
     */
    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);

    /**
     * @notice Contract constructor
     * @param initialOwner Address of the initial owner
     * @dev Sets the initial owner, cannot be zero address
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @notice Modifier to restrict access to owner only
     * @dev Throws if called by any account other than the owner
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @notice Returns the address of the current owner
     * @return Current owner address
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @notice Throws if the sender is not the owner
     * @dev Internal function to check ownership
     */
    function _checkOwner() internal view virtual {
        if (owner() != msg.sender) {
            revert OwnableUnauthorizedAccount(msg.sender);
        }
    }

    /**
     * @notice Leaves the contract without owner
     * @dev Can only be called by the current owner
     * WARNING: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @notice Transfers ownership of the contract to a new account
     * @param newOwner Address of the new owner
     * @dev Can only be called by the current owner
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @notice Transfers ownership of the contract to a new account
     * @param newOwner Address of the new owner
     * @dev Internal function without access restriction
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Get message sender in current execution context
     * @return Address of the message sender
     * @dev Provides information about the current execution context
     */
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    /**
     * @notice Get message data in current execution context  
     * @return Message data
     * @dev Provides information about the current execution context
     */
    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}
