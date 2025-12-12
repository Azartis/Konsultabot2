import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function SpeechWaves({ isActive = false }) {
  if (!isActive) return null;
  
  return (
    <View style={styles.container}>
      <View style={[styles.wave, styles.wave1]} />
      <View style={[styles.wave, styles.wave2]} />
      <View style={[styles.wave, styles.wave3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  wave: {
    width: 4,
    backgroundColor: '#6366f1',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  wave1: {
    height: 8,
  },
  wave2: {
    height: 12,
  },
  wave3: {
    height: 8,
  },
});

