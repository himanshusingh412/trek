import { apiClient } from './client';
import { PaymentOrder } from '../types/api';

export const PaymentsApi = {
  async createPaymentOrder(booking_id: string): Promise<PaymentOrder> {
    return apiClient<PaymentOrder>('/api/v1/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ booking_id }),
    });
  },

  async verifyPayment(data: {
    booking_id: string;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }): Promise<{ status: string; booking_id: string }> {
    return apiClient<{ status: string; booking_id: string }>('/api/v1/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
