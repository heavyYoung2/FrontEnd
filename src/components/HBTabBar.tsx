// src/components/HBTabBar.tsx
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
};

type Props = BottomTabBarProps & { centerRoute?: string };

const MAP: Record<
  string,
  { icon: { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }; label: string }
> = {
  qr:     { icon: { focused: 'qr-code',   unfocused: 'qr-code-outline' },   label: 'QR' },
  rental: { icon: { focused: 'cube',      unfocused: 'cube-outline' },      label: '물품' },
  index:  { icon: { focused: 'calendar',  unfocused: 'calendar-outline' },  label: '달력' },  // 중앙 후보
  locker: { icon: { focused: 'grid',      unfocused: 'grid-outline' },      label: '사물함' },
  mypage: { icon: { focused: 'person',    unfocused: 'person-outline' },    label: '마이' },
};

export default function HBTabBar({ state, navigation, centerRoute = 'index' }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  // 안전하게 가운데 라우트 선택 (centerRoute → 중앙 인덱스 → 첫번째)
  const { centerIndex, centerRouteObj } = useMemo(() => {
    const byName = state.routes.findIndex(r => r.name === centerRoute);
    if (byName >= 0) return { centerIndex: byName, centerRouteObj: state.routes[byName] };
    const mid = Math.floor(state.routes.length / 2);
    if (state.routes[mid]) return { centerIndex: mid, centerRouteObj: state.routes[mid] };
    return { centerIndex: 0, centerRouteObj: state.routes[0] };
  }, [state.routes, centerRoute]);

  const pressHandlers = useMemo(() => {
    return state.routes.reduce<Record<string, () => void>>((acc, route, i) => {
      acc[route.key] = () => {
        const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (state.index !== i && !e.defaultPrevented) navigation.navigate(route.name);
      };
      return acc;
    }, {});
  }, [navigation, state.index, state.routes]);

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={[styles.container, { paddingBottom: bottomPad }]}>
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            if (index === centerIndex) {
              // 중앙 자리 비움
              return <View key={`${route.key}-spacer`} style={styles.centerSpacer} />;
            }
            const focused = state.index === index;
            const cfg = MAP[route.name] ?? {
              icon: { focused: 'ellipse', unfocused: 'ellipse-outline' }, // 거의 안씀(모든 탭은 MAP에 넣자)
              label: '', // ← 폴백 라벨 비움: "(tabs)" 같은 이름 노출 방지
            };

            return (
              <Pressable key={route.key} onPress={pressHandlers[route.key]} style={styles.item}>
                <Ionicons
                  name={(focused ? cfg.icon.focused : cfg.icon.unfocused) as any}
                  size={22}
                  color={focused ? COLORS.text : COLORS.muted}
                />
                {!!cfg.label && (
                  <Text style={[styles.label, { color: focused ? COLORS.text : COLORS.muted }]}>
                    {cfg.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* 중앙 플로팅 버튼: 라벨 고정 '달력', 아이콘 고정 calendar */}
        {!!centerRouteObj && (
          <View pointerEvents="box-none" style={styles.centerWrap}>
            <View style={[styles.centerRing, styles.shadow]}>
              <Pressable
                onPress={pressHandlers[centerRouteObj.key]}
                style={({ pressed }) => [styles.centerBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              >
                <Ionicons name="calendar" size={28} color="#fff" />
                <Text style={styles.centerLabel}>달력</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const BAR_HEIGHT = 100;

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 },
  container: {
    marginHorizontal: 16,
    height: BAR_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: 'visible',
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  item: {
    flex: 1,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
    gap: 6,
  },
  label: { fontSize: 12, fontFamily: 'Pretendard-Medium' },
  centerSpacer: { flex: 1, minWidth: 58 }, // 필요시 조절
  centerWrap: { position: 'absolute', left: 0, right: 0, top: -15, alignItems: 'center' },
  centerRing: {
    width: 70, height: 50, borderRadius: 999,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  centerBtn: {
    width: 60, height: 60, borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    gap: 2,
  },
  centerLabel: { fontSize: 12, color: '#fff', fontFamily: 'Pretendard-SemiBold', lineHeight: 14 },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});