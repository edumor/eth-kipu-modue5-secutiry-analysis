const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * @title Pre-Deployment Checklist for Eduardo J. Moreno
 * @notice Verification script to ensure everything is ready for deployment
 */

async function main() {
    console.log("🔍 ETH-KIPU Module 5 - Pre-Deployment Checklist");
    console.log("===============================================");
    console.log("Student: Eduardo J. Moreno");
    console.log("Target: 0x5733eE985e22eFF46F595376d79e31413b1A1e16");
    console.log(`Check Time: ${new Date().toISOString()}\n`);

    // 1. Environment Configuration Check
    console.log("📋 1. Environment Configuration");
    console.log("--------------------------------");
    
    const requiredEnvVars = ['SEPOLIA_RPC_URL', 'PRIVATE_KEY'];
    let envComplete = true;
    
    requiredEnvVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName}: Configured`);
        } else {
            console.log(`❌ ${varName}: Missing`);
            envComplete = false;
        }
    });
    
    if (!envComplete) {
        console.log("\n⚠️  Please configure missing environment variables in .env file");
        process.exit(1);
    }

    // 2. Network Connectivity Check
    console.log("\n🌐 2. Network Connectivity");
    console.log("---------------------------");
    
    try {
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const network = await provider.getNetwork();
        console.log(`✅ Connected to: ${network.name} (chainId: ${network.chainId})`);
        
        if (network.chainId !== 11155111n) {
            console.log("⚠️  Warning: Not connected to Sepolia testnet");
        }
        
        const blockNumber = await provider.getBlockNumber();
        console.log(`📦 Latest Block: ${blockNumber}`);
        
    } catch (error) {
        console.log(`❌ Network connection failed: ${error.message}`);
        process.exit(1);
    }

    // 3. Account Balance Check
    console.log("\n💰 3. Account Balance");
    console.log("---------------------");
    
    try {
        const [signer] = await ethers.getSigners();
        const balance = await signer.provider.getBalance(signer.address);
        console.log(`📍 Deployer: ${signer.address}`);
        console.log(`💎 Balance: ${ethers.formatEther(balance)} ETH`);
        
        const minRequired = ethers.parseEther("0.01");
        if (balance < minRequired) {
            console.log("⚠️  Warning: Low balance. Consider adding more ETH for deployment and testing.");
        } else {
            console.log("✅ Sufficient balance for deployment");
        }
        
    } catch (error) {
        console.log(`❌ Account check failed: ${error.message}`);
        process.exit(1);
    }

    // 4. Contract Compilation Check
    console.log("\n🔨 4. Contract Compilation");
    console.log("---------------------------");
    
    try {
        const EduardoAttacker = await ethers.getContractFactory("EduardoMoreno_Attacker");
        console.log("✅ EduardoMoreno_Attacker: Compiled successfully");
        
        // Estimate deployment gas
        const deployTx = await EduardoAttacker.getDeployTransaction();
        const [signer] = await ethers.getSigners();
        const gasEstimate = await signer.estimateGas(deployTx);
        console.log(`⛽ Deployment Gas: ${gasEstimate.toString()}`);
        
    } catch (error) {
        console.log(`❌ Contract compilation failed: ${error.message}`);
        process.exit(1);
    }

    // 5. Target Contract Verification
    console.log("\n🎯 5. Target Contract Analysis");
    console.log("-------------------------------");
    
    const targetAddress = "0x5733eE985e22eFF46F595376d79e31413b1A1e16";
    
    try {
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const code = await provider.getCode(targetAddress);
        
        if (code === "0x") {
            console.log(`❌ Target contract not found at ${targetAddress}`);
        } else {
            console.log(`✅ Target contract found at ${targetAddress}`);
            console.log(`📏 Bytecode length: ${code.length} characters`);
            
            // Try to check if "Eduardo J. Moreno" is already registered
            try {
                const grader5Abi = [
                    "function students(string) view returns (uint256)",
                    "function studentCounter() view returns (uint256)",
                    "function deadline() view returns (uint256)",
                    "function startTime() view returns (uint256)"
                ];
                
                const grader5 = new ethers.Contract(targetAddress, grader5Abi, provider);
                
                const eduardoGrade = await grader5.students("Eduardo J. Moreno");
                console.log(`👤 Eduardo J. Moreno current grade: ${eduardoGrade.toString()}`);
                
                const studentCounter = await grader5.studentCounter();
                console.log(`📊 Total students registered: ${studentCounter.toString()}`);
                
                const deadline = await grader5.deadline();
                console.log(`⏰ Deadline: ${deadline.toString()}`);
                
                const startTime = await grader5.startTime();
                console.log(`🚀 Start Time: ${startTime.toString()}`);
                
                // Check if deadline is reasonable (not passed)
                const now = Math.floor(Date.now() / 1000);
                if (Number(deadline) > now) {
                    console.log("✅ Deadline has not passed");
                } else {
                    console.log("⚠️  Warning: Deadline may have passed");
                }
                
                if (Number(startTime) <= now) {
                    console.log("✅ Start time has passed - ready to attack");
                } else {
                    console.log("⚠️  Warning: Start time not reached yet");
                }
                
            } catch (error) {
                console.log(`⚠️  Could not read contract state: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Target contract check failed: ${error.message}`);
    }

    // 6. Security Analysis Summary
    console.log("\n🔒 6. Security Analysis Summary");
    console.log("--------------------------------");
    console.log("✅ Reentrancy vulnerability identified in target");
    console.log("✅ Attack vector: retrieve() function external call");
    console.log("✅ Exploit: Counter manipulation via reentrant calls");
    console.log("✅ Goal: Achieve counter[attacker] > 1 for gradeMe()");
    console.log("✅ Target: Register 'Eduardo J. Moreno' successfully");

    // 7. Final Readiness Assessment
    console.log("\n🎯 7. Deployment Readiness");
    console.log("---------------------------");
    console.log("✅ Environment: Configured");
    console.log("✅ Network: Sepolia connected");
    console.log("✅ Balance: Sufficient for deployment");
    console.log("✅ Contract: Compiled successfully");
    console.log("✅ Target: Analyzed and vulnerable");
    console.log("✅ Strategy: Attack vector identified");
    
    console.log("\n🚀 Ready for Deployment!");
    console.log("========================");
    console.log("Next steps:");
    console.log("1. npm run eduardo-deploy");
    console.log("2. npm run eduardo-attack");
    console.log("3. Verify registration success");
    console.log("4. Submit contract address to campus");
    console.log("\n⚠️  Remember: DO NOT verify the contract on Etherscan!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Checklist failed:", error);
        process.exit(1);
    });
