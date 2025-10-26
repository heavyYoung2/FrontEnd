// src/components/HBTabBar.tsx
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
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
  index:  { icon: { focused: 'calendar',  unfocused: 'calendar-outline' },  label: '달력' }, // 중앙
  locker: { icon: { focused: 'grid',      unfocused: 'grid-outline' },      label: '사물함' },
  mypage: { icon: { focused: 'person',    unfocused: 'person-outline' },    label: '마이' },
  home:   { icon: { focused: 'calendar',  unfocused: 'calendar-outline' },  label: '달력' },
};

export default function HBTabBar({ state, navigation, centerRoute = 'index' }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  const centerIndex = state.routes.findIndex(r => r.name === centerRoute);
  const centerRouteObj = state.routes[centerIndex];
  const centerCfg = centerRouteObj
    ? (MAP[centerRouteObj.name] ?? { icon: { focused: 'ellipse', unfocused: 'ellipse-outline' }, label: centerRouteObj.name })
    : null;

  const pressHandlers = state.routes.reduce<Record<string, () => void>>((acc, route, i) => {
    acc[route.key] = () => {
      const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (state.index !== i && !e.defaultPrevented) navigation.navigate(route.name);
    };
    return acc;
  }, {});

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={[styles.container, { paddingBottom: bottomPad }]}>
        {/* 탭 라인(상단 라운드) 역할 */}
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            if (index === centerIndex) {
              // 중앙 자리 비움
              return <View key={`${route.key}-spacer`} style={styles.centerSpacer} />;
            }

            const focused = state.index === index;
            const cfg = MAP[route.name] ?? {
              icon: { focused: 'ellipse', unfocused: 'ellipse-outline' },
              label: route.name,
            };

            return (
              <Pressable key={route.key} onPress={pressHandlers[route.key]} style={styles.item}>
                <Ionicons
                  name={(focused ? cfg.icon.focused : cfg.icon.unfocused) as any}
                  size={22}
                  color={focused ? COLORS.text : COLORS.muted}
                />
                <Text style={[styles.label, { color: focused ? COLORS.text : COLORS.muted }]}>{cfg.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* 중앙 플로팅 버튼 */}
        {centerRouteObj && centerCfg && (
          <View pointerEvents="box-none" style={styles.centerWrap}>
            <View style={[styles.centerRing, styles.shadow]}>
              <Pressable
                onPress={pressHandlers[centerRouteObj.key]}
                style={({ pressed }) => [styles.centerBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              >
                <Ionicons name={centerCfg.icon.focused} size={30} color="#fff" />
                <Text style={styles.centerLabel}>{centerCfg.label}</Text>
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
  root: { position: 'absolute', left: 0, right: 0, bottom: 0 },

  container: {
    marginHorizontal: 16,
    marginBottom: 0,
    height: BAR_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: 'visible',
    paddingHorizontal: 20,
  },

  // ✅ 간격을 넓히는 핵심: space-around + 패딩 + 갭
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',   // ← space-between → space-around
    columnGap: 0,                    // RN 0.71+ 지원. 필요하면 주석 처리
    height: '100%',
  },

  item: {
    flex: 1,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
    gap: 6,
  },
  label: { fontSize: 12, fontFamily: 'Pretendard-Medium' },

  // ✅ 중앙 폭을 좀 더 확보
  centerSpacer: {
    flex: 10,     // ← 1.0 -> 1.3 로 넓힘 (필요시 1.1~1.6 조절)
    minWidth: 50,
  },

  centerWrap: {
    position: 'absolute',
    left: 0, right: 0,
    top: -15,
    alignItems: 'center',
  },
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
  centerLabel: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: 14,
  },

  homeIndicator: {
    position: 'absolute',
    left: 0, right: 0,
    bottom: 10,
    alignSelf: 'center',
    width: 160, height: 4,
    borderRadius: 4,
    backgroundColor: '#1F2937',
    opacity: 0.15,
  },

  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
