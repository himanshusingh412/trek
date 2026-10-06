import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { LoadingView } from '../components/LoadingView';
import { EmptyState } from '../components/EmptyState';
import { BookingsApi } from '../api/bookings';
import { Booking } from '../types/api';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Bookings'>,
  StackScreenProps<RootStackParamList>
>;

type FilterTab = 'ALL' | 'CONFIRMED' | 'HELD' | 'CANCELLED';

export const BookingsListScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const data = await BookingsApi.getUserBookings();
      setBookings(data);
    } catch (e) {
      console.log('Failed to fetch user bookings:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'CONFIRMED') return b.status === 'CONFIRMED';
    if (activeFilter === 'HELD') return b.status === 'HELD';
    if (activeFilter === 'CANCELLED')
      return b.status === 'CANCELLED_TREKKER' || b.status === 'CANCELLED_FORCE_MAJEURE';
    return true;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'HELD':
        return 'warning';
      case 'CANCELLED_TREKKER':
      case 'CANCELLED_FORCE_MAJEURE':
        return 'error';
      default:
        return 'neutral';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Trek Bookings</Text>

        <View style={[styles.tabRow, { backgroundColor: colors.surfaceVariant }]}>
          {(['ALL', 'CONFIRMED', 'HELD', 'CANCELLED'] as FilterTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveFilter(tab)}
              style={[styles.tab, activeFilter === tab && { backgroundColor: colors.surface }]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeFilter === tab ? colors.primary : colors.textMuted },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <LoadingView message="Loading your bookings..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {filteredBookings.length === 0 ? (
            <EmptyState
              title="No Bookings Found"
              description="You have not placed any trek reservations under this filter yet."
              actionTitle="Explore Treks"
              onAction={() => navigation.navigate('MainTabs', { screen: 'Explore' })}
            />
          ) : (
            filteredBookings.map((item) => (
              <Card
                key={item.id}
                onPress={() => navigation.navigate('BookingDetail', { booking_id: item.id })}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.trekName, { color: colors.text }]}>
                    {item.departure?.track?.name || 'Himalayan Trek'}
                  </Text>
                  <Badge label={item.status} variant={getStatusBadgeVariant(item.status)} size="small" />
                </View>

                {item.departure?.start_date && (
                  <Text style={[styles.datesText, { color: colors.primary }]}>
                    📅{' '}
                    {new Date(item.departure.start_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    -{' '}
                    {new Date(item.departure.end_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                )}

                <View style={styles.cardFooter}>
                  <Text style={[styles.seatsCount, { color: colors.textSecondary }]}>
                    👥 {item.seats} Seat(s)
                  </Text>
                  <Text style={[styles.priceText, { color: colors.text }]}>
                    ₹{((item.amount_paise || 850000) / 100).toLocaleString('en-IN')}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  tabRow: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 11, fontWeight: '700' },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  trekName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  datesText: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  seatsCount: { fontSize: 13, fontWeight: '500' },
  priceText: { fontSize: 16, fontWeight: '800' },
});
