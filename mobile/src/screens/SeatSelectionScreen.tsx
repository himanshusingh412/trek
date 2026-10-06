import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { SeatPicker } from '../components/SeatPicker';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { BookingsApi } from '../api/bookings';
import { Traveller } from '../types/api';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'SeatSelection'>;

export const SeatSelectionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const departure = route.params.departure;

  const [seats, setSeats] = useState(1);
  const [contactName, setContactName] = useState(user?.full_name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  // Addons state
  const [insurance, setInsurance] = useState(true);
  const [offloading, setOffloading] = useState(false);
  const [transport, setTransport] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Price math
  const baseSeatPaise = departure.price_paise || 850000;
  const insurancePaise = insurance ? 35000 * seats : 0;
  const offloadingPaise = offloading ? 120000 * seats : 0;
  const transportPaise = transport ? 150000 * seats : 0;
  const totalPaise = baseSeatPaise * seats + insurancePaise + offloadingPaise + transportPaise;

  const handleHoldAndProceed = async () => {
    if (!contactName || !contactEmail || !contactPhone) {
      setError('Please fill in primary contact details.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Build traveller records
      const travellers: Traveller[] = Array.from({ length: seats }).map((_, idx) => ({
        full_name: idx === 0 ? contactName : `Traveller ${idx + 1}`,
        phone: idx === 0 ? contactPhone : null,
        date_of_birth: '1995-01-01',
        gender: 'PREFER_NOT_TO_SAY',
        insurance,
        insurance_id: null,
        offloading,
        transport,
      }));

      const booking = await BookingsApi.createBooking({
        departure_id: departure.id,
        seats,
        contact: {
          full_name: contactName,
          email: contactEmail,
          phone: contactPhone,
        },
        travellers,
        addons: { insurance, offloading, transport },
      });

      navigation.navigate('BookingCheckout', { booking_id: booking.id });
    } catch (e: any) {
      setError(e.message || 'Seat hold reservation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Reserve Seats" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card style={styles.summaryHeader}>
            <Text style={[styles.trekTitle, { color: colors.text }]}>{departure.track?.name || 'Himalayan Trek'}</Text>
            <Text style={[styles.depDate, { color: colors.primary }]}>
              {new Date(departure.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} -{' '}
              {new Date(departure.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </Card>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <SeatPicker
            value={seats}
            onChange={setSeats}
            minSeats={1}
            maxSeats={Math.min(departure.seats_left || 6, 10)}
          />

          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Primary Booking Contact</Text>
            <Input label="Full Name" value={contactName} onChangeText={setContactName} placeholder="Full Name" />
            <Input label="Email Address" value={contactEmail} onChangeText={setContactEmail} placeholder="Email" keyboardType="email-address" />
            <Input label="Phone Number" value={contactPhone} onChangeText={setContactPhone} placeholder="Phone" keyboardType="phone-pad" />
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Optional Expeditions Addons</Text>

            <TouchableOpacity
              onPress={() => setInsurance(!insurance)}
              style={[styles.addonRow, { borderColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.addonName, { color: colors.text }]}>🛡️ Medical & Trek Insurance</Text>
                <Text style={[styles.addonDesc, { color: colors.textSecondary }]}>High-altitude medical cover up to ₹3,00,000</Text>
              </View>
              <Text style={[styles.addonPrice, { color: colors.primary }]}>+₹350</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setOffloading(!offloading)}
              style={[styles.addonRow, { borderColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.addonName, { color: colors.text }]}>🎒 Backpack Offloading</Text>
                <Text style={[styles.addonDesc, { color: colors.textSecondary }]}>Pony/porter offloading (max 12kg rucksack)</Text>
              </View>
              <Text style={[styles.addonPrice, { color: colors.primary }]}>+₹1,200</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTransport(!transport)}
              style={[styles.addonRow, { borderColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.addonName, { color: colors.text }]}>🚐 Shared Pickup & Drop</Text>
                <Text style={[styles.addonDesc, { color: colors.textSecondary }]}>Dehradun / Rishikesh station to basecamp</Text>
              </View>
              <Text style={[styles.addonPrice, { color: colors.primary }]}>+₹1,500</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.priceBreakdown}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Fare Summary</Text>
            <View style={styles.priceRow}>
              <Text style={{ color: colors.textSecondary }}>Trek Fare ({seats}x seat)</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                ₹{((baseSeatPaise * seats) / 100).toLocaleString('en-IN')}
              </Text>
            </View>

            {(insurancePaise > 0 || offloadingPaise > 0 || transportPaise > 0) && (
              <View style={styles.priceRow}>
                <Text style={{ color: colors.textSecondary }}>Addons Total</Text>
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  ₹{(((insurancePaise + offloadingPaise + transportPaise)) / 100).toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                ₹{(totalPaise / 100).toLocaleString('en-IN')}
              </Text>
            </View>
          </Card>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Button
            title="Hold Seats & Continue to Pay"
            onPress={handleHoldAndProceed}
            loading={loading}
            variant="primary"
            size="large"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  summaryHeader: { padding: 14, marginBottom: 12 },
  trekTitle: { fontSize: 18, fontWeight: '800' },
  depDate: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  errorText: { fontSize: 13 },
  sectionCard: { padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  addonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  addonName: { fontSize: 14, fontWeight: '700' },
  addonDesc: { fontSize: 12, marginTop: 2 },
  addonPrice: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  priceBreakdown: { padding: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTopWidth: 1 },
  totalLabel: { fontSize: 16, fontWeight: '800' },
  totalValue: { fontSize: 22, fontWeight: '800' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
});
