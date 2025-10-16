import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const MessageBubble = ({ message, isUser }) => {
  const isImage = message.type === 'image';
  
  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.botContainer
    ]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Image 
            source={require('../assets/bot-avatar.png')}
            style={styles.avatar}
          />
        </View>
      )}
      
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.botBubble,
      ]}>
        {isImage ? (
          <Image 
            source={{ uri: message.content }}
            style={styles.imageContent}
            resizeMode="cover"
          />
        ) : (
          <Text style={[
            styles.text,
            isUser ? styles.userText : styles.botText
          ]}>
            {message.content}
          </Text>
        )}
        
        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 15,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  botContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 20,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#0066FF',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#2D2D5F',
    borderBottomLeftRadius: 5,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#FFFFFF',
  },
  imageContent: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});

export default MessageBubble;