import { NavigatorScreenParams } from '@react-navigation/native';
import { DepartureSummary, TrekSummary } from '../types/api';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  PhoneOtp: { phone: string };
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Explore: { region?: string; difficulty?: string; search?: string } | undefined;
  Bookings: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  TrekDetail: { slug: string; trek?: TrekSummary };
  DepartureDetail: { id: string; departure?: DepartureSummary };
  SeatSelection: { departure: DepartureSummary };
  BookingCheckout: { booking_id: string };
  BookingConfirmation: { booking_id: string };
  BookingDetail: { booking_id: string };
  AccountSettings: undefined;
  Support: undefined;
  GuideDashboard: undefined;
  AdminDashboard: undefined;
  AdminTracks: undefined;
  AdminDepartures: undefined;
};
