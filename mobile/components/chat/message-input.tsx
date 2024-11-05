"use client";

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Icon } from '../ui/icon';
import { Colors } from '../../constants/colors';

interface MessageInputProps {
  onSend: (message: string) => void;
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme === 'dark' ? Colors.white : Colors.black,
      paddingVertical: Platform.OS === 'ios' ? 8 : 4,
      marginRight: 8,
    },
    sendButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message);
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Mesajınızı yazın..."
        placeholderTextColor={theme === 'dark' ? Colors.grayLight : Colors.grayDark}
        multiline
        maxLength={1000}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          !message.trim() && { opacity: 0.5 },
        ]}
        onPress={handleSend}
        disabled={!message.trim()}>
        <Icon name="send" size={16} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}