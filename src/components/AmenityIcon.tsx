import React from 'react';
import { Droplet, Wifi, Coffee, Sofa } from 'lucide-react-native';
import { StationAmenity } from '@/types';
import { colors } from '@/theme';

export function AmenityIcon({ icon, size = 18 }: { icon: StationAmenity['icon']; size?: number }) {
  const color = colors.electricBlue;
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
