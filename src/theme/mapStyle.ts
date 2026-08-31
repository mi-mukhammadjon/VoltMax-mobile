import { colors } from './colors';
import { lightColors } from './colorsLight';
import { useActiveScheme } from '@/store/useThemeStore';

// Google Maps uchun VoltMax palitrasiga moslashtirilgan "avtorskiy" stillar
// (react-native-maps'ning customMapStyle prop'i orqali qo'llaniladi — MapScreen).
// POI/transit yorliqlari o'chirilgan — xaritada faqat yo'llar, suv va o'z marker'larimiz qoladi.

export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: colors.bgPrimary }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: colors.textMuted }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: colors.bgPrimary }] },

  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: colors.border }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: colors.textSecondary }] },

  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: colors.bgSecondary }] },

  { featureType: 'road', elementType: 'geometry', stylers: [{ color: colors.bgElevated }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: colors.border }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: colors.textMuted }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: colors.border }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: colors.textSecondary }] },

  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A1526' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: colors.textMuted }] },
] as const;

export const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: lightColors.bgPrimary }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: lightColors.textMuted }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: lightColors.bgPrimary }] },

  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: lightColors.border }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: lightColors.textSecondary }] },

  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#E3EFE7' }] },

  { featureType: 'road', elementType: 'geometry', stylers: [{ color: lightColors.bgSecondary }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: lightColors.border }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: lightColors.textMuted }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#E4EAF2' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: lightColors.textSecondary }] },

  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFE3F5' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: lightColors.textMuted }] },
] as const;

export function useMapStyle() {
  const scheme = useActiveScheme();
  return scheme === 'light' ? lightMapStyle : darkMapStyle;
}
