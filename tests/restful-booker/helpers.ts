import { expect, type APIRequestContext } from '@playwright/test';
import {
  getApiBaseURL,
  getRestfulBookerCredentials,
} from '../config/environments';

const baseURL = getApiBaseURL('restful-booker');
const userData = getRestfulBookerCredentials();

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

/** Creates a new booking and returns the booking ID and booking data. */
export async function createBooking(
  request: APIRequestContext,
  booking: object,
): Promise<{ bookingid: number; booking: Record<string, unknown> }> {
  const response = await request.post(`${baseURL}/booking`, { data: booking });
  expect(response.status()).toBe(200);

  return response.json();
}


/** Builds the URL for a booking ID. */
export function getBookingUrl(bookingId: number): string {
  return `${baseURL}/booking/${bookingId}`;
}