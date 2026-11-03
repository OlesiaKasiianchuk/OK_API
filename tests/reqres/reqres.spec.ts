import type { APIRequestContext, APIResponse } from '@playwright/test';
import { expect, test } from '../fixtures/api';
import { getApiBaseURL } from '../config/environments';

const baseURL = getApiBaseURL('reqres');
const usersPath = '/api/users';
const apiKey = process.env.REQRES_API_KEY;
const authHeaders: Record<string, string> = apiKey
  ? { 'x-api-key': apiKey }
  : {};

async function createUser(
  request: APIRequestContext,
  data: Record<string, string> | string | Buffer,
  headers: Record<string, string> = {},
): Promise<APIResponse> {
  return request.post(`${baseURL}${usersPath}`, {
    data,
    headers: { ...authHeaders, ...headers },
  });
}

test.describe('GET /api/users', () => {
  test(`GET ${usersPath}/2 returns a user with the expected fields`, async ({
    userService,
  }) => {
    const body = await userService.getUser(2);

    expect(body.data).toMatchObject({
      id: 2,
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
    });
    expect(body.data.avatar).toContain('/2-image.jpg');
  });

  test(`GET ${usersPath} validates every user and handles missing or null fields`, async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}${usersPath}?page=2`, {
      headers: authHeaders,
    });

    expect(response.status() === 200).toBe(true);

    const body: {
      data?: Array<{
        id?: number | null;
        email?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        avatar?: string | null;
      } | null> | null;
    } = await response.json();
    const users = body.data ?? [];

    expect(Array.isArray(body.data)).toBe(true);
    expect(users.length > 0).toBe(true);
    expect(
      users.every(
        (user) =>
          user !== null &&
          user.id !== undefined &&
          user.id !== null &&
          typeof user.email === 'string' &&
          typeof user.first_name === 'string' &&
          typeof user.last_name === 'string' &&
          typeof user.avatar === 'string',
      ),
    ).toBe(true);
  });
});

test.describe('POST /api/users', () => {
  test('creates a user and returns its ID', async ({ userService }) => {
    const user = { name: 'Jane', job: 'QA Engineer' };
    const body = await userService.createUser(user);
    expect(body.id).toBeTruthy();
    expect(body).toMatchObject(user);
  });

  test('accepts a request without Content-Type', async ({ request }) => {
    const response = await createUser(
      request,
      Buffer.from(JSON.stringify({ name: 'Jane', job: 'QA Engineer' })),
    );

    expect(response.status()).toBe(201);

    const body: { id: string } = await response.json();
    expect(body.id).toBeTruthy();
  });

  test('accepts a request with text/plain Content-Type', async ({
    request,
  }) => {
    const response = await createUser(
      request,
      JSON.stringify({ name: 'Jane', job: 'QA Engineer' }),
      { 'Content-Type': 'text/plain' },
    );

    expect(response.status()).toBe(201);

    const body: { id: string } = await response.json();
    expect(body.id).toBeTruthy();
  });
});

test.describe('PUT /api/users/2', () => {
  test('returns the updated user fields', async ({ userService }) => {
    const updatedUser = { name: 'Jane', job: 'Senior QA Engineer' };
    const body = await userService.updateUser(2, updatedUser);
    expect(body).toMatchObject(updatedUser);
  });
});

test.describe('PATCH /api/users/2', () => {
  test('returns the changed user field', async ({ request }) => {
    const changedFields = { job: 'Lead QA Engineer' };
    const response = await request.patch(`${baseURL}${usersPath}/2`, {
      data: changedFields,
      headers: authHeaders,
    });

    expect(response.status()).toBe(200);

    const body: { job: string } = await response.json();
    expect(body.job).toBe(changedFields.job);
  });
});

test.describe('DELETE /api/users/2', () => {
  test('returns 204 with no response body', async ({ request }) => {
    const response = await request.delete(`${baseURL}${usersPath}/2`, {
      headers: authHeaders,
    });

    expect(response.status()).toBe(204);
    expect(await response.text()).toBe('');
  });
});

test.describe('GET /api/private', () => {
  test('returns 401 without Authorization', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/private`);

    expect(response.status()).toBe(401);

    const body: { error: string } = await response.json();
    expect(body.error).toBe('missing_api_key');
  });
});
