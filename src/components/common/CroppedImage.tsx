import { Image, type ImageSource } from 'expo-image';
import { View, type DimensionValue } from 'react-native';

export type Crop = { width: string; height: string; left: string; top: string };

type Props = {
  source: ImageSource;
  width: number;
  height: number;
  /** 이미지 크기·위치(%). 피그마에서 프레임 밖으로 잘린 부분을 그대로 재현 */
  crop: Crop;
};

// 3D 아이콘 PNG 아래에 들어간 작은 글자를 피그마처럼 잘라서 보여준다
export default function CroppedImage({ source, width, height, crop }: Props) {
  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <View
        style={{
          position: 'absolute',
          width: crop.width as DimensionValue,
          height: crop.height as DimensionValue,
          left: crop.left as DimensionValue,
          top: crop.top as DimensionValue,
        }}>
        <Image source={source} contentFit="fill" style={{ width: '100%', height: '100%' }} />
      </View>
    </View>
  );
}
