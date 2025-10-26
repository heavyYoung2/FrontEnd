// app/(tabs)/mypage.tsx
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

/** 디자인 토큰 */
const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
  danger: '#E11D48',
};

export default function MyPageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const onLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => {/* TODO: signOut() */} },
    ]);
  };

  const onWithdraw = () => {
    Alert.alert('회원 탈퇴', '탈퇴 후 4년간 재가입이 제한됩니다. 진행할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '탈퇴', style: 'destructive', onPress: () => {/* TODO: withdraw() */} },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      {/* 상단: 배지 + 학번 + 가운데 타이틀 */}
      <View style={styles.headerWrap}>
        <Text style={styles.title}>나의 회비영</Text>

        <View style={styles.identityRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>학생회</Text>
          </View>
          <Text style={styles.studentId}>C246120</Text>
        </View>
      </View>

      {/* 섹션 타이틀 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>설정</Text>
      </View>

      {/* 버튼 리스트 */}
      <View style={styles.listWrap}>
        <SettingButton label="로그아웃" onPress={onLogout} />
        <SettingButton label="알림 설정" onPress={() => router.push('/settings/notifications')} />
        <SettingButton label="비밀번호 변경하기" onPress={() => router.push('/settings/password')} />
        <SettingButton label="회비영 사용법" onPress={() => router.push('/settings/guide')} />
        <SettingButton label="학생회 화면 전환" onPress={() => router.push('/settings/switch-role')} />
        <SettingButton
          label="회원 탈퇴하기"
          onPress={onWithdraw}
          variant="danger"
        />
      </View>
    </SafeAreaView>
  );
}

/** 공통 버튼 컴포넌트 */
function SettingButton({
  label,
  onPress,
  variant = 'default',
}: {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.itemBtn,
      pressed && { opacity: 0.9 },
      variant === 'danger' && styles.itemBtnDanger,
    ]}>
      <Text style={[
        styles.itemText,
        variant === 'danger' && { color: COLORS.danger, fontFamily: 'Pretendard-SemiBold' },
      ]}>
        {label}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={variant === 'danger' ? COLORS.danger : '#9AA0A6'}
      />
    </Pressable>
  );
}

/** ---------- styles ---------- */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  headerWrap: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: {
    textAlign: 'center',
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
  },
  studentId: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
  },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Pretendard-SemiBold',
  },

  listWrap: {
    paddingHorizontal: 16,
    gap: 12,
  },

  itemBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  itemBtnDanger: {
    borderColor: '#F9D4DA',
    backgroundColor: '#FFF5F6',
  },
  itemText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Pretendard-SemiBold',
  },
});
