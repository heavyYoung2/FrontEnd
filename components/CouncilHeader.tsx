import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthProvider';

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  border: '#E6E8EE',
  surface: '#FFFFFF',
};
const PLACEHOLDER_STUDENT_ID = 'C246120';

type Props = {
  /** 헤더 맨 위 뱃지 텍스트 (예: 학생회). null이면 숨김 */
  badgeLabel?: string | null;
  /** 학번 (예: C246120) */
  studentId?: string | null;
  /** 헤더 제목 (예: 공지사항, 공지 작성, 달력 등) */
  title?: string;
  /** 뒤로가기 버튼 표시 여부 */
  showBack?: boolean;
  /** back 버튼 클릭 시 실행할 커스텀 핸들러 */
  onBackPress?: () => void;
  /** back 스택이 없을 때 이동할 fallback 경로 */
  backFallbackHref?: string;
  /** 오른쪽에 들어갈 액션(텍스트/버튼 등) */
  right?: React.ReactNode;
  /** 바닥 테두리 표시 여부 (기본 true) */
  withBottomBorder?: boolean;
  /** 컨테이너 추가 스타일 */
  containerStyle?: ViewStyle;
};

export default function CouncilHeader({
  badgeLabel,
  studentId,
  title,
  showBack = false,
  onBackPress,
  backFallbackHref,
  right,
  withBottomBorder = true,
  containerStyle,
}: Props) {
  const router = useRouter();
  const { role, studentId: authStudentId } = useAuth();

  const resolvedBadgeLabel =
    badgeLabel ?? (role === 'student' ? '학생' : '학생회');
  const resolvedStudentId =
    studentId && studentId !== PLACEHOLDER_STUDENT_ID
      ? studentId
      : authStudentId ?? PLACEHOLDER_STUDENT_ID;

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    const canGoBack = typeof router.canGoBack === 'function' ? router.canGoBack() : false;
    if (canGoBack) {
      router.back();
    } else if (backFallbackHref) {
      router.replace(backFallbackHref);
    } else {
      router.replace('/(council)/index');
    }
  };

  return (
    <View style={[styles.wrap, withBottomBorder && styles.border, containerStyle]}>
      {/* ① 학생회+학번 라인 (항상 최상단) */}
      <View style={styles.identity}>
        {resolvedBadgeLabel ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{resolvedBadgeLabel}</Text>
          </View>
        ) : null}
        <Text style={styles.studentId}>{resolvedStudentId}</Text>
      </View>

      {/* ② 페이지 헤더 라인 (제목/뒤로가기/우측액션) */}
      {(title || showBack || right) && (
        <View style={styles.headerRow}>
          <View style={styles.leftSlot}>
            {showBack && (
              <Pressable hitSlop={10} onPress={handleBack} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color={COLORS.text} />
              </Pressable>
            )}
          </View>

          <View pointerEvents="none" style={styles.titleWrap}>
            <Text numberOfLines={1} style={styles.title}>{title ?? ''}</Text>
          </View>

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
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSlot: { width: 36, alignItems: 'flex-start', justifyContent: 'center' },
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  titleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 56,
  },
  title: { fontSize: 18, color: COLORS.text, fontFamily: 'Pretendard-SemiBold', textAlign: 'center' },
  right: {
    marginLeft: 'auto',
    minHeight: 28,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
});
