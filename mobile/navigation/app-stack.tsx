"use client";

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/dashboard';
import { PatientsScreen } from '../screens/patients';
import { PatientDetailsScreen } from '../screens/patients/patient-details';
import { MessagesScreen } from '../screens/messages';
import { SettingsScreen } from '../screens/settings';
import { NotificationSettingsScreen } from '../screens/settings/notification-settings';
import { Colors } from '../constants/colors';
import { useTheme } from '../hooks/use-theme';

const Stack = createNativeStackNavigator();

export function AppStack() {
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
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Ana Sayfa' }}
      />
      <Stack.Screen
        name="Patients"
        component={PatientsScreen}
        options={{ title: 'Hastalar' }}
      />
      <Stack.Screen
        name="PatientDetails"
        component={PatientDetailsScreen}
        options={{ title: 'Hasta Detayları' }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: 'Mesajlar' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Ayarlar' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Bildirim Ayarları' }}
      />
    </Stack.Navigator>
  );
}