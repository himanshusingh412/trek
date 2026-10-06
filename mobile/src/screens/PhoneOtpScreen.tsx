import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/types';
import { AuthApi } from '../api/auth';

type Props = StackScreenProps<AuthStackParamList, 'PhoneOtp'>;

export const PhoneOtpScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { verifyPhoneOtp } = useAuth();
  const phone = route.params.phone;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyPhoneOtp(phone, otp.trim());
    } catch (e: any) {
      setError(e.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    try {
      await AuthApi.requestPhoneOtp(phone);
      setCountdown(30);
    } catch (e: any) {
      setError('Failed to resend OTP.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Enter OTP Code</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We sent a 6-digit verification code to +91 {phone}
          </Text>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Input
            label="6-Digit OTP"
            placeholder="e.g. 123456"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            style={{ textAlign: 'center', letterSpacing: 8, fontSize: 22, fontWeight: '700' }}
          />

          <Button
            title="Verify & Continue"
            onPress={handleVerify}
            loading={loading}
            variant="primary"
            size="large"
            style={{ marginTop: 12 }}
          />

          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                Resend code in <Text style={{ fontWeight: '700' }}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
                  Resend OTP Code
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
            ‹ Change Mobile Number
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 'auto',
  },
});
