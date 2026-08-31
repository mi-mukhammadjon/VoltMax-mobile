import React from 'react';
import { Droplet, Wifi, Coffee, Sofa } from 'lucide-react-native';
import { StationAmenity } from '@/types';
import { useThemeColors } from '@/theme';

export function AmenityIcon({
  icon,
  size = 18,
  color: colorOverride,
}: {
  icon: StationAmenity['icon'];
  size?: number;
  color?: string;
}) {
  const colors = useThemeColors();
  const color = colorOverride ?? colors.primary;
  switch (icon) {
    case 'oil':
      return <Droplet size={size} color={color} />;
    case 'wifi':
      return <Wifi size={size} color={color} />;
    case 'coffee':
      return <Coffee size={size} color={color} />;
    case 'lounge':
      return <Sofa size={size} color={color} />;
    default:
      return null;
  }
}
