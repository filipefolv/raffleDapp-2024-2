import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import RaffleABI from './artifacts/contracts/Raffle.sol/Raffle.json';

function MyCreatedRafflesPage({ factoryContract, provider, account, setCurrentPage }) {
  const [createdRaffles, setCreatedRaffles] = useState([]);
  const [status, setStatus] = useState("");
  const [winningTicketInput, setWinningTicketInput] = useState("");
  const [invalidTickets, setInvalidTickets] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

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

          // Verifica se o contrato pode ser acessado
          const organizer = await raffleContract.organizer();
          if (organizer.toLowerCase() === account.toLowerCase()) {
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
              organizer,
            });
          }
        } catch (err) {
          console.error("Erro ao acessar contrato da rifa:", raffleAddress, err);
          continue; // Ignora contratos que não podem ser acessados
        }
      }
      setCreatedRaffles(myRaffles);
    } catch (err) {
      console.error("Erro ao carregar rifas criadas:", err);
      setStatus("Erro ao carregar rifas criadas.");
    }
  }, [factoryContract, provider, account]);

  const handleSetWinningTicket = async (raffleAddress) => {
    try {
      const signer = provider.getSigner();
      const raffleContract = new ethers.Contract(raffleAddress, RaffleABI.abi, signer);

      // Verifica se o número já foi tentado e é inválido
      if (invalidTickets.includes(Number(winningTicketInput))) {
        setStatus("Este número já foi tentado e é inválido. Escolha outro.");
        return;
      }

      // Verifica se o número escolhido é um bilhete vendido
      const ticketBuyer = await raffleContract.ticketToBuyer(Number(winningTicketInput));
      if (ticketBuyer === ethers.constants.AddressZero) {
        setStatus("Número inválido. Este bilhete não foi vendido.");
        setInvalidTickets([...invalidTickets, Number(winningTicketInput)]); // Adiciona à lista de números inválidos
        return;
      }

      // Define o número vencedor
      const tx = await raffleContract.setWinningTicket(Number(winningTicketInput));
      await tx.wait();

      // Feedback visual de sucesso
      setSuccessMessage(`Número vencedor ${winningTicketInput} definido com sucesso!`);
      setStatus(""); // Limpa mensagens de erro
      setInvalidTickets([]); // Limpa a lista de números inválidos
      setWinningTicketInput(""); // Limpa o campo de entrada

      // Atualiza a lista de rifas
      loadRaffles();
    } catch (err) {
      console.error("Erro ao definir número vencedor:", err);
      setStatus("Erro ao definir número vencedor: " + err.message);
    }
  };

  useEffect(() => {
    loadRaffles();
  }, [loadRaffles]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Minhas Rifas Criadas</h2>
      {createdRaffles.length > 0 ? (
        createdRaffles.map((raffle, index) => (
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
              </div>
            ) : (
              <p>Resultado ainda não registrado.</p>
            )}
            {!raffle.isActive && 
             raffle.organizer.toLowerCase() === account.toLowerCase() && 
             raffle.winningTicket === 0 && ( // Só exibe se o número vencedor ainda não foi definido
              <div>
                <input
                  type="number"
                  placeholder="Digite o número vencedor"
                  value={winningTicketInput}
                  onChange={(e) => setWinningTicketInput(e.target.value)}
                />
                <button onClick={() => handleSetWinningTicket(raffle.address)}>Definir Número Vencedor</button>
                {status && <p style={{ color: 'red' }}>{status}</p>}
                {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
              </div>
            )}
          </div>
        ))
      ) : (
        <p>Você ainda não criou nenhuma rifa.</p>
      )}
      <p>{status}</p>
      <button onClick={() => setCurrentPage("landing")}>Voltar à Pagina Inicial</button>
    </div>
  );
}

export default MyCreatedRafflesPage;
