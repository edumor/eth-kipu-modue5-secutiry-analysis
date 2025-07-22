# 🚀 Deployment Guide - Eduardo J. Moreno

## ETH-KIPU Module 5 - Quick Start Guide

This guide will help you deploy and execute the attack to register "Eduardo J. Moreno" in the Grader5 contract.

### ⚡ Quick Start (Automated)

If you have everything configured, run the complete workflow:

```bash
npm run complete
```

This will execute all steps automatically: check → compile → test → deploy → attack.

### 📋 Step-by-Step Manual Execution

#### 1. Environment Setup

First, create a `.env` file with your configuration:

```bash
cp .env.example .env
# Edit .env with your details:
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
# PRIVATE_KEY=your_private_key_here
```

#### 2. Pre-Deployment Check

Verify everything is ready:

```bash
npm run pre-check
```

This will check:
- ✅ Environment variables
- ✅ Network connectivity  
- ✅ Account balance
- ✅ Contract compilation
- ✅ Target contract analysis

#### 3. Deploy Attack Contract

Deploy the EduardoMoreno_Attacker contract (UNVERIFIED):

```bash
npm run eduardo-deploy
```

This will:
- Deploy to Sepolia testnet
- Save deployment info to `eduardo-deployment.json`
- Display contract address
- **NOT** verify the contract (as required)

#### 4. Execute Attack

Execute the reentrancy attack and register your name:

```bash
npm run eduardo-attack
```

This will:
- Execute reentrancy attack on Grader5
- Manipulate counter to satisfy `gradeMe()` requirements  
- Register "Eduardo J. Moreno" in the contract
- Save success info to `eduardo-success.json`

### 🎯 What Happens During the Attack

1. **Initial Call**: `executeAttack()` calls `Grader5.retrieve()` with >3 wei
2. **Reentrancy**: Grader5 calls back to attacker's `receive()` function
3. **State Manipulation**: `receive()` calls `retrieve()` again (reentrancy)
4. **Counter Exploit**: Counter reaches >1 (required for `gradeMe()`)
5. **Registration**: `gradeMe("Eduardo J. Moreno")` successfully executes
6. **Grade Assignment**: Student receives grade based on position in queue

### 📍 After Successful Execution

You'll get output similar to:

```
🎊 MISSION ACCOMPLISHED! 🎊
=====================================
✅ Student "Eduardo J. Moreno" successfully registered!
🏆 Grade Achieved: 85/100
📍 Attack Contract: 0x1234...abcd
🔗 Etherscan: https://sepolia.etherscan.io/address/0x1234...abcd

📝 Campus Submission Details:
- Student Name: "Eduardo J. Moreno"
- Contract Address: 0x1234...abcd
- Contract Status: UNVERIFIED ✓
```

### 🎓 Campus Submission

Submit to ETH-KIPU campus:

1. **Student Name**: `"Eduardo J. Moreno"` (exact match)
2. **Contract Address**: The address from deployment output
3. **Verification Status**: UNVERIFIED (as required)

### 🔧 Troubleshooting

#### Low Balance
```bash
# Check balance
npm run pre-check
# Add more Sepolia ETH from faucet
```

#### Network Issues
```bash
# Check network configuration
npm run pre-check
# Verify SEPOLIA_RPC_URL in .env
```

#### Contract Already Registered
If "Eduardo J. Moreno" is already registered, the attack will detect this and report the existing grade.

#### Attack Failed
```bash
# Check target contract status
npm run console
# Manual investigation:
const attacker = await ethers.getContractAt("EduardoMoreno_Attacker", "CONTRACT_ADDRESS");
const status = await attacker.getAttackStatus();
console.log(status);
```

### 📱 Manual Contract Interaction

If needed, you can interact manually:

```bash
npm run console

# Load contract
const attacker = await ethers.getContractAt("EduardoMoreno_Attacker", "CONTRACT_ADDRESS");

# Check status
const status = await attacker.getAttackStatus();
console.log("Counter:", status._counter.toString());
console.log("Grade:", status._studentGrade.toString());

# Execute attack manually
const tx = await attacker.executeAttack({value: ethers.parseEther("0.001")});
await tx.wait();

# Check result
const grade = await attacker.checkStudentGrade();
console.log("Final grade:", grade.toString());
```

### ⚠️ Important Reminders

- **DO NOT** verify the contract on Etherscan
- Use exact name: `"Eduardo J. Moreno"`
- Ensure sufficient ETH balance (≥0.01 ETH recommended)
- Attack before the deadline
- Keep contract address for campus submission

### 📞 Support

If you encounter issues:

1. Check the comprehensive logs from each script
2. Verify `.env` configuration
3. Ensure Sepolia testnet connectivity
4. Check account balance and permissions
5. Review the README.md for detailed vulnerability analysis

---

Good luck with your ETH-KIPU Module 5 submission, Eduardo! 🎓
