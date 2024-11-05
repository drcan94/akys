"use client";

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/use-theme';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../hooks/use-auth';
import { useToast } from '../../hooks/use-toast';
import { Colors } from '../../constants/colors';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { login } = useAuth();
  const { showToast } = useToast();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
    content: {
      flex: 1,
      padding: 16,
      justifyContent: 'center',
    },
    header: {
      marginBottom: 32,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
      textAlign: 'center',
    },
    form: {
      gap: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    footerText: {
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
      marginRight: 8,
    },
    link: {
      color: Colors.primary,
      fontWeight: '500',
    },
  });

  const handleLogin = async () => {
    if (!email || !password) {
      showToast({
        type: 'error',
        message: 'Lütfen tüm alanları doldurun',
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigation.navigate('Dashboard' as never);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Anestezi Kliniği</Text>
          <Text style={styles.subtitle}>
            Hesabınıza giriş yaparak devam edin
          </Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>E-posta</Text>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@hastane.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View>
            <Text style={styles.label}>Şifre</Text>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <Button
            onPress={handleLogin}
            disabled={isLoading}
            loading={isLoading}>
            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Hesabınız yok mu?</Text>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('Register' as never)}>
            Kayıt Olun
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}