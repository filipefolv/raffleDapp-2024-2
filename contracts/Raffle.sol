// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Raffle {
    // Dados básicos da rifa
    address public organizer;
    uint256 public ticketPrice;
    uint256 public totalTickets;
    uint256 public ticketsSold;
    bool public isRaffleActive;

    // Dados para término por porcentagem
    uint256 public percentageThreshold; // Ex: 80 para 80%

    // Resultado: número vencedor e ganhador (registrado manualmente)
    uint256 public winningTicket;   // 0 se não definido
    address public winner;

    mapping(uint256 => address) public ticketToBuyer;
    uint256[] public availableTickets;

    event RaffleCreated(
        address indexed organizer,
        uint256 totalTickets,
        uint256 ticketPrice,
        uint256 percentageThreshold
    );
    event TicketPurchased(address indexed buyer, uint256 ticketNumber);
    event RaffleEnded(uint256 winningTicket, address winner);

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Somente o organizador");
        _;
    }

    modifier raffleActive() {
        require(isRaffleActive, "Rifa nao esta ativa");
        _;
    }

    // O construtor recebe:
    // _organizer: endereço do organizador (quem cria a rifa)
    // _totalTickets: total de bilhetes
    // _ticketPrice: preço de cada bilhete (em wei)
    // _percentageThreshold: percentual (1 a 100) necessário para encerrar
    constructor(
        address _organizer,
        uint256 _totalTickets,
        uint256 _ticketPrice,
        uint256 _percentageThreshold
    ) {
        require(_organizer != address(0), "Endereco do organizador invalido");
        require(_totalTickets > 0, "O numero de bilhetes deve ser maior que zero");
        require(_ticketPrice > 0, "O preco do bilhete deve ser maior que zero");
        require(_percentageThreshold > 0 && _percentageThreshold <= 100, "Percentual invalido");

        organizer = _organizer;
        totalTickets = _totalTickets;
        ticketPrice = _ticketPrice;
        percentageThreshold = _percentageThreshold;
        isRaffleActive = true;

        for (uint256 i = 1; i <= _totalTickets; i++) {
            availableTickets.push(i);
        }

        emit RaffleCreated(organizer, _totalTickets, _ticketPrice, _percentageThreshold);
    }

    // Compra um bilhete
    function buyTicket(uint256 ticketNumber) external payable raffleActive {
        require(ticketNumber > 0 && ticketNumber <= totalTickets, "Numero de bilhete invalido");
        require(ticketToBuyer[ticketNumber] == address(0), "Bilhete ja comprado");
        require(msg.value == ticketPrice, "Valor incorreto");
        require(isTicketAvailable(ticketNumber), "Bilhete nao disponivel");

        ticketToBuyer[ticketNumber] = msg.sender;
        ticketsSold++;
        removeTicket(ticketNumber);
        emit TicketPurchased(msg.sender, ticketNumber);

        // Verifica se a rifa deve ser encerrada com base no percentual
        uint256 threshold = calculateThreshold();
        if (ticketsSold >= threshold || ticketsSold >= totalTickets) {
            endRaffle();
        }
    }

    // Calcula o limite de bilhetes vendidos para PercentageBased
    function calculateThreshold() internal view returns (uint256) {
        uint256 product = totalTickets * percentageThreshold;
        uint256 threshold = product / 100;
        if (product % 100 > 0) {
            threshold++;
        }
        return threshold;
    }

    // Verifica se um bilhete está disponível
    function isTicketAvailable(uint256 ticketNumber) internal view returns (bool) {
        for (uint256 i = 0; i < availableTickets.length; i++) {
            if (availableTickets[i] == ticketNumber) {
                return true;
            }
        }
        return false;
    }

    // Remove um bilhete da lista de disponíveis
    function removeTicket(uint256 ticketNumber) internal {
        uint256 length = availableTickets.length;
        for (uint256 i = 0; i < length; i++) {
            if (availableTickets[i] == ticketNumber) {
                availableTickets[i] = availableTickets[length - 1];
                availableTickets.pop();
                break;
            }
        }
    }

    // Encerra a rifa
    function endRaffle() internal {
        isRaffleActive = false;
        emit RaffleEnded(winningTicket, winner);

        // Se nenhum bilhete foi vendido, exclui a rifa
        if (ticketsSold == 0) {
            selfdestruct(payable(organizer));
        }
    }

    // O organizador registra manualmente o número vencedor
    function setWinningTicket(uint256 _winningTicket) external onlyOrganizer {
        require(!isRaffleActive, "Rifa ainda ativa");
        require(winningTicket == 0, "Resultado ja registrado");
        require(ticketToBuyer[_winningTicket] != address(0), "Bilhete nao vendido");
        winningTicket = _winningTicket;
        winner = ticketToBuyer[_winningTicket];
        emit RaffleEnded(_winningTicket, winner);
    }

    // Retorna os bilhetes disponíveis
    function getAvailableTickets() external view returns (uint256[] memory) {
        return availableTickets;
    }

    // Retorna os bilhetes comprados pelo chamador
    function getMyTickets() external view returns (uint256[] memory) {
        uint256[] memory myTickets = new uint256[](ticketsSold);
        uint256 count = 0;
        for (uint256 i = 1; i <= totalTickets; i++) {
            if (ticketToBuyer[i] == msg.sender) {
                myTickets[count] = i;
                count++;
            }
        }
        return myTickets;
    }

    // Retorna todos os bilhetes vendidos e seus compradores (apenas o organizador)
    function getAllTicketInfo() external view onlyOrganizer returns (uint256[] memory soldTickets, address[] memory buyers) {
        uint256[] memory tickets = new uint256[](ticketsSold);
        address[] memory addresses = new address[](ticketsSold);
        uint256 count = 0;
        for (uint256 i = 1; i <= totalTickets; i++) {
            if (ticketToBuyer[i] != address(0)) {
                tickets[count] = i;
                addresses[count] = ticketToBuyer[i];
                count++;
            }
        }
        return (tickets, addresses);
    }

    // Verifica se o usuário é o organizador
    function isOrganizer(address user) external view returns (bool) {
        return user == organizer;
    }

    fallback() external payable {
        revert("Funcao nao suportada");
    }

    receive() external payable {
        revert("Nao aceita Ether diretamente");
    }
}
