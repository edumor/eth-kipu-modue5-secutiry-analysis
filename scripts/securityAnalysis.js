const { ethers } = require("hardhat");

/**
 * @title Security Analysis Script
 * @author Eduardo J. Moreno  
 * @notice Analyzes the Grader5 contract for security vulnerabilities
 * @dev Provides comprehensive vulnerability assessment and attack vectors
 */

// Target contract details
const GRADER5_ADDRESS = "0x5733eE985e22eFF46F595376d79e31413b1A1e16";
const GRADER5_ABI = [
    "function retrieve() external payable",
    "function gradeMe(string calldata name) external", 
    "function counter(address) external view returns (uint256)",
    "function students(string calldata name) external view returns (uint256)",
    "function isGraded(address) external view returns (bool)",
    "function studentCounter() external view returns (uint256)",
    "function divisor() external view returns (uint256)",
    "function deadline() external view returns (uint256)",
    "function startTime() external view returns (uint256)",
    "function owner() external view returns (address)"
];

async function analyzeTarget() {
    console.log("🔍 GRADER5 CONTRACT SECURITY ANALYSIS");
    console.log("=" .repeat(60));
    console.log(`Target: ${GRADER5_ADDRESS} (Sepolia)`);
    
    // Connect to target contract
    const grader5 = new ethers.Contract(GRADER5_ADDRESS, GRADER5_ABI, ethers.provider);
    
    try {
        // Read contract state
        console.log("\n📊 CONTRACT STATE ANALYSIS");
        console.log("-" .repeat(40));
        
        const studentCounter = await grader5.studentCounter();
        const divisor = await grader5.divisor();
        const deadline = await grader5.deadline();
        const startTime = await grader5.startTime();
        
        console.log(`Student Counter: ${studentCounter}`);
        console.log(`Divisor: ${divisor}`);
        console.log(`Deadline: ${deadline}`);
        console.log(`Start Time: ${startTime}`);
        
        const currentTime = Math.floor(Date.now() / 1000);
        console.log(`Current Time: ${currentTime}`);
        console.log(`Time Until Deadline: ${deadline - currentTime} seconds`);
        
        // Calculate current grade for next student
        const currentGrade = calculateGrade(studentCounter, divisor);
        console.log(`Next Student Grade: ${currentGrade} points`);
        
        // Contract balance
        const balance = await ethers.provider.getBalance(GRADER5_ADDRESS);
        console.log(`Contract Balance: ${ethers.formatEther(balance)} ETH`);
        
    } catch (error) {
        console.log(`❌ Error reading contract state: ${error.message}`);
    }
    
    // Security vulnerability analysis
    console.log("\n🚨 VULNERABILITY ANALYSIS");
    console.log("-" .repeat(40));
    
    console.log("1. REENTRANCY VULNERABILITY - CRITICAL");
    console.log("   Location: retrieve() function");
    console.log("   Issue: External call before state finalization");
    console.log("   Impact: Counter manipulation possible");
    console.log("   Code Pattern:");
    console.log("   ```");
    console.log("   counter[msg.sender]++;");
    console.log("   (bool sent, ) = payable(msg.sender).call{value: 1, gas: gasleft()}(\"\");");
    console.log("   if(counter[msg.sender]<2) { counter[msg.sender]=0; }");
    console.log("   ```");
    
    console.log("\n2. STATE MANIPULATION - HIGH");
    console.log("   Location: Counter reset logic in retrieve()");
    console.log("   Issue: Exploitable state transitions");
    console.log("   Impact: Can achieve counter > 1 for gradeMe access");
    
    console.log("\n3. ACCESS CONTROL BYPASS - MEDIUM");
    console.log("   Location: gradeMe() function requirements");
    console.log("   Issue: Only counter check, no additional validation");
    console.log("   Impact: Any address can register if counter requirement met");
    
    console.log("\n4. TIMESTAMP DEPENDENCY - LOW");
    console.log("   Location: deadline and startTime checks");
    console.log("   Issue: Relies on block.timestamp");
    console.log("   Impact: Minor manipulation possible by miners");
    
    console.log("\n⚡ ATTACK STRATEGIES");
    console.log("-" .repeat(40));
    
    console.log("STRATEGY 1: Reentrancy Attack");
    console.log("  1. Deploy attack contract with receive() function");
    console.log("  2. Call retrieve() with >3 wei");  
    console.log("  3. In receive callback, call retrieve() again");
    console.log("  4. Manipulate counter through recursive calls");
    console.log("  5. Call gradeMe() when counter > 1");
    
    console.log("\nSTRATEGY 2: Sequential Calls");
    console.log("  1. Multiple sequential retrieve() calls");
    console.log("  2. Monitor counter state between calls");
    console.log("  3. Exploit counter reset logic");
    console.log("  4. Register when requirements satisfied");
    
    console.log("\n🛡️ MITIGATION RECOMMENDATIONS");
    console.log("-" .repeat(40));
    console.log("1. Implement ReentrancyGuard modifier");
    console.log("2. Follow Checks-Effects-Interactions pattern");
    console.log("3. Use pull payment pattern instead of push");
    console.log("4. Add additional access controls");
    console.log("5. Implement rate limiting");
    console.log("6. Use commit-reveal for sensitive operations");
}

function calculateGrade(studentCounter, divisor) {
    const grade = Number(studentCounter) / Number(divisor);
    if (grade <= 6) {
        return 100 - grade * 5;
    } else {
        return 70;
    }
}

async function checkStudentStatus(studentName) {
    console.log(`\n👤 CHECKING STUDENT STATUS: "${studentName}"`);
    console.log("-" .repeat(40));
    
    const grader5 = new ethers.Contract(GRADER5_ADDRESS, GRADER5_ABI, ethers.provider);
    
    try {
        const grade = await grader5.students(studentName);
        if (grade > 0) {
            console.log(`✅ Student "${studentName}" is registered with grade: ${grade}`);
            return true;
        } else {
            console.log(`❌ Student "${studentName}" is NOT registered yet`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error checking student: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log("🎓 ETH-KIPU MODULE 5 - SECURITY ANALYSIS");
    console.log("Eduardo J. Moreno - Smart Contract Security Assessment");
    console.log("=" .repeat(70));
    
    // Analyze target contract
    await analyzeTarget();
    
    // Check specific student status
    await checkStudentStatus("Eduardo J. Moreno");
    
    console.log("\n📋 ANALYSIS SUMMARY");
    console.log("=" .repeat(60));
    console.log("✅ Target contract analyzed for vulnerabilities");
    console.log("✅ Reentrancy vulnerability identified as primary attack vector");
    console.log("✅ Attack strategies documented");
    console.log("✅ Mitigation recommendations provided");
    
    console.log("\n🎯 NEXT STEPS:");
    console.log("1. Deploy EduardoMoreno_Attacker contract");
    console.log("2. Execute reentrancy attack");
    console.log("3. Register student name");
    console.log("4. Verify successful registration");
    
    console.log(`\n🌐 View target contract: https://sepolia.etherscan.io/address/${GRADER5_ADDRESS}`);
}

if (require.main === module) {
    main()
        .then(() => {
            console.log("\n🔚 Analysis completed successfully");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 Analysis failed:", error);
            process.exit(1);
        });
}

module.exports = {
    analyzeTarget,
    checkStudentStatus,
    calculateGrade
};
