import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { radius, useThemeColors } from '@/theme';

// Ma'lumot yuklanayotganda ko'rsatiladigan "skelet" blok — bo'sh ekran
// o'rniga tarkib shakli ko'rinadi (professional ilovalarda standart).

interface Props {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Skeleton({
  width = '100%',
  height = 14,
  borderRadius: br = radius.sm,
  style,
}: Props) {
  const colors = useThemeColors();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = useMemo(
    () => pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] }),
    [pulse]
  );

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: br, backgroundColor: colors.bgElevated, opacity },
        style,
      ]}
    />
  );
}
