const { expect } = require("chai");

describe("Raffle", function () {
  let Raffle, raffle, organizer, addr1;
  const totalTickets = 10;
  const ticketPrice = ethers.utils.parseEther("0.01");
  const duration = 3600; // 1 hora

  beforeEach(async function () {
    [organizer, addr1] = await ethers.getSigners();
    Raffle = await ethers.getContractFactory("Raffle");
    raffle = await Raffle.deploy(totalTickets, ticketPrice, duration);
    await raffle.deployed();
  });

  it("Deve criar a rifa corretamente", async function () {
    expect(await raffle.organizer()).to.equal(organizer.address);
    expect(await raffle.ticketPrice()).to.equal(ticketPrice);
  });

  it("Deve permitir compra de bilhete", async function () {
    await raffle.connect(addr1).buyTicket(1, { value: ticketPrice });
    expect(await raffle.ticketToBuyer(1)).to.equal(addr1.address);
  });
});

