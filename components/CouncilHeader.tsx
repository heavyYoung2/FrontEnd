import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  border: '#E6E8EE',
  surface: '#FFFFFF',
};

type Props = {
  /** 학번 (예: C246120) */
  studentId: string;
  /** 헤더 제목 (예: 공지사항, 공지 작성, 달력 등) */
  title?: string;
  /** 뒤로가기 버튼 표시 여부 */
  showBack?: boolean;
  /** 오른쪽에 들어갈 액션(텍스트/버튼 등) */
  right?: React.ReactNode;
  /** 바닥 테두리 표시 여부 (기본 true) */
  withBottomBorder?: boolean;
  /** 컨테이너 추가 스타일 */
  containerStyle?: ViewStyle;
};

export default function CouncilHeader({
  studentId,
  title,
  showBack = false,
  right,
  withBottomBorder = true,
  containerStyle,
}: Props) {
  const router = useRouter();

  return (
    <View style={[styles.wrap, withBottomBorder && styles.border, containerStyle]}>
      {/* ① 학생회+학번 라인 (항상 최상단) */}
      <View style={styles.identity}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>학생회</Text>
        </View>
        <Text style={styles.studentId}>{studentId}</Text>
      </View>

      {/* ② 페이지 헤더 라인 (제목/뒤로가기/우측액션) */}
      {(title || showBack || right) && (
        <View style={styles.headerRow}>
          <View style={{ width: 28 }}>
            {showBack && (
              <Pressable hitSlop={10} onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color={COLORS.text} />
              </Pressable>
            )}
          </View>

          <Text style={styles.title}>{title ?? ''}</Text>

          <View style={styles.right}>{right}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.surface,
  },
  border: {
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  studentId: { color: COLORS.text, fontSize: 14, fontFamily: 'Pretendard-Medium' },

  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, color: COLORS.text, fontFamily: 'Pretendard-SemiBold', textAlign: 'center' },
  right: { minWidth: 28, alignItems: 'flex-end', justifyContent: 'center' },
});
