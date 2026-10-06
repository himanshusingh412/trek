import { apiClient } from './client';
import { Booking, Traveller } from '../types/api';

export const BookingsApi = {
  async holdSeats(departure_id: string, seats: number): Promise<Booking> {
    return apiClient<Booking>('/api/v1/bookings/hold-seat', {
      method: 'POST',
      body: JSON.stringify({ departure_id, seats }),
    });
  },

  async createBooking(data: {
    departure_id: string;
    seats: number;
    contact: { full_name: string; email: string; phone: string };
    travellers: Traveller[];
    addons?: {
      insurance?: boolean;
      offloading?: boolean;
      transport?: boolean;
    };
  }): Promise<Booking> {
    return apiClient<Booking>('/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getUserBookings(): Promise<Booking[]> {
    return apiClient<Booking[]>('/api/v1/bookings');
  },

  async getBookingById(id: string): Promise<Booking> {
    return apiClient<Booking>(`/api/v1/bookings/${id}`);
  },

  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    return apiClient<Booking>(`/api/v1/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
