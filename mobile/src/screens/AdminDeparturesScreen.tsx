import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { LoadingView } from '../components/LoadingView';
import { AdminApi } from '../api/admin';
import { DepartureSummary } from '../types/api';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'AdminDepartures'>;

export const AdminDeparturesScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();

  const [departures, setDepartures] = useState<DepartureSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDepartures = async () => {
    try {
      const data = await AdminApi.getAdminDepartures();
      setDepartures(data);
    } catch (e) {
      console.log('Error fetching admin departures:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDepartures();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDepartures();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Admin Departures" onBack={() => navigation.goBack()} />

      {loading ? (
        <LoadingView message="Loading departure batches..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {departures.map((dep) => (
            <Card key={dep.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={[styles.title, { color: colors.text }]}>{dep.track?.name || 'Trek Batch'}</Text>
                <Badge label={dep.status} variant="info" size="small" />
              </View>
              <Text style={[styles.dates, { color: colors.primary }]}>
                📅 {new Date(dep.start_date).toLocaleDateString('en-IN')} -{' '}
                {new Date(dep.end_date).toLocaleDateString('en-IN')}
              </Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>
                Seats: {dep.seats_left}/{dep.max_group_size} • Meeting: {dep.meeting_point || 'Basecamp'}
              </Text>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  dates: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  sub: { fontSize: 12, marginTop: 4 },
});
