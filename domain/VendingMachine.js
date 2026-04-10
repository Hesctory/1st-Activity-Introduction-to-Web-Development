/**
 * DOMAIN LAYER — VendingMachine
 * Manages the drink catalog and drink selection.
 * No payment logic here.
 */

export class VendingMachine {
  constructor() {
    this.drinks = [];
  }

  loadDrinks(drinks) {
    this.drinks = drinks.map(d => ({
      ...d,
      preco: Math.round(d.preco * 100), // store in cents
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

export function formatCents(cents) {
  return (cents / 100).toFixed(2).replace('.', ',');
}
