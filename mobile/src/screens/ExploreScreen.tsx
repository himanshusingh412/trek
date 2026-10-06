import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { LoadingView } from '../components/LoadingView';
import { EmptyState } from '../components/EmptyState';
import { CatalogApi } from '../api/catalog';
import { TrekSummary } from '../types/api';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Explore'>,
  StackScreenProps<RootStackParamList>
>;

const DIFFICULTIES = ['ALL', 'EASY', 'MODERATE', 'DIFFICULT', 'STRENUOUS'];

export const ExploreScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();

  const initialSearch = route.params?.search || '';
  const initialRegion = route.params?.region || '';
  const initialDifficulty = route.params?.difficulty || 'ALL';

  const [search, setSearch] = useState(initialSearch);
  const [selectedDifficulty, setSelectedDifficulty] = useState(initialDifficulty);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);

  const [treks, setTreks] = useState<TrekSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCatalog = async () => {
    try {
      const data = await CatalogApi.getTreks({
        search: search || undefined,
        region: selectedRegion || undefined,
        difficulty: selectedDifficulty !== 'ALL' ? selectedDifficulty : undefined,
      });
      setTreks(data);
    } catch (e) {
      console.log('Error fetching catalog:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [search, selectedDifficulty, selectedRegion]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCatalog();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Explore Expeditions</Text>
        <Input
          placeholder="Search by name, peak or valley..."
          value={search}
          onChangeText={setSearch}
          style={{ marginTop: 8 }}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.diffRow}>
          {DIFFICULTIES.map((diff) => (
            <TouchableOpacity
              key={diff}
              onPress={() => setSelectedDifficulty(diff)}
              style={[
                styles.diffChip,
                {
                  backgroundColor:
                    selectedDifficulty === diff ? colors.primary : colors.surfaceVariant,
                },
              ]}
            >
              <Text
                style={[
                  styles.diffText,
                  { color: selectedDifficulty === diff ? '#ffffff' : colors.text },
                ]}
              >
                {diff}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingView message="Searching Himalayan routes..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {treks.length === 0 ? (
            <EmptyState
              title="No Treks Found"
              description="Try clearing your search query or changing difficulty filters."
              actionTitle="Clear Filters"
              onAction={() => {
                setSearch('');
                setSelectedDifficulty('ALL');
                setSelectedRegion('');
              }}
            />
          ) : (
            treks.map((trek) => (
              <Card
                key={trek.id}
                onPress={() => navigation.navigate('TrekDetail', { slug: trek.slug, trek })}
                style={styles.card}
              >
                <Image
                  source={{
                    uri:
                      trek.cover_image_url ||
                      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
                  }}
                  style={styles.image}
                />
                <View style={styles.cardBody}>
                  <View style={styles.badgeRow}>
                    <Badge label={`${trek.duration_days} Days`} variant="neutral" size="small" />
                    <Badge label={trek.difficulty} variant="warning" size="small" />
                    <Badge label={`${trek.highest_altitude_ft.toLocaleString()} ft`} variant="info" size="small" />
                  </View>
                  <Text style={[styles.trekTitle, { color: colors.text }]}>{trek.name}</Text>
                  <Text style={[styles.trekSub, { color: colors.textSecondary }]}>
                    {trek.region}, {trek.state}
                  </Text>
                  <Text style={[styles.shortDesc, { color: colors.textMuted }]} numberOfLines={2}>
                    {trek.short_description || 'High-altitude Himalayan trek with certified leads and gear.'}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.price, { color: colors.primary }]}>
                      ₹{(trek.price_paise_from / 100).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.viewDetails, { color: colors.primary }]}>
                      View Departures ›
                    </Text>
                  </View>
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
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  diffRow: {
    marginTop: 8,
    marginBottom: 4,
  },
  diffChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  diffText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
  },
  cardBody: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  trekTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  trekSub: {
    fontSize: 13,
    marginTop: 2,
  },
  shortDesc: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: '700',
  },
});
