"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Card } from '../../components/ui/card';
import { MessageInput } from '../../components/chat/message-input';
import { MessageReactions } from '../../components/chat/message-reactions';
import { Avatar } from '../../components/ui/avatar';
import { Icon } from '../../components/ui/icon';
import { Colors } from '../../constants/colors';
import { useMessages } from '../../hooks/use-messages';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function MessagesScreen() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { theme } = useTheme();
  const {
    messages,
    channels,
    isLoading,
    sendMessage,
    addReaction,
    removeReaction,
    markAsRead,
    hasNextPage,
    fetchNextPage,
  } = useMessages(selectedChannel);

  // ... existing styles ...

  const renderMessage = ({ item: message }) => (
    <View style={styles.messageContainer}>
      <Avatar
        size={32}
        source={message.user.image}
        fallback={
          <Text style={{ color: Colors.white }}>
            {message.user.name?.charAt(0)}
          </Text>
        }
      />
      <View style={styles.messageContent}>
        <Text style={styles.messageTime}>
          {message.user.name} •{' '}
          {format(new Date(message.createdAt), 'p', { locale: tr })}
        </Text>
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{message.content}</Text>
        </View>
        <MessageReactions
          messageId={message.id}
          reactions={message.reactions}
          currentUserId={user.id}
          onAddReaction={addReaction}
          onRemoveReaction={removeReaction}
        />
      </View>
    </View>
  );

  // ... rest of the component ...
}