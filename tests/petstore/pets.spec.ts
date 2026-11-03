import { buildPet } from '../factories/petstore';
import { expect, test } from '../fixtures/api';

test.describe('Petstore pets', () => {
  test('@smoke POST /pet creates a pet with a category and tags', async ({
    createPet,
  }) => {
    const pet = buildPet();
    const createdPet = await createPet(pet);

    expect(createdPet).toMatchObject(pet);
    expect(createdPet.category).toEqual(pet.category);
    expect(createdPet.tags).toEqual(pet.tags);
  });

  test('@smoke GET /pet/:id returns the created pet', async ({
    petService,
    seededPet,
  }) => {
    expect(await petService.getPet(seededPet.id)).toMatchObject(seededPet);
  });

  test('@smoke PUT /pet updates the pet and persists the changes', async ({
    petService,
    seededPet,
  }) => {
    const updatedPet = {
      ...seededPet,
      name: `${seededPet.name}-updated`,
      status: 'sold' as const,
    };

    expect(await petService.updatePet(updatedPet)).toMatchObject(updatedPet);
    expect(await petService.getPet(seededPet.id)).toMatchObject(updatedPet);
  });

  test('@smoke GET /pet/findByStatus returns the pet with the requested status', async ({
    petService,
    seededPet,
  }) => {
    const pets = await petService.findByStatus(seededPet.status);

    expect(pets.find((pet) => pet.id === seededPet.id)).toMatchObject(
      seededPet,
    );
  });

  test('@smoke DELETE /pet/:id removes the pet', async ({ petService, seededPet }) => {
    await petService.deletePet(seededPet.id);

    await expect(petService.getPet(seededPet.id)).rejects.toMatchObject({
      status: 404,
    });
  });
});