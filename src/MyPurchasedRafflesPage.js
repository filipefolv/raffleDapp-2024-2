import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import RaffleABI from './artifacts/contracts/Raffle.sol/Raffle.json';

function MyPurchasedRafflesPage({ factoryContract, provider, account, setCurrentPage }) {
  const [purchasedRaffles, setPurchasedRaffles] = useState([]);
  const [status, setStatus] = useState("");

  const loadRaffles = useCallback(async () => {
    if (!factoryContract || !account) return;
    try {
      const rafflesArray = await factoryContract.getRaffles();
      const signer = provider.getSigner();
      const myRaffles = [];
      for (let i = 0; i < rafflesArray.length; i++) {
        const raffleAddress = rafflesArray[i];

        // Verifica se o endereço da rifa é válido
        if (raffleAddress === ethers.constants.AddressZero) {
          console.warn("Endereço de rifa inválido:", raffleAddress);
          continue; // Ignora endereços inválidos
        }

        try {
          const raffleContract = new ethers.Contract(raffleAddress, RaffleABI.abi, signer);
          // Verifica se o usuário é o organizador da rifa
          const organizer = await raffleContract.organizer();
          if (organizer.toLowerCase() === account.toLowerCase()) {
            continue; // Ignora rifas criadas pelo próprio usuário
          }
          // Verifica se o usuário comprou bilhetes nesta rifa
          const myTickets = await raffleContract.getMyTickets({ from: account });
          if (myTickets.length > 0) {
            // Carrega os detalhes da rifa
            const totalTickets = await raffleContract.totalTickets();
            const ticketPrice = await raffleContract.ticketPrice();
            const ticketsSold = await raffleContract.ticketsSold();
            const percentageThreshold = await raffleContract.percentageThreshold();
            const isActive = await raffleContract.isRaffleActive();
            const winningTicket = await raffleContract.winningTicket();
            const winner = await raffleContract.winner();

            myRaffles.push({
              address: raffleAddress,
              totalTickets: totalTickets.toNumber(),
              ticketPrice: ethers.utils.formatEther(ticketPrice),
              ticketsSold: ticketsSold.toNumber(),
              percentageThreshold: percentageThreshold.toNumber(),
              isActive,
              winningTicket: winningTicket.toNumber(),
              winner,
              myTickets: myTickets.map(t => t.toNumber()), // Bilhetes comprados pelo usuário
            });
          }
        } catch (err) {
          console.error("Erro ao acessar contrato da rifa:", raffleAddress, err);
          continue; // Ignora contratos que não podem ser acessados
        }
      }
      setPurchasedRaffles(myRaffles);
    } catch (err) {
      console.error("Erro ao carregar rifas compradas:", err);
      setStatus("Erro ao carregar rifas compradas.");
    }
  }, [factoryContract, provider, account]);

  useEffect(() => {
    loadRaffles();
  }, [loadRaffles]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Minhas Rifas Compradas</h2>
      {purchasedRaffles.length > 0 ? (
        purchasedRaffles.map((raffle, index) => (
          <div key={index} style={{ border: '1px solid blue', padding: 10, marginBottom: 10 }}>
            <p><strong>Endereço da Rifa:</strong> {raffle.address}</p>
            <p><strong>Total de Bilhetes:</strong> {raffle.totalTickets}</p>
            <p><strong>Preço por Bilhete:</strong> {raffle.ticketPrice} ETH</p>
            <p><strong>Bilhetes Vendidos:</strong> {raffle.ticketsSold}</p>
            <p><strong>Percentual para Encerramento:</strong> {raffle.percentageThreshold}%</p>
            {raffle.winningTicket > 0 ? (
              <div>
                <p><strong>Número Vencedor:</strong> {raffle.winningTicket}</p>
                <p><strong>Ganhador:</strong> {raffle.winner}</p>
                {raffle.winner.toLowerCase() === account.toLowerCase() && (
                  <p style={{ color: 'green', fontWeight: 'bold' }}>🎉 Parabéns! Você ganhou esta rifa! 🎉</p>
                )}
              </div>
            ) : (
              <p>Resultado ainda não registrado.</p>
            )}
            <p><strong>Meus Bilhetes:</strong> {raffle.myTickets.join(", ")}</p>
          </div>
        ))
      ) : (
        <p>Você ainda não comprou bilhetes em nenhuma rifa.</p>
      )}
      <p>{status}</p>
      <button onClick={() => setCurrentPage("landing")}>Voltar à Pagina inicial</button>
    </div>
  );
}

export default MyPurchasedRafflesPage;
