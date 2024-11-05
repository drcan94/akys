"use client";

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useOperationNotes } from '../../hooks/use-operation-notes';
import { LoadingState } from '../ui/loading-state';
import { ErrorState } from '../ui/error-state';
import { EmptyState } from '../ui/empty-state';
import { OperationNoteCard } from './operation-note-card';
import { InfiniteScroll } from '../ui/infinite-scroll';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';

interface OperationNoteListProps {
  patientId: string;
}

export function OperationNoteList({ patientId }: OperationNoteListProps) {
  const { theme } = useTheme();
  const {
    data: notes,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    refresh,
  } = useOperationNotes(patientId);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
  });

  if (isLoading) {
    return <LoadingState type="card" rows={2} />;
  }

  if (isError) {
    return (
      <ErrorState
        message="Operasyon notları yüklenirken bir hata oluştu"
        onRetry={refresh}
      />
    );
  }

  if (!notes?.length) {
    return (
      <EmptyState
        icon="file-text"
        title="Not Bulunamadı"
        message="Bu hasta için henüz operasyon notu girilmemiş"
      />
    );
  }

  return (
    <View style={styles.container}>
      <InfiniteScroll
        data={notes}
        renderItem={({ item }) => <OperationNoteCard note={item} />}
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