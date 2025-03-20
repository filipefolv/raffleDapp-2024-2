async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const RaffleFactory = await ethers.getContractFactory("RaffleFactory");
  const raffleFactory = await RaffleFactory.deploy();
  await raffleFactory.deployed();

  console.log("RaffleFactory deployed to:", raffleFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

