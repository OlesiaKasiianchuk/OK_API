import { expect, test } from '@playwright/test';

const baseURL = (
  process.env.RESTFUL_BOOKER_BASE_URL ?? 'https://restful-booker.herokuapp.com'
).replace(/\/+$/, '');

test('POST /booking returns 500 when firstname is missing', async ({
  request,
}) => {
  const response = await request.post(`${baseURL}/booking`, {
    data: {
      lastname: 'Morgan',
      totalprice: 245,
      depositpaid: true,
      bookingdates: { checkin: '2027-03-10', checkout: '2027-03-14' },
      additionalneeds: 'Breakfast',
    },
  });

  expect(response.status()).toBe(500);
});

test('POST /booking coerces a string totalprice to null', async ({
  request,
}) => {
  const authResponse = await request.post(`${baseURL}/auth`, {
    data: { username: 'admin', password: 'password123' },
  });
  expect(authResponse.status()).toBe(200);
  const authBody: { token: string } = await authResponse.json();
  const authHeaders = { Cookie: `token=${authBody.token}` };

  const response = await request.post(`${baseURL}/booking`, {
    data: {
      firstname: 'Taylor',
      lastname: 'Morgan',
      totalprice: 'not-a-number',
      depositpaid: true,
      bookingdates: { checkin: '2027-03-10', checkout: '2027-03-14' },
      additionalneeds: 'Breakfast',
    },
  });

  expect(response.status()).toBe(200);
  const body: {
    bookingid: number;
    booking: { totalprice: number | null };
  } = await response.json();
  const bookingURL = `${baseURL}/booking/${body.bookingid}`;

  try {
    expect(body.booking.totalprice).toBeNull();
  } finally {
    const deleteResponse = await request.delete(bookingURL, {
      headers: authHeaders,
    });
    expect(deleteResponse.status()).toBe(201);
  }
});

test('POST /booking creates separate bookings for duplicate data', async ({
  request,
}) => {
  const authResponse = await request.post(`${baseURL}/auth`, {
    data: { username: 'admin', password: 'password123' },
  });
  expect(authResponse.status()).toBe(200);
  const authBody: { token: string } = await authResponse.json();
  const authHeaders = { Cookie: `token=${authBody.token}` };

  const booking = {
    firstname: 'Jordan',
    lastname: 'Parker',
    totalprice: 190,
    depositpaid: true,
    bookingdates: { checkin: '2027-06-08', checkout: '2027-06-12' },
    additionalneeds: 'Dinner',
  };
  const bookingIds: number[] = [];

  try {
    const firstResponse = await request.post(`${baseURL}/booking`, {
      data: booking,
    });
    expect(firstResponse.status()).toBe(200);
    const firstBody: { bookingid: number } = await firstResponse.json();
    bookingIds.push(firstBody.bookingid);

    const secondResponse = await request.post(`${baseURL}/booking`, {
      data: booking,
    });
    expect(secondResponse.status()).toBe(200);
    const secondBody: { bookingid: number } = await secondResponse.json();
    bookingIds.push(secondBody.bookingid);

    expect(secondBody.bookingid).not.toBe(firstBody.bookingid);
  } finally {
    for (const bookingId of bookingIds) {
      const deleteResponse = await request.delete(
        `${baseURL}/booking/${bookingId}`,
        { headers: authHeaders },
      );
      expect(deleteResponse.status()).toBe(201);
    }
  }
});