import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/src/design/colors';

type Props = {
  onPressSettings: () => void;
  onPressGuide: () => void;
  /**
   * Extra space above the device bottom inset to clear the tab bar.
   * Defaults to 104 to match existing layouts.
   */
  offset?: number;
};

export default function FloatingHelpButtons({ onPressSettings, onPressGuide, offset = 104 }: Props) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 16) + offset;

  return (
    <View style={[styles.fabColumn, { bottom }]}>
      <Pressable
        hitSlop={10}
        onPress={onPressSettings}
        style={({ pressed }) => [styles.fabButton, pressed && { opacity: 0.95 }]}
      >
        <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
      </Pressable>

      <Pressable
        hitSlop={10}
        onPress={onPressGuide}
        style={({ pressed }) => [styles.fabButton, pressed && { opacity: 0.95 }]}
      >
        <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fabColumn: {
    position: 'absolute',
    right: 20,
    gap: 12,
    alignItems: 'center',
  },
  fabButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
