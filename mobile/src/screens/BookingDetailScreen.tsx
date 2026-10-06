import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { BookingsApi } from '../api/bookings';
import { Booking } from '../types/api';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'BookingDetail'>;

export const BookingDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const bookingId = route.params.booking_id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      const data = await BookingsApi.getBookingById(bookingId);
      setBooking(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [bookingId]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? Refund policy will apply based on departure date.',
      [
        { text: 'No, Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const updated = await BookingsApi.cancelBooking(bookingId, 'User requested cancellation on mobile');
              setBooking(updated);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to cancel booking');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingView message="Loading booking details..." />;
  if (error || !booking) return <ErrorView message={error || 'Booking not found'} onRetry={fetchDetails} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Booking Details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trekName, { color: colors.text }]}>
                {booking.departure?.track?.name || 'Himalayan Trek'}
              </Text>
              <Text style={[styles.bookingId, { color: colors.textMuted }]}>
                ID: {booking.id.slice(0, 16)}
              </Text>
            </View>
            <Badge label={booking.status} variant={booking.status === 'CONFIRMED' ? 'success' : 'error'} />
          </View>

          {booking.departure?.start_date && (
            <Text style={[styles.dates, { color: colors.primary }]}>
              📅{' '}
              {new Date(booking.departure.start_date).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              })}{' '}
              -{' '}
              {new Date(booking.departure.end_date).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Primary Contact</Text>
          <Text style={[styles.value, { color: colors.textSecondary }]}>Name: {booking.contact?.full_name}</Text>
          <Text style={[styles.value, { color: colors.textSecondary }]}>Email: {booking.contact?.email}</Text>
          <Text style={[styles.value, { color: colors.textSecondary }]}>Phone: {booking.contact?.phone}</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Travellers ({booking.travellers?.length || booking.seats})
          </Text>
          {(booking.travellers || []).map((t, idx) => (
            <View key={idx} style={styles.travellerItem}>
              <Text style={[styles.tName, { color: colors.text }]}>
                {idx + 1}. {t.full_name}
              </Text>
              <Text style={[styles.tDetails, { color: colors.textMuted }]}>
                DOB: {t.date_of_birth} • Gender: {t.gender}
              </Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Summary</Text>
          <View style={styles.priceRow}>
            <Text style={{ color: colors.textSecondary }}>Total Fare Paid</Text>
            <Text style={[styles.totalPrice, { color: colors.primary }]}>
              ₹{((booking.amount_paise || 850000) / 100).toLocaleString('en-IN')}
            </Text>
          </View>
          {booking.payment && (
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              Razorpay Order ID: {booking.payment.razorpay_order_id}
            </Text>
          )}
        </Card>

        {booking.status === 'CONFIRMED' && (
          <Button
            title="Cancel Booking & Claim Refund"
            onPress={handleCancel}
            loading={cancelling}
            variant="danger"
            size="medium"
            style={{ marginTop: 8 }}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { padding: 18, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  trekName: { fontSize: 18, fontWeight: '800' },
  bookingId: { fontSize: 12, marginTop: 2 },
  dates: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  divider: { height: 1, marginVertical: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  value: { fontSize: 13, lineHeight: 20 },
  travellerItem: { marginVertical: 4 },
  tName: { fontSize: 14, fontWeight: '600' },
  tDetails: { fontSize: 12, marginTop: 1 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalPrice: { fontSize: 20, fontWeight: '800' },
});
