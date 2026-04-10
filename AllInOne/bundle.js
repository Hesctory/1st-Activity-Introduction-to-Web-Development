/*
  THIS FILE IS MADE WITH NO ARCHITECTURE, JUST TO SHOW IT
  WHEN OPENING THE HTML FILE WITHOUT A SERVER RUNING
  TO USE THIS, YOU HAVE TO CAHNGE THE <SCRIPT SRC> IN THE HTML, AND DELETE THE PROP: TYPE="MODULE"
  IF YOU'RE USING THE VERSION WITH HEXAGONAL ARCHITECTURE, THIS FILE IS USELESS, AND YOU'LL HAVE TO RUN A SERVER
  FOR EXAMPLE, I LIKE TO JUST USE THE EXTENSION "Live Server" IN VS CODE, AND THEN OPEN THE HTML FILE WITH IT
*/

/* VendingMachine (domain)  */

class VendingMachine {
  constructor() {
    this.drinks = [];
  }

  loadDrinks(drinks) {
    this.drinks = drinks.map(d => ({
      ...d,
      preco: Math.round(d.preco * 100),
    }));
  }

  getDrinks() {
    return this.drinks;
  }

  findDrink(sabor) {
    const drink = this.drinks.find(d => d.sabor === sabor);
    if (!drink) throw new Error(`Drink not found: ${sabor}`);
    return drink;
  }
}

function formatCents(cents) {
  return (cents / 100).toFixed(2).replace('.', ',');
}

/*  DrinkPayment (domain)  */

const VALID_COINS = [25, 50, 100];

class DrinkPayment {
  constructor() {
    this.drink = null;
    this.insertedAmount = 0;
  }

  begin(drink) {
    this.drink = drink;
    this.insertedAmount = 0;
  }

  insertCoin(valueInCents) {
    if (!VALID_COINS.includes(valueInCents)) {
      throw new Error(`Invalid coin: ${valueInCents}`);
    }
    this.insertedAmount += valueInCents;
    return this.insertedAmount;
  }

  tryDispense() {
    if (!this.drink) {
      return { success: false, change: 0, message: 'Nenhum refrigerante selecionado.' };
    }
    if (this.insertedAmount < this.drink.preco) {
      const missing = this.drink.preco - this.insertedAmount;
      return {
        success: false,
        change: 0,
        message: `Insira mais R$ ${formatCents(missing)} para liberar ${this.drink.sabor}.`,
      };
    }

    const change = this.insertedAmount - this.drink.preco;
    const dispensed = this.drink;

    this.drink = null;
    this.insertedAmount = 0;

    return {
      success: true,
      change,
      dispensed,
      message:
        change > 0
          ? `Refrigerante ${dispensed.sabor} liberado! Troco: R$ ${formatCents(change)}.`
          : `Refrigerante ${dispensed.sabor} liberado!`,
    };
  }

  cancelAndRefund() {
    const refund = this.insertedAmount;
    this.drink = null;
    this.insertedAmount = 0;
    return refund;
  }

  getInsertedAmountInReais() {
    return this.insertedAmount / 100;
  }
}

/*  DrinksRepository (adapter)  */

async function fetchDrinks() {
  const API_URL = 'https://api.jsonbin.io/v3/b/69d64173aaba882197d7779a';
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch drinks: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  return json.record.bebidas;
}

/*  UI  */

const machine = new VendingMachine();
const payment = new DrinkPayment();

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
  drinks.forEach(drink => {
    const btn = document.createElement('button');
    btn.className = 'drink-card';
    btn.dataset.sabor = drink.sabor;
    btn.setAttribute('role', 'listitem');
    btn.innerHTML = `
      <img src="${drink.imagem}" alt="${drink.sabor}" />
      <span class="drink-name">${drink.sabor}</span>
      <span class="drink-price">R$ ${(drink.preco / 100).toFixed(2).replace('.', ',')}</span>
    `;
    btn.addEventListener('click', () => goToPayment(drink.sabor));
    drinkGrid.appendChild(btn);
  });
}

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

backBtn.addEventListener('click', goToSelection);

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

function updateDisplay() {
  displayAmount.textContent = `R$ ${payment.getInsertedAmountInReais().toFixed(2).replace('.', ',')}`;
}

function showMessage(text, type = 'info') {
  displayMsg.textContent = text;
  displayMsg.className = `message ${type}`;
}

init();
