import React, { useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Animated } from 'react-native';

export default function GlitchText({ children, style }) {
  // Use only native driver for all animations to avoid conflicts
  const glitchAnim1 = useRef(new Animated.Value(0)).current;
  const glitchAnim2 = useRef(new Animated.Value(0)).current;
  const glitchAnim3 = useRef(new Animated.Value(0)).current;
  const skewAnim1 = useRef(new Animated.Value(0)).current;
  const skewAnim2 = useRef(new Animated.Value(0)).current;
  const skewAnim3 = useRef(new Animated.Value(0)).current;
  const scaleAnim1 = useRef(new Animated.Value(1)).current;
  const scaleAnim2 = useRef(new Animated.Value(1)).current;
  // Use opacity with native driver (works for opacity, just not for color changes)
  const shadowOpacity1 = useRef(new Animated.Value(0)).current;
  const shadowOpacity2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createGlitch = () => {
      const skewValue1 = (Math.random() - 0.5) * 0.3;
      const skewValue2 = (Math.random() - 0.5) * 0.3;
      const skewValue3 = (Math.random() - 0.5) * 0.2;
      const scaleValue1 = 1 + (Math.random() - 0.5) * 0.1;
      const scaleValue2 = 1 + (Math.random() - 0.5) * 0.1;
      const glitchX1 = (Math.random() - 0.5) * 12;
      const glitchX2 = (Math.random() - 0.5) * 12;
      const glitchX3 = (Math.random() - 0.5) * 4;
      
      // All animations use native driver
      Animated.parallel([
        // Shadow layer 1
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
          Animated.timing(skewAnim1, {
            toValue: skewValue1,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(skewAnim1, {
            toValue: -skewValue1,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(skewAnim1, {
            toValue: 0,
            duration: 15,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scaleAnim1, {
            toValue: scaleValue1,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim1, {
            toValue: 1,
            duration: 15,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shadowOpacity1, {
            toValue: 0.7,
            duration: 10,
            useNativeDriver: true,
          }),
          Animated.timing(shadowOpacity1, {
            toValue: 0,
            duration: 10,
            useNativeDriver: true,
          }),
        ]),
        // Shadow layer 2
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
        Animated.sequence([
          Animated.timing(skewAnim2, {
            toValue: skewValue2,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(skewAnim2, {
            toValue: -skewValue2,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(skewAnim2, {
            toValue: 0,
            duration: 15,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scaleAnim2, {
            toValue: scaleValue2,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim2, {
            toValue: 1,
            duration: 15,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shadowOpacity2, {
            toValue: 0.7,
            duration: 10,
            useNativeDriver: true,
          }),
          Animated.timing(shadowOpacity2, {
            toValue: 0,
            duration: 10,
            useNativeDriver: true,
          }),
        ]),
        // Main text
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
        Animated.sequence([
          Animated.timing(skewAnim3, {
            toValue: skewValue3,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(skewAnim3, {
            toValue: -skewValue3,
            duration: 15,
            useNativeDriver: true,
          }),
          Animated.timing(skewAnim3, {
            toValue: 0,
            duration: 15,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setTimeout(createGlitch, 800 + Math.random() * 1700);
      });
    };

    createGlitch();
  }, []);

  const skewInterpolate1 = skewAnim1.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

  const skewInterpolate2 = skewAnim2.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

  const skewInterpolate3 = skewAnim3.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-6deg', '6deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.text,
          style,
          styles.shadow1,
          {
            transform: [
              { translateX: glitchAnim1 },
              { skewX: skewInterpolate1 },
              { scale: scaleAnim1 },
            ],
            opacity: shadowOpacity1,
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
              { skewX: skewInterpolate2 },
              { scale: scaleAnim2 },
            ],
            opacity: shadowOpacity2,
          },
        ]}
      >
        {children}
      </Animated.Text>
      <Animated.Text 
        style={[
          styles.text, 
          style, 
          {
            transform: [
              { translateX: glitchAnim3 },
              { skewX: skewInterpolate3 },
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
  },
  shadow2: {
    position: 'absolute',
    color: '#EA4335',
  },
});
