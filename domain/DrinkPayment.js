/**
 * DOMAIN LAYER — DrinkPayment
 * Handles a single purchase: coin insertion, dispensing, and refund.
 * Receives a drink object (from VendingMachine.findDrink) to pay for.
 */

import { formatCents } from './VendingMachine.js';

const VALID_COINS = [25, 50, 100];

export class DrinkPayment {
  constructor() {
    this.drink = null;
    this.insertedAmount = 0; // in cents
  }

  /**
   * Start a payment session for the given drink.
   * Resets any previous state.
   */
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

  /**
   * Attempt to dispense the drink.
   * @returns {{ success: boolean, change: number, dispensed?: object, message: string }}
   */
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
