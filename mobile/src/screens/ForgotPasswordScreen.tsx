import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/types';
import { AuthApi } from '../api/auth';

type Props = StackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await AuthApi.requestPasswordReset(email.trim());
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email address and we'll send you password reset instructions
          </Text>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {success ? (
          <View style={[styles.successBox, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.successText, { color: colors.success }]}>
              Check your inbox! Password reset link has been sent to {email}.
            </Text>
            <Button
              title="Return to Login"
              onPress={() => navigation.navigate('Login')}
              variant="primary"
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="Account Email"
              placeholder="e.g. trekker@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title="Send Reset Instructions"
              onPress={handleSubmit}
              loading={loading}
              variant="primary"
              size="large"
            />
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backBtn}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
            ‹ Back to Sign In
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
  successBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 'auto',
  },
});
