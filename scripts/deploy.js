const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * @title Deploy Grader5Attacker Contract
 * @author Eduardo J. Moreno
 * @notice Deployment script for the Grader5 attacker contract
 * @dev This script deploys the contract to Sepolia WITHOUT verification
 */

async function main() {
  console.log("🚀 Starting deployment for Eduardo J. Moreno's ETH-KIPU Module 5 Project");
  console.log("==========================================");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await deployer.provider.getBalance(deployer.address);
  
  console.log("📋 Deployment Information:");
  console.log("- Student: Eduardo J. Moreno");
  console.log("- Deployer address:", deployer.address);
  console.log("- Network: Sepolia Testnet");
  console.log("- Balance:", ethers.formatEther(deployerBalance), "ETH");
  console.log("- Target Contract: 0x5733eE985e22eFF46F595376d79e31413b1A1e16");
  
  // Check if we have enough balance for deployment
  if (deployerBalance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance. You might need more ETH for deployment and testing.");
  }
  
  console.log("\n🔨 Deploying Grader5Attacker contract...");
  
  // Get contract factory
  const Grader5Attacker = await ethers.getContractFactory("Grader5Attacker");
  
  // Estimate deployment gas
  const deployTx = await Grader5Attacker.getDeployTransaction();
  const gasEstimate = await deployer.estimateGas(deployTx);
  const gasPrice = await deployer.provider.getFeeData();
  
  console.log("📊 Gas Estimation:");
  console.log("- Estimated gas:", gasEstimate.toString());
  console.log("- Gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
  console.log("- Estimated cost:", ethers.formatEther(gasEstimate * gasPrice.gasPrice), "ETH");
  
  // Deploy the contract
  const attacker = await Grader5Attacker.deploy({
    gasPrice: gasPrice.gasPrice,
    gasLimit: gasEstimate + 50000n // Add some buffer
  });
  
  console.log("⏳ Waiting for deployment transaction to be mined...");
  await attacker.waitForDeployment();
  
  const contractAddress = await attacker.getAddress();
  const deploymentTx = attacker.deploymentTransaction();
  
  console.log("\n✅ Contract deployed successfully!");
  console.log("==========================================");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Transaction Hash:", deploymentTx.hash);
  console.log("⛽ Gas Used:", deploymentTx.gasLimit.toString());
  console.log("💰 Transaction Cost:", ethers.formatEther(deploymentTx.gasPrice * deploymentTx.gasLimit), "ETH");
  
  // Get contract owner
  const owner = await attacker.owner();
  console.log("👤 Contract Owner:", owner);
  
  console.log("\n🔍 Etherscan Links:");
  console.log(`- Contract: https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log(`- Transaction: https://sepolia.etherscan.io/tx/${deploymentTx.hash}`);
  
  // Check target contract
  console.log("\n🎯 Target Contract Analysis:");
  try {
    const counter = await attacker.checkCounter();
    const isGraded = await attacker.checkIfGraded();
    console.log("- Current counter:", counter.toString());
    console.log("- Already graded:", isGraded);
  } catch (error) {
    console.log("- Unable to read target contract state:", error.message);
  }
  
  console.log("\n📖 Next Steps:");
  console.log("1. Fund the contract with ETH for the attack");
  console.log("2. Execute the attack using attackAndRegister('Eduardo J. Moreno')");
  console.log("3. Verify the registration on the target contract");
  console.log("\n⚠️  IMPORTANT: Contract deployed but NOT VERIFIED as required!");
  
  // Save deployment info to file
  const deploymentInfo = {
    studentName: "Eduardo J. Moreno",
    contractAddress: contractAddress,
    transactionHash: deploymentTx.hash,
    deployerAddress: deployer.address,
    network: "sepolia",
    timestamp: new Date().toISOString(),
    gasUsed: deploymentTx.gasLimit.toString(),
    gasPrice: deploymentTx.gasPrice.toString(),
    targetContract: "0x5733eE985e22eFF46F595376d79e31413b1A1e16"
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
