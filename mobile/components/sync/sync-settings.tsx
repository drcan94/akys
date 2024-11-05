"use client";

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { useDataContext } from '../../providers/data-provider';
import { Colors } from '../../constants/colors';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { useToast } from '../../hooks/use-toast';

export function SyncSettings() {
  const { theme } = useTheme();
  const { clearAllData } = useDataContext();
  const { showToast } = useToast();
  const [autoSync, setAutoSync] = useState(true);
  const [syncOnCellular, setSyncOnCellular] = useState(false);

  const styles = StyleSheet.create({
    container: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 16,
    },
    setting: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    settingLabel: {
      fontSize: 14,
      color: theme === 'dark' ? Colors.white : Colors.black,
    },
    settingDescription: {
      fontSize: 12,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
      marginTop: 4,
    },
    dangerZone: {
      padding: 16,
      backgroundColor: theme === 'dark' ? Colors.errorDark : Colors.errorLight,
      borderRadius: 8,
    },
    dangerTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.error,
      marginBottom: 8,
    },
    dangerDescription: {
      fontSize: 12,
      color: Colors.error,
      marginBottom: 16,
    },
  });

  const handleClearData = async () => {
    try {
      await clearAllData();
      showToast({
        type: 'success',
        message: 'Tüm veriler başarıyla temizlendi',
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Veriler temizlenirken bir hata oluştu',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Senkronizasyon</Text>
        <View style={styles.setting}>
          <View>
            <Text style={styles.settingLabel}>Otomatik Senkronizasyon</Text>
            <Text style={styles.settingDescription}>
              Verileri otomatik olarak senkronize et
            </Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: Colors.grayLight, true: Colors.primary }}
          />
        </View>
        <View style={styles.setting}>
          <View>
            <Text style={styles.settingLabel}>Mobil Veri Kullan</Text>
            <Text style={styles.settingDescription}>
              Mobil veri bağlantısında senkronize et
            </Text>
          </View>
          <Switch
            value={syncOnCellular}
            onValueChange={setSyncOnCellular}
            trackColor={{ false: Colors.grayLight, true: Colors.primary }}
          />
        </View>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Tehlikeli Bölge</Text>
        <Text style={styles.dangerDescription}>
          Tüm çevrimdışı verileri ve önbelleği temizler. Bu işlem geri alınamaz.
        </Text>
        <Button
          variant="destructive"
          onPress={handleClearData}
          leftIcon={<Icon name="trash-2" size={16} color={Colors.white} />}>
          Tüm Verileri Temizle
        </Button>
      </View>
    </View>
  );
}