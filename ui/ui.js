/**
 * UI LAYER — ui.js
 * Handles all DOM rendering, drag-and-drop, and UI events.
 * Calls domain methods and adapter; never contains business rules.
 */

import { VendingMachine, formatCents } from '../domain/VendingMachine.js';
import { DrinkPayment } from '../domain/DrinkPayment.js';
import { fetchDrinks } from '../adapters/drinksRepository.js';

const machine  = new VendingMachine();
const payment  = new DrinkPayment();

//  DOM refs 
const selectionView     = document.getElementById('selection-view');
const paymentView       = document.getElementById('payment-view');
const drinkGrid         = document.getElementById('drink-grid');
const displayAmount     = document.getElementById('display-amount');
const displayMsg        = document.getElementById('display-message');
const dropZone          = document.getElementById('drop-zone');
const cancelBtn         = document.getElementById('btn-cancel');
const backBtn           = document.getElementById('btn-back');
const dispenseTray      = document.getElementById('dispense-tray');
const paymentDrinkImg   = document.getElementById('payment-drink-img');
const paymentDrinkName  = document.getElementById('payment-drink-name');
const paymentDrinkPrice = document.getElementById('payment-drink-price');

async function init() {
  try {
    const drinks = await fetchDrinks();
    machine.loadDrinks(drinks);
    renderDrinkGrid(machine.getDrinks());
  } catch (err) {
    drinkGrid.innerHTML = '<p class="load-error">Erro ao carregar bebidas. Tente recarregar.</p>';
    console.error(err);
  }
}

function renderDrinkGrid(drinks) {
  drinkGrid.innerHTML = '';
  drinks.forEach((drink, index) => {
    const code = String.fromCharCode(65 + Math.floor(index / 4)) + ((index % 4) + 1);
    const btn = document.createElement('button');
    btn.className = 'drink-card';
    btn.dataset.sabor = drink.sabor;
    btn.setAttribute('role', 'listitem');
    btn.innerHTML = `
      <span class="drink-code">${code}</span>
      <img src="${drink.imagem}" alt="${drink.sabor}" />
      <span class="drink-name">${drink.sabor}</span>
      <span class="drink-price">R$ ${(drink.preco / 100).toFixed(2).replace('.', ',')}</span>
    `;
    btn.addEventListener('click', () => goToPayment(drink.sabor));
    drinkGrid.appendChild(btn);
  });
}

// Navigation 
function goToPayment(sabor) {
  const drink = machine.findDrink(sabor);
  payment.begin(drink);

  paymentDrinkImg.src = drink.imagem;
  paymentDrinkImg.alt = drink.sabor;
  paymentDrinkName.textContent = drink.sabor;
  paymentDrinkPrice.textContent = `R$ ${formatCents(drink.preco)}`;

  updateDisplay();
  showMessage('Insira moedas para pagar.', 'info');
  selectionView.classList.add('hidden');
  paymentView.classList.remove('hidden');
}

function goToSelection() {
  payment.cancelAndRefund();
  updateDisplay();
  paymentView.classList.add('hidden');
  selectionView.classList.remove('hidden');
}

// Back button 
backBtn.addEventListener('click', goToSelection);

// Drag and Drop 
document.querySelectorAll('.coin').forEach(coin => {
  coin.addEventListener('dragstart', e => {
    e.dataTransfer.setData('coinValue', coin.dataset.value);
    coin.classList.add('dragging');
  });
  coin.addEventListener('dragend', () => coin.classList.remove('dragging'));
});

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const value = parseInt(e.dataTransfer.getData('coinValue'), 10);
  handleCoinInserted(value);
});

function handleCoinInserted(valueInCents) {
  payment.insertCoin(valueInCents);
  updateDisplay();
  animateCoinDrop();

  const result = payment.tryDispense();
  if (result.success) {
    handleDispense(result);
  } else if (payment.insertedAmount > 0 && payment.drink) {
    const missing = payment.drink.preco - payment.insertedAmount;
    if (missing > 0) {
      showMessage(`Faltam R$ ${formatCents(missing)}.`, 'info');
    }
  }
}

// Dispense 
function handleDispense(result) {
  showMessage(result.message, 'success');
  updateDisplay();
  animateDispense(result.dispensed);
  setTimeout(goToSelection, 4000);
}

function animateDispense(drink) {
  dispenseTray.innerHTML = '';
  const img = document.createElement('img');
  img.src = drink.imagem;
  img.alt = drink.sabor;
  img.className = 'dispensed-drink';
  dispenseTray.appendChild(img);
  dispenseTray.classList.add('show');
  setTimeout(() => {
    dispenseTray.classList.remove('show');
    dispenseTray.innerHTML = '';
  }, 3500);
}

function animateCoinDrop() {
  dropZone.classList.add('coin-received');
  setTimeout(() => dropZone.classList.remove('coin-received'), 300);
}

// Cancel / Refund 
cancelBtn.addEventListener('click', () => {
  const refund = payment.cancelAndRefund();
  updateDisplay();
  if (refund > 0) {
    showMessage(`Operação cancelada. Troco: R$ ${formatCents(refund)}.`, 'warning');
    setTimeout(goToSelection, 2000);
  } else {
    goToSelection();
  }
});

// Helpers 
function updateDisplay() {
  displayAmount.textContent = `R$ ${payment.getInsertedAmountInReais().toFixed(2).replace('.', ',')}`;
}

function showMessage(text, type = 'info') {
  displayMsg.textContent = text;
  displayMsg.className = `message ${type}`;
}

init();
