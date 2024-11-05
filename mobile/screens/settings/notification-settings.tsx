"use client";

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { usePushNotifications } from '../../hooks/use-push-notifications';
import { Switch } from '../../components/ui/switch';
import { Card } from '../../components/ui/card';
import { Icon } from '../../components/ui/icon';
import { Colors } from '../../constants/colors';
import {
  loadNotificationSettings,
  saveNotificationSettings,
} from '../../lib/notifications';

export function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const {
    isEnabled,
    isPending,
    enableNotifications,
    disableNotifications,
  } = usePushNotifications();

  const [settings, setSettings] = useState({
    operationNotes: true,
    messages: true,
    patientUpdates: true,
    mentions: true,
    reactions: true,
    emergencyAlerts: true,
    sound: true,
    vibration: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await loadNotificationSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSettingChange = async (key: string, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await saveNotificationSettings(newSettings);

      // Handle special cases
      if (key === 'emergencyAlerts' && !value) {
        Alert.alert(
          'Önemli Uyarı',
          'Acil durum bildirimlerini kapatmak önemli bildirimleri kaçırmanıza neden olabilir. Emin misiniz?',
          [
            {
              text: 'İptal',
              onPress: () => {
                setSettings((prev) => ({ ...prev, emergencyAlerts: true }));
                saveNotificationSettings({ ...newSettings, emergencyAlerts: true });
              },
              style: 'cancel',
            },
            { text: 'Devam Et', style: 'destructive' },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
    content: {
      padding: 16,
    },
    card: {
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        theme === 'dark' ? Colors.darkBorder : Colors.lightBorder,
    },
    settingTitle: {
      fontSize: 16,
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
    },
    icon: {
      marginRight: 12,
    },
    warningText: {
      fontSize: 12,
      color: Colors.error,
      marginTop: 4,
    },
  });

  const renderSettingItem = (
    key: string,
    title: string,
    description: string,
    iconName: string,
    disabled = false
  ) => (
    <View style={styles.settingItem}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon
            name={iconName}
            size={20}
            color={theme === 'dark' ? Colors.white : Colors.black}
            style={styles.icon}
          />
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={settings[key as keyof typeof settings]}
        onValueChange={(value) => handleSettingChange(key, value)}
        disabled={disabled || (!isEnabled && key !== 'emergencyAlerts')}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={isEnabled ? disableNotifications : enableNotifications}
            disabled={isPending}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon
                  name="bell"
                  size={20}
                  color={theme === 'dark' ? Colors.white : Colors.black}
                  style={styles.icon}
                />
                <Text style={styles.settingTitle}>Tüm Bildirimler</Text>
              </View>
              <Text style={styles.settingDescription}>
                Tüm bildirimleri etkinleştirin veya devre dışı bırakın
              </Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={isEnabled ? disableNotifications : enableNotifications}
              disabled={isPending}
            />
          </TouchableOpacity>

          {renderSettingItem(
            'emergencyAlerts',
            'Acil Durum Bildirimleri',
            'Önemli ve acil durumlar için anlık bildirimler',
            'alert-triangle'
          )}

          {renderSettingItem(
            'operationNotes',
            'Operasyon Notları',
            'Yeni ve güncellenen operasyon notları için bildirimler',
            'file-text'
          )}

          {renderSettingItem(
            'messages',
            'Mesajlar',
            'Yeni mesaj bildirimleri',
            'message-square'
          )}

          {renderSettingItem(
            'mentions',
            'Bahsedilmeler',
            'Mesajlarda bahsedildiğinizde bildirim alın',
            'at-sign'
          )}

          {renderSettingItem(
            'patientUpdates',
            'Hasta Güncellemeleri',
            'Hasta bilgileri güncellendiğinde bildirim alın',
            'user'
          )}

          {renderSettingItem(
            'reactions',
            'Tepkiler',
            'Mesajlarınıza gelen tepkiler için bildirim alın',
            'smile'
          )}

          {Platform.OS === 'ios' && renderSettingItem(
            'sound',
            'Ses',
            'Bildirim sesi',
            'volume-2'
          )}

          {renderSettingItem(
            'vibration',
            'Titreşim',
            'Bildirim titreşimi',
            'vibrate'
          )}
        </Card>

        {!isEnabled && (
          <Text style={styles.warningText}>
            * Bildirimleri almak için bildirimleri etkinleştirmeniz gerekmektedir
          </Text>
        )}
      </View>
    </ScrollView>
  );
}