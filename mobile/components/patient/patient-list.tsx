"use client";

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePatients } from '../../hooks/use-patients';
import { LoadingState } from '../ui/loading-state';
import { ErrorState } from '../ui/error-state';
import { EmptyState } from '../ui/empty-state';
import { PatientCard } from './patient-card';
import { InfiniteScroll } from '../ui/infinite-scroll';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';

export function PatientList() {
  const { theme } = useTheme();
  const { 
    data: patients,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    refresh
  } = usePatients();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
  });

  if (isLoading) {
    return <LoadingState type="card" rows={3} />;
  }

  if (isError) {
    return (
      <ErrorState
        message="Hasta listesi yüklenirken bir hata oluştu"
        onRetry={refresh}
      />
    );
  }

  if (!patients?.length) {
    return (
      <EmptyState
        icon="users"
        title="Hasta Bulunamadı"
        message="Henüz kayıtlı hasta bulunmuyor"
      />
    );
  }

  return (
    <View style={styles.container}>
      <InfiniteScroll
        data={patients}
        renderItem={({ item }) => <PatientCard patient={item} />}
        keyExtractor={(item) => item.id}
        onRefresh={refresh}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isLoading={isLoading}
        isError={isError}
      />
    </View>
  );
}