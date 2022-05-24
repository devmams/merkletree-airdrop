// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';

contract MerkleAirdrop is Ownable {

  bytes32 public root;
  mapping(address => bool) public claimed;
  event Claimed(address user, uint256 amount);

  fallback() external payable {}

  function setRoot(bytes32 _root) external onlyOwner{
    root = _root;
  }

  function isClaimed(address user) external view returns(bool){
    return claimed[user];
  }

  function claim(bytes32[] memory proof, uint256 amountToClaim) external {
    bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amountToClaim));
    require(MerkleProof.verify(proof, root, leaf), "You are not eligible");
    require(!claimed[msg.sender], 'Airdrop already claimed');
    claimed[msg.sender] = true;
    (bool success,) = msg.sender.call{value: amountToClaim}("");
    require(success, 'Transfer failed');
    emit Claimed(msg.sender, amountToClaim);
  }
  
}