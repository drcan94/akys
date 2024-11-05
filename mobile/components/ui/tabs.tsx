"use client";

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';

interface Tab {
  key: string;
  title: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  initialTab?: string;
}

export function Tabs({ tabs, initialTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0].key);
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? Colors.darkBorder : Colors.lightBorder,
      marginBottom: 16,
    },
    tabItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      minWidth: width / tabs.length,
    },
    tabTitle: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
    },
    activeTabTitle: {
      color: theme === 'dark' ? Colors.white : Colors.black,
    },
    indicator: {
      position: 'absolute',
      bottom: -1,
      height: 2,
      backgroundColor: Colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}>
              <Text
                style={[
                  styles.tabTitle,
                  isActive && styles.activeTabTitle,
                ]}>
                {tab.title}
              </Text>
              {isActive && (
                <View
                  style={[
                    styles.indicator,
                    {
                      width: width / tabs.length,
                      left: 0,
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {tabs.find((tab) => tab.key === activeTab)?.content}
    </View>
  );
}