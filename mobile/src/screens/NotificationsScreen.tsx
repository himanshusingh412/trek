import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { LoadingView } from '../components/LoadingView';
import { EmptyState } from '../components/EmptyState';
import { NotificationsApi } from '../api/notifications';
import { NotificationItem } from '../types/api';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Notifications'>,
  StackScreenProps<RootStackParamList>
>;

export const NotificationsScreen: React.FC<Props> = () => {
  const { colors } = useTheme();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await NotificationsApi.getNotifications();
      setItems(data);
    } catch (e) {
      console.log('Error loading notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
      </View>

      {loading ? (
        <LoadingView message="Loading alerts..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {items.length === 0 ? (
            <EmptyState
              title="No Notifications"
              description="You're all caught up! Departure and snow alerts will appear here."
            />
          ) : (
            items.map((item) => (
              <Card key={item.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                  <Badge label={item.type} variant="info" size="small" />
                </View>
                <Text style={[styles.message, { color: colors.textSecondary }]}>{item.message}</Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>
                  {new Date(item.timestamp).toLocaleString('en-IN')}
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
  header: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  message: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  time: { fontSize: 11, marginTop: 6 },
});
