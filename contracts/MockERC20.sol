// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title MockERC20 - ERC20 Token for Testing Reentrancy Attacks
 * @author Eduardo J. Moreno
 * @notice Mock ERC20 token contract for testing complex reentrancy scenarios
 * @dev This contract helps us analyze potential multi-contract reentrancy attacks
 * 
 * ANALYSIS PURPOSE:
 * This MockERC20 helps us test:
 * 1. Cross-contract reentrancy attacks
 * 2. Token interaction vulnerabilities
 * 3. Complex state manipulation scenarios  
 * 4. Multi-step attack vectors
 * 5. Gas optimization for attacks involving tokens
 */
contract MockERC20 {
    
    /// @notice Token metadata
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    /// @notice Balance tracking
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /// @notice Owner for administrative functions
    address public owner;

    /// @notice Callback tracking for reentrancy testing
    bool private _inCallback;
    uint256 public callbackCount;

    /**
     * @notice Events following ERC20 standard
     */
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event CallbackExecuted(address indexed caller, uint256 count);

    /**
     * @notice Custom errors
     */
    error InsufficientBalance();
    error InsufficientAllowance(); 
    error TransferFailed();
    error CallbackLoop();

    /**
     * @notice Contract constructor
     * @param _initialSupply Initial token supply
     * @dev Mints initial supply to deployer
     */
    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    /**
     * @notice Transfer tokens from sender to recipient
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success Whether transfer succeeded
     * @dev Standard ERC20 transfer with reentrancy hooks
     */
    function transfer(address to, uint256 amount) public returns (bool success) {
        return _transfer(msg.sender, to, amount);
    }

    /**
     * @notice Transfer tokens from one address to another using allowance
     * @param from Sender address
     * @param to Recipient address  
     * @param amount Amount to transfer
     * @return success Whether transfer succeeded
     */
    function transferFrom(address from, address to, uint256 amount) public returns (bool success) {
        if (allowance[from][msg.sender] < amount) revert InsufficientAllowance();
        
        allowance[from][msg.sender] -= amount;
        return _transfer(from, to, amount);
    }

    /**
     * @notice Approve spender to use tokens
     * @param spender Address to approve
     * @param amount Amount to approve
     * @return success Whether approval succeeded
     */
    function approve(address spender, uint256 amount) public returns (bool success) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
     * @notice Internal transfer function with callback hooks
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success Whether transfer succeeded
     * @dev Contains callback that can be exploited for reentrancy testing
     */
    function _transfer(address from, address to, uint256 amount) internal returns (bool success) {
        if (balanceOf[from] < amount) revert InsufficientBalance();

        // VULNERABLE PATTERN: External call before state finalization
        // This mirrors the vulnerability pattern in Grader5.retrieve()
        if (to.code.length > 0 && !_inCallback) {
            _inCallback = true;
            callbackCount++;
            
            // Call recipient's callback function (if it's a contract)
            // This simulates how Grader5 calls back to our attacker contract
            try this.notifyTransfer(from, to, amount) {
                // Callback succeeded
                emit CallbackExecuted(to, callbackCount);
            } catch {
                // Callback failed, continue with transfer
            }
            
            _inCallback = false;
        }

        // State changes after external interaction (VULNERABLE!)
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Callback function that can trigger reentrancy
     * @param from Original sender
     * @param to Recipient that triggered callback
     * @param amount Amount being transferred
     * @dev This function can be called during transfer to test reentrancy
     */
    function notifyTransfer(address from, address to, uint256 amount) external {
        if (msg.sender != address(this)) return;
        
        // This is where an attacker contract could perform reentrancy
        // Similar to how our Grader5Attacker uses receive() function
        
        if (callbackCount > 3) revert CallbackLoop();
        
        // Potential reentrancy point - contract calls back to itself
        if (to.code.length > 0) {
            (bool success,) = to.call(
                abi.encodeWithSignature("onTokenReceived(address,address,uint256)", from, to, amount)
            );
            // Ignore call result to prevent reverting main transfer
        }
    }

    /**
     * @notice Mint new tokens (owner only)
     * @param to Recipient address
     * @param amount Amount to mint
     * @dev For testing purposes - allows creating tokens for attack scenarios
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner, "Only owner can mint");
        
        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Transfer(address(0), to, amount);
    }

    /**
     * @notice Burn tokens from sender
     * @param amount Amount to burn
     * @dev For testing token burning scenarios
     */
    function burn(uint256 amount) external {
        if (balanceOf[msg.sender] < amount) revert InsufficientBalance();
        
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        
        emit Transfer(msg.sender, address(0), amount);
    }

    /**
     * @notice Emergency function to demonstrate direct state manipulation
     * @param target Address to manipulate
     * @param newBalance New balance to set
     * @dev DANGEROUS: Direct balance manipulation - for educational purposes only!
     */
    function emergencySetBalance(address target, uint256 newBalance) external {
        require(msg.sender == owner, "Only owner");
        
        uint256 oldBalance = balanceOf[target];
        balanceOf[target] = newBalance;
        
        if (newBalance > oldBalance) {
            totalSupply += (newBalance - oldBalance);
            emit Transfer(address(0), target, newBalance - oldBalance);
        } else if (newBalance < oldBalance) {
            totalSupply -= (oldBalance - newBalance);  
            emit Transfer(target, address(0), oldBalance - newBalance);
        }
    }

    /**
     * @notice Get callback status for debugging
     * @return inCallback Whether currently in callback
     * @return count Total callback count
     */
    function getCallbackStatus() external view returns (bool inCallback, uint256 count) {
        return (_inCallback, callbackCount);
    }

    /**
     * @notice Reset callback counter (owner only)
     * @dev For testing multiple attack scenarios
     */
    function resetCallbackCount() external {
        require(msg.sender == owner, "Only owner");
        callbackCount = 0;
    }

    /**
     * @notice Batch transfer for gas optimization testing
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to transfer
     * @dev Tests gas costs in multi-transfer scenarios
     */
    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external {
        require(recipients.length == amounts.length, "Array length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
    }
}
