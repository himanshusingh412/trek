import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  StackScreenProps<RootStackParamList>
>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, mode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.userCard}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'T'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.full_name || 'Himalayan Trekker'}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || 'trekker@example.com'}</Text>
          <Badge label={`ROLE: ${user?.role || 'TREKKER'}`} variant="info" style={{ marginTop: 8 }} />
        </Card>

        {user?.role === 'GUIDE' && (
          <Card onPress={() => navigation.navigate('GuideDashboard')} style={styles.menuCard}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>👨‍🦯 Guide Expedition Dashboard</Text>
            <Text style={[styles.menuSub, { color: colors.textMuted }]}>Manage assigned departure batches and trek groups</Text>
          </Card>
        )}

        {user?.role === 'ADMIN' && (
          <Card onPress={() => navigation.navigate('AdminDashboard')} style={styles.menuCard}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>⚙️ Sahyātri Admin Dashboard</Text>
            <Text style={[styles.menuSub, { color: colors.textMuted }]}>Manage tracks, departures, guide profiles and revenue</Text>
          </Card>
        )}

        <Card style={styles.sectionCard}>
          <TouchableOpacity onPress={() => navigation.navigate('AccountSettings')} style={[styles.optionRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.text }]}>Account & Personal Settings</Text>
            <Text style={{ color: colors.textMuted }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleTheme} style={[styles.optionRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.text }]}>
              App Appearance ({mode === 'dark' ? '🌙 Dark' : '☀️ Light'})
            </Text>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Toggle</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Support')} style={styles.optionRow}>
            <Text style={[styles.optionText, { color: colors.text }]}>Help & Emergency Support</Text>
            <Text style={{ color: colors.textMuted }}>›</Text>
          </TouchableOpacity>
        </Card>

        <Button
          title="Sign Out"
          onPress={logout}
          variant="outline"
          size="medium"
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 40 },
  userCard: { alignItems: 'center', padding: 20, marginBottom: 16 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  userName: { fontSize: 20, fontWeight: '800' },
  userEmail: { fontSize: 13, marginTop: 2 },
  menuCard: { padding: 14, marginBottom: 12 },
  menuTitle: { fontSize: 15, fontWeight: '700' },
  menuSub: { fontSize: 12, marginTop: 2 },
  sectionCard: { paddingHorizontal: 16, marginBottom: 16 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  optionText: { fontSize: 14, fontWeight: '600' },
});
