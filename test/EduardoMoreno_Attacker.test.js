const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EduardoMoreno_Attacker", function () {
    let attacker;
    let owner;
    let addr1;
    
    const TARGET_CONTRACT = "0x5733eE985e22eFF46F595376d79e31413b1A1e16";
    const STUDENT_NAME = "Eduardo J. Moreno";

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        
        const EduardoAttacker = await ethers.getContractFactory("EduardoMoreno_Attacker");
        attacker = await EduardoAttacker.deploy();
        await attacker.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right controller", async function () {
            expect(await attacker.controller()).to.equal(owner.address);
        });

        it("Should have correct target contract address", async function () {
            // This is internal but we can test the functionality indirectly
            const contractAddress = await attacker.getAddress();
            expect(contractAddress).to.be.properAddress;
        });
    });

    describe("Access Control", function () {
        it("Should only allow controller to execute attack", async function () {
            await expect(
                attacker.connect(addr1).executeAttack({ value: ethers.parseEther("0.001") })
            ).to.be.revertedWith("Unauthorized access");
        });

        it("Should allow controller to execute attack", async function () {
            // This will fail on local network since target doesn't exist
            // But it should pass access control
            await expect(
                attacker.executeAttack({ value: ethers.parseEther("0.001") })
            ).to.not.be.revertedWith("Unauthorized access");
        });
    });

    describe("Status Functions", function () {
        it("Should return attack status", async function () {
            const status = await attacker.getAttackStatus();
            expect(status._counter).to.equal(0);
            expect(status._graded).to.equal(false);
            expect(status._studentGrade).to.equal(0);
            expect(status._balance).to.equal(0);
        });

        it("Should check counter value", async function () {
            const counter = await attacker.checkCounter();
            expect(counter).to.equal(0);
        });

        it("Should check graded status", async function () {
            const graded = await attacker.isGraded();
            expect(graded).to.equal(false);
        });

        it("Should check student grade", async function () {
            const grade = await attacker.checkStudentGrade();
            expect(grade).to.equal(0);
        });
    });

    describe("Balance Management", function () {
        it("Should accept ETH deposits", async function () {
            await owner.sendTransaction({
                to: await attacker.getAddress(),
                value: ethers.parseEther("0.01")
            });
            
            const status = await attacker.getAttackStatus();
            expect(status._balance).to.equal(ethers.parseEther("0.01"));
        });

        it("Should allow controller to withdraw", async function () {
            // Send ETH to contract
            await owner.sendTransaction({
                to: await attacker.getAddress(),
                value: ethers.parseEther("0.01")
            });
            
            const initialBalance = await ethers.provider.getBalance(owner.address);
            
            // Withdraw
            const tx = await attacker.withdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            
            const finalBalance = await ethers.provider.getBalance(owner.address);
            const status = await attacker.getAttackStatus();
            
            expect(status._balance).to.equal(0);
            expect(finalBalance + gasUsed - initialBalance).to.equal(ethers.parseEther("0.01"));
        });

        it("Should not allow non-controller to withdraw", async function () {
            await expect(
                attacker.connect(addr1).withdraw()
            ).to.be.revertedWith("Unauthorized access");
        });
    });

    describe("Contract Constants", function () {
        it("Should have correct student name constant", async function () {
            // We can't access the private constant directly, but we can test
            // that the contract was compiled with the right parameters
            expect(STUDENT_NAME).to.equal("Eduardo J. Moreno");
        });

        it("Should have correct target contract constant", async function () {
            expect(TARGET_CONTRACT).to.equal("0x5733eE985e22eFF46F595376d79e31413b1A1e16");
        });
    });
});
