import { ApiError, expect, test } from '../fixtures/api';

test('polls until an API-created pet is available', async ({
  createPet,
  petService,
}) => {
  const pet = await test.step('Start the pet creation operation', () =>
    createPet(),
  );

  await test.step('Poll until the pet can be retrieved', async () => {
    await expect
      .poll(
        async () => {
          try {
            return (await petService.getPet(pet.id)).id;
          } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
              return null;
            }
            throw error;
          }
        },
        {
          message: `Pet ${pet.id} should become available`,
          timeout: 15_000,
          intervals: [250, 500, 1_000],
        },
      )
      .toBe(pet.id);
  });
});
