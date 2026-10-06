import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { LoadingView } from '../components/LoadingView';
import { AdminApi } from '../api/admin';
import { TrekSummary } from '../types/api';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'AdminTracks'>;

export const AdminTracksScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();

  const [tracks, setTracks] = useState<TrekSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTracks = async () => {
    try {
      const data = await AdminApi.getAdminTracks();
      setTracks(data);
    } catch (e) {
      console.log('Error fetching admin tracks:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTracks();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Admin Tracks" onBack={() => navigation.goBack()} />

      {loading ? (
        <LoadingView message="Loading trek catalog tracks..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {tracks.map((track) => (
            <Card key={track.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={[styles.title, { color: colors.text }]}>{track.name}</Text>
                <Badge label={track.difficulty} variant="warning" size="small" />
              </View>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>
                {track.region}, {track.state} • {track.duration_days} Days • {track.highest_altitude_ft.toLocaleString()} ft
              </Text>
              <Text style={[styles.price, { color: colors.primary }]}>
                Base Fare: ₹{(track.price_paise_from / 100).toLocaleString('en-IN')}
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
  sub: { fontSize: 12, marginTop: 4 },
  price: { fontSize: 14, fontWeight: '700', marginTop: 6 },
});
