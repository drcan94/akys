"use client";

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';
import { Icon } from '../ui/icon';

const AVAILABLE_REACTIONS = ["👍", "❤️", "😊", "🎉", "👏", "🤔", "😢", "🔥"];

interface MessageReactionsProps {
  messageId: string;
  reactions: {
    emoji: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
    };
  }[];
  currentUserId: string;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
}

export function MessageReactions({
  messageId,
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
}: MessageReactionsProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginTop: 4,
      gap: 4,
    },
    reactionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? Colors.darkBorder : Colors.lightBorder,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 36,
    },
    activeReaction: {
      backgroundColor: theme === 'dark' ? Colors.primary : Colors.primaryLight,
    },
    reactionText: {
      fontSize: 12,
      marginLeft: 4,
      color: theme === 'dark' ? Colors.white : Colors.black,
    },
    addReactionButton: {
      padding: 4,
    },
    modal: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 16,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    emojiButton: {
      width: '12.5%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emoji: {
      fontSize: 24,
    },
  });

  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const userReactions = reactions
    .filter((r) => r.userId === currentUserId)
    .map((r) => r.emoji);

  const handleReaction = (emoji: string) => {
    if (userReactions.includes(emoji)) {
      onRemoveReaction(messageId, emoji);
    } else {
      onAddReaction(messageId, emoji);
    }
    setShowReactionPicker(false);
  };

  return (
    <>
      <View style={styles.container}>
        {Object.entries(reactionCounts).map(([emoji, count]) => {
          const hasReacted = userReactions.includes(emoji);
          return (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.reactionButton,
                hasReacted && styles.activeReaction,
              ]}
              onPress={() => handleReaction(emoji)}>
              <Text>{emoji}</Text>
              <Text style={styles.reactionText}>{count}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={styles.addReactionButton}
          onPress={() => setShowReactionPicker(true)}>
          <Icon
            name="smile"
            size={20}
            color={theme === 'dark' ? Colors.grayLight : Colors.grayDark}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showReactionPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactionPicker(false)}>
        <Pressable
          style={styles.modal}
          onPress={() => setShowReactionPicker(false)}>
          <Pressable style={styles.modalContent}>
            <View style={styles.emojiGrid}>
              {AVAILABLE_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiButton}
                  onPress={() => handleReaction(emoji)}>
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}