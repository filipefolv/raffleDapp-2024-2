import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import RaffleFactoryABI from './artifacts/contracts/RaffleFactory.sol/RaffleFactory.json';
import RaffleABI from './artifacts/contracts/Raffle.sol/Raffle.json';

// Importe as páginas
import LandingPage from './LandingPage';
import CreateRafflePage from './CreateRafflePage';
import BuyRafflePage from './BuyRafflePage';
import MyCreatedRafflesPage from './MyCreatedRafflesPage';
import MyPurchasedRafflesPage from './MyPurchasedRafflesPage';

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [factoryContract, setFactoryContract] = useState(null);
  const [contractError, setContractError] = useState("");
  const [notifications, setNotifications] = useState([]);

  // Endereço do contrato RaffleFactory (substitua pelo endereço correto)
  const FACTORY_ADDRESS = "0xD082e9b22515E943c234A23BD6496c6D3815d8d1";

  // currentPage controla a página exibida
  const [currentPage, setCurrentPage] = useState("landing");

  // Função para adicionar notificações
  const addNotification = (message) => {
    setNotifications((prev) => [...prev, message]);
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1)); // Remove a notificação mais antiga após 5 segundos
    }, 5000);
  };

  // Configura os listeners de eventos
  const setupEventListeners = useCallback(
    (factory) => {
      if (!provider || !account) return; // Verifica se provider e account estão definidos

      // Evento: Nova rifa criada
      factory.on("RaffleCreated", (raffleAddress, organizer) => {
        if (organizer.toLowerCase() === account.toLowerCase()) {
          addNotification(`Você criou uma nova rifa: ${raffleAddress}`);
        } else {
          addNotification(`Nova rifa criada por ${organizer}: ${raffleAddress}`);
        }

        // Configura listeners para eventos do contrato Raffle
        const raffleContract = new ethers.Contract(raffleAddress, RaffleABI.abi, provider.getSigner());

        // Evento: Bilhete comprado
        raffleContract.on("TicketPurchased", (buyer, ticketNumber) => {
          if (buyer.toLowerCase() === account.toLowerCase()) {
            addNotification(`Você comprou o bilhete ${ticketNumber} na rifa ${raffleAddress}`);
          } else {
            addNotification(`O usuário ${buyer} comprou o bilhete ${ticketNumber} na sua rifa ${raffleAddress}`);
          }
        });

        // Evento: Rifa encerrada
        raffleContract.on("RaffleEnded", (winningTicket, winner) => {
          if (winner.toLowerCase() === account.toLowerCase()) {
            addNotification(`🎉 Parabéns! Você ganhou a rifa ${raffleAddress} com o bilhete ${winningTicket}! 🎉`);
          } else {
            addNotification(`A rifa ${raffleAddress} foi encerrada. O vencedor é ${winner} com o bilhete ${winningTicket}.`);
          }
        });
      });
    },
    [provider, account] // Dependências do useCallback
  );

  // Conecta a carteira e configura o contrato
  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
        await tempProvider.send("eth_requestAccounts", []);
        setProvider(tempProvider);
        const signer = tempProvider.getSigner();
        const userAddress = await signer.getAddress();
        setAccount(userAddress);

        // Verifica se o contrato RaffleFactory foi implantado corretamente
        try {
          const factory = new ethers.Contract(FACTORY_ADDRESS, RaffleFactoryABI.abi, signer);
          setFactoryContract(factory);

          // Configura os listeners de eventos
          setupEventListeners(factory);

          // Verifica se o contrato está acessível
          const owner = await factory.owner();
          if (!owner) {
            setContractError("Erro ao acessar o contrato RaffleFactory. Verifique o endereço e o ABI.");
          }
        } catch (err) {
          console.error("Erro ao acessar o contrato RaffleFactory:", err);
          setContractError("Erro ao acessar o contrato RaffleFactory. Verifique o endereço e o ABI.");
        }
      } catch (err) {
        console.error("Erro ao conectar carteira:", err);
      }
    } else {
      alert("Por favor, instale o MetaMask!");
    }
  }, [setupEventListeners]); // Dependências do useCallback

  // Tenta conectar a carteira caso ainda não tenha conta definida
  useEffect(() => {
    if (window.ethereum && !account) {
      connectWallet();
    }
  }, [connectWallet, account]); // Dependências do useEffect

  // Renderiza a página atual
  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage setCurrentPage={setCurrentPage} />;
      case "create":
        return (
          <CreateRafflePage
            provider={provider}
            account={account}
            factoryContract={factoryContract}
            setCurrentPage={setCurrentPage}
          />
        );
      case "buy":
        return (
          <BuyRafflePage
            provider={provider}
            account={account}
            factoryContract={factoryContract}
            setCurrentPage={setCurrentPage}
          />
        );
      case "myCreated":
        return (
          <MyCreatedRafflesPage
            provider={provider}
            account={account}
            factoryContract={factoryContract}
            setCurrentPage={setCurrentPage}
          />
        );
      case "myPurchased":
        return (
          <MyPurchasedRafflesPage
            provider={provider}
            account={account}
            factoryContract={factoryContract}
            setCurrentPage={setCurrentPage}
          />
        );
      default:
        return <LandingPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>RaffleDapp</h1>
      {!account ? (
        <button onClick={connectWallet}>Conectar Carteira</button>
      ) : (
        <div>
          <p>Conectado: {account}</p>
          {contractError && <p style={{ color: 'red' }}>{contractError}</p>}
          {/* Exibe notificações */}
          <div style={{ marginBottom: 10 }}>
            {notifications.map((msg, index) => (
              <div key={index} style={{ padding: 5, background: '#e0e0e0', marginBottom: 5 }}>
                {msg}
              </div>
            ))}
          </div>
          {renderPage()}
        </div>
      )}
    </div>
  );
}

export default App;
