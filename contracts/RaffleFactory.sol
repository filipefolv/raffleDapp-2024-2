// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Raffle.sol";

contract RaffleFactory {
    address public owner;
    Raffle[] public raffles;

    event RaffleCreated(address indexed raffleAddress, address indexed organizer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Somente o dono pode executar esta funcao");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Cria uma nova rifa passando msg.sender como organizador
    function createRaffle(
        uint256 _totalTickets,
        uint256 _ticketPrice,
        uint256 _percentageThreshold
    ) external {
        require(_totalTickets > 0, "O numero de bilhetes deve ser maior que zero");
        require(_ticketPrice > 0, "O preco do bilhete deve ser maior que zero");
        require(_percentageThreshold > 0 && _percentageThreshold <= 100, "O percentual deve estar entre 1 e 100");

        Raffle raffle = new Raffle(msg.sender, _totalTickets, _ticketPrice, _percentageThreshold);
        raffles.push(raffle);
        emit RaffleCreated(address(raffle), msg.sender);
    }

    // Retorna a lista de todas as rifas criadas
    function getRaffles() external view returns (Raffle[] memory) {
        return raffles;
    }

    // Verifica se um endereço de rifa é válido
    function isRaffleValid(address raffleAddress) external view returns (bool) {
        for (uint256 i = 0; i < raffles.length; i++) {
            if (address(raffles[i]) == raffleAddress) {
                return true;
            }
        }
        return false;
    }

    fallback() external payable {
        revert("Funcao nao suportada");
    }

    receive() external payable {
        revert("Nao aceita Ether diretamente");
    }
}
