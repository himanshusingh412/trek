export type Role = 'TREKKER' | 'GUIDE' | 'ADMIN';
export type AuthMethod = 'PASSWORD' | 'PHONE_OTP' | 'GOOGLE';

export type User = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  email_verified: boolean;
  phone_verified: boolean;
  guest: boolean;
  auth_methods: AuthMethod[];
  marketing_email: boolean;
  marketing_whatsapp: boolean;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  is_new_user: boolean;
  user: User;
};

export type OtpRequestResponse = {
  expires_in: number;
  resend_after: number;
};

export type TrekSummary = {
  id: string;
  slug: string;
  name: string;
  region: string;
  state: string;
  duration_days: number;
  difficulty: 'EASY' | 'MODERATE' | 'DIFFICULT' | 'STRENUOUS';
  highest_altitude_ft: number;
  price_paise_from: number;
  cover_image_url: string;
  short_description: string;
};

export type DepartureSummary = {
  id: string;
  start_date: string;
  end_date: string;
  price_paise: number;
  seats_left: number;
  max_group_size: number;
  meeting_point: string;
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
  track: TrekSummary;
  guide: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type BookingStatus =
  | 'HELD'
  | 'CONFIRMED'
  | 'CANCELLED_TREKKER'
  | 'CANCELLED_FORCE_MAJEURE'
  | 'EXPIRED'
  | 'RELEASED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type Traveller = {
  full_name: string;
  phone: string | null;
  date_of_birth: string;
  gender: 'FEMALE' | 'MALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
  insurance: boolean;
  insurance_id: string | null;
  offloading: boolean;
  transport: boolean;
};

export type Booking = {
  id: string;
  departure: DepartureSummary;
  seats: number;
  price_paise_per_seat: number;
  amount_paise: number;
  status: BookingStatus;
  hold_expires_at: string;
  created_at: string;
  contact: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
  };
  travellers: Traveller[];
  travellers_complete: boolean;
  addons: {
    insurance_seats: number;
    offloading_seats: number;
    transport_seats: number;
    total_paise: number;
  };
  payment: {
    id: string;
    razorpay_order_id: string;
    amount_paise: number;
    status: PaymentStatus;
    method: string | null;
    paid_at: string | null;
  } | null;
  refunds: Array<{
    id: string;
    amount_paise: number;
    status: 'PENDING' | 'PROCESSED' | 'FAILED';
    kind: 'TREKKER_CANCELLATION' | 'FORCE_MAJEURE' | 'LATE_CAPTURE';
    created_at: string;
  }>;
  refund_policy?: Array<{
    min_days_before: number;
    refund_bps: number;
  }>;
};

export type PaymentOrder = {
  payment_id: string;
  razorpay_order_id: string;
  key_id: string;
  amount_paise: number;
  currency: string;
  description: string;
  checkout_timeout_seconds: number;
  prefill: {
    name?: string | null;
    email?: string | null;
    contact?: string | null;
  };
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'BOOKING_UPDATE' | 'SNOW_REPORT' | 'SYSTEM';
};
