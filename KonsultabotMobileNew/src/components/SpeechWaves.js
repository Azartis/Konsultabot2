import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { lumaTheme } from '../theme/lumaTheme';

const { width } = Dimensions.get('window');

export default function SpeechWaves({ isActive = false }) {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const wave4 = useRef(new Animated.Value(0)).current;
  const wave5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      const createWaveAnimation = (animValue, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animations = Animated.parallel([
        createWaveAnimation(wave1, 0),
        createWaveAnimation(wave2, 100),
        createWaveAnimation(wave3, 200),
        createWaveAnimation(wave4, 300),
        createWaveAnimation(wave5, 400),
      ]);

      animations.start();

      return () => {
        animations.stop();
        wave1.setValue(0);
        wave2.setValue(0);
        wave3.setValue(0);
        wave4.setValue(0);
        wave5.setValue(0);
      };
    }
  }, [isActive]);

  if (!isActive) return null;

  const createWaveStyle = (animValue) => ({
    transform: [
      {
        scaleY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1.5],
        }),
      },
    ],
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.wave, createWaveStyle(wave1)]} />
      <Animated.View style={[styles.wave, createWaveStyle(wave2)]} />
      <Animated.View style={[styles.wave, createWaveStyle(wave3)]} />
      <Animated.View style={[styles.wave, createWaveStyle(wave4)]} />
      <Animated.View style={[styles.wave, createWaveStyle(wave5)]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    gap: 6,
    marginTop: 20,
  },
  wave: {
    width: 4,
    height: 40,
    backgroundColor: lumaTheme.colors.primary,
    borderRadius: 2,
    shadowColor: lumaTheme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
});
