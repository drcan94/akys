"use client";

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/login';
import { RegisterScreen } from '../screens/auth/register';
import { Colors } from '../constants/colors';
import { useTheme } from '../hooks/use-theme';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
        },
        headerTintColor: theme === 'dark' ? Colors.white : Colors.black,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Giriş Yap' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Kayıt Ol' }}
      />
    </Stack.Navigator>
  );
}