const { ethers } = require("hardhat");
const fs = require('fs');
require("dotenv").config();

/**
 * @title Deploy Eduardo J. Moreno's Attack Contract
 * @author Eduardo J. Moreno
 * @notice Specialized deployment for ETH-KIPU Module 5 practical work
 * @dev Deploys EduardoMoreno_Attacker contract without verification as required
 */

async function main() {
    const studentName = "Eduardo J. Moreno";
    const targetContract = "0x5733eE985e22eFF46F595376d79e31413b1A1e16";
    
    console.log("🚀 ETH-KIPU Module 5 - Security Analysis Project");
    console.log("================================================");
    console.log(`📋 Student: ${studentName}`);
    console.log(`🎯 Target: ${targetContract}`);
    console.log(`🌐 Network: Sepolia Testnet`);
    console.log(`⏰ Deployment Time: ${new Date().toISOString()}`);
    
    // Get deployer
    const [deployer] = await ethers.getSigners();
    const balance = await deployer.provider.getBalance(deployer.address);
    
    console.log(`\n💼 Deployer Information:`);
    console.log(`- Address: ${deployer.address}`);
    console.log(`- Balance: ${ethers.formatEther(balance)} ETH`);
    
    // Check minimum balance requirement
    if (balance < ethers.parseEther("0.01")) {
        console.warn("⚠️  Warning: Low balance detected. Consider adding more ETH.");
    }
    
    console.log(`\n🔨 Deploying EduardoMoreno_Attacker contract...`);
    
    // Get contract factory
    const EduardoAttacker = await ethers.getContractFactory("EduardoMoreno_Attacker");
    
    // Estimate deployment costs
    const deployTx = await EduardoAttacker.getDeployTransaction();
    const gasEstimate = await deployer.estimateGas(deployTx);
    const feeData = await deployer.provider.getFeeData();
    
    console.log(`📊 Deployment Estimates:`);
    console.log(`- Gas Required: ${gasEstimate.toString()}`);
    console.log(`- Gas Price: ${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei`);
    console.log(`- Estimated Cost: ${ethers.formatEther(gasEstimate * feeData.gasPrice)} ETH`);
    
    // Deploy with optimized gas settings
    const attacker = await EduardoAttacker.deploy({
        gasPrice: feeData.gasPrice,
        gasLimit: gasEstimate + 10000n // Small buffer
    });
    
    console.log(`⏳ Waiting for contract deployment...`);
    await attacker.waitForDeployment();
    
    const contractAddress = await attacker.getAddress();
    const deploymentTx = attacker.deploymentTransaction();
    
    console.log(`\n✅ Contract Successfully Deployed!`);
    console.log(`================================================`);
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`🔗 Transaction Hash: ${deploymentTx.hash}`);
    console.log(`⛽ Gas Used: ${deploymentTx.gasLimit.toString()}`);
    console.log(`💰 Deploy Cost: ${ethers.formatEther(deploymentTx.gasPrice * deploymentTx.gasLimit)} ETH`);
    
    // Verify contract functionality
    console.log(`\n🔍 Contract Verification:`);
    try {
        const status = await attacker.getAttackStatus();
        console.log(`- Current Counter: ${status._counter.toString()}`);
        console.log(`- Already Graded: ${status._graded}`);
        console.log(`- Student Grade: ${status._studentGrade.toString()}`);
        console.log(`- Contract Balance: ${ethers.formatEther(status._balance)} ETH`);
        
        // Check if Eduardo J. Moreno is already registered
        const existingGrade = await attacker.checkStudentGrade();
        if (existingGrade > 0) {
            console.log(`🎉 "${studentName}" already registered with grade: ${existingGrade}`);
        } else {
            console.log(`📝 "${studentName}" not yet registered - ready for attack`);
        }
        
    } catch (error) {
        console.log(`- Status check failed: ${error.message}`);
    }
    
    // Save deployment information
    const deploymentInfo = {
        projectName: "ETH-KIPU Module 5 Security Analysis",
        studentName: studentName,
        contractName: "EduardoMoreno_Attacker",
        contractAddress: contractAddress,
        transactionHash: deploymentTx.hash,
        deployerAddress: deployer.address,
        network: "sepolia",
        targetContract: targetContract,
        deploymentTime: new Date().toISOString(),
        gasUsed: deploymentTx.gasLimit.toString(),
        gasPrice: deploymentTx.gasPrice.toString(),
        estimatedCost: ethers.formatEther(deploymentTx.gasPrice * deploymentTx.gasLimit),
        blockNumber: deploymentTx.blockNumber?.toString() || "pending"
    };
    
    try {
        fs.writeFileSync('eduardo-deployment.json', JSON.stringify(deploymentInfo, null, 2));
        console.log(`📄 Deployment info saved to: eduardo-deployment.json`);
    } catch (error) {
        console.log(`⚠️  Could not save deployment info: ${error.message}`);
    }
    
    console.log(`\n🔗 Etherscan Links:`);
    console.log(`- Contract: https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log(`- Transaction: https://sepolia.etherscan.io/tx/${deploymentTx.hash}`);
    console.log(`- Target Contract: https://sepolia.etherscan.io/address/${targetContract}`);
    
    console.log(`\n📋 Next Steps:`);
    console.log(`1. Fund contract with ETH: await contract.executeAttack({value: ethers.parseEther("0.001")})`);
    console.log(`2. Execute attack to register "${studentName}"`);
    console.log(`3. Verify registration on target contract`);
    console.log(`4. Submit contract address to campus: ${contractAddress}`);
    
    console.log(`\n⚠️  IMPORTANT REMINDERS:`);
    console.log(`- Contract deployed but NOT VERIFIED (as required)`);
    console.log(`- Student name registered: "${studentName}"`);
    console.log(`- Keep this contract address for campus submission`);
    console.log(`- Do NOT verify this contract on Etherscan`);
    
    return {
        contractAddress,
        transactionHash: deploymentTx.hash,
        studentName,
        deploymentInfo
    };
}

// Handle both direct execution and module export
if (require.main === module) {
    main()
        .then((result) => {
            console.log(`\n🎉 Deployment completed successfully!`);
            console.log(`Contract: ${result.contractAddress}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error(`❌ Deployment failed:`, error);
            process.exit(1);
        });
}

module.exports = { main };
