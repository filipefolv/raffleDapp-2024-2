import React, { useState } from 'react';
import { ethers } from 'ethers';

function CreateRafflePage({ provider, account, factoryContract, setCurrentPage }) {
  const [totalTickets, setTotalTickets] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [percentageThreshold, setPercentageThreshold] = useState("");
  const [status, setStatus] = useState("");

  const createRaffle = async () => {
    if (!factoryContract) {
      alert("Contrato da fábrica não definido!");
      return;
    }
    try {
      const total = parseInt(totalTickets);
      const price = ethers.utils.parseEther(ticketPrice);
      const threshold = parseInt(percentageThreshold);

      // Cria a rifa
      const tx = await factoryContract.createRaffle(total, price, threshold);
      setStatus("Transação enviada, aguardando confirmação...");
      await tx.wait();
      setStatus("Rifa criada com sucesso!");
    } catch (err) {
      console.error("Erro ao criar rifa:", err);
      setStatus("Erro: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Criar Nova Rifa</h2>
      <div>
        <label>Total de Bilhetes: </label>
        <input
          type="number"
          value={totalTickets}
          onChange={e => setTotalTickets(e.target.value)}
          placeholder="Ex: 100"
        />
      </div>
      <div>
        <label>Preço por Bilhete (em ETH): </label>
        <input
          type="text"
          value={ticketPrice}
          onChange={e => setTicketPrice(e.target.value)}
          placeholder="Ex: 0.01"
        />
      </div>
      <div>
        <label>Percentual para Encerramento (%): </label>
        <input
          type="number"
          value={percentageThreshold}
          onChange={e => setPercentageThreshold(e.target.value)}
          placeholder="Ex: 50"
        />
      </div>
      <button onClick={createRaffle}>Criar Rifa</button>
      <p>{status}</p>
      <button onClick={() => setCurrentPage("landing")}>Voltar à Pagina Inicial</button>
    </div>
  );
}

export default CreateRafflePage;
