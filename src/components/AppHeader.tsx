import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../design/colors';
import { TYPO } from '../design/typography';

type Props = {
  role?: '학생' | '학생회';
  studentId?: string;       // 예: C123456
  right?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void } | null;
  title?: string;           // 필요 시 중앙 타이틀 (ex. 달력, 설정 등)
};

export default function AppHeader({ role = '학생회', studentId = 'C123456', right, title }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <View style={styles.badge}><Text style={styles.badgeTxt}>{role}</Text></View>
        <Text style={styles.sid}>{studentId}</Text>
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : <View />}

      <View style={styles.right}>
        {right ? (
          <Pressable onPress={right.onPress} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name={right.icon} size={20} color={COLORS.text} />
          </Pressable>
        ) : <View style={{ width: 28 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 56, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeTxt: { color: '#fff', fontFamily: 'Pretendard-Medium', fontSize: 12 },
  sid: { ...TYPO.body, fontFamily: 'Pretendard-SemiBold' },
  title: { position: 'absolute', left: 0, right: 0, textAlign: 'center', ...TYPO.subtitle, color: COLORS.text },
  right: { width: 28, alignItems: 'flex-end' },
  iconBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
