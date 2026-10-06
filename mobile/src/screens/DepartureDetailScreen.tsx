import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingView } from '../components/LoadingView';
import { CatalogApi } from '../api/catalog';
import { DepartureSummary } from '../types/api';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'DepartureDetail'>;

export const DepartureDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const id = route.params.id;

  const [departure, setDeparture] = useState<DepartureSummary | null>(route.params.departure || null);
  const [loading, setLoading] = useState(!route.params.departure);

  useEffect(() => {
    if (!departure) {
      CatalogApi.getDepartureById(id)
        .then(setDeparture)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <LoadingView message="Loading departure batch details..." />;
  if (!departure) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Departure Details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={[styles.trekName, { color: colors.text }]}>{departure.track?.name || 'Himalayan Trek Batch'}</Text>
          <Text style={[styles.dates, { color: colors.primary }]}>
            {new Date(departure.start_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })} -{' '}
            {new Date(departure.end_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>

          <View style={styles.badgeRow}>
            <Badge label={`Seats Left: ${departure.seats_left}`} variant="success" />
            <Badge label={`Group Size: ${departure.max_group_size}`} variant="neutral" />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.label, { color: colors.textMuted }]}>Meeting Location</Text>
          <Text style={[styles.value, { color: colors.text }]}>📍 {departure.meeting_point || 'Basecamp Pickup Point'}</Text>

          {departure.guide && (
            <>
              <Text style={[styles.label, { color: colors.textMuted, marginTop: 12 }]}>Lead Expedition Guide</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                👨‍🦯 {departure.guide.full_name || 'Certified Himalayan Guide'}
              </Text>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.price, { color: colors.primary }]}>
            ₹{(departure.price_paise / 100).toLocaleString('en-IN')} <Text style={{ fontSize: 13, color: colors.textMuted }}>/ seat</Text>
          </Text>

          <Button
            title="Proceed to Seat Selection"
            onPress={() => navigation.navigate('SeatSelection', { departure })}
            variant="primary"
            size="large"
            style={{ marginTop: 16 }}
          />
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  card: { padding: 18 },
  trekName: { fontSize: 20, fontWeight: '800' },
  dates: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  divider: { height: 1, marginVertical: 14 },
  label: { fontSize: 12, fontWeight: '600' },
  value: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  price: { fontSize: 24, fontWeight: '800', marginTop: 4 },
});
