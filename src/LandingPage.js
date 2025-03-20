// src/LandingPage.js
import React from 'react';

function LandingPage({ setCurrentPage }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h2>Bem-vindo ao RaffleDapp!</h2>
      <p>Escolha uma opção:</p>
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
        <button onClick={() => setCurrentPage("create")}>Criar Rifa</button>
        <button onClick={() => setCurrentPage("buy")}>Comprar Rifa</button>
        <button onClick={() => setCurrentPage("myCreated")}>Minhas Rifas Criadas</button>
        <button onClick={() => setCurrentPage("myPurchased")}>Minhas Rifas Compradas</button>
      </div>
    </div>
  );
}

export default LandingPage;

