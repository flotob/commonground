// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CgTest is ERC20 {
    constructor() ERC20("CgTest", "CGT") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}