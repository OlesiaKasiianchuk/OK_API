import { expect, test } from '@playwright/test';
import { getApiBaseURL } from '../config/environments';
import { createBooking, getAuthHeaders, getBookingUrl } from './helpers';

const baseURL = getApiBaseURL('restful-booker');

test.describe('POST /booking edge cases', () => {
  let bookingIds: number[];

  test.beforeEach(() => {
    bookingIds = [];
  });

  test.afterEach(async ({ request }) => {
    if (bookingIds.length === 0) {
      return;
    }

    const authHeaders = await getAuthHeaders(request);
    for (const bookingId of bookingIds) {
      const deleteResponse = await request.delete(getBookingUrl(bookingId), {
        headers: authHeaders,
      });
      expect(deleteResponse.status()).toBe(201);
    }
  });

  test('returns 500 when firstname is missing', async ({ request }) => {
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

  test('rejects a booking when checkout is missing from bookingdates', async ({
    request,
  }) => {
    const response = await request.post(`${baseURL}/booking`, {
      data: {
        firstname: 'Morgan',
        lastname: 'Taylor',
        totalprice: 245,
        depositpaid: true,
        bookingdates: { checkin: '2027-03-10' },
        additionalneeds: 'Breakfast',
      },
    });

    if (response.ok()) {
      const body: { bookingid?: number } = await response.json();
      if (body.bookingid !== undefined) {
        bookingIds.push(body.bookingid);
      }
    }

    expect([400, 422, 500]).toContain(response.status());
  });

  test('rejects a booking when checkout is before checkin', async ({
    request,
  }) => {
    test.fail(
      true,
      'Restful Booker currently accepts checkout dates before checkin.',
    );

    const response = await request.post(`${baseURL}/booking`, {
      data: {
        firstname: 'Morgan',
        lastname: 'Taylor',
        totalprice: 245,
        depositpaid: true,
        bookingdates: { checkin: '2027-03-14', checkout: '2027-03-10' },
        additionalneeds: 'Breakfast',
      },
    });

    if (response.status() === 200) {
      const body: { bookingid?: number } = await response.json();
      if (body.bookingid !== undefined) {
        bookingIds.push(body.bookingid);
      }
    }

    expect([400, 422]).toContain(response.status());
  });

  test('coerces a string totalprice to null', async ({ request }) => {
    const body = await createBooking(request, {
      firstname: 'Taylor',
      lastname: 'Morgan',
      totalprice: 'not-a-number',
      depositpaid: true,
      bookingdates: { checkin: '2027-03-10', checkout: '2027-03-14' },
      additionalneeds: 'Breakfast',
    });
    bookingIds.push(body.bookingid);
    expect(body.booking.totalprice).toBeNull();
  });

  test('creates separate bookings for duplicate data', async ({ request }) => {
    const booking = {
      firstname: 'Jordan',
      lastname: 'Parker',
      totalprice: 190,
      depositpaid: true,
      bookingdates: { checkin: '2027-06-08', checkout: '2027-06-12' },
      additionalneeds: 'Dinner',
    };

    const firstBody = await createBooking(request, booking);
    bookingIds.push(firstBody.bookingid);

    const secondBody = await createBooking(request, booking);
    bookingIds.push(secondBody.bookingid);

    expect(secondBody.bookingid).not.toBe(firstBody.bookingid);
  });
});