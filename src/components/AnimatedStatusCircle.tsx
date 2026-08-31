import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  icon: React.ReactNode;
  gradientColors: readonly [string, string];
  size?: number;
}

// Zaryadlash oqimida "kutish" holatlari (charger javobini kutish, sessiya
// tugashi) uchun umumiy animatsiyali belgi — pulslanuvchi halqa + gradient
// doira + atrofida suzib turuvchi dekorativ zarrachalar.
export default function AnimatedStatusCircle({ icon, gradientColors, size = 120 }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    floatLoop.start();
    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [pulse, float]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const dotOpacity = float.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] });
  const dotTranslate = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  const wrapSize = size * 1.8;

  return (
    <View style={[styles.wrap, { width: wrapSize, height: wrapSize }]}>
      {DOT_POSITIONS.map(({ dotSize, ...pos }, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            pos as any,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              opacity: dotOpacity,
              transform: [{ translateY: dotTranslate }],
            },
          ]}
        />
      ))}

      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 1.35,
            height: size * 1.35,
            borderRadius: (size * 1.35) / 2,
            backgroundColor: gradientColors[0],
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      >
        {icon}
      </LinearGradient>
    </View>
  );
}

const DOT_POSITIONS: Array<{ top?: string; bottom?: string; left?: string; right?: string; dotSize: number }> = [
  { top: '6%', left: '16%', dotSize: 7 },
  { top: '14%', right: '10%', dotSize: 5 },
  { bottom: '16%', left: '8%', dotSize: 6 },
  { bottom: '8%', right: '14%', dotSize: 5 },
  { top: '48%', left: '0%', dotSize: 4 },
  { top: '44%', right: '2%', dotSize: 4 },
];

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  circle: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  dot: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.5)' },
});
