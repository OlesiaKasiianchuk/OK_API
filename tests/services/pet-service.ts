import type { BaseApiClient } from '../api-client';
import type { Pet, PetStatus } from '../models/resources';

export class PetService {
  constructor(private readonly client: BaseApiClient) {}

  createPet(pet: Pet): Promise<Pet> {
    return this.client.post('/pet', pet);
  }

  getPet(id: number): Promise<Pet> {
    return this.client.get(`/pet/${id}`);
  }

  updatePet(pet: Pet): Promise<Pet> {
    return this.client.put('/pet', pet);
  }

  findByStatus(status: PetStatus): Promise<Pet[]> {
    return this.client.get(`/pet/findByStatus?status=${status}`);
  }

  deletePet(id: number, expectedStatus: number | number[] = 200): Promise<void> {
    return this.client.delete(`/pet/${id}`, { expectedStatus });
  }
}
