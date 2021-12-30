// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract WavePortal {
    uint256 private seed; //used to help generate a "random" number

    //mapping(address => uint256) public addressTotalWaves;
    mapping(address => uint256) public lastWavedAt; // when the given account last waved at our contract

    event NewWave(address indexed from, string message, uint256 timestamp, uint256 prizeWon);
    //event PrizeWon(address indexed winner, uint256 amount, uint256 timestamp);

    struct Wave {
        address waver;
        string message;
        uint256 timestamp;
        uint256 prizeWon;
    }

    Wave[] waves;

    constructor() payable {
        console.log("WOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO");

        seed = (block.timestamp + block.difficulty) % 100; //initial seed
    }

    function wave(string memory _message) public {
        require(block.timestamp > lastWavedAt[msg.sender] + 30 seconds,
        "Wait at least 30 seconds since last waving"); //user has 30 sec cooldown time

        console.log("%s has waved w/ message %s", msg.sender, _message);
        //addressTotalWaves[msg.sender]++;

        seed = (block.difficulty + block.timestamp + seed) % 100;
        console.log("Random seed generated: %d", seed);

        if (seed <= 30) { //30% chance of winning
            console.log("%s won!", msg.sender);

            uint256 prizeAmount = 0.0001 ether;

            require(
                prizeAmount <= address(this).balance,
                "Trying to withdraw more money than the contract has"
            );

            (bool success, ) = (msg.sender).call{value: prizeAmount}(""); 
            require(success, "Failed to withdraw money from contract");
            waves.push(Wave(msg.sender, _message, block.timestamp, prizeAmount));
            //emit PrizeWon(msg.sender, prizeAmount, block.timestamp);
        } else {
            waves.push(Wave(msg.sender, _message, block.timestamp, 0.0));
        }
        
        lastWavedAt[msg.sender] = waves[waves.length - 1].timestamp;

        emit NewWave(waves[waves.length - 1].waver, waves[waves.length - 1].message,
        waves[waves.length - 1].timestamp, waves[waves.length - 1].prizeWon);
    }

    function getAllWaves() public view returns(Wave[] memory) {
        return waves;
    }

    function getTotalWaves() public view returns(uint256) {
        console.log("We have %d total waves!", waves.length);
        return waves.length;
    }
}