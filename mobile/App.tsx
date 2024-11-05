"use client";

import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './providers/theme-provider';
import { DataProvider } from './lib/core/providers';
import { AppNavigator } from './navigation';
import { enhancedNotifications } from './lib/core/notifications';
import { useTheme } from './hooks/use-theme';
import { Colors } from './constants/colors';

function App(): JSX.Element {
  const { theme } = useTheme();

  useEffect(() => {
    enhancedNotifications.initialize();
  }, []);

  return (
    <ThemeProvider>
      <DataProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={theme === 'dark' ? Colors.darker : Colors.lighter}
          />
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaView>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;