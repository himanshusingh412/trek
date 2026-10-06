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
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { CatalogApi } from '../api/catalog';
import { TrekSummary } from '../types/api';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  StackScreenProps<RootStackParamList>
>;

const REGIONS = ['Uttarakhand', 'Himachal', 'Kashmir', 'Sikkim'];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [treks, setTreks] = useState<TrekSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchHomeData = async () => {
    try {
      const data = await CatalogApi.getTreks();
      setTreks(data);
    } catch (e) {
      console.log('Failed to fetch home treks:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const handleSearchSubmit = () => {
    if (search.trim()) {
      navigation.navigate('MainTabs', {
        screen: 'Explore',
        params: { search: search.trim() },
      });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
            Namaste, {user?.full_name ? user.full_name.split(' ')[0] : 'Trekker'} 🙏
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Find Your Next Peak</Text>
        </View>

        {user?.role === 'GUIDE' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('GuideDashboard')}
            style={[styles.roleBadge, { backgroundColor: colors.secondary }]}
          >
            <Text style={styles.roleBadgeText}>Guide Hub</Text>
          </TouchableOpacity>
        )}

        {user?.role === 'ADMIN' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminDashboard')}
            style={[styles.roleBadge, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.roleBadgeText}>Admin Panel</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchSection}>
        <Input
          placeholder="Search treks, peaks or regions..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
      </View>

      {/* Hero Card */}
      <Card
        onPress={() => navigation.navigate('TrekDetail', { slug: 'kedarkantha-trek' })}
        style={styles.heroCard}
      >
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
          }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <Badge label="FEATURED EXPEDITION" variant="info" size="small" />
          <Text style={styles.heroTitle}>Kedarkantha Winter Summit</Text>
          <Text style={styles.heroSub}>Summit 12,500 ft • 5 Days • Uttarakhand</Text>
          <Text style={styles.heroPrice}>Starting at ₹8,500 / seat</Text>
        </View>
      </Card>

      {/* Region Chips */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore by Region</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {REGIONS.map((region) => (
          <TouchableOpacity
            key={region}
            onPress={() =>
              navigation.navigate('MainTabs', {
                screen: 'Explore',
                params: { region },
              })
            }
            style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.chipText, { color: colors.text }]}>{region}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trending Treks */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Himalayan Treks</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'Explore' })}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {treks.length === 0 && !loading ? (
        <Card style={styles.fallbackCard}>
          <Text style={[styles.fallbackTitle, { color: colors.text }]}>Upcoming Season Departures</Text>
          <Text style={[styles.fallbackDesc, { color: colors.textSecondary }]}>
            Kedarkantha, Har Ki Dun, Brahmatal, and Valley of Flowers departures open.
          </Text>
        </Card>
      ) : (
        treks.map((trek) => (
          <Card
            key={trek.id}
            onPress={() => navigation.navigate('TrekDetail', { slug: trek.slug, trek })}
            style={styles.trekCard}
          >
            <Image
              source={{
                uri:
                  trek.cover_image_url ||
                  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
              }}
              style={styles.trekImage}
            />
            <View style={styles.trekContent}>
              <View style={styles.trekBadges}>
                <Badge label={`${trek.duration_days} Days`} variant="neutral" size="small" />
                <Badge label={trek.difficulty} variant="warning" size="small" />
                <Badge label={`${trek.highest_altitude_ft.toLocaleString()} ft`} variant="info" size="small" />
              </View>

              <Text style={[styles.trekName, { color: colors.text }]}>{trek.name}</Text>
              <Text style={[styles.trekRegion, { color: colors.textSecondary }]}>
                {trek.region}, {trek.state}
              </Text>

              <View style={styles.trekFooter}>
                <Text style={[styles.priceText, { color: colors.primary }]}>
                  ₹{(trek.price_paise_from / 100).toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.perSeat, { color: colors.textMuted }]}>/ trekker</Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchSection: {
    marginBottom: 16,
  },
  heroCard: {
    height: 200,
    padding: 0,
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  heroSub: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  heroPrice: {
    color: '#34d399',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipsRow: {
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fallbackCard: {
    padding: 20,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  fallbackDesc: {
    fontSize: 14,
    marginTop: 4,
  },
  trekCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  trekImage: {
    width: '100%',
    height: 160,
  },
  trekContent: {
    padding: 14,
  },
  trekBadges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  trekName: {
    fontSize: 17,
    fontWeight: '700',
  },
  trekRegion: {
    fontSize: 13,
    marginTop: 2,
  },
  trekFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
  },
  perSeat: {
    fontSize: 12,
    marginLeft: 4,
  },
});
