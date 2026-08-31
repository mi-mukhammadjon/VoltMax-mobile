import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { Power, ChevronRight } from 'lucide-react-native';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';

interface Props {
  label?: string;
  onComplete: () => void;
}

const KNOB_SIZE = 56;
const TRACK_PADDING = 4;

export default function SwipeToStopButton({ label = "Tugatish uchun suring...", onComplete }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const completedRef = useRef(false);

  const maxTranslate = Math.max(trackWidth - KNOB_SIZE - TRACK_PADDING * 2, 1);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const next = Math.max(0, Math.min(gesture.dx, maxTranslate));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const next = Math.max(0, Math.min(gesture.dx, maxTranslate));
        if (next > maxTranslate * 0.7 && !completedRef.current) {
          completedRef.current = true;
          Animated.timing(translateX, {
            toValue: maxTranslate,
            duration: 120,
            useNativeDriver: false,
          }).start(() => onComplete());
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.track} onLayout={onTrackLayout}>
      <View style={styles.labelRow} pointerEvents="none">
        <ChevronRight size={18} color={colors.textMuted} />
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <Animated.View
        style={[styles.knob, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Power size={22} color="#fff" />
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    track: {
      height: KNOB_SIZE + TRACK_PADDING * 2,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      paddingHorizontal: TRACK_PADDING,
      overflow: 'hidden',
    },
    labelRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    labelText: {
      color: colors.textMuted,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.medium,
    },
    knob: {
      width: KNOB_SIZE,
      height: KNOB_SIZE,
      borderRadius: KNOB_SIZE / 2,
      backgroundColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
