import { expect, test } from '@playwright/test';

const baseURL = 'https://httpbin.org';

type EchoResponse = {
  json: Record<string, unknown>;
};

test('GET /json returns the slideshow resource', async ({ request }) => {
  const response = await request.get(`${baseURL}/json`);

  expect(response.status()).toBe(200);

  const body: {
    slideshow: {
      title: string;
      slides: Array<{ title: string; type: string }>;
    };
  } = await response.json();
  expect(body.slideshow.title).toBe('Sample Slide Show');
  expect(body.slideshow.slides).toHaveLength(2);
  expect(body.slideshow.slides[0]).toMatchObject({
    title: 'Wake up to WonderWidgets!',
    type: 'all',
  });
});

test('POST /post echoes submitted data and ID without creating a resource', async ({
  request,
}) => {
  const user = {
    id: 'httpbin-user-1',
    name: 'Jane',
    job: 'QA Engineer',
  };
  const response = await request.post(`${baseURL}/post`, { data: user });

  expect(response.status()).toBe(200);

  const body: EchoResponse = await response.json();
  expect(body.json).toMatchObject(user);
});

test('POST /status/201 returns the requested status without a created-resource body', async ({
  request,
}) => {
  const response = await request.post(`${baseURL}/status/201`, {
    data: { name: 'Jane', job: 'QA Engineer' },
  });

  expect(response.status()).toBe(201);
});

test('PUT /put echoes the updated data', async ({ request }) => {
  const updatedUser = {
    id: 'httpbin-user-1',
    name: 'Jane',
    job: 'Senior QA Engineer',
  };
  const response = await request.put(`${baseURL}/put`, { data: updatedUser });

  expect(response.status()).toBe(200);

  const body: EchoResponse = await response.json();
  expect(body.json).toMatchObject(updatedUser);
});

test('PATCH /patch echoes the changed data', async ({ request }) => {
  const changedFields = { job: 'Lead QA Engineer' };
  const response = await request.patch(`${baseURL}/patch`, {
    data: changedFields,
  });

  expect(response.status()).toBe(200);

  const body: EchoResponse = await response.json();
  expect(body.json).toMatchObject(changedFields);
});

test('DELETE /delete echoes the request but does not verify resource absence', async ({
  request,
}) => {
  const deletedRecord = { id: 'httpbin-user-1' };
  const response = await request.delete(`${baseURL}/delete`, {
    data: deletedRecord,
  });

  expect(response.status()).toBe(200);

  const body: EchoResponse = await response.json();
  expect(body.json).toMatchObject(deletedRecord);
});
