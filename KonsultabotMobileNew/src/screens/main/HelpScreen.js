import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import {
  Text,
  Card,
  List,
  Divider,
  Button,
} from 'react-native-paper';
import { theme, spacing } from '../../theme/theme';

export default function HelpScreen({ navigation }) {
  const faqItems = [
    {
      question: 'How do I use KonsultaBot?',
      answer: 'Simply type your question in the chat input or use the microphone button to speak. KonsultaBot will provide helpful IT support answers based on your query.',
    },
    {
      question: 'What languages are supported?',
      answer: 'KonsultaBot supports English, Bisaya, Waray, and Tagalog. You can change the language in Settings.',
    },
    {
      question: 'How do I use voice input?',
      answer: 'Tap the microphone button and speak your question. The app will transcribe your speech and send it to the bot automatically.',
    },
    {
      question: 'Does KonsultaBot work offline?',
      answer: 'Yes! KonsultaBot has offline mode with basic IT support knowledge. For advanced features, an internet connection is required.',
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to Settings > Account > Change Password. Enter your current password and new password to update it.',
    },
    {
      question: 'How do I change the app theme?',
      answer: 'Go to Settings > Appearance > Theme. You can choose between Light, Dark, or Auto mode.',
    },
    {
      question: 'Can I export my chat history?',
      answer: 'Chat history export feature is coming soon. Your conversations are stored locally on your device.',
    },
    {
      question: 'Who can I contact for support?',
      answer: 'For technical support, contact the EVSU Dulag IT Department. You can also email support@evsu.edu.ph',
    },
  ];

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@evsu.edu.ph?subject=KonsultaBot Support Request');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+639123456789');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>
            Get help using KonsultaBot and find answers to common questions
          </Text>
        </Card.Content>
      </Card>

      {/* FAQ Section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqItems.map((item, index) => (
            <View key={index}>
              <List.Item
                title={item.question}
                description={item.answer}
                titleStyle={styles.faqQuestion}
                descriptionStyle={styles.faqAnswer}
                titleNumberOfLines={2}
                descriptionNumberOfLines={10}
              />
              {index < faqItems.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Contact Support Section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          
          <List.Item
            title="Email Support"
            description="support@evsu.edu.ph"
            left={(props) => <List.Icon {...props} icon="email" color={theme.colors.accent} />}
            onPress={handleContactSupport}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Call IT Department"
            description="+63 912 345 6789"
            left={(props) => <List.Icon {...props} icon="phone" color={theme.colors.accent} />}
            onPress={handleCallSupport}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Visit IT Office"
            description="EVSU Dulag Campus, IT Department Office"
            left={(props) => <List.Icon {...props} icon="map-marker" color={theme.colors.accent} />}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
        </Card.Content>
      </Card>

      {/* Quick Tips Section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Be specific with your questions for better answers
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Use voice input for hands-free interaction
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Check your internet connection for full features
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Clear chat history if the app feels slow
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* About Section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>About KonsultaBot</Text>
          <Text style={styles.aboutText}>
            KonsultaBot is an AI-powered IT support assistant developed for EVSU Dulag Campus.
            It helps students and staff with computer problems, network issues, and general IT support.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  faqQuestion: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  faqAnswer: {
    color: theme.colors.placeholder,
    fontSize: 14,
    lineHeight: 20,
  },
  listItemTitle: {
    color: theme.colors.text,
    fontSize: 16,
  },
  listItemDescription: {
    color: theme.colors.placeholder,
    fontSize: 14,
  },
  divider: {
    backgroundColor: theme.colors.disabled,
    marginVertical: spacing.xs,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  tipBullet: {
    color: theme.colors.accent,
    fontSize: 18,
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  tipText: {
    color: theme.colors.text,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  aboutText: {
    color: theme.colors.placeholder,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  versionText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
});

