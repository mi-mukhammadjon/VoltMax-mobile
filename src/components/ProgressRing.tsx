import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Foizni ko'rsatuvchi animatsiyali halqa. Qiymat o'zgarganda halqa silliq
// to'ladi (0 dan boshlab), markazda esa istalgan tarkib (foiz matni,
// ikonka) turadi. Band ulagich va parkovka rejimida ishlatiladi.

interface Props {
  /** 0–100 */
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** halqa rangi — bitta rang yoki gradient uchun ikkita */
  colors?: readonly [string, string];
  trackColor?: string;
  /** halqa markazidagi tarkib */
  children?: React.ReactNode;
  /** animatsiya davomiyligi (ms) */
  duration?: number;
}

export default function ProgressRing({
  percent,
  size = 132,
  strokeWidth = 10,
  colors: ringColors,
  trackColor,
  children,
  duration = 900,
}: Props) {
  const themeColors = useThemeColors();
  const gradient = ringColors ?? themeColors.gradientPrimary;
  const track = trackColor ?? themeColors.bgElevated;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const clamped = Math.max(0, Math.min(percent, 100));
    Animated.timing(progress, {
      toValue: clamped,
      duration,
      easing: Easing.out(Easing.cubic),
      // strokeDashoffset native driver bilan qo'llab-quvvatlanmaydi
      useNativeDriver: false,
    }).start();
  }, [percent, duration, progress]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradient[0]} />
            <Stop offset="1" stopColor={gradient[1]} />
          </LinearGradient>
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          // 12 soatdan boshlash uchun (standart holatda 3 soat pozitsiyasi)
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
