"use client";

import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';

interface SwipeAction {
  text: string;
  icon?: string;
  color: string;
  onPress: () => void;
}

interface SwipeActionProps {
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SwipeAction({
  leftActions = [],
  rightActions = [],
  children,
  style,
}: SwipeActionProps) {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const actionWidth = 80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx }) => {
        const maxLeft = leftActions.length * actionWidth;
        const maxRight = rightActions.length * actionWidth;
        const x = Math.min(maxLeft, Math.max(-maxRight, dx));
        translateX.setValue(x);
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const maxLeft = leftActions.length * actionWidth;
        const maxRight = rightActions.length * actionWidth;

        let toValue = 0;
        if (dx > 50 && leftActions.length) {
          toValue = maxLeft;
        } else if (dx < -50 && rightActions.length) {
          toValue = -maxRight;
        }

        Animated.spring(translateX, {
          toValue,
          velocity: vx,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
    },
    actionsContainer: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
    },
    leftActions: {
      flexDirection: 'row',
    },
    rightActions: {
      flexDirection: 'row-reverse',
      marginLeft: 'auto',
    },
    actionButton: {
      width: actionWidth,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionText: {
      color: Colors.white,
      fontSize: 14,
      fontWeight: '500',
    },
    content: {
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
    },
  });

  const renderActions = (actions: SwipeAction[], isLeft: boolean) => {
    return (
      <View style={isLeft ? styles.leftActions : styles.rightActions}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { backgroundColor: action.color }]}
            onPress={action.onPress}>
            <View>
              {action.icon && (
                <Icon name={action.icon} size={24} color={Colors.white} />
              )}
              <Text style={styles.actionText}>{action.text}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.actionsContainer}>
        {renderActions(leftActions, true)}
        {renderActions(rightActions, false)}
      </View>
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}