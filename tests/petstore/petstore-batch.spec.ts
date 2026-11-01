import { nextPetId } from '../factories/petstore';
import { ApiError, expect, test } from '../fixtures/api';

test('batch pet lookups retain successes when one lookup returns 404', async ({
  petService,
  seededPet,
}) => {
  const results = await Promise.allSettled([
    petService.getPet(seededPet.id),
    petService.getPet(nextPetId()),
  ]);

  const foundPet = results[0];
  expect(foundPet.status).toBe('fulfilled');
  if (foundPet.status !== 'fulfilled') {
    throw foundPet.reason;
  }
  expect(foundPet.value).toMatchObject(seededPet);

  const missingPet = results[1];
  expect(missingPet.status).toBe('rejected');
  if (missingPet.status !== 'rejected') {
    throw new Error('Expected the missing pet lookup to reject.');
  }
  expect(missingPet.reason).toBeInstanceOf(ApiError);
  expect((missingPet.reason as ApiError).status).toBe(404);
});
