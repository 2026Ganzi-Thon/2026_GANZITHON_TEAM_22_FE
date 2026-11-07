import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

// 피그마에서 받은 선 아이콘 (Flaticon UIcons). 색은 SVG 안에 들어 있다
const ICONS = {
  back: require('@/assets/images/icons/etc/angle-right.svg'),
  plus: require('@/assets/images/icons/etc/plus.svg'),
  plusSmall: require('@/assets/images/icons/etc/plus-small.svg'),
  minusSmall: require('@/assets/images/icons/etc/minus-small.svg'),
  pencil: require('@/assets/images/icons/etc/pencil.svg'),
} as const;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export default function Icon({ name, size = 24, style }: Props) {
  return <Image source={ICONS[name]} style={[{ width: size, height: size }, style]} contentFit="contain" />;
}
