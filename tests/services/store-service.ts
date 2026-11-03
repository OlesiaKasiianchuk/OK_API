import type { BaseApiClient } from '../api-client';
import type { StoreOrder } from '../models/resources';

export class StoreService {
  constructor(private readonly client: BaseApiClient) {}

  placeOrder(order: StoreOrder): Promise<StoreOrder> {
    return this.client.post('/store/order', order);
  }

  getOrder(id: number): Promise<StoreOrder> {
    return this.client.get(`/store/order/${id}`);
  }

  deleteOrder(
    id: number,
    expectedStatus: number | number[] = 200,
  ): Promise<void> {
    return this.client.delete(`/store/order/${id}`, { expectedStatus });
  }
}
