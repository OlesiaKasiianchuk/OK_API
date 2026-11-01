import { expect, test } from '../fixtures/api';

test.describe('Petstore order lifecycle', () => {
  test('retrieves, updates, and deletes the pet and order', async ({
    petService,
    seededOrder,
    seededPet,
    storeService,
  }) => {
    await test.step('3. GET order returns the order linked to the pet', async () => {
      expect(await storeService.getOrder(seededOrder.id)).toMatchObject({
        id: seededOrder.id,
        petId: seededPet.id,
      });
    });

    await test.step('4. PUT pet marks it pending and persists the change', async () => {
      const updatedPet = { ...seededPet, status: 'pending' as const };

      expect(await petService.updatePet(updatedPet)).toMatchObject(updatedPet);
      expect(await petService.getPet(seededPet.id)).toMatchObject(updatedPet);
    });

    await test.step('5. DELETE order removes it and GET returns 404', async () => {
      await storeService.deleteOrder(seededOrder.id);

      await expect(storeService.getOrder(seededOrder.id)).rejects.toMatchObject({
        status: 404,
      });
    });

    await test.step('6. DELETE pet removes it and GET returns 404', async () => {
      await petService.deletePet(seededPet.id);

      await expect(petService.getPet(seededPet.id)).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});