import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'Support'>;

export const SupportScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Help & Support" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.emergencyCard}>
          <Text style={[styles.emergTitle, { color: colors.error }]}>🚨 Mountain Emergency Line</Text>
          <Text style={[styles.emergText, { color: colors.text }]}>
            For urgent active trail assistance, weather emergencies or medical evacuations.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('tel:+919876543210')}
            style={[styles.callBtn, { backgroundColor: colors.error }]}
          >
            <Text style={styles.callText}>Call Support (+91 9876543210)</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={[styles.question, { color: colors.text }]}>What is included in the trek fee?</Text>
            <Text style={[styles.answer, { color: colors.textSecondary }]}>
              All accommodation (alpine tents/lodges), 3 meal spreads per day, certified expedition leader, wilderness first responder, and permits.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={[styles.question, { color: colors.text }]}>What is the cancellation refund policy?</Text>
            <Text style={[styles.answer, { color: colors.textSecondary }]}>
              • 30+ days before start: 90% refund{'\n'}
              • 15-29 days before start: 50% refund{'\n'}
              • Less than 15 days: 0% refund (Transferable to next batch)
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  emergencyCard: { padding: 16, marginBottom: 16, backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  emergTitle: { fontSize: 16, fontWeight: '800' },
  emergText: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  callBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  callText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  card: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  faqItem: { marginBottom: 14 },
  question: { fontSize: 14, fontWeight: '700' },
  answer: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});
