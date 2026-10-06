import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { CatalogApi } from '../api/catalog';
import { DepartureSummary, TrekSummary } from '../types/api';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'TrekDetail'>;

export const TrekDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const slug = route.params.slug;

  const [trek, setTrek] = useState<any>(route.params.trek || null);
  const [departures, setDepartures] = useState<DepartureSummary[]>([]);
  const [snowReport, setSnowReport] = useState<any>(null);
  const [loading, setLoading] = useState(!route.params.trek);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'departures'>('overview');

  const fetchDetails = async () => {
    try {
      const trekData = await CatalogApi.getTrekBySlug(slug);
      setTrek(trekData);
      const depData = await CatalogApi.getTrekDepartures(slug);
      setDepartures(depData);

      try {
        const snow = await CatalogApi.getSnowReport(slug);
        setSnowReport(snow);
      } catch (e) {
        // quiet fail for snow
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load trek details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [slug]);

  if (loading) return <LoadingView message="Fetching expedition details..." />;
  if (error || !trek) return <ErrorView message={error || 'Trek not found'} onRetry={fetchDetails} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={trek.name} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={{
            uri:
              trek.cover_image_url ||
              'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
          }}
          style={styles.heroImage}
        />

        <View style={styles.mainInfo}>
          <View style={styles.badgeRow}>
            <Badge label={`${trek.duration_days} Days`} variant="neutral" />
            <Badge label={trek.difficulty} variant="warning" />
            <Badge label={`${trek.highest_altitude_ft.toLocaleString()} ft`} variant="info" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{trek.name}</Text>
          <Text style={[styles.location, { color: colors.textSecondary }]}>
            📍 {trek.region}, {trek.state}
          </Text>

          {snowReport && (
            <Card style={styles.snowCard}>
              <Text style={[styles.snowTitle, { color: colors.secondary }]}>
                ❄️ Snow & Weather Report
              </Text>
              <Text style={[styles.snowText, { color: colors.text }]}>
                Snow Depth: {snowReport.snow_depth_cm || '25'} cm • Condition: {snowReport.condition || 'Fresh Powder'}
              </Text>
            </Card>
          )}

          <View style={[styles.tabRow, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity
              onPress={() => setActiveTab('overview')}
              style={[styles.tab, activeTab === 'overview' && { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'overview' ? colors.primary : colors.textMuted }]}>
                Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('itinerary')}
              style={[styles.tab, activeTab === 'itinerary' && { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'itinerary' ? colors.primary : colors.textMuted }]}>
                Itinerary
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('departures')}
              style={[styles.tab, activeTab === 'departures' && { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'departures' ? colors.primary : colors.textMuted }]}>
                Dates ({departures.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>About the Trek</Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {trek.short_description ||
                  'Ascend through dense pine forests, frozen streams, and high ridge lines to reach the summit. Led by experienced local guides certified in Wilderness First Aid.'}
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 16 }]}>
                Key Highlights
              </Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>• 360-degree Himalayan panorama at summit</Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>• High-quality 4-season alpine tents</Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>• Nutritious warm mountain meals prepared fresh</Text>
            </View>
          )}

          {activeTab === 'itinerary' && (
            <View style={styles.tabContent}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Day-by-Day Route</Text>
              {(trek.itinerary || [
                { day: 1, title: 'Drive to Basecamp', description: 'Pickup from railway station, scenic mountain drive to base village.' },
                { day: 2, title: 'Trek to Camp 1', description: 'Walk through pine forests along mountain streams to reach meadow campsite.' },
                { day: 3, title: 'Summit Push & Return', description: 'Early morning climb to summit for sunrise view, descend to basecamp.' },
              ]).map((item: any) => (
                <Card key={item.day} style={styles.itineraryCard}>
                  <Text style={[styles.dayBadge, { color: colors.primary }]}>Day {item.day}</Text>
                  <Text style={[styles.itineraryTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.itineraryDesc, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </Card>
              ))}
            </View>
          )}

          {activeTab === 'departures' && (
            <View style={styles.tabContent}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Available Departure Batches</Text>
              {departures.length === 0 ? (
                <Text style={{ color: colors.textMuted, marginTop: 8 }}>
                  No active public departures currently scheduled for this trek.
                </Text>
              ) : (
                departures.map((dep) => (
                  <Card key={dep.id} style={styles.departureCard}>
                    <View style={styles.depHeader}>
                      <View>
                        <Text style={[styles.depDates, { color: colors.text }]}>
                          {new Date(dep.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} -{' '}
                          {new Date(dep.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                        <Text style={[styles.depMeeting, { color: colors.textSecondary }]}>
                          Meeting Point: {dep.meeting_point || 'Basecamp'}
                        </Text>
                      </View>
                      <Badge
                        label={`${dep.seats_left} seats left`}
                        variant={dep.seats_left > 3 ? 'success' : 'error'}
                      />
                    </View>

                    <View style={styles.depFooter}>
                      <Text style={[styles.depPrice, { color: colors.primary }]}>
                        ₹{(dep.price_paise / 100).toLocaleString('en-IN')}
                      </Text>
                      <Button
                        title="Book Batch"
                        onPress={() => navigation.navigate('SeatSelection', { departure: dep })}
                        variant="primary"
                        size="small"
                      />
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.stickyFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.footerPrice, { color: colors.primary }]}>
            ₹{(trek.price_paise_from / 100).toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.footerSub, { color: colors.textMuted }]}>per seat</Text>
        </View>
        <Button
          title="Select Departure"
          onPress={() => setActiveTab('departures')}
          variant="primary"
          size="medium"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 90 },
  heroImage: { width: '100%', height: 220 },
  mainInfo: { padding: 16 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  location: { fontSize: 14, fontWeight: '500', marginTop: 4, marginBottom: 12 },
  snowCard: { padding: 12, marginBottom: 16, backgroundColor: 'rgba(56, 189, 248, 0.1)' },
  snowTitle: { fontSize: 13, fontWeight: '700' },
  snowText: { fontSize: 13, marginTop: 2 },
  tabRow: { flexDirection: 'row', borderRadius: 10, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '700' },
  tabContent: { marginTop: 4 },
  sectionHeading: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  bodyText: { fontSize: 14, lineHeight: 22 },
  bullet: { fontSize: 14, lineHeight: 22, marginTop: 4 },
  itineraryCard: { marginBottom: 10, padding: 12 },
  dayBadge: { fontSize: 12, fontWeight: '700' },
  itineraryTitle: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  itineraryDesc: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  departureCard: { marginBottom: 12, padding: 14 },
  depHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  depDates: { fontSize: 15, fontWeight: '700' },
  depMeeting: { fontSize: 12, marginTop: 2 },
  depFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  depPrice: { fontSize: 17, fontWeight: '800' },
  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, borderTopWidth: 1 },
  footerPrice: { fontSize: 20, fontWeight: '800' },
  footerSub: { fontSize: 11 },
});
