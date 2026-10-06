import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ProfileApi } from '../api/profile';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'AccountSettings'>;

export const AccountSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [marketingEmail, setMarketingEmail] = useState<boolean>(!!user?.marketing_email);
  const [marketingWhatsapp, setMarketingWhatsapp] = useState<boolean>(user?.marketing_whatsapp ?? true);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await ProfileApi.updateProfile({
        full_name: fullName,
        email,
        phone,
        marketing_email: marketingEmail,
        marketing_whatsapp: marketingWhatsapp,
      });
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Account Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Details</Text>
          <Input label="Full Name" value={fullName} onChangeText={setFullName} />
          <Input label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Input label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Communication Preferences</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>WhatsApp Trail Notifications</Text>
              <Text style={[styles.switchSub, { color: colors.textMuted }]}>Receive departure updates & guide alerts</Text>
            </View>
            <Switch value={marketingWhatsapp} onValueChange={(v: boolean) => setMarketingWhatsapp(v)} trackColor={{ true: colors.primary }} />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Expedition Newsletters</Text>
              <Text style={[styles.switchSub, { color: colors.textMuted }]}>Seasonal trek discounts and snow reports</Text>
            </View>
            <Switch value={marketingEmail} onValueChange={(v: boolean) => setMarketingEmail(v)} trackColor={{ true: colors.primary }} />
          </View>
        </Card>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          variant="primary"
          size="large"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  switchLabel: { fontSize: 14, fontWeight: '600' },
  switchSub: { fontSize: 12, marginTop: 2 },
});
