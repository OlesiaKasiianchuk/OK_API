import { expect, test } from '@playwright/test';

const baseURL = (
  process.env.RESTFUL_BOOKER_BASE_URL ?? 'https://restful-booker.herokuapp.com'
).replace(/\/+$/, '');

test.describe('Authentication in restful-booker', () => {
  test('authenticates valid credentials', async ({ request }) => {
  const validResponse = await request.post(`${baseURL}/auth`, {
    data: { username: 'admin', password: 'password123' },
  });

  expect(validResponse.status()).toBe(200);
  const validBody: { token: string } = await validResponse.json();
  expect(validBody.token).toBeTruthy();
  });

test('rejects an invalid password', async ({ request }) => {
  const invalidResponse = await request.post(`${baseURL}/auth`, {
    data: { username: 'admin', password: 'invalid-password' },
  });

  expect(invalidResponse.status()).toBe(200);
  expect(await invalidResponse.json()).toEqual({ reason: 'Bad credentials' });
  });   
});