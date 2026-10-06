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

type Props = StackScreenProps<RootStackParamList, 'GuideDashboard'>;

export const GuideDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();

  const [departures, setDepartures] = useState<DepartureSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGuideData = async () => {
    try {
      const data = await AdminApi.getGuideAssignedDepartures();
      setDepartures(data);
    } catch (e) {
      console.log('Error loading guide data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGuideData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGuideData();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Guide Expedition Hub" onBack={() => navigation.goBack()} />

      {loading ? (
        <LoadingView message="Loading assigned expedition batches..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          <Text style={[styles.heading, { color: colors.text }]}>Assigned Departure Batches</Text>

          {departures.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No upcoming departure batches assigned to your guide account yet.
              </Text>
            </Card>
          ) : (
            departures.map((dep) => (
              <Card key={dep.id} style={styles.depCard}>
                <View style={styles.row}>
                  <Text style={[styles.trekName, { color: colors.text }]}>{dep.track?.name || 'Trek Batch'}</Text>
                  <Badge label={dep.status} variant="info" size="small" />
                </View>

                <Text style={[styles.dateText, { color: colors.primary }]}>
                  📅 {new Date(dep.start_date).toLocaleDateString('en-IN')} -{' '}
                  {new Date(dep.end_date).toLocaleDateString('en-IN')}
                </Text>
                <Text style={[styles.subText, { color: colors.textSecondary }]}>
                  Meeting Point: {dep.meeting_point || 'Basecamp'} • Max Size: {dep.max_group_size}
                </Text>
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
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  emptyCard: { padding: 16, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  depCard: { padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trekName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  dateText: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  subText: { fontSize: 12, marginTop: 4 },
});
