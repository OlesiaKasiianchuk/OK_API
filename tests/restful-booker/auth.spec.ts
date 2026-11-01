import { expect, test } from '@playwright/test';
import { baseURL, userData } from './config';

test.describe('Authentication in restful-booker', () => {
  test('authenticates valid credentials', async ({ request }) => {
    const validResponse = await request.post(`${baseURL}/auth`, {
      data: userData,
    });

    expect(validResponse.status()).toBe(200);
    const validBody: { token: string } = await validResponse.json();
    expect(validBody.token).toBeTruthy();
  });

  test('rejects an invalid password', async ({ request }) => {
    const invalidResponse = await request.post(`${baseURL}/auth`, {
      data: { ...userData, password: 'invalid-password' },
    });

    expect(invalidResponse.status()).toBe(200);
    expect(await invalidResponse.json()).toEqual({ reason: 'Bad credentials' });
  });
});