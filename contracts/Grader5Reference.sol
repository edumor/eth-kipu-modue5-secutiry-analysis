// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Grader5 - Target Contract for Security Analysis
 * @author ETH-KIPU Module 5
 * @notice This contract is used for educational purposes to demonstrate vulnerabilities
 * @dev This is a REFERENCE copy of the target contract for analysis purposes
 */
contract Grader5 is Ownable {
    mapping (address => uint256) public counter;
    mapping(string => uint256) public students;
    mapping(address => bool) public isGraded;
    uint256 public studentCounter;
    uint256 public divisor = 8;
    uint256 public deadline = 10000000000000000000000;
    uint256 public startTime = 0;

    constructor() Ownable(msg.sender) payable {}

    /**
     * @notice Vulnerable function that allows reentrancy attacks
     * @dev Contains multiple vulnerabilities:
     * - Reentrancy vulnerability in call
     * - State manipulation possible
     * - Counter logic can be exploited
     */
    function retrieve() external payable {
        require(msg.value > 3,"not enough money");
        counter[msg.sender]++;
        require(counter[msg.sender]<4);
        (bool sent, ) = payable(msg.sender).call{value: 1, gas: gasleft()}("");
        require(sent, "Failed to send Ether");
        if(counter[msg.sender]<2) {
            counter[msg.sender]=0;
        }
    }  

    /**
     * @notice Function to register student name and get grade
     * @param name Student name to register
     * @dev Requires counter[msg.sender] > 1 to execute
     */
    function gradeMe(string calldata name) public {
        require(block.timestamp<deadline,"The end");
        require(block.timestamp>startTime,"The end");
        require( counter[msg.sender] > 1,"Not yet");
        uint256 _grade = studentCounter/divisor;
        ++studentCounter;

        if (_grade <= 6) {
            _grade = 100 - _grade * 5;
        } else {
            _grade = 70;
        }
  
        require(students[name]==0,"student already exists");
        require(isGraded[msg.sender]==false, "already graded");
        isGraded[msg.sender] = true;
        students[name] = _grade;
    }

    // Owner functions
    function setDivisor(uint256 _divisor) public onlyOwner {
        divisor = _divisor;
    }

    function setDeadline(uint256 _deadline) public onlyOwner {
        deadline = _deadline;
    }

    function setStudentCounter(uint256 _studentCounter) public onlyOwner {
        studentCounter = _studentCounter;
    }

    function setStartTime(uint256 _startTime) public onlyOwner {
        startTime = _startTime;
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
