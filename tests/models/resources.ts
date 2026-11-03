export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

export interface UserListResponse {
  data: User[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface UserWriteRequest {
  name: string;
  job: string;
}

export interface UserWriteResponse extends UserWriteRequest {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Type aliases (not interfaces) so values satisfy toMatchObject's Record<string, unknown>.
export type BookingDates = {
  checkin: string;
  checkout: string;
};

export type Booking = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
};

export interface CreatedBookingResponse {
  bookingid: number;
  booking: Booking;
}

export interface BookingCredentials {
  username: string;
  password: string;
}

export interface BookingAuthResponse {
  token?: string;
  reason?: string;
}

export type PetStatus = 'available' | 'pending' | 'sold';

export type PetCategory = {
  id: number;
  name: string;
};

export type PetTag = {
  id: number;
  name: string;
};

export type Pet = {
  id: number;
  category: PetCategory;
  name: string;
  photoUrls: string[];
  tags: PetTag[];
  status: PetStatus;
};

export interface StoreOrder {
  id: number;
  petId: number;
  quantity: number;
  shipDate: string;
  status: 'placed' | 'approved' | 'delivered';
  complete: boolean;
}