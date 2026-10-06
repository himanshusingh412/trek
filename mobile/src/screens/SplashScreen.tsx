import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const SplashScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.logoText}>S</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Sahyātri</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Himalayan Treks & Mountain Expeditions
      </Text>
      <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 6,
  },
  spinner: {
    marginTop: 32,
  },
});
