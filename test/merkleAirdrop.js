const MerkleAirdrop = artifacts.require('MerkleAirdrop');
const {MerkleTree} = require('merkletreejs')
const keccak256 = require('keccak256')
var Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('MerkleAirdrop', (accounts) => {
  let merkleAirdrop
  let owner
  let otherAccount

  beforeEach(async () => {
    merkleAirdrop = await MerkleAirdrop.deployed()
    owner = accounts[0]
    otherAccount = accounts[5]
    await web3.eth.sendTransaction({to:merkleAirdrop.address, from:owner, value:10**18+''})
  })

  it('Should deploy smart contract properly', async () =>{
    assert(merkleAirdrop.address !== '')
  })

  it('Should return 0x0000000000000000000000000000000000000000000000000000000000000000', async () =>{
    assert(await merkleAirdrop.root() === '0x0000000000000000000000000000000000000000000000000000000000000000')
  })

  it('Should return 0x9b64cf48917f983ce8bb818f161173c20e332e3542972a3be5399a8111e0b45f', async () =>{
    await merkleAirdrop.setRoot('0x9b64cf48917f983ce8bb818f161173c20e332e3542972a3be5399a8111e0b45f')
    assert(await merkleAirdrop.root() === '0x9b64cf48917f983ce8bb818f161173c20e332e3542972a3be5399a8111e0b45f')
  })

  it('Should not be possible to change root with otherAccount', async () =>{
    await expectRevert.unspecified(
      merkleAirdrop.setRoot('0x9b64cf48917f983ce8bb818f161173c20e332e3542972a3be5399a8111e0b45f',
      {from:otherAccount})
    )
  })

  it('Should return false', async () =>{
    assert(await merkleAirdrop.isClaimed(otherAccount) === false)
  })

  it('Should be able claim the airdrop', async () =>{
    const leafNodesWithAirdropAmount = [owner, otherAccount].map(
      (x, ind) => web3.utils.soliditySha3({type: 'address', value: x},{type: 'uint256', value: (((ind+1)*10**15)+'')})
    )
    const tree = new MerkleTree(leafNodesWithAirdropAmount, keccak256, {sortPairs: true})
    const root = '0x' + tree.getRoot().toString('hex')
    const airdropAmount = (2 * 10**15) + ''
    const eligibleProof = tree.getHexProof(leafNodesWithAirdropAmount[1])
    await merkleAirdrop.setRoot(root)
    await merkleAirdrop.claim(eligibleProof, airdropAmount, {from:otherAccount})
    assert(await merkleAirdrop.isClaimed(otherAccount) === true)
  })

  it('Should not be able claim the airdrop', async () =>{
    const leafNodesWithAirdropAmount = [owner, otherAccount].map(
      (x, ind) => web3.utils.soliditySha3({type: 'address', value: x},{type: 'uint256', value: (((ind+1)*10**15)+'')})
    )
    const tree = new MerkleTree(leafNodesWithAirdropAmount, keccak256, {sortPairs: true})
    const root = '0x' + tree.getRoot().toString('hex')
    const airdropAmount = (2 * 10**15) + ''
    const eligibleProof = tree.getHexProof(leafNodesWithAirdropAmount[1])
    await merkleAirdrop.setRoot(root)
    await expectRevert.unspecified(
      merkleAirdrop.claim(eligibleProof, airdropAmount, {from:owner})
    )
  })

})