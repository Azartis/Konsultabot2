import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function HolographicOrb({ size = 100 }) {
  return (
    <View style={[styles.orb, { width: size, height: size }]} />
  );
}

const styles = StyleSheet.create({
  orb: {
    borderRadius: 50,
    backgroundColor: '#6366f1',
    opacity: 0.3,
  },
});

