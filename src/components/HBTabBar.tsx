// src/components/HBTabBar.tsx
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#2451FF',
  text: '#1F2329',
  muted: '#1F2329',
  border: '#E7EAF2',
  surface: '#FFFFFF',
  pillBg: '#FFFFFF',
  pillBorder: '#E2E6F2',
};

// Single source of truth so both council/student stacks stay in sync
const TAB_CONFIG = {
  qr:     { icon: { focused: 'qr-code',   unfocused: 'qr-code-outline' },   label: 'QR' },
  rental: { icon: { focused: 'cube',      unfocused: 'cube-outline' },      label: '물품' },
  index:  { icon: { focused: 'calendar',  unfocused: 'calendar-outline' },  label: '달력' }, // 중앙 후보
  locker: { icon: { focused: 'grid',      unfocused: 'grid-outline' },      label: '사물함' },
  mypage: { icon: { focused: 'person',    unfocused: 'person-outline' },    label: '마이' },
} satisfies Record<string, { icon: { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }; label: string }>;

const TAB_ORDER = ['qr', 'rental', 'index', 'locker', 'mypage'] as const;

type Props = BottomTabBarProps & { centerRoute?: (typeof TAB_ORDER)[number] };

export default function HBTabBar({ state, navigation, centerRoute = 'index' }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const { routes: stateRoutes, index: activeIndex } = state;

  const orderedRoutes = useMemo(() => {
    type Route = (typeof stateRoutes)[number];
    const routeByName = stateRoutes.reduce<Record<string, Route>>((acc, route) => {
      acc[route.name] = route;
      return acc;
    }, {});

    const sorted = TAB_ORDER.map(name => routeByName[name]).filter((route): route is Route => Boolean(route));

    // 모든 목표 탭을 찾은 경우에만 커스텀 순서를 사용
    if (sorted.length === TAB_ORDER.length) return sorted;
    return stateRoutes;
  }, [stateRoutes]);

  const displayRoutes = orderedRoutes;

  const routeIndexLookup = useMemo(() => {
    return stateRoutes.reduce<Record<string, number>>((acc, route, index) => {
      acc[route.key] = index;
      return acc;
    }, {});
  }, [stateRoutes]);

  // 안전하게 가운데 라우트 선택 (centerRoute → 중앙 인덱스 → 첫번째)
  const { centerIndex, centerRouteObj } = useMemo(() => {
    const byName = displayRoutes.findIndex(r => r.name === centerRoute);
    if (byName >= 0) return { centerIndex: byName, centerRouteObj: displayRoutes[byName] };
    const mid = Math.floor(displayRoutes.length / 2);
    if (displayRoutes[mid]) return { centerIndex: mid, centerRouteObj: displayRoutes[mid] };
    return { centerIndex: 0, centerRouteObj: displayRoutes[0] };
  }, [displayRoutes, centerRoute]);

  const pressHandlers = useMemo(() => {
    return stateRoutes.reduce<Record<string, () => void>>((acc, route, i) => {
      acc[route.key] = () => {
        const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (activeIndex !== i && !e.defaultPrevented) navigation.navigate(route.name);
      };
      return acc;
    }, {});
  }, [navigation, activeIndex, stateRoutes]);

  const centerFocused = !!centerRouteObj && activeIndex === routeIndexLookup[centerRouteObj.key];
  const centerCfg = centerRouteObj ? TAB_CONFIG[centerRouteObj.name as keyof typeof TAB_CONFIG] : undefined;
  const centerIconName: keyof typeof Ionicons.glyphMap =
    centerCfg ? (centerFocused ? centerCfg.icon.focused : centerCfg.icon.unfocused) : 'ellipse';
  const centerLabel = centerCfg?.label ?? centerRouteObj?.name ?? '';

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={[styles.container, { paddingBottom: bottomPad }]}>
        <View style={styles.row}>
          {displayRoutes.map((route, index) => {
            if (index === centerIndex) {
              // 중앙 버튼 자리 확보
              return <View key={`${route.key}-spacer`} style={styles.centerSpacer} />;
            }
            const focused = activeIndex === routeIndexLookup[route.key];
            const cfg = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG] ?? {
              icon: { focused: 'ellipse', unfocused: 'ellipse-outline' },
              label: '',
            };

            const iconName = focused ? cfg.icon.focused : cfg.icon.unfocused;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={cfg.label || route.name}
                onPress={pressHandlers[route.key]}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <Ionicons
                  name={iconName}
                  size={22}
                  color={focused ? COLORS.primary : COLORS.muted}
                />
                {!!cfg.label && (
                  <Text style={[styles.label, { color: focused ? COLORS.primary : COLORS.muted }]}>
                    {cfg.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {!!centerRouteObj && (
          <View pointerEvents="box-none" style={styles.centerWrap}>
            <View style={[styles.centerRing, styles.shadow]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={centerLabel}
                onPress={pressHandlers[centerRouteObj.key]}
                style={({ pressed }) => [
                  styles.centerBtn,
                  {
                    backgroundColor: centerFocused ? COLORS.primary : COLORS.pillBg,
                    borderColor: centerFocused ? COLORS.primary : COLORS.pillBorder,
                    borderWidth: 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Ionicons
                  name={centerIconName}
                  size={24}
                  color={centerFocused ? '#FFFFFF' : COLORS.muted}
                />
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
    marginHorizontal: 0,
    height: BAR_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    overflow: 'visible',
    paddingHorizontal: 28,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 12,
    paddingBottom: 20,
    gap: 6,
  },
  itemPressed: { opacity: 0.65 },
  label: { fontSize: 12, lineHeight: 16, fontFamily: 'Pretendard-Medium', letterSpacing: 0.2 },
  centerSpacer: { width: 84 },
  centerWrap: { position: 'absolute', left: 0, right: 0, top: -30, alignItems: 'center' },
  centerRing: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.pillBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtn: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C2A58',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
});
