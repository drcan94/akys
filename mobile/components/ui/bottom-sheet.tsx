"use client";

import React, { useRef, useEffect } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  snapPoints?: number[];
  children: React.ReactNode;
  style?: ViewStyle;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BottomSheet({
  isVisible,
  onClose,
  snapPoints = [0.9, 0.5, 0],
  children,
  style,
}: BottomSheetProps) {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const lastGestureDy = useRef(0);

  useEffect(() => {
    if (isVisible) {
      showBottomSheet();
    } else {
      hideBottomSheet();
    }
  }, [isVisible]);

  const showBottomSheet = () => {
    Animated.spring(translateY, {
      toValue: SCREEN_HEIGHT * (1 - snapPoints[1]),
      useNativeDriver: true,
    }).start();
  };

  const hideBottomSheet = () => {
    Animated.spring(translateY, {
      toValue: SCREEN_HEIGHT,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => {
        const newPosition = lastGestureDy.current + dy;
        if (newPosition >= 0) {
          translateY.setValue(SCREEN_HEIGHT * (1 - snapPoints[1]) + newPosition);
        }
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        lastGestureDy.current += dy;

        const currentPosition = lastGestureDy.current / SCREEN_HEIGHT;
        let snapIndex = 1; // Default to middle snap point

        if (vy > 0.5 || currentPosition > 0.75) {
          // Swipe down - snap to bottom or close
          snapIndex = 2;
        } else if (vy < -0.5 || currentPosition < 0.25) {
          // Swipe up - snap to top
          snapIndex = 0;
        }

        const snapPoint = SCREEN_HEIGHT * (1 - snapPoints[snapIndex]);

        Animated.spring(translateY, {
          toValue: snapPoint,
          velocity: vy,
          useNativeDriver: true,
        }).start(() => {
          lastGestureDy.current = snapPoint - SCREEN_HEIGHT * (1 - snapPoints[1]);
          if (snapIndex === 2) {
            onClose();
          }
        });
      },
    })
  ).current;

  const styles = StyleSheet.create({
    modal: {
      margin: 0,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      minHeight: SCREEN_HEIGHT * 0.3,
      paddingTop: 12,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 8,
    },
  });

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.modal}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.container,
            style,
            {
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}