import { test as base, expect } from '@playwright/test';
import { ApiError, BaseApiClient } from '../api-client';
import {
  getApiBaseURL,
  getRestfulBookerCredentials,
} from '../config/environments';
import type {
  Booking,
  BookingAuthResponse,
  CreatedBookingResponse,
  Pet,
  StoreOrder,
} from '../models/resources';
import { buildOrder, buildPet } from '../factories/petstore';
import { BookingService } from '../services/booking-service';
import { PetService } from '../services/pet-service';
import { StoreService } from '../services/store-service';
import { UserService } from '../services/user-service';

interface ApiFixtures {
  apiClient: BaseApiClient;
  authenticatedBookingClient: BaseApiClient;
  bookingService: BookingService;
  createPet: (overrides?: Partial<Pet>) => Promise<Pet>;
  petService: PetService;
  petstoreClient: BaseApiClient;
  placeOrder: (
    overrides: Partial<StoreOrder> & Pick<StoreOrder, 'petId'>,
  ) => Promise<StoreOrder>;
  seededBooking: {
    id: number;
    booking: Booking;
    delete: () => Promise<void>;
  };
  seededOrder: StoreOrder;
  seededPet: Pet;
  storeService: StoreService;
  userService: UserService;
}

export const test = base.extend<ApiFixtures>({
  apiClient: async ({ request }, use) => {
    const apiKey = process.env.REQRES_API_KEY;
    const client = new BaseApiClient({
      request,
      baseURL: getApiBaseURL('reqres'),
      authHeaders: apiKey ? { 'x-api-key': apiKey } : {},
    });
    await use(client);
  },

  
  authenticatedBookingClient: async ({ request }, use) => {
    const baseURL = getApiBaseURL('restful-booker');
    const unauthenticatedClient = new BaseApiClient({ request, baseURL });
    const auth = await unauthenticatedClient.post<BookingAuthResponse>(
      '/auth',
      getRestfulBookerCredentials(),
    );

    if (!auth.token) {
      throw new Error('Restful Booker authentication did not return a token.');
    }

    await use(
      new BaseApiClient({
        request,
        baseURL,
        authHeaders: { Cookie: `token=${auth.token}` },
      }),
    );
  },

  bookingService: async ({ authenticatedBookingClient }, use) => {
    await use(new BookingService(authenticatedBookingClient));
  },

  seededBooking: async ({ bookingService }, use) => {
    const booking: Booking = {
      firstname: 'Fixture',
      lastname: 'Booking',
      totalprice: 165,
      depositpaid: true,
      bookingdates: { checkin: '2027-08-10', checkout: '2027-08-13' },
      additionalneeds: 'Breakfast',
    };
    const created: CreatedBookingResponse =
      await bookingService.createBooking(booking);
    let deleted = false;

    await use({
      id: created.bookingid,
      booking: created.booking,
      delete: async () => {
        await bookingService.deleteBooking(created.bookingid);
        deleted = true;
      },
    });
    if (!deleted) {
      await bookingService.deleteBooking(created.bookingid);
    }
  },

  userService: async ({ apiClient }, use) => {
    await use(new UserService(apiClient));
  },

  petstoreClient: async ({ request }, use) => {
    await use(
      new BaseApiClient({ request, baseURL: getApiBaseURL('petstore') }),
    );
  },

  petService: async ({ petstoreClient }, use) => {
    await use(new PetService(petstoreClient));
  },

  storeService: async ({ petstoreClient }, use) => {
    await use(new StoreService(petstoreClient));
  },

  createPet: async ({ petService }, use) => {
    const createdPetIds: number[] = [];

    await use(async (overrides) => {
      const pet = buildPet(overrides);
      createdPetIds.push(pet.id);
      return petService.createPet(pet);
    });

    for (const petId of createdPetIds) {
      await petService.deletePet(petId, [200, 404]);
    }
  },

  seededPet: async ({ createPet }, use) => {
    await use(await createPet());
  },

  placeOrder: async ({ storeService }, use) => {
    const placedOrderIds: number[] = [];

    await use(async (overrides) => {
      const order = buildOrder(overrides);
      placedOrderIds.push(order.id);
      return storeService.placeOrder(order);
    });

    for (const orderId of placedOrderIds) {
      await storeService.deleteOrder(orderId, [200, 404]);
    }
  },

  seededOrder: async ({ placeOrder, seededPet }, use) => {
    await use(await placeOrder({ petId: seededPet.id }));
  },
});

export { ApiError, expect };