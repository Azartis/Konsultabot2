import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const FeatureItem = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.featureCard} onPress={onPress}>
    <View style={styles.featureIcon}>
      <Icon name={icon} size={24} color="#fff" />
    </View>
    <Text style={styles.featureText}>{title}</Text>
    <Icon name="chevron-forward" size={20} color="#8E8EA0" />
  </TouchableOpacity>
);

const FeatureGrid = ({ onFeatureSelect }) => {
  const features = [
    {
      id: 'translation',
      icon: 'language',
      title: 'Smart Translation',
    },
    {
      id: 'image-gen',
      icon: 'image',
      title: 'Image Generation',
    },
    {
      id: 'daily-tasks',
      icon: 'calendar',
      title: 'Daily Task Planner',
    },
    {
      id: 'focus-tools',
      icon: 'timer',
      title: 'Focus & Mindfulness Tools',
    }
  ];

  return (
    <View style={styles.container}>
      {features.map(feature => (
        <FeatureItem
          key={feature.id}
          icon={feature.icon}
          title={feature.title}
          onPress={() => onFeatureSelect(feature.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  featureCard: {
    backgroundColor: '#1F1F3D',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#2D2D5F',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
});

export default FeatureGrid;