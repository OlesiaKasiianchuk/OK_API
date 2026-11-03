import type { Pet, StoreOrder } from '../models/resources';
/**
 * Factory functions for creating test data for the Petstore API.
 */
export function nextPetId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

/**
 * Generates a unique ID for a new order.
 */
export function nextOrderId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}
/**
 * Builds a new Pet object with default values, allowing overrides.
 */
export function buildPet(overrides: Partial<Pet> = {}): Pet {
  const id = overrides.id ?? nextPetId();
  return {
    id,
    category: { id: 7, name: 'test category' },
    name: `test-pet-${id}`,
    photoUrls: ['https://example.com/test-pet.jpg'],
    tags: [{ id: 11, name: 'playwright' }],
    status: 'available',
    ...overrides,
  };
}

/**
 * Builds a new StoreOrder object with default values, allowing overrides.
 */
export function buildOrder(
  overrides: Partial<StoreOrder> & Pick<StoreOrder, 'petId'>,
): StoreOrder {
  return {
    id: nextOrderId(),
    quantity: 1,
    shipDate: new Date().toISOString(),
    status: 'placed',
    complete: true,
    ...overrides,
  };
}
