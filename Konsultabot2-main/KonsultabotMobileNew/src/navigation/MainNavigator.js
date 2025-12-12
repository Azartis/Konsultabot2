import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ImprovedChatScreen from '../screens/main/ImprovedChatScreen';
import SimpleProfileScreen from '../screens/main/SimpleProfileScreen';
import SimpleSettingsScreen from '../screens/main/SimpleSettingsScreen';
import { theme } from '../theme/cleanTheme';

const Stack = createStackNavigator();

function ChatStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ChatMain" 
        component={ImprovedChatScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}


function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={SimpleProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SimpleSettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  // Removed footer tabs - navigation now only through header menu
  return <ChatStack />;
}
