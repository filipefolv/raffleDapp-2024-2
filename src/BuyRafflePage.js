import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import RaffleABI from './artifacts/contracts/Raffle.sol/Raffle.json';

function BuyRafflePage({ factoryContract, provider, account, setCurrentPage }) {
  const [activeRaffles, setActiveRaffles] = useState([]);
  const [status, setStatus] = useState("");

  const loadRaffles = useCallback(async () => {
    if (!factoryContract || !account) return;
    try {
      const rafflesArray = await factoryContract.getRaffles();
      const signer = provider.getSigner();
      const activeList = [];
      for (let i = 0; i < rafflesArray.length; i++) {
        const raffleAddress = rafflesArray[i];
        const raffleContract = new ethers.Contract(raffleAddress, RaffleABI.abi, signer);
        const organizer = await raffleContract.organizer();
        if (organizer.toLowerCase() !== account.toLowerCase()) {
          const isActive = await raffleContract.isRaffleActive();
          if (isActive) {
            activeList.push(raffleAddress);
          }
        }
      }
      setActiveRaffles(activeList);
    } catch (err) {
      console.error("Erro ao carregar rifas:", err);
      setStatus("Erro ao carregar rifas. Tente novamente.");
    }
  }, [factoryContract, provider, account]);

  useEffect(() => {
    loadRaffles();
  }, [loadRaffles]);

  async function buyTicket(raffleAddress, ticketNumber) {
    try {
      const signer = provider.getSigner();
      const raffleContract = new ethers.Contract(raffleAddress, RaffleABI.abi, signer);

      // Captura o evento TicketPurchased
      raffleContract.on("TicketPurchased", (buyer, ticketNumber) => {
        if (buyer.toLowerCase() === account.toLowerCase()) {
          setStatus(`Você comprou o bilhete ${ticketNumber} com sucesso!`);
        }
      });

      const ticketPrice = await raffleContract.ticketPrice();
      const tx = await raffleContract.buyTicket(ticketNumber, { value: ticketPrice });
      setStatus("Transação enviada. Aguarde a confirmação...");
      await tx.wait();
      setStatus("Bilhete comprado com sucesso!");
      loadRaffles();
    } catch (err) {
      console.error("Erro ao comprar bilhete:", err);
      setStatus("Erro: " + err.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Comprar Rifa</h2>
      <ul>
        {activeRaffles.length > 0 ? (
          activeRaffles.map((raffleAddress, index) => (
            <ActiveRaffle
              key={index}
              raffleAddress={raffleAddress}
              provider={provider}
              buyTicket={buyTicket}
            />
          ))
        ) : (
          <p>Nenhuma rifa ativa disponível para compra.</p>
        )}
      </ul>
      <p>{status}</p>
      <button onClick={() => setCurrentPage("landing")}>Voltar à Pagina Inicial</button>
    </div>
  );
}

function ActiveRaffle({ raffleAddress, provider, buyTicket }) {
  const [raffleDetails, setRaffleDetails] = useState({});
  const [ticketNumber, setTicketNumber] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDetails() {
      if (!provider) return;
      try {
        const signer = provider.getSigner();
        const raffleContract = new ethers.Contract(raffleAddress, RaffleABI.abi, signer);
        const totalTickets = await raffleContract.totalTickets();
        const ticketPrice = await raffleContract.ticketPrice();
        const ticketsSold = await raffleContract.ticketsSold();
        const percentageThreshold = await raffleContract.percentageThreshold();
        const isActive = await raffleContract.isRaffleActive();
        const winningTicket = await raffleContract.winningTicket();
        const winner = await raffleContract.winner();

        setRaffleDetails({
          totalTickets: totalTickets.toNumber(),
          ticketPrice: ethers.utils.formatEther(ticketPrice),
          ticketsSold: ticketsSold.toNumber(),
          percentageThreshold: percentageThreshold.toNumber(),
          isActive,
          winningTicket: winningTicket.toNumber(),
          winner,
        });
      } catch (err) {
        console.error("Erro ao carregar detalhes da rifa:", err);
        setError("Erro ao carregar os detalhes da rifa.");
      }
    }
    loadDetails();
  }, [raffleAddress, provider]);

  async function handleBuyTicket() {
    setError("");
    try {
      const chosenTicket = Number(ticketNumber);
      const signer = provider.getSigner();
      const raffleContract = new ethers.Contract(raffleAddress, RaffleABI.abi, signer);

      // Verifica se a rifa ainda está ativa
      const isActive = await raffleContract.isRaffleActive();
      if (!isActive) {
        setError("Esta rifa não está mais disponível para compra.");
        return;
      }

      // Verifica se o número escolhido está na lista de bilhetes disponíveis
      const availableTickets = await raffleContract.getAvailableTickets();
      const available = availableTickets.map(t => Number(t));
      if (!available.includes(chosenTicket)) {
        setError("O número escolhido não está disponível ou fora do intervalo.");
        return;
      }

      // Envia a transação para comprar o bilhete
      await buyTicket(raffleAddress, chosenTicket);
      setTicketNumber("");
    } catch (err) {
      console.error("Erro ao comprar bilhete:", err);
      setError("Erro ao comprar bilhete: " + err.message);
    }
  }

  return (
    <li style={{ marginBottom: 10, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
      <p><strong>Endereço da Rifa:</strong> {raffleAddress}</p>
      <p><strong>Total de Bilhetes:</strong> {raffleDetails.totalTickets !== undefined ? raffleDetails.totalTickets : "N/A"}</p>
      <p><strong>Preço por Bilhete:</strong> {raffleDetails.ticketPrice ? raffleDetails.ticketPrice + " ETH" : "N/A"}</p>
      <p><strong>Bilhetes Vendidos:</strong> {raffleDetails.ticketsSold !== undefined ? raffleDetails.ticketsSold : "N/A"}</p>
      <p><strong>Percentual para Encerramento:</strong> {raffleDetails.percentageThreshold || 0}%</p>

      {raffleDetails.winningTicket > 0 && (
        <div>
          <p><strong>Número Vencedor:</strong> {raffleDetails.winningTicket}</p>
          <p><strong>Ganhador:</strong> {raffleDetails.winner}</p>
        </div>
      )}

      {raffleDetails.isActive && ( // Só exibe a opção de compra se a rifa estiver ativa
        <div>
          <input
            type="number"
            placeholder="Digite o número do bilhete"
            value={ticketNumber}
            onChange={e => setTicketNumber(e.target.value)}
          />
          <button onClick={handleBuyTicket}>Comprar Bilhete</button>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </li>
  );
}

export default BuyRafflePage;
