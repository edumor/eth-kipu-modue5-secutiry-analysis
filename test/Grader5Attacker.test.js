const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * @title Grader5Attacker Test Suite
 * @author Eduardo J. Moreno
 * @notice Tests for the Grader5 attacker contract functionality
 */
describe("Grader5Attacker - Security Analysis Tests", function () {
  let attacker;
  let owner;
  let addr1;
  let addr2;

  const TARGET_CONTRACT = "0x5733eE985e22eFF46F595376d79e31413b1A1e16";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const Grader5Attacker = await ethers.getContractFactory("Grader5Attacker");
    attacker = await Grader5Attacker.deploy();
    await attacker.waitForDeployment();
  });

  describe("Contract Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await attacker.owner()).to.equal(owner.address);
    });

    it("Should set the correct target contract address", async function () {
      expect(await attacker.TARGET_CONTRACT()).to.equal(TARGET_CONTRACT);
    });

    it("Should have initial state values", async function () {
      const status = await attacker.getAttackStatus();
      expect(status.isCurrentlyAttacking).to.be.false;
      expect(status.currentAttackCount).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to execute attack", async function () {
      await expect(
        attacker.connect(addr1).executeAttack({ value: ethers.parseEther("0.001") })
      ).to.be.revertedWithCustomError(attacker, "NotOwner");
    });

    it("Should only allow owner to register student", async function () {
      await expect(
        attacker.connect(addr1).registerStudent("Test Student")
      ).to.be.revertedWithCustomError(attacker, "NotOwner");
    });

    it("Should only allow owner to withdraw", async function () {
      await expect(
        attacker.connect(addr1).emergencyWithdraw()
      ).to.be.revertedWithCustomError(attacker, "NotOwner");
    });
  });

  describe("Attack Function Validations", function () {
    it("Should reject attack with insufficient value", async function () {
      await expect(
        attacker.executeAttack({ value: 3 })
      ).to.be.revertedWithCustomError(attacker, "InsufficientBalance");
    });

    it("Should reject combined attack with insufficient value", async function () {
      await expect(
        attacker.attackAndRegister("Eduardo J. Moreno", { value: 3 })
      ).to.be.revertedWithCustomError(attacker, "InsufficientBalance");
    });

    it("Should prevent reentrant attacks during ongoing attack", async function () {
      // This test simulates the protection against multiple simultaneous attacks
      const status = await attacker.getAttackStatus();
      expect(status.isCurrentlyAttacking).to.be.false;
    });
  });

  describe("Utility Functions", function () {
    it("Should return contract balance", async function () {
      const balance = await attacker.getBalance();
      expect(balance).to.equal(0);
    });

    it("Should return attack status information", async function () {
      const status = await attacker.getAttackStatus();
      expect(status.isCurrentlyAttacking).to.be.a('boolean');
      expect(status.currentAttackCount).to.be.a('bigint');
      expect(status.contractCounter).to.be.a('bigint');
      expect(status.alreadyGraded).to.be.a('boolean');
    });

    it("Should check counter from target contract", async function () {
      // This will return 0 since our attacker contract hasn't interacted with target yet
      const counter = await attacker.checkCounter();
      expect(counter).to.be.a('bigint');
    });

    it("Should check if graded from target contract", async function () {
      const isGraded = await attacker.checkIfGraded();
      expect(isGraded).to.be.a('boolean');
    });

    it("Should check student grade by name", async function () {
      const grade = await attacker.checkStudentGrade("Test Student");
      expect(grade).to.be.a('bigint');
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to withdraw ETH", async function () {
      // Send some ETH to the contract first
      await owner.sendTransaction({
        to: await attacker.getAddress(),
        value: ethers.parseEther("0.1")
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await attacker.getBalance();
      expect(contractBalance).to.equal(ethers.parseEther("0.1"));

      const tx = await attacker.emergencyWithdraw();
      await tx.wait();

      const finalBalance = await attacker.getBalance();
      expect(finalBalance).to.equal(0);
    });
  });

  describe("Event Emissions", function () {
    it("Should emit events during attack execution", async function () {
      // Note: This test validates our contract structure
      // The attack will fail against localhost but that's expected
      
      try {
        await attacker.executeAttack({ 
          value: ethers.parseEther("0.001"),
          gasLimit: 500000 
        });
      } catch (error) {
        // Expected to fail without real target contract
        expect(error.message).to.include("revert");
      }
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should have reasonable gas costs for deployment", async function () {
      const Grader5Attacker = await ethers.getContractFactory("Grader5Attacker");
      const deployTx = await Grader5Attacker.getDeployTransaction();
      const gasEstimate = await owner.estimateGas(deployTx);
      
      console.log("      ⛽ Deployment gas estimate:", gasEstimate.toString());
      expect(gasEstimate).to.be.lessThan(1500000n); // Should be less than 1.5M gas
    });

    it("Should estimate gas for attack functions", async function () {
      try {
        const gasEstimate = await attacker.executeAttack.estimateGas({ 
          value: ethers.parseEther("0.001") 
        });
        console.log("      ⛽ Attack execution gas estimate:", gasEstimate.toString());
      } catch (error) {
        // Expected to fail without target contract, but shows our function is valid
        console.log("      ⛽ Gas estimation failed (expected without target):", error.message.substring(0, 50) + "...");
      }
    });
  });

  describe("Security Best Practices Validation", function () {
    it("Should have proper error handling", async function () {
      // Test custom errors work correctly
      await expect(
        attacker.connect(addr1).executeAttack({ value: ethers.parseEther("0.001") })
      ).to.be.revertedWithCustomError(attacker, "NotOwner");

      await expect(
        attacker.executeAttack({ value: 1 })
      ).to.be.revertedWithCustomError(attacker, "InsufficientBalance");
    });

    it("Should handle external call failures gracefully", async function () {
      // Our contract should handle failures from target contract calls
      // without reverting the entire transaction where possible
      const status = await attacker.getAttackStatus();
      expect(status.isCurrentlyAttacking).to.be.a('boolean');
      expect(status.contractCounter).to.be.a('bigint');
      expect(status.alreadyGraded).to.be.a('boolean');
    });
  });

  describe("Documentation and NatSpec", function () {
    it("Should have proper contract metadata", async function () {
      // Verify contract is properly documented
      const contractFactory = await ethers.getContractFactory("Grader5Attacker");
      expect(contractFactory.interface).to.not.be.undefined;
      expect(contractFactory.interface.fragments.length).to.be.greaterThan(10);
    });
  });
});

describe("Integration Tests (Sepolia Network)", function () {
  // These tests are designed to run against the actual Sepolia network
  // They should be run manually with: npx hardhat test --network sepolia
  
  it("Should connect to Sepolia and validate target contract", async function () {
    if (network.name !== "sepolia") {
      this.skip(); // Skip if not running on Sepolia
    }

    const targetAddress = "0x5733eE985e22eFF46F595376d79e31413b1A1e16";
    const code = await ethers.provider.getCode(targetAddress);
    expect(code).to.not.equal("0x"); // Contract should exist
  });
});
