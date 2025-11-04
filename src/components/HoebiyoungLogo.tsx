import React, { useMemo } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

type HoebiyoungLogoProps = {
  taglineVisible?: boolean;
  align?: 'center' | 'left';
};

const LOGO_WITH_TAGLINE = require('@/assets/images/heavy-young-logo.png') as ImageSourcePropType;
const LOGO_ICON = require('@/assets/images/heavy-young-app.png') as ImageSourcePropType;

export default function HoebiyoungLogo({ taglineVisible = true, align = 'center' }: HoebiyoungLogoProps) {
  const { source, width } = useMemo(() => {
    if (taglineVisible) {
      return { source: LOGO_WITH_TAGLINE, width: 220 };
    }
    return { source: LOGO_ICON, width: 88 };
  }, [taglineVisible]);

  const aspectRatio = useMemo(() => {
    const resolved = Image.resolveAssetSource(source);
    return resolved?.width && resolved?.height ? resolved.width / resolved.height : 1;
  }, [source]);

  return (
    <View style={[styles.wrapper, align === 'left' && { alignItems: 'flex-start' }]}>
      <Image
        source={source}
        style={[styles.image, { width, aspectRatio }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  image: {
    height: undefined,
  },
});
