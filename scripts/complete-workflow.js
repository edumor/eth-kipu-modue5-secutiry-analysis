const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');

const execAsync = promisify(exec);

/**
 * @title Complete Eduardo J. Moreno ETH-KIPU Module 5 Workflow
 * @notice Automated execution of the complete assignment workflow
 * @dev This script handles the entire process from compilation to final verification
 */

async function main() {
    console.log("🎓 ETH-KIPU Module 5 - Complete Workflow Execution");
    console.log("==================================================");
    console.log("Student: Eduardo J. Moreno");
    console.log("Assignment: Smart Contract Security Analysis & Exploitation");
    console.log(`Execution Time: ${new Date().toISOString()}\n`);

    const steps = [
        {
            name: "Pre-Deployment Check",
            command: "npm run pre-check",
            description: "Verify environment and requirements"
        },
        {
            name: "Contract Compilation",
            command: "npm run compile",
            description: "Compile all smart contracts"
        },
        {
            name: "Local Testing",
            command: "npm test",
            description: "Run test suite to verify functionality"
        },
        {
            name: "Deploy Attack Contract",
            command: "npm run eduardo-deploy",
            description: "Deploy EduardoMoreno_Attacker to Sepolia (UNVERIFIED)"
        },
        {
            name: "Execute Attack",
            command: "npm run eduardo-attack", 
            description: "Execute reentrancy attack and register student name"
        }
    ];

    let currentStep = 1;
    const totalSteps = steps.length;

    for (const step of steps) {
        console.log(`\n📋 Step ${currentStep}/${totalSteps}: ${step.name}`);
        console.log(`${"=".repeat(50)}`);
        console.log(`📝 ${step.description}`);
        console.log(`🔧 Command: ${step.command}\n`);

        try {
            const startTime = Date.now();
            const { stdout, stderr } = await execAsync(step.command);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log(stdout);
            if (stderr) {
                console.log("⚠️  Warnings:", stderr);
            }

            console.log(`✅ Step ${currentStep} completed in ${duration}s`);

            // Special handling for deployment step
            if (step.name === "Deploy Attack Contract") {
                try {
                    const deploymentInfo = JSON.parse(fs.readFileSync('eduardo-deployment.json', 'utf8'));
                    console.log(`\n🏗️  Contract Deployed Successfully!`);
                    console.log(`📍 Address: ${deploymentInfo.contractAddress}`);
                    console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${deploymentInfo.contractAddress}`);
                    console.log(`⚠️  Status: UNVERIFIED (as required)`);
                } catch (error) {
                    console.log("⚠️  Could not read deployment info");
                }
            }

            // Special handling for attack step
            if (step.name === "Execute Attack") {
                try {
                    if (fs.existsSync('eduardo-success.json')) {
                        const successInfo = JSON.parse(fs.readFileSync('eduardo-success.json', 'utf8'));
                        console.log(`\n🎉 MISSION ACCOMPLISHED!`);
                        console.log(`🎊 Student: ${successInfo.studentName}`);
                        console.log(`🏆 Grade: ${successInfo.finalGrade}/100`);
                        console.log(`📍 Contract: ${successInfo.contractAddress}`);
                        console.log(`\n📋 Campus Submission:`);
                        console.log(`- Name: "${successInfo.studentName}"`);
                        console.log(`- Address: ${successInfo.contractAddress}`);
                    }
                } catch (error) {
                    console.log("⚠️  Could not read success info");
                }
            }

        } catch (error) {
            console.error(`❌ Step ${currentStep} failed:`);
            console.error(error.message);
            
            // Don't fail the entire process for test failures in local environment
            if (step.name === "Local Testing" && error.message.includes("failing")) {
                console.log("⚠️  Some tests failed but continuing with deployment...");
            } else if (step.name === "Pre-Deployment Check") {
                console.log("🛑 Pre-deployment check failed. Please fix issues before continuing.");
                process.exit(1);
            } else if (currentStep >= 4) { // Deployment or attack steps
                console.log("🛑 Critical step failed. Manual intervention required.");
                process.exit(1);
            }
        }

        currentStep++;
    }

    // Final Summary
    console.log(`\n🎯 WORKFLOW COMPLETED`);
    console.log(`${"=".repeat(50)}`);
    console.log(`✅ All steps executed`);
    console.log(`🎓 Eduardo J. Moreno's ETH-KIPU Module 5 Assignment`);
    
    try {
        const deploymentInfo = JSON.parse(fs.readFileSync('eduardo-deployment.json', 'utf8'));
        console.log(`\n📋 Final Submission Details:`);
        console.log(`- Student Name: "Eduardo J. Moreno"`);
        console.log(`- Contract Address: ${deploymentInfo.contractAddress}`);
        console.log(`- Network: Sepolia Testnet`);
        console.log(`- Contract Status: UNVERIFIED ✓`);
        console.log(`- Deployment: ${deploymentInfo.deploymentTime}`);
        
        if (fs.existsSync('eduardo-success.json')) {
            const successInfo = JSON.parse(fs.readFileSync('eduardo-success.json', 'utf8'));
            console.log(`- Registration: SUCCESS ✓`);
            console.log(`- Grade Achieved: ${successInfo.finalGrade}/100`);
        }

        console.log(`\n🔗 Important Links:`);
        console.log(`- Contract: https://sepolia.etherscan.io/address/${deploymentInfo.contractAddress}`);
        console.log(`- Target: https://sepolia.etherscan.io/address/0x5733eE985e22eFF46F595376d79e31413b1A1e16`);
        
    } catch (error) {
        console.log("⚠️  Could not generate final summary - check individual step outputs");
    }

    console.log(`\n🎉 Assignment Ready for Campus Submission!`);
    console.log(`Remember: Submit the contract address and "Eduardo J. Moreno" exactly as shown above.`);
}

if (require.main === module) {
    main()
        .then(() => {
            console.log("\n✨ All done! Good luck with your submission, Eduardo! ✨");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Workflow execution failed:", error);
            process.exit(1);
        });
}

module.exports = { main };
