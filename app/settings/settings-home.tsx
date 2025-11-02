// app/(tabs)/mypage.tsx
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';

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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader studentId="C246120" title="나의 회비영" showBack />

      {/* 섹션 타이틀 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>설정</Text>
      </View>

      {/* 버튼 리스트 */}
      <View style={styles.listCard}>
        <SettingRow label="로그아웃" onPress={onLogout} />
        <SettingRow
          label="학생회 인원 관리하기"
          onPress={() => router.push('/settings/manage-members')}
        />
        <SettingRow label="비밀번호 변경하기" onPress={() => router.push('/settings/password')} />
        <SettingRow label="회비영 사용법" onPress={() => router.push('/settings/guide')} />
        <SettingRow label="학생 화면 전환" onPress={() => router.push('/settings/switch-role')} />
        <SettingRow
          label="회원 탈퇴하기"
          onPress={onWithdraw}
          variant="danger"
          isLast
        />
      </View>
    </SafeAreaView>
  );
}

type RowProps = {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
  isLast?: boolean;
};

/** 공통 버튼 컴포넌트 */
function SettingRow({
  label,
  onPress,
  variant = 'default',
  isLast = false,
}: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.itemRow,
        pressed && { opacity: 0.93 },
        !isLast && styles.itemDivider,
      ]}
    >
      <Text
        style={[
          styles.itemText,
          variant === 'danger' && { color: COLORS.danger, fontFamily: 'Pretendard-SemiBold' },
        ]}
      >
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

  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Pretendard-SemiBold',
  },

  listCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  itemRow: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  itemText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Pretendard-SemiBold',
  },
});
