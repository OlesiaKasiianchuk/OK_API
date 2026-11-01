import { expect, test, type APIResponse } from '@playwright/test';
import { getApiBaseURL, getRestfulBookerCredentials } from '../config/environments';

interface ErrorShape {
  contentType: string | null;
  body: unknown;
}

async function getErrorShape(
  response: APIResponse,
): Promise<ErrorShape> {
  const rawContentType = response.headers()['content-type'] ?? '';
  const contentType = rawContentType.split(';', 1)[0] || null;
  const text = await response.text();
  if (!text) {
    return { contentType, body: 'empty' };
  }

  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    body = text;
  }
  return { contentType, body: shapeOf(body) };
}

function shapeOf(value: unknown): unknown {
  if (value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? [] : [shapeOf(value[0])];
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, shapeOf(child)]),
    );
  }
  return typeof value;
}

test.describe('Error response structure by API', () => {
  test('Restful Booker invalid credential errors share a JSON structure', async ({
    request,
  }) => {
    const baseURL = getApiBaseURL('restful-booker');
    const credentials = getRestfulBookerCredentials();
    const invalidPasswordResponse = await request.post(`${baseURL}/auth`, {
      data: { ...credentials, password: 'invalid-password' },
    });
    const invalidUsernameResponse = await request.post(`${baseURL}/auth`, {
      data: { ...credentials, username: 'invalid-username' },
    });

    expect(invalidPasswordResponse.status()).toBe(200);
    expect(invalidUsernameResponse.status()).toBe(200);
    const invalidPasswordShape = await getErrorShape(invalidPasswordResponse);
    const invalidUsernameShape = await getErrorShape(invalidUsernameResponse);

    expect(invalidPasswordShape).toEqual({
      contentType: 'application/json',
      body: { reason: 'string' },
    });
    expect(invalidUsernameShape).toEqual(invalidPasswordShape);
  });

  test('Petstore GET and DELETE return different missing-pet error structures', async ({
    request,
  }) => {
    const baseURL = getApiBaseURL('petstore');
    const missingPetId = Number.MAX_SAFE_INTEGER - 1;
    const getResponse = await request.get(`${baseURL}/pet/${missingPetId}`);
    const deleteResponse = await request.delete(
      `${baseURL}/pet/${missingPetId}`,
    );

    expect(getResponse.status()).toBe(404);
    expect(deleteResponse.status()).toBe(404);
    const getShape = await getErrorShape(getResponse);
    const deleteShape = await getErrorShape(deleteResponse);

    expect(getShape).toEqual({
      contentType: 'application/json',
      body: { code: 'number', message: 'string', type: 'string' },
    });
    expect(deleteShape).toEqual({ contentType: null, body: 'empty' });
    expect(deleteShape).not.toEqual(getShape);
  });

  test('DummyJSON product errors share a JSON message shape', async ({
    request,
  }) => {
    const baseURL = getApiBaseURL('dummyjson');
    const missingProductIds = [0, 999999999];
    const responses = await Promise.all(
      missingProductIds.map((id) => request.get(`${baseURL}/products/${id}`)),
    );

    for (const response of responses) {
      expect(response.status()).toBe(404);
    }

    const shapes = await Promise.all(responses.map(getErrorShape));
    expect(shapes[0]).toEqual({
      contentType: 'application/json',
      body: { message: 'string' },
    });
    expect(shapes[1]).toEqual(shapes[0]);
  });
});
