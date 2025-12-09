import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { lumaTheme } from '../theme/lumaTheme';

const { width } = Dimensions.get('window');

export default function HolographicOrb({ size = 200, animate = true }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [animate]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.5,
            height: size * 1.5,
            opacity: glowOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(0, 255, 240, 0)', 'rgba(79, 142, 255, 0.3)', 'rgba(0, 255, 240, 0)']}
          style={styles.glowGradient}
        />
      </Animated.View>

      {/* Main orb */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            transform: [{ scale: scaleAnim }, { rotate }],
          },
        ]}
      >
        <LinearGradient
          colors={lumaTheme.gradients.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbGradient}
        />
        
        {/* Inner highlight */}
        <View style={styles.highlight}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)']}
            style={styles.highlightGradient}
          />
        </View>

        {/* Reflections */}
        <View style={styles.reflection1} />
        <View style={styles.reflection2} />
      </Animated.View>

      {/* Particles */}
      <View style={styles.particles}>
        {[...Array(8)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                transform: [
                  { rotate: `${i * 45}deg` },
                  { translateX: size * 0.7 },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'transparent',
  },
  glowGradient: {
    flex: 1,
    borderRadius: 9999,
  },
  orb: {
    borderRadius: 9999,
    overflow: 'hidden',
    position: 'relative',
  },
  orbGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
  },
  highlight: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '40%',
    height: '40%',
    borderRadius: 9999,
  },
  highlightGradient: {
    flex: 1,
    borderRadius: 9999,
  },
  reflection1: {
    position: 'absolute',
    bottom: '20%',
    right: '15%',
    width: '25%',
    height: '25%',
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  reflection2: {
    position: 'absolute',
    top: '30%',
    right: '20%',
    width: '15%',
    height: '15%',
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  particles: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: lumaTheme.colors.orbCyan,
    opacity: 0.6,
  },
});
