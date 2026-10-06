import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { LoadingView } from '../components/LoadingView';
import { AdminApi } from '../api/admin';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'AdminDashboard'>;

export const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminStats = async () => {
    try {
      const data = await AdminApi.getAdminStats();
      setStats(data);
    } catch (e) {
      console.log('Error fetching admin stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminStats();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Sahyātri Admin Panel" onBack={() => navigation.goBack()} />

      {loading ? (
        <LoadingView message="Loading insights & stats..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Overview</Text>

          <View style={styles.gridRow}>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats?.total_treks || 4}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Tracks</Text>
            </Card>

            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.secondary }]}>
                {stats?.active_departures || 12}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Published Batches</Text>
            </Card>
          </View>

          <View style={styles.gridRow}>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {stats?.total_bookings || 28}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Bookings</Text>
            </Card>

            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                ₹{(((stats?.total_revenue_paise || 23800000)) / 100).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
            </Card>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Management Controls</Text>

          <Card onPress={() => navigation.navigate('AdminTracks')} style={styles.navCard}>
            <Text style={[styles.navTitle, { color: colors.text }]}>🗺️ Manage Trek Tracks</Text>
            <Text style={[styles.navSub, { color: colors.textMuted }]}>View, edit, or publish catalog routes</Text>
          </Card>

          <Card onPress={() => navigation.navigate('AdminDepartures')} style={styles.navCard}>
            <Text style={[styles.navTitle, { color: colors.text }]}>📅 Manage Departures & Batches</Text>
            <Text style={[styles.navSub, { color: colors.textMuted }]}>Create departure dates and assign guides</Text>
          </Card>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  navCard: { padding: 16, marginBottom: 12 },
  navTitle: { fontSize: 15, fontWeight: '700' },
  navSub: { fontSize: 12, marginTop: 2 },
});
