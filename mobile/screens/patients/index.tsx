"use client";

import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useTheme } from '../../hooks/use-theme';
import { Card } from '../../components/ui/card';
import { SearchBar } from '../../components/ui/search-bar';
import { Icon } from '../../components/ui/icon';
import { Colors } from '../../constants/colors';
import { usePatients } from '../../hooks/use-patients';

export function PatientsScreen() {
  const [search, setSearch] = useState('');
  const navigation = useNavigation();
  const { theme } = useTheme();
  const {
    data: patients,
    isLoading,
    refetch,
    hasNextPage,
    fetchNextPage,
  } = usePatients({ search });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? Colors.darkBorder : Colors.lightBorder,
    },
    content: {
      flex: 1,
    },
    card: {
      margin: 8,
      padding: 16,
    },
    patientName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 4,
    },
    patientInfo: {
      fontSize: 14,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
      marginBottom: 2,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme === 'dark' ? Colors.primary : Colors.primaryLight,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    badgeText: {
      fontSize: 12,
      color: theme === 'dark' ? Colors.white : Colors.primary,
    },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    emptyText: {
      fontSize: 16,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  const renderPatientCard = ({ item: patient }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('PatientDetails', { patientId: patient.id })
      }>
      <Card style={styles.card}>
        <Text style={styles.patientName}>
          {patient.firstName} {patient.lastName}
        </Text>
        <Text style={styles.patientInfo}>
          Protokol No: {patient.medicalRecordNumber}
        </Text>
        <Text style={styles.patientInfo}>
          Doğum Tarihi:{' '}
          {format(new Date(patient.dateOfBirth), 'P', { locale: tr })}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{patient.gender}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name="users"
        size={48}
        color={theme === 'dark' ? Colors.grayLight : Colors.grayDark}
      />
      <Text style={styles.emptyText}>
        {search
          ? 'Aramanızla eşleşen hasta bulunamadı'
          : 'Henüz hasta kaydı bulunmuyor'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Hasta ara..."
        />
      </View>
      <View style={styles.content}>
        <FlatList
          data={patients?.pages.flatMap((page) => page.patients) ?? []}
          renderItem={renderPatientCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          onEndReached={() => {
            if (hasNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
        />
      </View>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewPatient')}>
        <Icon name="plus" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}