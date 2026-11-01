import type { BaseApiClient } from '../api-client';
import type { User, UserListResponse, UserWriteRequest, UserWriteResponse } from '../models/resources';

export class UserService {
  constructor(private readonly client: BaseApiClient) {}

  getUser(id: number): Promise<{ data: User }> {
    return this.client.get(`/api/users/${id}`);
  }

  listUsers(page: number): Promise<UserListResponse> {
    return this.client.get(`/api/users?page=${page}`);
  }

  createUser(user: UserWriteRequest): Promise<UserWriteResponse> {
    return this.client.post('/api/users', user, { expectedStatus: 201 });
  }

  updateUser(
    id: number,
    user: UserWriteRequest,
  ): Promise<UserWriteResponse> {
    return this.client.put(`/api/users/${id}`, user);
  }

  deleteUser(id: number): Promise<void> {
    return this.client.delete(`/api/users/${id}`, { expectedStatus: 204 });
  }
}