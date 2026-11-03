import { expect, test } from '../fixtures/api';

test.describe('Petstore orders', () => {
  test('POST /store/order creates an order for the test pet', async ({
    placeOrder,
    seededPet,
  }) => {
    const order = await placeOrder({ petId: seededPet.id, quantity: 2 });

    expect(order).toMatchObject({
      petId: seededPet.id,
      quantity: 2,
      status: 'placed',
    });
    expect(order.id).toBeGreaterThan(0);
  });

  test('DELETE /store/order/:id removes the test order', async ({
    seededOrder,
    storeService,
  }) => {
    await storeService.deleteOrder(seededOrder.id);

    await expect(storeService.getOrder(seededOrder.id)).rejects.toMatchObject({
      status: 404,
    });
  });
});
