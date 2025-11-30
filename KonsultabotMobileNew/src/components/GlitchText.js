import React, { useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Animated } from 'react-native';

export default function GlitchText({ children, style }) {
  const glitchAnim1 = useRef(new Animated.Value(0)).current;
  const glitchAnim2 = useRef(new Animated.Value(0)).current;
  const glitchAnim3 = useRef(new Animated.Value(0)).current;
  const skewAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createGlitch = () => {
      // More pronounced distortion values
      const skewValue = (Math.random() - 0.5) * 0.3;
      const scaleValue = 1 + (Math.random() - 0.5) * 0.1;
      const glitchX1 = (Math.random() - 0.5) * 12; // Increased from ±3 to ±12
      const glitchX2 = (Math.random() - 0.5) * 12;
      const glitchX3 = (Math.random() - 0.5) * 4;
      
      Animated.parallel([
        // Horizontal glitch movement - much more pronounced
        Animated.sequence([
          Animated.timing(glitchAnim1, {
            toValue: glitchX1,
            duration: 25,
            useNativeDriver: true,
          }),
          Animated.timing(glitchAnim1, {
            toValue: -glitchX1 * 0.5,
            duration: 25,
            useNativeDriver: true,
          }),
          Animated.timing(glitchAnim1, {
            toValue: 0,
            duration: 25,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glitchAnim2, {
            toValue: glitchX2,
            duration: 25,
            useNativeDriver: true,
          }),
          Animated.timing(glitchAnim2, {
            toValue: -glitchX2 * 0.5,
            duration: 25,
            useNativeDriver: true,
          }),
          Animated.timing(glitchAnim2, {
            toValue: 0,
            duration: 25,
            useNativeDriver: true,
          }),
        ]),
        // Skew distortion - more pronounced
        Animated.sequence([
          Animated.timing(skewAnim, {
            toValue: skewValue,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(skewAnim, {
            toValue: -skewValue,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(skewAnim, {
            toValue: 0,
            duration: 15,
            useNativeDriver: true,
          }),
        ]),
        // Scale distortion - more pronounced
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: scaleValue,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 15,
            useNativeDriver: true,
          }),
        ]),
        // Color shift - more visible
        Animated.sequence([
          Animated.timing(colorShift, {
            toValue: 1,
            duration: 10,
            useNativeDriver: false,
          }),
          Animated.timing(colorShift, {
            toValue: 0,
            duration: 10,
            useNativeDriver: false,
          }),
        ]),
        // Main text movement - more pronounced
        Animated.sequence([
          Animated.timing(glitchAnim3, {
            toValue: glitchX3,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(glitchAnim3, {
            toValue: 0,
            duration: 15,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // More frequent glitches (0.8-2.5 seconds)
        setTimeout(createGlitch, 800 + Math.random() * 1700);
      });
    };

    createGlitch();
  }, []);

  const skewInterpolate = skewAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

  const colorOpacity = colorShift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  return (
    <View style={styles.container}>
      {/* Distorted shadow layers for glitch effect */}
      <Animated.Text
        style={[
          styles.text,
          style,
          styles.shadow1,
          {
            transform: [
              { translateX: glitchAnim1 },
              { skewX: skewInterpolate },
              { scale: scaleAnim },
            ],
            opacity: colorOpacity,
          },
        ]}
      >
        {children}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.text,
          style,
          styles.shadow2,
          {
            transform: [
              { translateX: glitchAnim2 },
              { skewX: skewInterpolate },
              { scale: scaleAnim },
            ],
            opacity: colorOpacity,
          },
        ]}
      >
        {children}
      </Animated.Text>
      {/* Main text with subtle distortion */}
      <Animated.Text 
        style={[
          styles.text, 
          style, 
          {
            transform: [
              { translateX: glitchAnim3 },
              { skewX: skewInterpolate },
            ],
          }
        ]}
      >
        {children}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  text: {
    fontWeight: '400',
    color: '#202124',
  },
  shadow1: {
    position: 'absolute',
    color: '#4285F4',
    opacity: 0.9,
  },
  shadow2: {
    position: 'absolute',
    color: '#EA4335',
    opacity: 0.9,
  },
});

