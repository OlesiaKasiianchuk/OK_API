import { expect, test } from '@playwright/test';

const baseURL = (
  process.env.RESTFUL_BOOKER_BASE_URL ?? 'https://restful-booker.herokuapp.com'
).replace(/\/+$/, '');

test('persists booking updates', async ({ request }) => {
  const authResponse = await request.post(`${baseURL}/auth`, {
    data: { username: 'admin', password: 'password123' },
  });
  expect(authResponse.status()).toBe(200);
  const authBody: { token: string } = await authResponse.json();
  const authHeaders = { Cookie: `token=${authBody.token}` };

  const booking = {
    firstname: 'Casey',
    lastname: 'Lee',
    totalprice: 180,
    depositpaid: false,
    bookingdates: { checkin: '2027-05-10', checkout: '2027-05-13' },
    additionalneeds: 'Lunch',
  };
  const createResponse = await request.post(`${baseURL}/booking`, {
    data: booking,
  });
  expect(createResponse.status()).toBe(200);
  const createBody: { bookingid: number } = await createResponse.json();
  const bookingURL = `${baseURL}/booking/${createBody.bookingid}`;

  const updatedBooking = {
    ...booking,
    firstname: 'Casey-Updated',
    totalprice: 225,
  };
  const updateResponse = await request.put(bookingURL, {
    data: updatedBooking,
    headers: authHeaders,
  });
  expect(updateResponse.status()).toBe(200);

  const persistedResponse = await request.get(bookingURL);
  expect(persistedResponse.status()).toBe(200);
  expect(await persistedResponse.json()).toMatchObject(updatedBooking);

  const deleteResponse = await request.delete(bookingURL, {
    headers: authHeaders,
  });
  expect(deleteResponse.status()).toBe(201);
});

test('creates, reads, updates, and deletes a booking', async ({ request }) => {
  const authResponse = await request.post(`${baseURL}/auth`, {
    data: { username: 'admin', password: 'password123' },
  });

  expect(authResponse.status()).toBe(200);
  const authBody: { token: string } = await authResponse.json();
  expect(authBody.token).toBeTruthy();
  const authHeaders = { Cookie: `token=${authBody.token}` };

  const booking = {
    firstname: 'Taylor',
    lastname: 'Morgan',
    totalprice: 245,
    depositpaid: true,
    bookingdates: { checkin: '2027-03-10', checkout: '2027-03-14' },
    additionalneeds: 'Breakfast',
  };
  const createResponse = await request.post(`${baseURL}/booking`, {
    data: booking,
  });

  expect(createResponse.status()).toBe(200);
  const createBody: { bookingid: number; booking: typeof booking } =
    await createResponse.json();
  expect(createBody.bookingid).toBeGreaterThan(0);
  expect(createBody.booking).toMatchObject(booking);
  const bookingURL = `${baseURL}/booking/${createBody.bookingid}`;

  const readResponse = await request.get(bookingURL);
  expect(readResponse.status()).toBe(200);
  expect(await readResponse.json()).toMatchObject(booking);

  const updatedBooking = {
    ...booking,
    firstname: 'Taylor-Updated',
    totalprice: 310,
    bookingdates: { checkin: '2027-04-02', checkout: '2027-04-06' },
  };
  const updateResponse = await request.put(bookingURL, {
    data: updatedBooking,
    headers: authHeaders,
  });

  expect(updateResponse.status()).toBe(200);
  expect(await updateResponse.json()).toMatchObject(updatedBooking);

  const deleteResponse = await request.delete(bookingURL, {
    headers: authHeaders,
  });
  expect(deleteResponse.status()).toBe(201);

  const absentResponse = await request.get(bookingURL);
  expect(absentResponse.status()).toBe(404);
});