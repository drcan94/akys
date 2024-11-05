"use client";

import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  type TextInputProps,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Icon } from './icon';
import { Colors } from '../../constants/colors';

interface SearchBarProps extends TextInputProps {
  onClear?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder,
  ...props
}: SearchBarProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme === 'dark' ? Colors.darkBorder : Colors.lightBorder,
      paddingHorizontal: 12,
      height: 40,
    },
    input: {
      flex: 1,
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginLeft: 8,
      fontSize: 16,
    },
    icon: {
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
    },
  });

  return (
    <View style={styles.container}>
      <Icon name="search" size={20} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme === 'dark' ? Colors.grayLight : Colors.grayDark}
        {...props}
      />
      {value ? (
        <TouchableOpacity onPress={onClear}>
          <Icon name="x" size={20} style={styles.icon} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}