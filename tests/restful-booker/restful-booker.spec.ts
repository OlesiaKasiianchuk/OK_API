import { expect, test } from '../fixtures/api';

test('persists booking updates', async ({ bookingService, seededBooking }) => {
  const { id: bookingId, booking } = seededBooking;
  const updatedBooking = {
    ...booking,
    firstname: 'Casey-Updated',
    totalprice: 225,
  };
  const updateResponse = await bookingService.updateBooking(
    bookingId,
    updatedBooking,
  );
  expect(updateResponse).toMatchObject(updatedBooking);

  const persistedResponse = await bookingService.getBooking(bookingId);
  expect(persistedResponse).toMatchObject(updatedBooking);
});

test('creates, reads, updates, and deletes a booking', async ({
  bookingService,
  seededBooking,
}) => {
  const { id: bookingId, booking } = seededBooking;
  const readResponse = await bookingService.getBooking(bookingId);
  expect(readResponse).toMatchObject(booking);

  const updatedBooking = {
    ...booking,
    firstname: 'Taylor-Updated',
    totalprice: 310,
    bookingdates: { checkin: '2027-04-02', checkout: '2027-04-06' },
  };
  const updateResponse = await bookingService.updateBooking(
    bookingId,
    updatedBooking,
  );
  expect(updateResponse).toMatchObject(updatedBooking);

  await seededBooking.delete();

  await expect(bookingService.getBooking(bookingId)).rejects.toMatchObject({
    status: 404,
  });
});