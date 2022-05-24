const MerkleAirdrop = artifacts.require('MerkleAirdrop');
const {MerkleTree} = require('merkletreejs')
const keccak256 = require('keccak256')
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
module.exports = async function(deployer, _, accounts) {
  await deployer.deploy(MerkleAirdrop);
  let merkleAirdrop = await MerkleAirdrop.deployed()

  await web3.eth.sendTransaction({to:merkleAirdrop.address, from:accounts[0], value:10**18+'', data:'0x'}) // transfer 1 eth to MerkleAirdrop contract
  console.log('merkleAirdrop balance :' +await web3.eth.getBalance(merkleAirdrop.address))

  const whitelistAddresses = accounts
  console.log(whitelistAddresses)

  const leafNodesWithAirdropAmount = whitelistAddresses.map(
    (x, ind) => web3.utils.soliditySha3({type: 'address', value: x},{type: 'uint256', value: (((ind+1)*10**15)+'')})
  )
  const tree = new MerkleTree(leafNodesWithAirdropAmount, keccak256, {sortPairs: true})
  console.log('tree : \n'+ tree.toString())
 
  const bufferToHex = x => '0x' + x.toString('hex') //function to convert buffer to string

  const root = bufferToHex(tree.getRoot())
  await merkleAirdrop.setRoot(root) //set MerkleAirdrop root variable
  console.log('contract root : '+await merkleAirdrop.root())


  const num_account = 2
  const eligibleAddress = accounts[num_account]
  const airdropAmount = ((num_account+1) * 10**15) + ''
  const eligibleLeaf = leafNodesWithAirdropAmount[num_account]
  const eligibleProof = tree.getHexProof(eligibleLeaf)
  console.log('eligibleAddress : '+ eligibleAddress)
  console.log('airdropAmount : '+ airdropAmount)
  console.log('eligibleLeaf : '+ eligibleLeaf)
  console.log('eligibleProof : '+ JSON.stringify(eligibleProof))
  

  console.log('account balance before airdrop :' +await web3.eth.getBalance(eligibleAddress))
  await merkleAirdrop.claim(eligibleProof, airdropAmount, {from:eligibleAddress})
  console.log('account balance after airdrop :' +await web3.eth.getBalance(eligibleAddress))
};
