/**
 * Chat Bubble Component for KonsultaBot
 * Displays individual chat messages with enhanced styling
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export const ChatBubble = ({ message, isUser, onFeedback }) => {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSourceIcon = (source) => {
    const icons = {
      'gemini': 'sparkles',
      'gemini_enhanced': 'sparkles-outline',
      'knowledge_base': 'library',
      'local_intelligence': 'bulb',
      'offline_knowledge_base': 'library-outline',
      'generic_fallback': 'help-circle',
      'error': 'warning'
    };
    return icons[source] || 'chatbubble';
  };

  const getSourceColor = (source) => {
    const colors = {
      'gemini': '#4C9EF6',
      'gemini_enhanced': '#3B82F6',
      'knowledge_base': '#10B981',
      'local_intelligence': '#F59E0B',
      'offline_knowledge_base': '#6B7280',
      'generic_fallback': '#8B5CF6',
      'error': '#EF4444'
    };
    return colors[source] || '#6B7280';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#10B981'; // Green
    if (confidence >= 0.6) return '#F59E0B'; // Yellow
    if (confidence >= 0.4) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={300}
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.botContainer
      ]}
    >
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        {/* Bot message header with source info */}
        {!isUser && message.source && (
          <View style={styles.messageHeader}>
            <View style={styles.sourceInfo}>
              <Ionicons
                name={getSourceIcon(message.source)}
                size={14}
                color={getSourceColor(message.source)}
              />
              <Text style={[styles.sourceText, { color: getSourceColor(message.source) }]}>
                {message.source.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
            
            {message.confidence !== undefined && (
              <View style={styles.confidenceInfo}>
                <View style={[
                  styles.confidenceDot,
                  { backgroundColor: getConfidenceColor(message.confidence) }
                ]} />
                <Text style={styles.confidenceText}>
                  {Math.round(message.confidence * 100)}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Message text */}
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.botText
        ]}>
          {message.text}
        </Text>

        {/* Message footer */}
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>
            {formatTimestamp(message.timestamp)}
          </Text>
          
          {/* Processing time for bot messages */}
          {!isUser && message.processingTime && (
            <Text style={styles.processingTime}>
              {message.processingTime.toFixed(1)}s
            </Text>
          )}
          
          {/* Translation indicator */}
          {message.translationUsed && (
            <Ionicons name="language" size={12} color="#6B7280" />
          )}
        </View>

        {/* Intent and entities info (for debugging/admin) */}
        {!isUser && __DEV__ && message.intent && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Intent: {message.intent}
            </Text>
            {message.entities && Object.keys(message.entities).length > 0 && (
              <Text style={styles.debugText}>
                Entities: {Object.keys(message.entities).join(', ')}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Feedback buttons for bot messages */}
      {!isUser && onFeedback && (
        <View style={styles.feedbackContainer}>
          <TouchableOpacity
            style={[styles.feedbackButton, styles.thumbsUp]}
            onPress={() => onFeedback(message.id, true)}
          >
            <Ionicons name="thumbs-up" size={16} color="#10B981" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.feedbackButton, styles.thumbsDown]}
            onPress={() => onFeedback(message.id, false)}
          >
            <Ionicons name="thumbs-down" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 10,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  botContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: width * 0.8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: '#4C9EF6',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  confidenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  confidenceText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#1F2937',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  processingTime: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  debugInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  debugText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  feedbackContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 10,
  },
  feedbackButton: {
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
  },
  thumbsUp: {
    borderColor: '#D1FAE5',
  },
  thumbsDown: {
    borderColor: '#FEE2E2',
  },
});
