// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";

contract CgLuksoTest is LSP7DigitalAsset {
    constructor() LSP7DigitalAsset("CgTest", "CGT", msg.sender, 0, false) {}

    function mint(address to, uint256 amount, bool force, bytes memory data) public {
        _mint(to, amount, force, data);
    }
}