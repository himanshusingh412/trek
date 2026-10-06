import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'BookingConfirmation'>;

export const BookingConfirmationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const bookingId = route.params.booking_id;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successHeader}>
          <View style={[styles.checkCircle, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Booking Confirmed!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your Himalayan expedition seats have been successfully reserved and confirmed.
          </Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Booking Reference:</Text>
            <Text style={[styles.value, { color: colors.primary }]}>{bookingId.slice(0, 12).toUpperCase()}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Badge label="PAYMENT SUCCESSFUL" variant="success" />

          <Text style={[styles.noteText, { color: colors.textSecondary, marginTop: 12 }]}>
            📧 A detailed confirmation voucher and gear checklist have been sent to your email. Our expedition lead guide will reach out 48 hours before start date.
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title="View Booking Details"
            onPress={() => navigation.navigate('BookingDetail', { booking_id: bookingId })}
            variant="primary"
            size="large"
            style={{ marginBottom: 12 }}
          />
          <Button
            title="Return to Home"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            variant="outline"
            size="medium"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  successHeader: { alignItems: 'center', marginBottom: 24 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  checkIcon: { color: '#059669', fontSize: 40, fontWeight: '900' },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  card: { padding: 18, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600' },
  value: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, marginVertical: 12 },
  noteText: { fontSize: 13, lineHeight: 18 },
  actions: { width: '100%' },
});
