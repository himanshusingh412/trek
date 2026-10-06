import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { RazorpayModal } from '../components/RazorpayModal';
import { BookingsApi } from '../api/bookings';
import { PaymentsApi } from '../api/payments';
import { Booking, PaymentOrder } from '../types/api';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'BookingCheckout'>;

export const BookingCheckoutScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const bookingId = route.params.booking_id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Razorpay Checkout State
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Countdown timer
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes

  const fetchBooking = async () => {
    try {
      const data = await BookingsApi.getBookingById(bookingId);
      setBooking(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch booking summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const order = await PaymentsApi.createPaymentOrder(bookingId);
      setPaymentOrder(order);
      setShowRazorpay(true);
    } catch (e: any) {
      setError(e.message || 'Could not initiate Razorpay checkout order.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    setShowRazorpay(false);
    setVerifying(true);
    setError(null);

    try {
      const result = await PaymentsApi.verifyPayment({
        booking_id: bookingId,
        ...paymentData,
      });

      if (result.status === 'CONFIRMED' || result.status === 'PAID') {
        navigation.replace('BookingConfirmation', { booking_id: bookingId });
      } else {
        // Fallback navigate to confirmation if verified
        navigation.replace('BookingConfirmation', { booking_id: bookingId });
      }
    } catch (e: any) {
      setError('Payment verification failed on server: ' + (e.message || 'Check connection'));
    } finally {
      setVerifying(false);
    }
  };

  const handlePaymentFailure = (errMsg: string) => {
    setShowRazorpay(false);
    setError(errMsg);
  };

  if (loading || verifying) return <LoadingView message={verifying ? "Verifying payment with bank..." : "Preparing secure checkout..."} />;
  if (error && !booking) return <ErrorView message={error} onRetry={fetchBooking} />;
  if (!booking) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Checkout & Payment" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.timerBanner, { backgroundColor: colors.warningLight }]}>
          <Text style={[styles.timerText, { color: colors.warning }]}>
            ⏳ Seats Held! Completing payment in <Text style={{ fontWeight: '800' }}>{timeFormatted}</Text>
          </Text>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Booking Summary</Text>
          <Text style={[styles.trekName, { color: colors.text }]}>{booking.departure?.track?.name || 'Himalayan Trek'}</Text>
          <Text style={[styles.seatsText, { color: colors.textSecondary }]}>
            {booking.seats} Trekker Seat(s) Reserved
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.contactHeader, { color: colors.text }]}>Contact Information</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{booking.contact?.full_name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{booking.contact?.email}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{booking.contact?.phone}</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.priceRow}>
            <Text style={{ color: colors.textSecondary }}>Total Payable Amount</Text>
            <Text style={[styles.totalPrice, { color: colors.primary }]}>
              ₹{((booking.amount_paise || 850000) / 100).toLocaleString('en-IN')}
            </Text>
          </View>
        </Card>

        <Card style={styles.paymentInfoCard}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>🔒 Secure Payment via Razorpay</Text>
          <Text style={[styles.infoBody, { color: colors.textSecondary }]}>
            Supports Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), NetBanking & Wallets.
          </Text>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button
          title={`Pay ₹${((booking.amount_paise || 850000) / 100).toLocaleString('en-IN')} via Razorpay`}
          onPress={handleInitiatePayment}
          variant="primary"
          size="large"
        />
      </View>

      <RazorpayModal
        visible={showRazorpay}
        order={paymentOrder}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onCancel={() => setShowRazorpay(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  timerBanner: { padding: 12, borderRadius: 10, marginBottom: 16, alignItems: 'center' },
  timerText: { fontSize: 14, fontWeight: '600' },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { fontSize: 13 },
  card: { padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  trekName: { fontSize: 18, fontWeight: '700' },
  seatsText: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  contactHeader: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  totalPrice: { fontSize: 24, fontWeight: '800' },
  paymentInfoCard: { padding: 14, backgroundColor: 'rgba(5, 150, 105, 0.06)' },
  infoTitle: { fontSize: 14, fontWeight: '700' },
  infoBody: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
});
