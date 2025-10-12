import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme, spacing, borderRadius } from '../../theme/cleanTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: "Welcome to KonsultaBot! 🤖",
    subtitle: "Your IT Support Assistant",
    description: "I'm here to help you solve IT problems at EVSU Dulag Campus. From WiFi issues to printer troubles, I've got you covered!",
    icon: "🎯",
    color: "#1976d2",
    features: [
      "24/7 IT support assistance",
      "Voice and text interaction",
      "Offline mode available",
      "Campus-specific solutions"
    ]
  },
  {
    id: 2,
    title: "Smart Assistance 🧠",
    subtitle: "AI-Powered Solutions",
    description: "I use advanced AI to understand your problems and provide step-by-step solutions. When online, I access the latest information. When offline, I use my built-in knowledge base.",
    icon: "🔧",
    color: "#00D4FF",
    features: [
      "Intelligent problem diagnosis",
      "Step-by-step solutions",
      "Multiple language support",
      "Context-aware responses"
    ]
  },
  {
    id: 3,
    title: "Voice & Text Input 🎤",
    subtitle: "Communicate Your Way",
    description: "Talk to me using voice commands or type your questions. I support English, Bisaya, Waray, and Tagalog to help you communicate comfortably.",
    icon: "💬",
    color: "#4caf50",
    features: [
      "Voice recognition",
      "Text-to-speech responses",
      "Multi-language support",
      "Natural conversation"
    ]
  },
  {
    id: 4,
    title: "Common IT Issues 🛠️",
    subtitle: "Quick Solutions Ready",
    description: "I can help with the most common IT problems on campus. Tap on quick actions or describe your issue in your own words.",
    icon: "⚡",
    color: "#ff9800",
    features: [
      "WiFi connectivity issues",
      "Printer and printing problems",
      "Computer performance issues",
      "MS Office application help"
    ]
  },
  {
    id: 5,
    title: "Get Started! 🚀",
    subtitle: "Ready to Help You",
    description: "You're all set! Start by asking me about any IT issue you're facing. Remember, I'm here to help make your campus technology experience smooth and hassle-free.",
    icon: "✨",
    color: "#9c27b0",
    features: [
      "Ask me anything IT-related",
      "Use voice or text input",
      "Check quick action buttons",
      "Visit IT office for complex issues"
    ]
  }
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      navigation.replace('MainTabs');
    }
  };

  const renderOnboardingItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={[item.color + '20', item.color + '10']}
          style={styles.slideGradient}
        >
          <Animated.View style={[styles.slideContent, { transform: [{ scale }], opacity }]}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Text style={styles.iconEmoji}>{item.icon}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: item.color }]}>{item.subtitle}</Text>

            {/* Description */}
            <Text style={styles.description}>{item.description}</Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
              {item.features.map((feature, featureIndex) => (
                <View key={featureIndex} style={styles.featureItem}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={item.color} 
                    style={styles.featureIcon}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 20, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: onboardingData[currentIndex].color,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KonsultaBot Setup</Text>
        {currentIndex < onboardingData.length - 1 && (
          <Button
            mode="text"
            onPress={handleSkip}
            labelStyle={styles.skipButtonText}
          >
            Skip
          </Button>
        )}
      </View>

      {/* Content */}
      <Animated.FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderOnboardingItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Pagination */}
      {renderPagination()}

      {/* Navigation Buttons */}
      <Surface style={styles.navigationContainer}>
        <View style={styles.navigationButtons}>
          {currentIndex > 0 && (
            <IconButton
              icon="arrow-left"
              size={24}
              mode="contained"
              style={[styles.navButton, styles.prevButton]}
              onPress={handlePrevious}
            />
          )}
          
          <View style={styles.spacer} />
          
          <Button
            mode="contained"
            onPress={handleNext}
            style={[styles.nextButton, { backgroundColor: onboardingData[currentIndex].color }]}
            labelStyle={styles.nextButtonText}
            icon={currentIndex === onboardingData.length - 1 ? "rocket-launch" : "arrow-right"}
            contentStyle={styles.nextButtonContent}
          >
            {currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}
          </Button>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  skipButtonText: {
    color: theme.colors.placeholder,
    fontSize: 16,
  },
  slide: {
    width,
    flex: 1,
  },
  slideGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconEmoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    color: theme.colors.onSurface,
    paddingHorizontal: spacing.md,
  },
  featuresContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  featureIcon: {
    marginRight: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  navigationContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    elevation: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: theme.colors.surface,
  },
  prevButton: {
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    borderRadius: borderRadius.lg,
    elevation: 2,
  },
  nextButtonContent: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
