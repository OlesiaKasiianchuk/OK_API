import { expect, type APIRequestContext } from '@playwright/test';
import { baseURL, userData } from './config';

/** Authenticates the configured user and returns the token cookie header. */
export async function getAuthHeaders(
  request: APIRequestContext,
): Promise<{ Cookie: string }> {
  const response = await request.post(`${baseURL}/auth`, { data: userData });
  expect(response.status()).toBe(200);

  const body: { token: string } = await response.json();
  expect(body.token).toBeTruthy();

  return { Cookie: `token=${body.token}` };
}