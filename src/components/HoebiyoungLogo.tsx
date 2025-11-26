import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import HeavyYoungLogoSvg from '@/assets/images/heavy-young-svg.svg';

type HoebiyoungLogoProps = {
  taglineVisible?: boolean;
  align?: 'center' | 'left';
};

const ASPECT_RATIO = 1025 / 533;

export default function HoebiyoungLogo({ taglineVisible = true, align = 'center' }: HoebiyoungLogoProps) {
  const { width, height } = useMemo(() => {
    const targetWidth = taglineVisible ? 240 : 120;
    return { width: targetWidth, height: targetWidth / ASPECT_RATIO };
  }, [taglineVisible]);

  return (
    <View style={[styles.wrapper, align === 'left' && { alignItems: 'flex-start' }]}>
      <HeavyYoungLogoSvg width={width} height={height} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
});
