import type { BaseApiClient } from '../api-client';
import type { Booking, CreatedBookingResponse } from '../models/resources';

export class BookingService {
  constructor(private readonly client: BaseApiClient) {}

  createBooking(booking: Booking): Promise<CreatedBookingResponse> {
    return this.client.post('/booking', booking);
  }

  getBooking(id: number): Promise<Booking> {
    return this.client.get(`/booking/${id}`);
  }

  updateBooking(id: number, booking: Booking): Promise<Booking> {
    return this.client.put(`/booking/${id}`, booking);
  }

  deleteBooking(id: number): Promise<void> {
    return this.client.delete(`/booking/${id}`, { expectedStatus: 201 });
  }
}