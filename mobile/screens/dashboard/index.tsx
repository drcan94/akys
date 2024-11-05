"use client";

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/use-theme';
import { Card } from '../../components/ui/card';
import { Icon } from '../../components/ui/icon';
import { Colors } from '../../constants/colors';

export function DashboardScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
    content: {
      padding: 16,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginHorizontal: -8,
    },
    card: {
      width: '48%',
      marginBottom: 16,
      padding: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginTop: 8,
    },
    cardValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginTop: 4,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.grid}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Patients' as never)}>
            <Card style={styles.card}>
              <Icon
                name="users"
                size={24}
                color={theme === 'dark' ? Colors.white : Colors.black}
              />
              <Text style={styles.cardTitle}>Bekleyen Hastalar</Text>
              <Text style={styles.cardValue}>0</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity>
            <Card style={styles.card}>
              <Icon
                name="clipboard"
                size={24}
                color={theme === 'dark' ? Colors.white : Colors.black}
              />
              <Text style={styles.cardTitle}>Günlük Operasyonlar</Text>
              <Text style={styles.cardValue}>0</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Messages' as never)}>
            <Card style={styles.card}>
              <Icon
                name="message-square"
                size={24}
                color={theme === 'dark' ? Colors.white : Colors.black}
              />
              <Text style={styles.cardTitle}>Okunmamış Mesajlar</Text>
              <Text style={styles.cardValue}>0</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity>
            <Card style={styles.card}>
              <Icon
                name="activity"
                size={24}
                color={theme === 'dark' ? Colors.white : Colors.black}
              />
              <Text style={styles.cardTitle}>Aktif Kullanıcılar</Text>
              <Text style={styles.cardValue}>0</Text>
            </Card>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}