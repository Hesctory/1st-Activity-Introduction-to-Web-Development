/**
 * ADAPTER LAYER — DrinksRepository
 * Responsible for fetching data from the external Web Service.
 * Returns plain objects; knows nothing about the DOM or domain rules.
 */

const API_URL = 'https://api.jsonbin.io/v3/b/69d64173aaba882197d7779a';

export async function fetchDrinks() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch drinks: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  // normalize: return the bebidas array
  return json.record.bebidas;
}
